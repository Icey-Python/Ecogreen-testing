import axios, { HttpStatusCode } from "axios";
import { Config } from "../lib/config.js";
import { Logger } from "borgen";
import { timestamp } from "../util/timestamp.js";
import { StatusCodes } from "http-status-codes";

// Mpesa STK push
// @route POST /api/v1/pay/stk
export const stkPush = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    const mpesaToken = res.locals.token;

    //const paybill = fieldPaymentDetails?.paybill_number
    //const account_name = fieldPaymentDetails?.account_name
    //const account_number = fieldPaymentDetails?.account_number
    //const till_number = fieldPaymentDetails?.till_number
    //TODO: Update call back url
    const CALLBACK_URL = process.env.CALLBACK_URL;
    console.log(CALLBACK_URL);
    //TODO: Add business short code
    const BUSINESS_SHORT_CODE = false ? "" : "174379";

    if (!BUSINESS_SHORT_CODE) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Business Short Code is required" });
    }

    const transactionType = false
      ? "CustomerBuyGoodsOnline"
      : "CustomerPayBillOnline";

    const password = Buffer.from(
      BUSINESS_SHORT_CODE + Config.LNM_PASSKEY + timestamp
    ).toString("base64");

    const payload = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: 1,
      PartyA: phone,
      PartyB: BUSINESS_SHORT_CODE,
      PhoneNumber: phone,
      CallBackURL: `${CALLBACK_URL}/api/v1/mpesaPay/callback`,
      AccountReference: false ? "Test" : "Test",
      TransactionDesc: "Payment",
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: {
          Authorization: `Bearer ${mpesaToken}`,
        },
      }
    );

    res.status(HttpStatusCode.Created).json(response.data);
  } catch (err) {
    Logger.error({ message: "stkPush" + err.message });

    res.status(HttpStatusCode.InternalServerError).json({
      status: "error",
      message: "Failed to initiate STK push",
      data: null,
    });
  }
};

// Mpesa Callback
// @route POST /api/v1/mpesaPay/callback
export const callback = async (req, res) => {
  try {
    const { Body } = req.body;
    console.log(Body);
    const { stkCallback } = Body;
    console.log(stkCallback);
    const merchantRequestID = stkCallback.MerchantRequestID;
    const checkoutRequestID = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;
    const callbackMetadata = stkCallback.CallbackMetadata;
    console.log(resultCode);

    if (resultCode === 0) {
      const amount = callbackMetadata.Item.find(
        (item) => item.Name === "Amount"
      ).Value;
      const mpesaReceiptNumber = callbackMetadata.Item.find(
        (item) => item.Name === "MpesaReceiptNumber"
      ).Value;
      const transactionDate = callbackMetadata.Item.find(
        (item) => item.Name === "TransactionDate"
      ).Value;
      const phoneNumber = callbackMetadata.Item.find(
        (item) => item.Name === "PhoneNumber"
      ).Value;

      const transaction_date = new Date(transactionDate);

      return res.status(200).json({
        message:
          "Payment processed successfully and updated the booking status to confirmed",
      });
    } else {
      return res
        .status(400)
        .json({ message: `Transaction failed: ${resultDesc}` });
    }
  } catch (err) {
    Logger.error({ message: "callback" + err.message });

    res.status(HttpStatusCode.InternalServerError).json({
      status: "error",
      message: "callback error",
      data: null,
    });
  }
};

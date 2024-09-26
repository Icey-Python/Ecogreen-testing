import axios, { HttpStatusCode } from "axios";
import GreenBank from "../models/greenBank.model.js";
import { Config } from "../lib/config.js";
import { Logger } from "borgen";
import { timestamp } from "../util/timestamp.js";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";
import User from "../models/user.model.js";

// Mpesa STK push
// @route POST /api/v1/pay/stk
export const stkPush = async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const userId = res.locals.userId;

    const mpesaToken = res.locals.token;
    // Fetch the user’s GreenBank and points data
    const greenBankAccount = await GreenBank.findOne({ user: userId });
    const userAccount = await User.findById(userId);

    if (!greenBankAccount || !userAccount) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "User or GreenBank account not found",
        data: null,
      });
    }

    // Conversion logic: 100 points for every 10 KSh
    const pointsConversionRate = 10;
    const totalPoints = (amount * 100) / pointsConversionRate;

    // Calculate 10% deduction for GreenBank
    const greenBankDeduction = totalPoints * 0.1;
    const netAmountToUser = totalPoints - greenBankDeduction;

    // Update user’s GreenBank balance
    greenBankAccount.points += greenBankDeduction;
    await greenBankAccount.save();
    // Update user’s points
    userAccount.balance += netAmountToUser;
    await userAccount.save();

    // Proceed with the Mpesa STK push request
    const CALLBACK_URL = process.env.CALLBACK_URL;
    const BUSINESS_SHORT_CODE = process.env.BUSINESS_SHORT_CODE || "174379";

    if (!BUSINESS_SHORT_CODE) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Business Short Code is required",
      });
    }

    const transactionType = "CustomerPayBillOnline";

    const password = Buffer.from(
      BUSINESS_SHORT_CODE + Config.LNM_PASSKEY + timestamp
    ).toString("base64");

    const payload = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: amount, // >10? amount : 10
      PartyA: phone,
      PartyB: BUSINESS_SHORT_CODE,
      PhoneNumber: phone,
      CallBackURL: `${CALLBACK_URL}/api/v1/mpesaPay/callback`,
      AccountReference: "GreenBank Deposit",
      TransactionDesc: "Deposit to GreenBank",
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

    res.status(HttpStatusCode.Created).json({
      status: "success",
      message: "Deposit successful, points updated, and GreenBank credited",
      data: response.data,
      pointsAdded: totalPoints,
      greenBankDeduction: greenBankDeduction,
    });
  } catch (err) {
    Logger.error({ message: "stkPush- " + err.message });

    res.status(HttpStatusCode.InternalServerError).json({
      status: "error",
      message: "Failed to initiate STK push",
      data: null,
    });
  }
};

// Mpesa Callback -> stk
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

const generateOriginatorConversationID = () => {
  return crypto.randomUUID();
};
// @desc Withdraw from GreenBank to Mpesa
// @route POST /api/v1/payments/withdraw
export const withdrawToMpesa = async (req, res) => {
  try {
    const { phone, amount } = req.body;
    if(!phone){
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid phone number",
        data: null,
      });
    }
    if(!amount){
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Please provide a valid amount",
        data: null,
      });
    }
    const userId = res.locals.userId;
    const mpesaToken = res.locals.token;

    const INITIATOR_NAME = "testapi";
    const INITIATOR_PASSWORD = "Safaricom999!*!";
    const B2CSHORT_CODE = "600998";

    // Check the user's GreenBank balance
    const userGreenBank = await GreenBank.findOne({ user: userId });
    console.log(userGreenBank.points, "|", amount);
    if (!userGreenBank || userGreenBank.points < amount) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Insufficient balance in GreenBank.",
        data: {
          pts: userGreenBank.points,
        },
      });
    }
    const amountInPts = (amount * 100) / 10 ;
    // Deduct the amount from the GreenBank balance
    userGreenBank.points -= amountInPts;

    // Mpesa transaction details
    const CALLBACK_URL = process.env.CALLBACK_URL;
    const initiatorId = generateOriginatorConversationID()

    const payload = {
      OriginatorConversationID: initiatorId,
      InitiatorName: INITIATOR_NAME,
      SecurityCredential:
        "ZfBlcD1FyAv6OcVgyWjSEPBJOM8VPOC6XmahYKWwoH4NA3PrujztZQm9iQj7E9L7NsPQkOUqNI783nteUs2r1/V89MuXHBShmn5d3TqOyvj6ibAb2eMckh6s53ot73cV8I12SFg2MpnHIGNG6YgopI5WU/whZDycbbGw5U2GsTG0yBtBpz3Q6CwknN6I4RO9nS3xITfuPaixXbYYSoDWcwTSK2hs13p2/Vl5VjJUZRs7ZIm+7WKY8YiRL1u0qMmq1mSERXRAcSPwEaV8XBitchqEcrprehBzqUD7hZYD7TDbv0U/+Se2O+6khdhYYdVBAX7cCuL1nJdpcmAebWrIPA==",
      CommandID: "BusinessPayment",
      Amount: amount,
      PartyA: B2CSHORT_CODE,
      PartyB: phone,
      Remarks: "Withdrawal from Greenbank",
      QueueTimeOutURL: `${CALLBACK_URL}/api/v1/mpesaPay/b2c/timeout`,
      ResultURL: `${CALLBACK_URL}/api/v1/mpesaPay/b2c/result`,
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest",
      payload,
      {
        headers: {
          Authorization: `Bearer ${mpesaToken}`,
        },
      }
    );

    res.status(StatusCodes.CREATED).json({
      status: "success",
      message: "Withdrawal in progress",
      data: response.data,
    });

    await userGreenBank.save();
  } catch (err) {
    Logger.error("Withdrawal Error:", err.message);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to initiate withdrawal",
      error: err.message,
    });
  }
};

/// Mpesa Withdrawal Callback
// @route POST /api/v1/mpesaPay/b2c/result
export const b2cResultCallback = async (req, res) => {
  try {
    const { Result } = req.body;

    const {
      ResultType,
      ResultCode,
      ResultDesc,
      OriginatorConversationID,
      ConversationID,
      TransactionID,
      ReferenceData,
    } = Result;

    return res.status(StatusCodes.OK).json({
      message: "Withdrawal processed successfully",
      data: {},
    });
  } catch (err) {
    console.log(err);
    console.log(stkCallBack);
    Logger.error("Withdrawal Callback Error:", err.message);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred during Mpesa callback",
      error: err.message,
    });
  }
};

// @ desc Withdrawal timeout
// @ route POST /api/v1/mpesaPay/b2c/timeout
export const b2cTimeoutCallback = async (req, res) => {
  try {
    console.log(req.body);

    return res.status(StatusCodes.OK).json({
      message: "Timeout occurred perfoming this action",
      data: {},
    });
  } catch (err) {
    Logger.error("Withdrawal Callback Error:", err.message);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred during Mpesa callback",
      error: err.message,
    });
  }
};

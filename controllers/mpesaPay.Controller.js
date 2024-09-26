import axios, { HttpStatusCode } from "axios";
import GreenBank from "../models/greenBank.model.js";
import { Config } from "../lib/config.js";
import { Logger } from "borgen";
import { timestamp } from "../util/timestamp.js";
import { StatusCodes } from "http-status-codes";

// Mpesa STK push
// @route POST /api/v1/pay/stk
export const stkPush = async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const userId = req.user.id; 

    const mpesaToken = res.locals.token;

    // Fetch the user’s GreenBank and points data
    const greenBankAccount = await GreenBank.findOne({ userId });
    const userAccount = await User.findById(userId);

    if (!greenBankAccount || !userAccount) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "User or GreenBank account not found",
        data: null,
      });
    }

    // Conversion logic: 100 points for every 10 KSh
    const pointsConversionRate = 10; 
    const totalPoints = (amount * 100) / pointsConversionRate;

    // Calculate 10% deduction for GreenBank
    const greenBankDeduction = amount * 0.1;
    const netAmountToUser = amount - greenBankDeduction;

    // Update user’s GreenBank balance
    greenBankAccount.points += greenBankDeduction;
    await greenBankAccount.save();

    // Update user’s points
    userAccount.balance += totalPoints;
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
      Amount: netAmountToUser, 
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

// @desc Withdraw from GreenBank to Mpesa
// @route POST /api/v1/payments/withdraw
export const withdrawToMpesa = async (req, res) => {
  try {
    const { phone, amount } = req.body;
    const userId = res.locals.userId;
    const mpesaToken = res.locals.token;

    // Check the user's GreenBank balance
    const userGreenBank = await GreenBank.findOne({ user: userId });

    if (!userGreenBank || userGreenBank.balance < amount) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Insufficient balance in GreenBank.",
      });
    }

    // Deduct the amount from the GreenBank balance
    userGreenBank.balance -= amount;
    await userGreenBank.save();

    // Mpesa transaction details
    const CALLBACK_URL = process.env.CALLBACK_URL; 
    const BUSINESS_SHORT_CODE = "174379"; 

    const password = Buffer.from(
      BUSINESS_SHORT_CODE + Config.LNM_PASSKEY + timestamp
    ).toString("base64");

    const payload = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline", 
      Amount: amount,
      PartyA: phone,
      PartyB: BUSINESS_SHORT_CODE,
      PhoneNumber: phone,
      CallBackURL: `${CALLBACK_URL}/api/v1/mpesaPay/withdraw/callback`,
      AccountReference: "GreenBank Withdrawal",
      TransactionDesc: "Withdraw to Mpesa",
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

    res.status(StatusCodes.CREATED).json({
      status: "success",
      message: "Withdrawal in progress",
      data: response.data,
    });
  } catch (err) {
    Logger.error("Withdrawal Error:", err.message);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to initiate withdrawal",
      error: err.message,
    });
  }
};

/// Mpesa Withdrawal Callback
// @route POST /api/v1/mpesaPay/withdraw/callback
export const mpesaWithdrawalCallback = async (req, res) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;

    const resultCode = stkCallback.ResultCode;
    const resultDesc = stkCallback.ResultDesc;
    const callbackMetadata = stkCallback.CallbackMetadata;

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

      console.log("Mpesa Withdrawal Successful:", {
        mpesaReceiptNumber,
        amount,
        transaction_date,
        phoneNumber,
      });

      return res.status(StatusCodes.OK).json({
        message: "Withdrawal processed successfully",
        data: {
          amount,
          mpesaReceiptNumber,
          transaction_date,
          phoneNumber,
        },
      });
    } else {
      Logger.error(`Withdrawal Failed: ${resultDesc}`);
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: `Withdrawal failed: ${resultDesc}`,
      });
    }
  } catch (err) {
    Logger.error("Withdrawal Callback Error:", err.message);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred during Mpesa callback",
      error: err.message,
    });
  }
};

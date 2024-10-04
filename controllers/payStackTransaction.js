import crypto from 'crypto'
import { Logger } from 'borgen'
import { StatusCodes } from 'http-status-codes'
import axios from 'axios'
import Paystack from '@paystack/paystack-sdk'

// Paystack Webhook
// @route POST /api/v1/pay/webhook
export const PaystackWebhook = async (
  req,
  res,
)=> {
  try {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex')
    if (hash == req.headers['x-paystack-signature']) {
      const event = req.body

      // Handle central account purchase
      // @route POST /api/v1/account/purchase
      let response = await axios.post('http://localhost:8001/api/v1/account/purchase', {
        payment_ref: event.data.reference,
        payment_option: 'mpesa',
        amount: event.data.amount / 100,
      })

      console.log(response.data)

      console.log('Payment webhook :', event)
    }

    res.sendStatus(StatusCodes.OK)
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error initializing transaction',
    })
    Logger.error({ message: 'Error initializing transaction ' + error })
  }
}

// Handles initializing payment
// @route POST /api/v1/pay/init
export const initializePayment = async(
  req,
  res,
)=> {
  try {
    const { email, amount } = req.body

    let response = await PaystackClient.transaction.initialize({
      email,
      amount,
    })

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transaction initialized',
      data: response,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error initializing transaction',
    })
    Logger.error({ message: 'Error initializing transaction ' + error })
  }
}

// Verify a transaction
// @route GET /api/v1/pay/verify/?ref=transaction_reference
export const verifyTransaction = async (
  req,
  res,
)=> {
  try {
    const reference = req.query.ref

    if (!reference) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Transaction reference is required',
      })
      return
    }

    let response = await PaystackClient.transaction.verify({ reference })

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transaction verified',
      data: response,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error verifying transaction',
    })
    Logger.error({ message: 'Error verifying transaction ' + error })
  }
}

// Fetch a transaction
// @route GET /api/v1/pay/transaction/?id=transaction_id
export const fetchTransaction = async (
  req,
  res,
) => {
  try {
    const id = req.query.id

    if (!id) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Transaction ID is required',
      })
      return
    }

    let response = await PaystackClient.transaction.fetch({ id })

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transaction fetched',
      data: response,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error fetching transaction',
    })
    Logger.error({ message: 'Error fetching transaction ' + error })
  }
}

// List all transactions
// @route POST /api/v1/pay/transaction/all
export const listTransactions = async (
  req,
  res,
)=> {
  try {
    const { perPage, page, from, to } = req.body

    const from_date = new Date(from)
    const to_date = new Date(to)

    let response = await PaystackClient.transaction.list({
      perPage,
      page,
      from: from_date,
      to: to_date,
    })

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transactions fetched',
      data: response,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error fetching transactions',
    })
    Logger.error({ message: 'Error fetching transactions ' + error })
  }
}


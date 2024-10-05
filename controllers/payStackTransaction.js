import crypto from 'crypto'
import { Logger } from 'borgen'
import { StatusCodes } from 'http-status-codes'
import { PaystackClient } from '../app.js'
import Deposit from '../models/deposit.model.js'
import User from '../models/user.model.js'
import GreenBank from '../models/greenBank.model.js'
import Withdraw from '../models/withdraw.model.js'
// Paystack Webhook
// @route POST /api/v1/pay/webhook
export const PaystackWebhook = async (req, res) => {
  try {
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex')
    if (hash == req.headers['x-paystack-signature']) {
      const event = req.body
      const payment_ref = event.data.reference
      const amount = event.data.amount / 100 // paystack -> in cents
      const status = event.data.status

      if (event.event.split('.')[0] == 'charge') {
        if (status == 'success') {
          const deposit = await Deposit.findOne({ reference: payment_ref })
          deposit.status = 'completed'
          
          //update User balance and greenbank balance
          const user = await User.findById(deposit.userId)
          const totalPoints = (amount * 100) / 10 // 100 points for every 10 ksh

          // Calculate 10% deduction for GreenBank
          const greenBankDeduction = totalPoints * 0.1
          const netAmountToUser = totalPoints - greenBankDeduction

          user.balance += netAmountToUser

          // Update user’s GreenBank balance
          const greenBank = await GreenBank.findOne({ user: deposit.userId })
          greenBank.points += greenBankDeduction
          await user.save()
          await greenBank.save()
          await deposit.save()
        }

        if (status == 'failed') {
          const deposit = await Deposit.findOne({ reference: payment_ref })
          deposit.status = 'failed'
          await deposit.save()
        }
      } else if (event.event.split('.')[1] == 'transfer') {
        if (status == 'success') {
          const withdrawal = await Withdraw.findOne({ reference: payment_ref })
          withdrawal.status = status == 'success' ? 'completed' : 'failed'
          const greenBank = await GreenBank.findOne({ user: withdrawal.userId })
          greenBank.points -= (amount / 100) *(100/10)
          greenBank.save()
          await withdrawal.save()
        }
      }
    }

    return res.sendStatus(StatusCodes.OK)
  } catch (error) {
    Logger.error({ message: 'Error initializing transaction ' + error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error initializing transaction',
      data: null,
    })
  }
}

// Handles initializing payment
// @route POST /api/v1/pay/init
export const initializePayment = async (req, res) => {
  try {
    const userId = res.locals.userId
    if(!userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please Login and try again',
      })
    }
    // email -> User
    const { email, amount } = req.body
    if (!email || !amount) {
     return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'All fields are required',
      })
    }
    let response = await PaystackClient.transaction.initialize({
      email,
      amount,
    })

    // Create pending transaction
    const deposit = new Deposit({
      userId,
      reference: response.data.reference,
      amount: amount / 100,
      status: 'pending',
    })

    await deposit.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transaction initialized',
      data: response,
    })
  } catch (error) {
    Logger.error({ message: 'Error initializing transaction: ' + error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error initializing transaction',
    })
    Logger.error({ message: 'Error initializing transaction ' + error })
  }
}

// Verify a transaction
// @route GET /api/v1/pay/verify/?ref=transaction_reference
export const verifyTransaction = async (req, res) => {
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

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transaction verified',
      data: response,
    })
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error verifying transaction',
    })
    Logger.error({ message: 'Error verifying transaction ' + error })
  }
}

// Fetch a transaction
// @route GET /api/v1/pay/transaction/?id=transaction_id
export const fetchTransaction = async (req, res) => {
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

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transaction fetched',
      data: response,
    })
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error fetching transaction',
    })
    Logger.error({ message: 'Error fetching transaction ' + error })
  }
}

// List all transactions
// @route POST /api/v1/pay/transaction/all
export const listTransactions = async (req, res) => {
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

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transactions fetched',
      data: response,
    })
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error fetching transactions',
    })
    Logger.error({ message: 'Error fetching transactions ' + error })
  }
}


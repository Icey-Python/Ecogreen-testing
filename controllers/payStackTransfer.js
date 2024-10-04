import { Logger } from 'borgen'
import { StatusCodes } from 'http-status-codes'
import { PaystackClient } from '../app.js'
import { v4 as uuidv4 } from 'uuid'
import Withdraw  from '../models/withdraw.model.js'
//  Initialize a transfer
//  @route POST /api/v1/pay/transfer/init
export const initializeTransfer = async (req, res) => {
  try {
    const userId = res.locals.userId

    if (!userId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please Login and try again',
      })
    }
    const { source, amount, recipient, reason, currency} = req.body
    //reference a uuid 
    const reference = uuidv4()

    if (!source || !amount || !recipient || !reason || !currency) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'All fields are required',
      })
    }
    let response = await PaystackClient.transfer.initialize({
      source,
      amount,
      recipient,
      reason,
      currency,
      reference,
    })
    // Create pending withdrawal
    const withdrawal = new Withdraw({
      userId: userId,
      amount: amount / 100,
      reference: reference,
      recepient: userId,
      status: 'pending',
    })
    await withdrawal.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transfer initialized',
      data: response,
    })
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error initializing transfer',
    })
    Logger.error({ message: 'Error initializing transfer ' + error })
  }
}

// Finalize a transfer
// @route POST /api/v1/pay/transfer/finalize
export const finalizeTransfer = async (req, res) => {
  try {
    const { transfer_code, otp } = req.body

    let response = await PaystackClient.transfer.finalize({
      transfer_code,
      otp,
    })

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transfer finalized',
      data: response,
    })
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error finalizing transfer',
    })
    Logger.error({ message: 'Error finalizing transfer ' + error })
  }
}

// Verify a transfer
// @route GET /api/v1/pay/transfer/verify/?ref=transfer_reference
export const verifyTransfer = async (req, res) => {
  try {
    const reference = req.query.ref

    if (!reference) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Transfer reference is required',
      })
      return
    }

    let response = await PaystackClient.transfer.verify({ reference })

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transfer verified',
      data: response,
    })
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error verifying transfer',
    })
    Logger.error({ message: 'Error verifying transfer ' + error })
  }
}

// Fetch a transfer
// @route GET /api/v1/pay/transfer/get/?id=transfer_id
export const fetchTransfer = async (req, res) => {
  try {
    const id = req.query.id

    if (!id) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Transfer ID is required',
      })
      return
    }

    let response = await PaystackClient.transfer.fetch({ id })

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transfer fetched',
      data: response,
    })
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error fetching transfer',
    })
    Logger.error({ message: 'Error fetching transfer ' + error })
  }
}

// List all transfers
// @route POST /api/v1/pay/transfers/all
export const listTransfers = async (req, res) => {
  try {
    const { perPage, page, status, from, to } = req.body

    const from_date = new Date(from)
    const to_date = new Date(to)

    let response = await PaystackClient.transfer.list({
      perPage,
      page,
      from: from_date,
      to: to_date,
      status,
    })

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transfers fetched',
      data: response,
    })
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error fetching transfers',
    })
    Logger.error({ message: 'Error fetching transfers ' + error })
  }
}

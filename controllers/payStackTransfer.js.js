import { Logger } from 'borgen'
import { StatusCodes } from 'http-status-codes'
import { PaystackClient } from '../app.js'

//  Initialize a transfer
//  @route POST /api/v1/pay/transfer/init
export const initializeTransfer = async (req, res) => {
  try {
    const { source, amount, recipient, reason, currency, reference } = req.body

    let response = await PaystackClient.transfer.initialize({
      source,
      amount,
      recipient,
      reason,
      currency,
      reference,
    })

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transfer initialized',
      data: response,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transfer finalized',
      data: response,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Transfer reference is required',
      })
      return
    }

    let response = await PaystackClient.transfer.verify({ reference })

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transfer verified',
      data: response,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transfer fetched',
      data: response,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
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

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transfers fetched',
      data: response,
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'Error fetching transfers',
    })
    Logger.error({ message: 'Error fetching transfers ' + error })
  }
}

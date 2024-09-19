import { StatusCodes } from 'http-status-codes'
import User from '../models/user.model.js'
import { Logger } from 'borgen'
import Product from '../models/product.model.js'
import Report from '../models/report.model.js'

//@desc Create Report -> reported by user
//@route POST /api/v1/report/create
export const createReport = async (req, res) => {
  try {
    const userId = res.locals.userId
    const user = User.findById(userId)

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    const { productId, message } = req.body
    if (!productId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Product Id is required',
        data: null,
      })
    }

    const product = await Product.findById(productId)

    if (!product) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Product Id',
        data: null,
      })
    }

    if (!message) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Message is required',
        data: null,
      })
    }

    //check if user has already reported the same item
    const existingReport = await Report.findOne({
      productId: product._id,
      reporterId: userId,
    })

    if (existingReport) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'You have already reported this product',
        data: null,
      })
    }

    const report = await Report.create({
      productId: product._id,
      reporterId: userId,
      message,
    })

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Report created successfully',
      data: report,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while creating the report',
      data: null,
    })
  }
}

//@ desc Delete report
//@ route DELETE /api/v1/report/delete/:id

export const deleteReport = async (req, res) => {
  try {
    const reportId = req.params.id
    const userId = res.locals.userId
    const report = await Report.findById(reportId)
    if (!reportId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Provide a valid report Id',
        data: null,
      })
    }
    if (!report) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'An error occured while trying to find your report',
        data: null,
      })
    }
    if (!userId || userId == report.reporterId) {
      return res.StatusCodes(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }

    await Report.findByIdAndDelete(reportId)
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Report deleted successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while deleting the report',
      data: null,
    })
  }
}

// @ desc Find Report By Id
// @ route GET /api/v1/report/find/one/:id
export const findReport = async (req, res) => {
  try {
    const reportId = req.params.id
    const report = await Report.findById(reportId)

    if (!report) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'An error occured while trying to find your report',
        data: null,
      })
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Report found successfully',
      data: report,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while finding the report',
      data: null,
    })
  }
}

// @ desc Find all reports
// @ route GET /api/v1/report/find/all
export const findReports = async (req, res) => {
  try {
    const reports = await Report.find()
    if (!reports) {
      res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'No reports found',
        data: null,
      })
    }
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Reports found successfully',
      data: reports,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while finding the reports',
      data: null,
    })
  }
}

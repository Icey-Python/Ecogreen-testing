import { StatusCodes } from 'http-status-codes'
import User from '../models/user.model.js'
import { Logger } from 'borgen'
import Order from '../models/order.model.js'
import Product from '../models/product.model.js'

//@desc Create product
//@route POST /api/v1/order/create
export const createOrder = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { productId, amount } = req.body

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Product not found',
        data: null,
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'User not found',
        data: null,
      })
    }

    if (amount > product.quantity) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message:
          'An error occurred while trying to make your order, order amount cannot be more than the quantity in stock',
        data: null,
      })
    }

    if (amount <= 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'An error occurred while trying to make your order, order amount cannot be less than 1',
        data: null,
      })
    } 

    //reduce the quantity of the product
    product.quantity = product.quantity - amount
    await product.save()

    const order = await Order.create({
      sellerId: product.seller,
      buyerId: userId,
      productId,
      amount,
    })

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Order created successfully',
      data: order,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while creating the order',
      data: null,
    })
  }
}

//@ desc Delete Order
//@ route DELETE /api/v1/order/delete/:id
export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id
    const order = await Order.findByIdAndDelete(orderId)

    if (!order) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'An error occured while trying to find your order',
        data: null,
      })
    }

    console.log(order)
    const product = await Product.findById(order.productId)
    
    product.quantity = product.quantity + order.amount
    await product.save()

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Order deleted successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while deleting the order',
      data: null,
    })
  }
}

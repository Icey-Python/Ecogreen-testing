import { StatusCodes } from 'http-status-codes'
import { Logger } from 'borgen' // Assuming you have a logger
import Shop from '../models/shop.model.js'
import User from '../models/user.model.js'

//@ desc create Shop
//@ route POST /api/v1/shop/create
export const createShop = async (req, res) => {
  try {
    const admin = res.locals.userId
    if (!admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    const { name, description, latitude, longitude, contact } = req.body
    if (!name || !description || !latitude || !longitude || !contact) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'All fields are required',
        data: null,
      })
    }

    const newShop = new Shop({
      name,
      description,
      location:{
        coordinates: [longitude, latitude],
      },
      contact,
    })

    await newShop.save()
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Shop created successfully',
      data: {
        name,
        description,
        contact,
      },
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: error.message,
      data: null,
    })
  }
}

// @ desc Delete shop
// @ route DELETE /api/v1/shop/delete/:id
export const deleteShop = async (req, res) => {
  try {
    const shopId = req.body.id
    if (!shopId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Shop ID is required',
        data: null,
      })
    }
    const shop = await Shop.findByIdAndDelete(shopId)
    if (!shop) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Shop not found',
        data: null,
      })
    }
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Shop deleted successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: error.message,
      data: null,
    })
  }
}

// @ desc Update shop details
// @ route PUT /api/v1/shop/update
export const updateShop = async (req, res) => {
  try {
    const { id, name, description, location, contact } = req.body
    if (!id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Shop ID is required',
        data: null,
      })
    }
    const shop = await Shop.findById(id)

    if (!shop) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }

    if (name) shop.name = name
    if (description) shop.description = description
    if (location) shop.location = location
    if (contact) shop.contact = contact
    await shop.save()

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Shop updated successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: error.message,
      data: null,
    })
  }
}

// @ desc find all shops
// @ route GET /api/v1/shop/find/all
export const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find()
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Shops fetched successfully',
      data: shops,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: error.message,
      data: null,
    })
  }
}

// @ desc find by id
// @ route GET /api/v1/shop/find/:id
export const getShop = (req, res) => {
  try {
    const shopId = req.params.id
    if (!shopId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Shop ID is required',
        data: null,
      })
    }
    const shop = Shop.findById(shopId)
    if (!shop) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Shop Id',
        data: null,
      })
    }
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Shop fetched successfully',
      data: shop,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: error.message,
      data: null,
    })
  }
}

// @ desc get nearby shops
// @ route GET /api/v1/shop/find/nearby
export const getNearbyShops = async (req, res) => {
  try {
    const userId = res.locals.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }

    // Fetch the user by ID
    const user = await User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid User Id',
        data: null,
      })
    }

    // Use user location if available, otherwise fetch from req.body
    const longitude = user.location?.coordinates[0] ?? req.body.longitude
    const latitude = user.location?.coordinates[1] ?? req.body.latitude
    
    console.log(longitude, latitude)
    // Check if coordinates are available
    if (!longitude || !latitude) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Location data is required',
        data: null,
      })
    }

    // Find nearby shops within a specific radius (e.g., 5km)
    const shops = await Shop.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude], // longitude first
          },
          distanceField: 'distance', // Field to store calculated distance
          spherical: true,
          maxDistance: 5000, // Set max distance in meters (5000m = 5km)
        },
      },
    ])

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Shops fetched successfully',
      data: shops.length > 0? shops : "No shops nearby",
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: error.message,
      data: null,
    })
  }
}

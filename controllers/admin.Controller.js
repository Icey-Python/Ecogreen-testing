import { StatusCodes } from 'http-status-codes'
import User from '../models/user.model.js'
import Admin from '../models/admin.model.js'
import bcrypt from 'bcrypt'
import { Logger } from 'borgen'
import jwt from 'jsonwebtoken'
import { Config } from '../lib/config.js'

// @desc create new admin
// @route POST /api/v1/admin/create
export const createAdmin = async (req, res) => {
  try {
    /**@desc {
     name: string
      email: string
      password: string
      role: string
    }**/
    //check if admin is superAdmin 
    const currentAdminUser = await Admin.findById(res.locals.userId)
    if (currentAdminUser.role != 'superAdmin') {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    const { name, email, password, role } = req.body
    // hash password
    const hashedPassword = bcrypt.hashSync(password, 10)
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role,
    })
    admin.save()

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Admin created successfully',
      data: {
        name,
        email,
        role,
      },
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while creating the admin',
      data: null,
    })
  }
}
// @desc Login admin
// @route POST /api/v1/admin/login
export const loginAdmin = async (req, res) => {
  try {
    /**@desc {
      email: string
      password: string
    }**/
    const { email, password } = req.body

    // Check if the user exists
    const admin = await Admin.findOne({ email })
    if (!admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Invalid email or password',
        data: null,
      })
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, admin.password)
    if (!isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Invalid email or password',
        data: null,
      })
    }

    // Create jwt
    let token = jwt.sign(
      {
        id: admin.id,
      },
      Config.JWT_SECRET,
      {
        expiresIn: '7d', // Set expiration to 7 days
      },
    )
    // If password is valid, login is successful
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Login successful',
      data: {
        userId: admin._id,
        name: admin.name,
        email: admin.email,
        token,
      },
    })
  } catch (error) {
    Logger.error({ message: error.message })

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred during login',
      data: null,
    })
  }
}

// @desc Update admin credentials
// @route PUT /api/v1/admin/update/:id
export const updateAdminById = async (req, res) => {
  try {
    const userId = req.params.id
    const { name, email, password } = req.body
    // Fetch the user to update
    const admin = await Admin.findById(userId)
    if (!admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    if (admin.role == 'superAdmin') {
      //check if the admin is superAdmin
      const currentAdminUser = await Admin.findById(res.locals.userId)
      if (currentAdminUser.role != 'superAdmin') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: 'error',
          message: 'You are not allowed to perfom this action',
          data: null,
        })
      }
    }

    // Update the user
    if (name) admin.name = name
    if (email) admin.email = email
    const updatedAdmin = await admin.save()

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Admin updated successfully',
      data: {
        name: updatedAdmin.name,
        email: updatedAdmin.email,
      },
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while updating the admin',
      data: null,
    })
  }
}

// @desc Update admin password
// @route PUT /api/v1/admin/password/:id
export const updateAdminPasswordById = async (req, res) => {
  try {
    const userId = req.params.id
    const { oldPassword, newPassword } = req.body
    // Fetch the user to update
    const admin = await Admin.findById(userId)
    if (!admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    if (admin.role == 'superAdmin') {
      //check if the admin is superAdmin
      const currentAdminUser = await Admin.findById(res.locals.userId)
      if (currentAdminUser.role != 'superAdmin') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: 'error',
          message: 'You are not allowed to perfom this action',
          data: null,
        })
      }
    }
    //compare old password
    const isPasswordValid = await bcrypt.compare(oldPassword, admin.password)
    if (!isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Invalid old password',
        data: null,
      })
    }
    // Update the user
    admin.password = await bcrypt.hash(newPassword, 10)
    const updatedAdmin = await admin.save()

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Admin password updated successfully',
      data: {
        name: updatedAdmin.name,
        email: updatedAdmin.email,
      },
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while updating the admin',
      data: null,
    })
  }
}

// @desc Delete admin
// @route DELETE /api/v1/admin/delete/:id
export const deleteAdminById = async (req, res) => {
  try {
    const userId = req.params.id
    const currentAdminUser = await Admin.findById(res.locals.userId)
    // Fetch the user to delete
    const admin = await Admin.findByIdAndDelete(userId)
    if (!admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    if (admin.role == 'superAdmin' && currentAdminUser.role != 'superAdmin') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: 'error',
          message: 'You are not allowed to perfom this action',
          data: null,
        })
    }

    // superadmin delete all admin
    if (admin.role != 'superAdmin' && userId != res.locals.userId && currentAdminUser.role != 'superAdmin') {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: 'error',
          message: 'You are not allowed to perfom this action',
          data: null,
        })
    }

    // Delete the user

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Admin deleted successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while deleting the admin',
      data: null,
    })
  }
}

// @desc Get all admins
// @route GET /api/v1/all
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password')
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Admins fetched successfully',
      data: admins,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while fetching admins',
      data: null,
    })
  }
}

// @desc Get all users 
// @route GET /api/v1/admin/users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password')
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Users fetched successfully',
      data: users,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while fetching users',
      data: null,
    })
  }
}

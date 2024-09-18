import { StatusCodes } from 'http-status-codes';
import Admin from '../models/admin.model.js';
import bcrypt from 'bcrypt';
import { Logger } from 'borgen';
import jwt from 'jsonwebtoken';
import { Config } from '../lib/config.js';

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
    const userId = res.params.id;
    const { name, email, password } = req.body;
    // Fetch the user to update
    const admin = await Admin.findById(userId);
    if (!admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "You are not allowed to perfom this action",
        data: null,
      });
    }
  }
  catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while updating the admin',
      data: null,
    })
  }
} 

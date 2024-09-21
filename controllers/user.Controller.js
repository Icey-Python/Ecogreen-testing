import { StatusCodes } from 'http-status-codes'
import User from '../models/user.model.js'
import { Logger } from 'borgen'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Config } from '../lib/config.js'
import otp from 'otp-generator'
import { Resend } from 'resend'

//@init Resend
const resend = new Resend(Config.RS_MAIL_KEY)
// @route POST /api/v1/user/signup
// @desc Register user
export const signUpUser = async (req, res) => {
  try {
    const { name, email, password } = req.body

    let hashedPassword = await bcrypt.hash(password, 10)
    let newUser = new User({
      name,
      email,
      password: hashedPassword,
    })

    let data = await newUser.save()
    // Create jwt
    let token = jwt.sign(
      {
        id: newUser.id,
      },
      Config.JWT_SECRET,
      {
        expiresIn: '7d', // Set expiration to 7 days
      },
    )
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'User sign up successful',
      data: {
        name: data.name,
        email: data.email,
        token,
      },
    })
  } catch (error) {
    Logger.error({ message: error.message })

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while creating the user',
      data: null,
    })
  }
}

// @desc Login user
// @route POST /api/v1/user/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body

    // Check if the user exists
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Invalid email or password',
        data: null,
      })
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password)
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
        id: user.id,
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
        userId: user._id,
        name: user.name,
        email: user.email,
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

// @desc Update a user's own account by ID
// @route PUT /api/v1/users/:id
export const updateUserById = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { name, email, password } = req.body

    // Fetch the user to update
    const user = await User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'User not found',
        data: null,
      })
    }

    // Update the user's fields
    if (name) user.name = name
    if (email) user.email = email

    // If password is provided, hash it before saving
    if (password) {
      user.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await user.save()

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'User updated successfully',
      data: updatedUser,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while updating the user',
      data: null,
    })
  }
}

// @desc Update a user's password
// @route PUT /api/v1/users/password/:id
export const updateUserPassword = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { newPassword, password } = req.body

    if (!password || !newPassword) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Please check missing fields',
        data: null,
      })
    }

    // Fetch the user to update
    const user = await User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please login to perform this action',
        data: null,
      })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Invalid old password',
        data: null,
      })
    }

    // If password is provided, hash it before saving

    user.password = await bcrypt.hash(password, 10)

    const updatedUser = await user.save()

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'User password updated successfully',
      data: updatedUser,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while updating the password',
      data: null,
    })
  }
}
//@ desc Forgot Password -> reset Details
//@ route POST /api/v1/user/reset/password/otp
export const forgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please provide email',
        data: null,
      })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(StatusCodes.BAD_GATEWAY).json({
        status: 'error',
        message: 'The email address you provided does not match your email',
        data: null,
      })
    }
    //send email using resend
    const otpCode = otp.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    })
    const resetDetails = {
      token: bcrypt.hashSync(otpCode, 10),
      expires: Date.now() + 300000,
    }
    user.resetDetails = resetDetails
    await user.save()
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['ndungusamkelly5@gmail.com'],
      subject: 'Password Reset',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            text-align: center;
        }
        .header {
            background-color: #4CAF50;
            padding: 10px;
            color: white;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
        }
        .content p {
            font-size: 16px;
            color: #333;
        }
        .otp-code {
            display: inline-block;
            background-color: #f9f9f9;
            padding: 15px;
            font-size: 28px;
            letter-spacing: 10px;
            font-weight: bold;
            color: #333;
            border: 2px dashed #4CAF50;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            padding: 10px;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>Password Reset Request</h1>
    </div>

    <div class="content">
        <p>Hi,</p>
        <p>You requested to reset your password. Please use the OTP code below to proceed with resetting your password:</p>

        <div class="otp-code">
            ${otpCode}
        </div>

        <p>This code will expire in 10 minutes. If you did not request a password reset, please ignore this email.</p>
    </div>

    <div class="footer">
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>&copy; 2024 Ecogreen. All rights reserved.</p>
    </div>
</div>

</body>
</html>
`,
    })
    if (error) {
      Logger.error({ message: error.message })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'An error occurred while sending reset details to your email',
        data: null,
      })
    }
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'OTP sent successfully',
      data,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while sending reset details',
      data: null,
    })
  }
}

//@ desc Send OTP -> 2FA
//@ route POST /api/v1/users/otp
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'User not found',
        data: null,
      })
    }
    const otpCode = otp.generate(6, {
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false,
    })
    const authDetails = {
      token: bcrypt.hashSync(otpCode, 10),
      expires: Date.now() + 300000,
    }
    user.authDetails = authDetails
    await user.save()
    const { data, error } = await resend.emails.send({
      to:["ndungusamkelly5@gmail.com"],
      from: 'Acme <onboarding@resend.dev>',
      subject: 'OTP Code',
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Code</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #4CAF50;
            color: white;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 20px;
        }
        .content p {
            font-size: 16px;
            color: #333;
        }
        .otp-code {
            display: inline-block;
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .footer {
            padding: 10px;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>OTP Code</h1>
    </div>

    <div class="content">
        <p>Hi,</p>
        <p>Someone requested to sign into your acoount, enter this code to verify if it you who is signing in </p>

        <div class="otp-code">
            ${otpCode}
        </div>

        <p>If Its not you who is trying to sign in, please reset your password ASAP.</p>
    </div>

    <div class="footer">
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>&copy; 2024 Ecogreen. All rights reserved.</p>
    </div>
</div>

</body>
</html>
`,
    })
    if (error) {
      Logger.error({ message: error.message })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'An error occurred while sending OTP',
        data: null,
      })
    }
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'OTP sent successfully',
      data,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while sending OTP',
      data: null,
    })
  }
}
//@desc verify OTP -> resetPassword
//@route POST /api/v1/users/otp/verify

export const verifyOtp = async (req, res) => {
  try {
    const { email, otpCode } = req.body
    if (!email || !otpCode) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'All fields are required',
        data: null,
      })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    if (Date.now() > user.authDetails.expires || Date.now() > user.resetDetails.expires) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'OTP expired',
        data: null,
      })
    }
    if (!bcrypt.compare(otpCode, user.authDetails.token) || !bcrypt.compare(otpCode,user.resetDetails.token)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid OTP code',
        data: null,
      })
    }
    
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'OTP verified successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while verifying OTP',
      data: null,
    })
  }
}
//@desc New Password after OTP verfication 
//@route POST /api/v1/users/reset/password/new
export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'All fields are required',
        data: null,
      })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    user.password = bcrypt.hash(password, 10)
    await user.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Password reset successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while resetting password',
      data: null,
    })
  }
}
//@desc Delete user's own account by ID
//@route DELETE /api/v1/users/:id

export const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id

    // Fetch the user to delete
    const user = await User.findByIdAndDelete(userId)
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'User not found',
        data: null,
      })
    }

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'User deleted successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while deleting the user',
      data: null,
    })
  }
}

// @desc Get all users (Admin only)
// @route GET /api/v1/users
export const getAllUsers = async (req, res) => {
  try {
    // Check if the requesting user is an admin (this check is handled by adminAuth middleware)
    const users = await User.find().select('-password') // Exclude password

    res.status(StatusCodes.OK).json({
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

// @desc Request connection to another user
// @route POST /api/v1/user/connect/request/:recipientUserId
export const requestConnection = async (req, res) => {
  try {
    const requestingUserId = res.locals.userId
    const recipientUserId = req.params.recipientUserId

    // Check if recipient user exists
    const recipientUser = await User.findById(recipientUserId)
    if (!recipientUser) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'User not found.',
      })
    }

    // Check if the request already exists or if they are already connected
    const existingRequest = recipientUser.connectionRequests.find(
      (req) => req.from.toString() === requestingUserId,
    )
    const alreadyConnected =
      recipientUser.connections.includes(requestingUserId)

    if (existingRequest) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Connection request already sent.',
      })
    }

    if (alreadyConnected) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'You are already connected with this user.',
      })
    }

    // Add the connection request to the recipient user's connectionRequests array
    recipientUser.connectionRequests.push({
      from: requestingUserId,
      status: 'pending',
    })

    await recipientUser.save()

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Connection request sent successfully.',
    })
  } catch (error) {
    Logger.error({ message: error.message, stack: error.stack }) // Log the actual error
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while sending the connection request.',
    })
  }
}

// @desc Approve connection request from another user
// @route POST /api/v1/user/connect/approve/:requestingUserid
export const approveConnection = async (req, res) => {
  try {
    const approvingUserId = res.locals.userId
    const requestingUserId = req.params.requestingUserId

    // Find the approving user
    const approvingUser = await User.findById(approvingUserId)
    if (!approvingUser) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'User not found.',
      })
    }

    // Find the connection request
    const connectionRequest = approvingUser.connectionRequests.find(
      (req) =>
        req.from.toString() === requestingUserId && req.status === 'pending',
    )

    if (!connectionRequest) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Connection request not found.',
      })
    }

    // Approve the request: Add each user to the other's connections array
    approvingUser.connections.push(requestingUserId)
    connectionRequest.status = 'approved'

    // Update the requesting user's connections
    const requestingUser = await User.findById(requestingUserId)
    if (requestingUser) {
      requestingUser.connections.push(approvingUserId)
      await requestingUser.save()
    }

    await approvingUser.save()

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Connection approved successfully.',
    })
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while approving the connection request.',
    })
  }
}

import { StatusCodes } from 'http-status-codes'
import User from '../models/user.model.js'
import { Logger } from 'borgen'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Config } from '../lib/config.js'
import otp from 'otp-generator'
import { Resend } from 'resend'
import { connectionRequestEmail, otpEmail, resetEmail } from '../lib/email-templates/otpEmail.js'
import GreenBank from '../models/greenBank.model.js'
import { uploadImage } from '../util/imageUpload.js'
import Donation from '../models/donation.model.js'
import Deposit from '../models/deposit.model.js'
import Withdraw from '../models/withdraw.model.js'
import Transaction from '../models/transaction.model.js'
import Post from '../models/post.model.js'
import Notification from '../models/notification.model.js' 
//@init Resend
const resend = new Resend(Config.RS_MAIL_KEY)
// @route POST /api/v1/user/signup
// @desc Register user
export const signUpUser = async (req, res) => {
  try {
    const { name, email, password, refferalCode, contact } = req.body
    if (!name || !email || !password || !contact) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'All fields are required',
        data: null,
      })
    }
    const user = await User.findOne({ email })
    if (user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'A User with this email already exists',
        data: null,
      })
    }
    //add phone check 
    const phone = await User.findOne({ contact })
    if (phone) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'A User with this phone number already exists',
        data: null,
      })
    }
    let hashedPassword = await bcrypt.hash(password, 10)
    const userRefferalCode = otp.generate(6, {
      upperCaseAlphabets: true,
      lowerCaseAlphabets: true,
      digits: true,
      specialChars: false,
    })
    let newUser = new User({
      name,
      email,
      password: hashedPassword,
      refferal: { code: userRefferalCode },
      contact,
    })

    const greenBank = new GreenBank({
      user: newUser.id,
      description: 'Extra donation points supporting environmental causes',
    })
    await greenBank.save()

    // update referree users
    if (refferalCode) {
      const refferalUser = await User.findOne({
        refferal: { code: refferalCode },
      })
      if (!refferalUser) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: 'Invalid refferal code',
          data: null,
        })
      }
      refferalUser.refferal.refferedUsers.push(newUser._id)
      // 10 reffeals = 4000 points
      // 15 refferals =5000 points
      // 20 refferals = pizza award
      if (refferalUser.refferal.refferedUsers.length > 20 && refferalUser.refferal.awardEarned != "Pizza!") {
        refferalUser.refferal.awardEarned = "Pizza!"
      } else if (refferalUser.refferal.refferedUsers.length > 15 && refferalUser.refferal.totalEarned < 5000) {
        refferalUser.totalEarned = 5000
        refferalUser.balance += 5000
      } else if (refferalUser.refferal.refferedUsers.length > 10 && refferalUser.refferal.totalEarned < 4000) {
        refferalUser.totalEarned = 4000
        refferalUser.balance += 4000
      }
      await refferalUser.save()
    }

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
        id: data.id,
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
// @route PUT /api/v1/user/update
export const updateUserById = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { name, email, oldPassword, newPassword } = req.body
    const image = req.file
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

    if (newPassword && !oldPassword) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Old password is required',
        data: null,
      })
    }
    // If password is provided, hash it before saving
    if (newPassword && oldPassword) {
      const isValidPassword = await bcrypt.compare(oldPassword, user.password)
      if (!isValidPassword) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: 'error',
          message: 'Invalid old password',
          data: null,
        })
      }
      user.password = await bcrypt.hash(newPassword, 10)
    }
    if (image) {
      uploadImage({
        req,
        res,
        Model: User,
        modelName: 'user',
        imageField: 'image',
        docId: user.id,
      })
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
    user.emailVerified = false
    await user.save()
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['ndungusamkelly5@gmail.com'],
      subject: 'Password Reset',
      html: otpEmail(otpCode),
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
    user.emailVerified = false
    await user.save()
    const { data, error } = await resend.emails.send({
      to: ['ndungusamkelly5@gmail.com'],
      from: 'Acme <onboarding@resend.dev>',
      subject: 'OTP Code',
      html: resetEmail(otpCode),
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
    if (
      Date.now() > user.authDetails.expires ||
      Date.now() > user.resetDetails.expires
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'OTP expired',
        data: null,
      })
    }
    if (
      !bcrypt.compare(otpCode, user.authDetails.token) ||
      !bcrypt.compare(otpCode, user.resetDetails.token)
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid OTP code',
        data: null,
      })
    }
    user.emailVerified = true
    await user.save()
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
    user.emailVerified = true
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
    const userId = res.locals.userId

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

    const requestingUser = await User.findById(requestingUserId)
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
    //send resend email 

    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: ['ndungusamkelly5@gmail.com'],
      subject: 'New Join Squad Request',
      html: connectionRequestEmail(recipientUser.name, requestingUser.name)
    })
    if (error) {
      Logger.error({ message: error.message })
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'An error occurred while sending connection request details to email',
        data: null,
      })
    }

    // create new notification 
    const newNotification = new Notification({
      user: recipientUser._id,
      description: `${requestingUser.name} sent you a connection request.`,
      from: requestingUser._id,
      type: "connectionRequest"
    })
    await newNotification.save()
    recipientUser.notifications.push(newNotification)
    await recipientUser.save()

    await recipientUser.save()

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Connection request sent successfully.',
      data: null
    })
  } catch (error) {
    Logger.error({ message: error.message}) // Log the actual error
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

    const connectionRequestIndex = approvingUser.connectionRequests.findIndex(
      (req) =>
        req.from.toString() === requestingUserId && req.status === 'pending',
    )

    if (!connectionRequestIndex === -1) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Connection request not found.',
      })
    }

    // Approve the request: Add each user to the other's connections array

    approvingUser.connections.push(requestingUserId)
    approvingUser.connectionRequests[connectionRequestIndex].status = 'approved'

    // Remove the connection request from the approving user's connectionRequests array
    approvingUser.connectionRequests.splice(connectionRequestIndex, 1)

    // Update the requesting user's connections
    const requestingUser = await User.findById(requestingUserId)
    if (requestingUser) {
      requestingUser.connections.push(approvingUserId)
      await requestingUser.save()
    }
    // remove from notifications 
    approvingUser.notifications = approvingUser.notifications.filter((notification) => {
      return notification.from.toString() !== approvingUserId || notification.type !== "connectionRequest";
    });
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

// @ desc Get User Refferal Code
// @ route GET /api/v1/user/reffer
export const getRefferalCode = async (req, res) => {
  try {
    const userId = res.locals.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    const user = await User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Invalid Id',
        data: null,
      })
    }
    const refferalCode = user.refferal.code
    console.log(refferalCode)
    if (!refferalCode) {
      // Generate Refferal Code
      const refferalCode = otp.generate(6, {
        lowerCaseAlphabets: true,
        upperCaseAlphabets: true,
        digits: true,
        specialChars: false,
      })
      user.refferal.code = refferalCode
      await user.save()
    }
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Refferal Code fetched successfully',
      data: {
        refferalCode,
      },
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while fetching user',
      data: null,
    })
  }
}

// @ Desc Send Points to other user
// @ route POST /api/v1/user/points/send

export const sendPoints = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { amount, recepientId } = req.body

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login to perfom this action',
        data: null,
      })
    }

    if (!amount || amount < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Amount cannot be zero',
        data: null,
      })
    }
    if (!recepientId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'A recepeint is required for this action',
        data: null,
      })
    }
    //get user balance
    const user = await User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login to perfom this action',
        data: null,
      })
    }
    if (amount > user.balance) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: `Insufficient funds in your account, You need ${amount - user.balance} extra points to perfom this transfer`,
        data: null,
      })
    }
    // check if the receiver is valid
    const receiver = await User.findById(recepientId)
    if (!receiver) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid receiver Id',
        data: null,
      })
    }

    // perfom transaction
    user.balance -= amount
    receiver.balance += amount
    await user.save()
    await receiver.save()

    // create new Transaction 
    const transaction = new Transaction({
      sender: userId,
      receiver: recepientId,
      amount,
    })
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Money transfer action performed succesfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured trying to perfom this transfer',
      data: null,
    })
  }
}
// @ desc move points from user balance to greenbank 
// @ route POST /api/v1/user/points/move 
export const movePoints = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { amount } = req.body
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login to perfom this action',
        data: null,
      })
    }
    if (!amount || amount < 1) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Amount cannot be zero',
        data: null,
      })
    }
    const user = await User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login to perfom this action',
        data: null,
      })
    }
    if (amount > user.balance) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: `Insufficient funds in your account, You need ${amount - user.balance} extra points to perfom this transfer`,
        data: null,
      })
    }
    user.balance -= amount
    user.greenbank += amount
    //create transaction 
    const transaction = new Transaction({
      sender: userId,
      receiver: userId,
      amount,
      description: "Move from balance to greenbank"
    })
    await user.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Money transfer action performed succesfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured trying to perfom this transfer',
      data: null,
    })
  }
}

// @ desc get transaction history 
// @ route GET /api/v1/user/transactions/history
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = res.locals.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    const user = await User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Invalid Id',
        data: null,
      })
    }
    //get orders with user id 
    const purchases = Order.find({ buyerId: user.id }).populate('products.product')
    //get donations with user id 
    const donations = Donation.find({ user: user.id })
    // get deposits with user id
    const deposits = Deposit.find({ userId: user.id })
    // get withdrawals
    const withdrawals = Withdraw.find({ userId: user.id })

    //get transactions with recepient id or user id 
    const transactions = Transaction.find({ $or: [{ sender: user.id }, { receiver: user.id }] })
    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Transaction history fetched successfully',
      data: {
        purchases,
        donations,
        deposits,
        withdrawals,
        transactions,
      },
    })
  }
  catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while fetching user',
      data: null,
    })
  }
}

// @ desc remove post from feed
// @ route POST /api/v1/user/feed/remove
export const removePostFromFeed = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { postId } = req.body
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    if (!postId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please provide post id',
        data: null,
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Invalid Id',
        data: null,
      })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid post Id',
        data: null,
      })
    }

    user.feed.excluded.push(postId)
    await user.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Post removed from feed successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to remove post from feed',
      data: null,
    })
  }
}

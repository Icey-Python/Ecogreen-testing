import { StatusCodes } from "http-status-codes";
import User from "../models/user.model.js";
import { Logger } from "borgen";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Config } from "../lib/config.js";

// @route POST /api/v1/user/signup
// @desc Register user
export const signUpUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let hashedPassword = await bcrypt.hash(password, 10);
    let newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    let data = await newUser.save();
    // Create jwt
    let token = jwt.sign(
      {
        id: newUser.id,
      },
      Config.JWT_SECRET,
      {
        expiresIn: "7d", // Set expiration to 7 days
      }
    );
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "User sign up successful",
      data: {
        name: data.name,
        email: data.email,
        token
      },
    });

    
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while creating the user",
      data: null,
    });
  }
};

// @desc Login user
// @route POST /api/v1/user/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Invalid email or password",
        data: null,
      });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Invalid email or password",
        data: null,
      });
    }

    // Create jwt
    let token = jwt.sign(
      {
        id: user.id,
      },
      Config.JWT_SECRET,
      {
        expiresIn: "7d", // Set expiration to 7 days
      }
    );

    // If password is valid, login is successful
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Login successful",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred during login",
      data: null,
    });
  }
};

// @desc Update a user's own account by ID
// @route PUT /api/v1/users/:id
export const updateUserById = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const { name, email, password } = req.body;

    // Fetch the user to update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "User not found",
        data: null,
      });
    }

    // Update the user's fields
    if (name) user.name = name;
    if (email) user.email = email;

    // If password is provided, hash it before saving
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await user.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while updating the user",
      data: null,
    });
  }
};

// @desc Update a user's password
// @route PUT /api/v1/users/password/:id
export const updateUserPassword = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const { newPassword, password } = req.body;

    if (!password || !newPassword) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Please check missing fields",
        data: null,
      });
    }

    // Fetch the user to update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Please login to perform this action",
        data: null,
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Invalid email or password",
        data: null,
      });
    }

    // If password is provided, hash it before saving

    user.password = await bcrypt.hash(password, 10);

    const updatedUser = await user.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "User password updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while updating the password",
      data: null,
    });
  }
};

//@desc Delete user's own account by ID
//@route DELETE /api/v1/users/:id

export const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // Fetch the user to delete
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "User not found",
        data: null,
      });
    }

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "User deleted successfully",
      data: null,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while deleting the user",
      data: null,
    });
  }
};

// @desc Get all users (Admin only)
// @route GET /api/v1/users
export const getAllUsers = async (req, res) => {
  try {
    // Check if the requesting user is an admin (this check is handled by adminAuth middleware)
    const users = await User.find().select('-password'); // Exclude password

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching users",
      data: null,
    });
  }
};

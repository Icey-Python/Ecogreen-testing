import { StatusCodes } from "http-status-codes";
import User from '../models/user.model.js'
import { Logger } from "borgen";
import bcrypt from "bcrypt"

// @route POST /api/v1/user/signup
export const signUpUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    let hashedPassword =await  bcrypt.hash(password, 10);
    let newUser = new User({
      name,
      email,
      password: hashedPassword
    })

    let data = await newUser.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "User sign up successful",
      data
    });
  } catch (error) {
    Logger.error({message:error.message});
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while creating the user",
      data: null,
    });
  }
};


// Login user
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

    // If password is valid, login is successful
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Login successful",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email
      }
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

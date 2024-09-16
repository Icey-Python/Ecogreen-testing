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

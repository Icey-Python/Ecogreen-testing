import { Logger } from "borgen";
import Squad from "../models/squad.model.js";  
import jwt from "jsonwebtoken"
import { StatusCodes } from "http-status-codes";
import { Config } from "../lib/config.js";
import User from "../models/user.model.js";
export const squadAdminAuth = async (req, res, next) => {
  try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
          return res.status(StatusCodes.UNAUTHORIZED).json({
            status: "error",
            message: "No token provided",
            data: null,
          });
        }
    
        // Verify and decode the token
        const decoded = jwt.verify(token,Config.JWT_SECRET );
        const userId = decoded.id;

        let admin = await Squad.find({admin: userId});

        if(!admin){
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: "error",
                message: "You are not allowed to perform this action",
                data:null,
              });
        }
        next()

  } catch (error) {
    Logger.error({message: error})
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while checking squad admin privileges.",
    });
  }
};

import jwt from "jsonwebtoken"
import { StatusCodes } from "http-status-codes";
import { Config } from "../lib/config.js";
import User from "../models/user.model.js";

export const userAuth = async (req,res,next) => {
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

        let user = await User.findById(userId);

        if(!user){
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: "error",
                message: "You are not allowed to perform this action",
                data: null,
              });
        }

        res.locals.userId = user.id;

        next()       
    } catch (err) {
        res.status(StatusCodes.UNAUTHORIZED).json({
            status: "error",
            message: "You are not allowed to perform this action",
            data: null,
          });
    }
}
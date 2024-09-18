import jwt from "jsonwebtoken"
import { StatusCodes } from "http-status-codes";
import { Config } from "../lib/config.js";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";

export const adminAuth = async (req,res,next) => {
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

        let admin = await Admin.findById(userId);

        if(!admin){
            return res.status(StatusCodes.UNAUTHORIZED).json({
                status: "error",
                message: "You are not allowed to perform this action",
                data: null,
              });
        }

        res.locals.userId = admin.id;

        next()       
    } catch (err) {
        res.status(StatusCodes.UNAUTHORIZED).json({
            status: "error",
            message: "You are not allowed to perform this action",
            data: null,
          });
    }
}


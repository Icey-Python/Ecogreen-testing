import jwt from "jsonwebtoken"
import { StatusCodes } from "http-status-codes";
import { Config } from "../lib/config.js";
import Admin from "../models/admin.model.js";
import User from "../models/user.model.js";



export const userAdminAuth = async (req, res, next) => {
    try {
      // Get token from header
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: " No token provided.",
        });
      }
  
      // Verify token
      const decoded = jwt.verify(token, Config.JWT_SECRET);
      if (!decoded) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: " Invalid token.",
        });
      }
  
      const userId = decoded.id;

      const user = await User.findById(userId);
      const admin = await Admin.findById(userId);
  
      // Check if the user exists either as a user or admin
      if (user) {
        res.locals.userId = user; 
        next(); 
      } else if (admin) {
        res.locals.userId = admin; 
        next(); 
      } else {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "You are not allowed to perform this action.",
          data: null,
        });
      }
    } catch (error) {
      console.error("Auth Error:", error);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "You are not allowed to perform this action",
        data: null,
      });
    }
  };

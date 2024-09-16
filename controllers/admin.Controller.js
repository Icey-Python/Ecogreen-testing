import { StatusCodes } from "http-status-codes";

// create new admin
// @route GET /api/v1/admin/signup
export const signUpAdmin = async (req, res) => {
  const { name, id } = req.body;
  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Admin sign up successful",
    data: {
      name,
      id,
    },
  });
};

// create new admin
// @route GET /api/v1/admin/login
export const loginAdmin = async (req, res) => {
  const { name, pass } = req.body;
  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Admin logged in successfully",
    data: {
      name,
      pass,
    },
  });
};

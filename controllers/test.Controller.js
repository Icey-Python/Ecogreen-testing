import { StatusCodes } from "http-status-codes";

// @route GET /api/v1/test/testing
export const testingController = async (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Testing successful",
      data: null,
    });
  } catch (err) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while processing your request",
      data: null,
    });
  }
};

import { StatusCodes } from "http-status-codes";

// Create new squad
// @route POST /api/v1/squad/create
export const createSquad = async (req, res) => {
  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Created squads  successful",
    data: null,
  });
};

// Get all squads
// @route GET /api/v1/squad/all
export const getAllSquads = async(req,res) => {
    res.status(StatusCodes.OK).json({
        status: "success",
        message: "Fetched all squads successful",
        data: null,
      });
}



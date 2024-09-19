import { StatusCodes } from "http-status-codes";
import User from "../models/user.model.js";
import { Logger } from "borgen";


//desc Get all user donations
//route GET /api/v1/leaderboard/users/donations

export const getAllUsersDonations = async (req, res) => {
  try {
    // Find all users, sort by donations in descending order
    const users = await User.find({})
      .select("name donations")
      .sort({ donations: -1 })
      .limit(10);

    // Check if any users found
    if (!users || users.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "No donations found",
        data: null,
      });
    }

    // Prepare leaderboard data
    const leaderboard = users.map((user, index) => ({
      rank: index + 1, // Assign rank based on position
      name: user.name,
      totalDonations: user.donations,
    }));

    // Return leaderboard response
    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Leaderboard fetched successfully",
      data: leaderboard,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching the leaderboard",
      data: null,
    });
  }
};

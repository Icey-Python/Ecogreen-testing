import { StatusCodes } from 'http-status-codes'
import User from '../models/user.model.js'
import { Logger } from 'borgen'
import Squad from '../models/squad.model.js'

//desc Get all user donations
//route GET /api/v1/leaderboard/users/donations

export const getAllUsersDonations = async (req, res) => {
  try {
    // Find all users, sort by donations in descending order
    const users = await User.find({})
      .select('name donations')
      .sort({ donations: -1 })
      .limit(10)

    // Check if any users found
    if (!users || users.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'No donations found',
        data: null,
      })
    }

    // Prepare leaderboard data
    const leaderboard = users.map((user, index) => ({
      rank: index + 1, // Assign rank based on position
      name: user.name,
      totalDonations: user.donations,
    }))

    // Return leaderboard response
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Leaderboard fetched successfully',
      data: leaderboard,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while fetching the leaderboard',
      data: null,
    })
  }
}

// @desc Squad leaderboard
// @route GET /api/v1/leaderboard/squads/donations
export const getDonationsBySquads = async (req, res) => {
  try {
    // Find all squads and populate their members (which are users)
    const squads = await Squad.find().populate("members");

    // Array to hold squad donation totals
    const squadDonations = [];

    // Loop through each squad
    for (const squad of squads) {
      // Calculate the total donations for the squad by summing member donations
      const totalDonations = squad.members.reduce((acc, member) => acc + (member.donations || 0), 0);

      // Push the squad and its total donations to the array
      squadDonations.push({
        squadName: squad.name, // Squad name
        squadDescription: squad.description, // Optional description if needed
        totalDonations: totalDonations
      });
    }

    // Sort squads by total donations in descending order
    squadDonations.sort((a, b) => b.totalDonations - a.totalDonations);

    // Return the sorted squads with total donations
    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Squad donations fetched successfully",
      data: squadDonations
    });
  } catch (error) {
    Logger.error({ message: error.message });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching squad donations",
      data: null
    });
  }
};

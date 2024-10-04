import { StatusCodes } from 'http-status-codes'
import User from '../models/user.model.js'
import { Logger } from 'borgen'
import Squad from '../models/squad.model.js'
const DONATION_MULTIPLIER = 5
const PURCHASE_MULTIPLIER = 3
const ACTIVITY_MULTIPLIER = 2
const BALANCE_MULTIPLIER = 1

//desc Get all user donations
//route GET /api/v1/leaderboard/users/donations
export const getUserLeaderboard = async (req, res) => {
  try {
    //get all users
    const users = await User.find().select('-password')
    const leaderboard = users.map((user) => ({
      name: user.name,
      userId: user.id,
      totalScore:
        DONATION_MULTIPLIER * user.donations +
        PURCHASE_MULTIPLIER * user.purchases +
        BALANCE_MULTIPLIER * user.balance,
    }))
    // Extract the total scores into an array
    const scores = leaderboard.map((user) => user.totalScore)

    // Find the maximum score
    const maxScore = Math.max(...scores)

    const leaderboardWithPercentages = leaderboard.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      totalScore: user.totalScore,
      percentage: ((user.totalScore / maxScore) * 100).toFixed(2),
    }))
    // Return leaderboard response
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Leaderboard fetched successfully',
      data: leaderboardWithPercentages,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while fetching user leaderboard',
      data: null,
    })
  }
}

// @desc Squad leaderboard
// @route GET /api/v1/leaderboard/squads/donations
export const getSquadLeaderBoard = async (req, res) => {
  try {
    const squads = await Squad.find().populate('members')
    const squadDonations = squads.map((squad) => {
      const totalDonations = squad.members.reduce(
        (acc, member) =>
          acc +
          DONATION_MULTIPLIER * (member.donations || 0) +
          PURCHASE_MULTIPLIER * (member.purchases || 0) +
          BALANCE_MULTIPLIER * (member.balance || 0),
        0,
      )

      return {
        squadName: squad.name,
        totalScore: totalDonations,
      }
    })
    // Extract the total scores into an array
    const scores = squadDonations.map(squad => squad.totalScore);

    // Find the maximum score 
    const maxScore = Math.max(...scores);
     const leaderboardWithPercentages = squadDonations.map((squad, index) => ({
      rank: index + 1,
      squadName: squad.squadName,
       squadId: squad.id,
      totalScore: squad.totalScore,
      percentage: ((squad.totalScore / maxScore) * 100).toFixed(2),
    }));
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Squad leaderboard fetched successfully',
      data: leaderboardWithPercentages,
    })
  } catch (error) {
    Logger.error({ message: error.message })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while fetching squad leaderboard',
      data: null,
    })
  }
}

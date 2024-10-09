import { StatusCodes } from 'http-status-codes'
import User from '../models/user.model.js'
import { Logger } from 'borgen'
import Squad from '../models/squad.model.js'


//desc Get all user donations
//route GET /api/v1/leaderboard/users/donations
export const getUserLeaderboard = async (req, res) => {
  try {
    //get all users
    const users = await User.find().select('-password')
    //donation, purchase and activity percentages
    let leaderboardWithPercentages = users.map((user) => {
      const totalPercentage = user.leaderboardScore;
      return {
        id: user.id,
        name: user.name,
        totalPercentage,
      }
    })
    leaderboardWithPercentages = leaderboardWithPercentages.sort((a, b) => b.totalPercentage - a.totalPercentage)
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
    //for each squad get the average leaderboardScore for squad members 
    let leaderboardWithPercentages = squads.map((squad) => {
      const totalPercentage = squad.members
        .map((member) => member.leaderboardScore)
        .reduce((a, b) => a + b, 0) / squad.members.length
      return {
        id: squad.id,
        name: squad.name,
        totalPercentage,
      }
    })
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

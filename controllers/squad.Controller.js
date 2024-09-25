import { StatusCodes } from 'http-status-codes'
import Squad from '../models/squad.model.js' // Make sure you import your Squad model
import { Logger } from 'borgen' // Assuming you have a logger
import User from '../models/user.model.js' // Import User model if needed for population
import { Types, ObjectId } from 'mongoose'
import { isValidObjectId } from 'mongoose'
import Moderator from '../models/moderator.model.js'
import CarbonCalculator from '../models/carbonCalculator.model.js'
// @desc Create new squad
// @route POST /api/v1/squad/create
export const createSquad = async (req, res) => {
  try {
    /*
     @desc 
     {
      name,
      description,
      members -> optional
      moderators -> optional []
     }
     */
    const { name, description, members,moderators} = req.body
    const creatorId = res.locals.userId
    const user = await User.findById(creatorId)

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please Login and try again',
        data: null,
      })
    }
    // Create the squad with the creator as the first member and moderator
    let newSquad = new Squad({
      name,
      description,
      members: members ? [creatorId, ...members] : [creatorId],
      admin: user._id,
      moderators: moderators ? [creatorId, ...moderators] : [creatorId],
    })
    if(moderators){ 
     moderators.forEach(async (moderator) => {
      newSquad.members.push(new Types.ObjectId(moderator))
      const moderatorInfo = await User.findById(moderator)
      moderatorInfo.squads.push(newSquad._id)
      await moderatorInfo.save()
      let newModerator = new Moderator({
        moderatorId: new Types.ObjectId(moderator),
        squadId: newSquad._id,
        role: 'mod-members',
      })
      await newModerator.save()
    })
    }
    user.squads.push(newSquad._id)
    await user.save()

    let data = await newSquad.save()

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Squad created successfully',
      data: {
        squad: {
          id: data._id,
          name: data.name,
          description: data.description,
          members: data.members,
        },
      },
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while creating the squad',
      data: null,
    })
  }
}

// @desc  Request Join Squad
// @route PUT /api/v1/squad/join/:id
export const requestToJoinSquad = async (req, res) => {
  try {
    const userId = res.locals.userId
    const squadId = req.params.id
    const user = await User.findById(userId)

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please Login and try again',
        data: null,
      })
    }
    //find squad by Id
    const squad = await Squad.findById(squadId)
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Squad Id',
        data: null,
      })
    }
    const members = squad.members
    //check if member already is in the squad
    if (members.includes(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'You are already a member of this squad',
        data: null,
      })
    }


    squad.requestedMembers.push(user._id)
    await squad.save()

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Join squad request sent successfully',
      data: {
        name: squad.name,
        id: squad.id,
      },
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while joining the squad',
      data: null,
    })
  }
}

// @desc Leave Squad
// @route PUT /api/v1/squad/leave/:id
export const leaveSquad = async (req, res) => {
  try {
    const squadId = req.params.id
    const userId = res.locals.userId // Assuming userId is set in middleware

    if (!squadId || !userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }

    // Find the squad by Id
    const squad = await Squad.findById(squadId)
    if (!squad) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: 'error',
        message: 'Squad not found',
        data: null,
      })
    }

    // Check if the user is a member of the squad
    if (!squad.members.includes(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'You are not a member of this squad',
        data: null,
      })
    }

    // Remove the user from the squad's members
    squad.members = squad.members.filter(
      (memberId) => memberId.toString() !== userId,
    )

    // Save the updated squad
    await squad.save()

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'You have successfully left the squad',
      data: {
        squadId: squad._id,
        userId,
      },
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while leaving the squad',
      data: null,
    })
  }
}

// @desc Get all squads
// @route GET /api/v1/squad/all
export const getAllSquads = async (req, res) => {
  try {
    const squads = await Squad.find().populate('members')

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Fetched all squads successful',
      data: squads,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to fetch squads',
      data: null,
    })
  }
}

//@desc Update squads
//@route PUT /api/v1/squad/update/:id
export const updateSquad = async (req, res) => {
  try {
    const squadId = req.params.id
    const userId = res.locals.userId
    const { name, description } = req.body

    const squad = await Squad.findById(squadId)
    if (!squad || !userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }

    if (userId != String(squad.admin)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }

    if (name) squad.name = name
    if (description) squad.description = description
    await squad.save()
    //get the creatorId from the squad members
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Squad details updated successfully',
      data: squad,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to update the squad details',
      data: null,
    })
  }
}

//@desc Delete Squads
//@route DELETE /api/v1/squad/delete/:id
export const deleteSquad = async (req, res) => {
  try {
    const squadId = req.params.id
    const userId = res.locals.userId

    const squad = await Squad.findById(squadId)
    if (!squad || !userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }

    if (userId != String(squad.admin)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }
    // Remove the squad from all users' members field
    await User.updateMany(
      { _id: { $in: squad.members } },
      { $pull: { squads: squadId } },
    )

    // Remove the squad from the members field in the Squad document
    await Squad.findByIdAndUpdate(
      squadId,
      { $pull: { members: { $in: squad.members } } },
      { new: true },
    )
    await Squad.findByIdAndDelete(squadId)

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Squad deleted successfully',
      data: {
        name: squad.name,
        id: squad.id,
      },
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to update the squad details',
      data: null,
    })
  }
}

//@ desc add member to squad -> Admin
//@ route PUT api/v1/squad/add/:id
export const addMember = async (req, res) => {
  try {
    const requestedMemberId = req.params.id
    const userId = res.locals.userId
    const { squadId } = req.body

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please log in and try again',
        data: null,
      })
    }

    if (!requestedMemberId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'requestedMemberId is required',
        data: null,
      })
    }
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }
    const requestedMember = await User.findById(requestedMemberId)
    if (!requestedMember) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid User Id',
        data: null,
      })
    }
    const squad = await Squad.findById(squadId)

    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Squad Id',
        data: null,
      })
    }
    const moderator = await Moderator.findOne({
      moderatorId: userId,
      squadId: squadId,
    })
    if (userId != squad.admin || moderator.role != 'mod-members' || !squad.moderators.includes(userId)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }

    if (squad.members.includes(requestedMemberId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'User is already a member of the squad',
        data: null,
      })
    }

    requestedMember.squads.push(new Types.ObjectId(squadId))
    await requestedMember.save()
    squad.members.push(new Types.ObjectId(requestedMemberId))
    await squad.save()

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'User added to the squad successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to add user to the squad',
      data: null,
    })
  }
}

//@ desc approve member to squad -> Admin
//@ route PUT api/v1/squad/approve/:id
export const approveMember = async (req, res) => {
  try {
    const userId = res.locals.userId
    const requestedMemberId = req.params.id
    const { squadId } = req.body
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    if(!requestedMemberId){
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'User Id is required',
        data: null,
      })
    }
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }

    const squad = await Squad.findById(squadId)

    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Squad Id',
        data: null,
      })
    }
    
  const requestedMember = await User.findById(requestedMemberId)
    if (!requestedMember) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid User Id',
        data: null,
      })
    }
    const moderator = await Moderator.find({squadId: squadId, moderatorId: userId})
    if (userId != squad.admin || !squad.moderators.includes(userId) || moderator.role != "mod-members"){
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }
    if(!squad.requestedMembers.includes(requestedMemberId)){
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'User did not requested to join the squad',
        data: null,
      })
    }
    if (squad.members.includes(requestedMemberId)) {
    return res.status(StatusCodes.CONFLICT).json({
        status: 'error',
        message: 'Member already in the squad',
        data: null,
      })
    }
    squad.requestedMembers = squad.requestedMembers.filter(
      (member) => member.toString() !== userId,
    )
    
    requestedMember.squads.push(new Types.ObjectId(squadId))
    await requestedMember.save()
    squad.members.push(new Types.ObjectId(requestedMemberId))
    squad.requestedMembers = squad.requestedMembers.filter(
      (member) => member.toString() !== requestedMemberId,
    )
    await squad.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Squad Member approved successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to approve the member',
      data: null,
    })
  }
}

//@ desc remove member from squad -> Admin
//@ route DELETE api/v1/squad/members/delete/:id
export const removeMember = async (req, res) => {
  try {
    const userId = res.locals.userId
    const memberId = req.params.id
    const { squadId } = req.body
    if (!memberId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Member Id is required',
        data: null,
      })
    }
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }

    const squad = await Squad.findById(squadId)
    const member = await User.findById(memberId)
    if(!member){
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid member Id',
        data: null,
      })
    }
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }

    const moderator = await Moderator.find({squadId: squadId, moderatorId: userId})
    if (userId != squad.admin|| !squad.moderators.includes(userId) || moderator.role != "mod-members"){ 
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }
    if (!squad.members.includes(memberId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Member not found in the squad',
        data: null,
      })
    }
    squad.members = squad.members.filter(
      (member) => member.toString() !== memberId,
    )
    member.squads = member.squads.filter(
      (userSquad) => userSquad.toString() !== squadId,
    )
    await member.save()
    await squad.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Squad Member removed successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to remove the member',
      data: null,
    })
  }
}

//MODERATORS 

//@ desc add moderator of squad
//@ route POST api/v1/squad/moderator/add
export const addModeratorToSquad = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { squadId, role, moderatorId } = req.body
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Login to perfom this action',
        data: null,
      })
    }
    if (!role) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Role is required',
        data: null,
      })
    }
    if (!moderatorId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Moderator Id is required',
        data: null,
      })
    }
    const moderator = await User.findById(moderatorId)
    if (!moderator) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid moderator Id',
        data: null,
      })
    }
    const squad = await Squad.findById(squadId)
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Squad Id',
        data: null,
      })
    }

    if (userId != squad.admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    if (squad.moderators.includes(moderatorId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Moderator already exists in the squad',
        data: null,
      })
    }
    if(!squad.members.includes(moderatorId)){
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Moderator must be part of the squad',
        data: null,
      })
    }
    squad.moderators.push(new Types.ObjectId(moderatorId))
    //create new Moderator 
    const newModerator = new Moderator({
      moderatorId: new Types.ObjectId(moderatorId),
      squadId: new Types.ObjectId(squadId),
      role: role,
    })
    await newModerator.save()
    await squad.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Moderator created successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to create moderator',
      data: null,
    })
  }
}

//@ desc Update Moderator role 
//@ route PUT api/v1/squad/moderator/update
export const updateModeratorRole = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { squadId, moderatorId, role } = req.body
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Login to perfom this action',
        data: null,
      })
    }
    if (!moderatorId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Moderator Id is required',
        data: null,
      })
    }
    if (!role) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Role is required [mod-members,mod-post]',
        data: null,
      })
    }
    const moderator = await Moderator.findOne({moderatorId:moderatorId, squadId:squadId})
    if (!moderator) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid moderator Id',
        data: null,
      })
    }
    const squad = await Squad.findById(squadId)
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Squad Id',
        data: null,
      })
    }

    if (userId != squad.admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    if (!squad.moderators.includes(moderatorId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Moderator does not exist in the squad',
        data: null,
      })
    }
    const moderatorRoles = ['mod-members', 'mod-post']
    if(role && !moderatorRoles.includes(role)){
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid role [mod-members,mod-post]',
        data: null,
      })
    }

    moderator.role = role
    await moderator.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Moderator role updated successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to update moderator role',
      data: null,
    })
  }
}

//@ desc Demote moderator
//@ route PUT api/v1/squad/moderator/delete
export const deleteModerator = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { squadId, moderatorId } = req.body
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Login to perfom this action',
        data: null,
      })
    }
    if (!moderatorId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Moderator Id is required',
        data: null,
      })
    }
    const moderator = await Moderator.findOne({moderatorId:moderatorId, squadId:squadId})
    if (!moderator) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid moderator Id',
        data: null,
      })
    }
    const squad = await Squad.findById(squadId)
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Squad Id',
        data: null,
      })
    }

    if (userId != squad.admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    if (!squad.moderators.includes(moderatorId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Moderator does not exist in the squad',
        data: null,
      })
    }
    squad.moderators = squad.moderators.filter((moderator) => moderator != moderatorId);
    await moderator.deleteOne()
    await squad.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Moderator deleted successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to delete moderator',
      data: null,
    })
  }
}

//@ desc get all moderators of a squad 
//@ route GET api/v1/squad/moderator/all
export const getAllModerators = async (req, res) => {
  try {
    const userId = res.locals.userId
    const squadId = req.params.id
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Login to perfom this action',
        data: null,
      })
    }
    const squad = await Squad.findById(squadId)
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Squad Id',
        data: null,
      })
    }

  
    const moderators = await Moderator.find({squadId:squadId})
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Moderators fetched successfully',
      data: moderators,
    })
  } catch (error) {
    Logger.error({ message: error })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to fetch moderators',
      data: null,
    })
  }
}

// @ update percentage achieved on activities(fvc)
// @ route PUT api/v1/squad/achieved/update/:id
export const updatePercentage = async (req, res) => {
  try {
    const userId = res.locals.userId
    const squadId = req.params.id
    const {percentage} = req.body
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Login to perfom this action',
        data: null,
      })
    }
    if (!percentage) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Percentage is required',
        data: null,
      })
    }

    const squad = await Squad.findById(squadId)
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Squad Id',
        data: null,
      })
    }

    if (userId != squad.admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    squad.percentageAchieved = percentage
    await squad.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Percentage updated successfully',
      data: {
        name: squad.name,
        percentageAchieved: squad.percentageAchieved
      },
    })  
  } catch (error) {
    Logger.error({ message: error })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to update percentage',
      data: null,
    })
  }
}

// @ desc get percentage achieved on activities
// @ route GET api/v1/squad/achieved/get/:id
export const getPercentage = async (req, res) => {
  try {
    const userId = res.locals.userId
    const squadId = req.params.id
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Login to perfom this action',
        data: null,
      })
    }

    const squad = await Squad.findById(squadId)
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Squad Id',
        data: null,
      })
    }

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Percentage fetched successfully',
      data: {
        name: squad.name,
        percentageAchieved: squad.percentageAchieved
      },
    })
  } catch (error) {
    Logger.error({ message: error })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to fetch percentage',
      data: null,
    })
  }
}

// @ desc get all percentage achieved on activities
// @ route GET api/v1/squad/achieved/get/all
export const getAllPercentage = async (req, res) => {
  try {
    const userId = res.locals.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Login to perfom this action',
        data: null,
      })
    }

    const squads = await Squad.find().select('percentageAchieved')
    if (!squads) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'No squads found to perfom this action',
        data: null,
      })
    }

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Percentage fetched successfully',
      data: squads,
    })
  } catch (error) {
    Logger.error({ message: error })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to fetch percentage',
      data: null,
    })
  }
}

// @ desc Get squad carbon calculation
// @ route GET api/v1/squad/carbon/get/:id
export const getCarbon = async (req, res) => {
  try {
    const userId = res.locals.userId
    const squadId = req.params.id
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Login to perfom this action',
        data: null,
      })
    }

    const squad = await Squad.findById(squadId)
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Squad Id',
        data: null,
      })
    }
    const carbonData = CarbonCalculator.findById(squad.carbonCalculatorData);
    if(!carbonData) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid Carbon Calculator Id',
        data: null,
      })
    }
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Carbon calculation fetched successfully',
      data: {
        name: squad.name,
        carbonCalculatorData: carbonData,
      },
    })
  } catch (error) {
    Logger.error({ message: error })
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to fetch percentage',
      data: null,
    })
  }
}

// @ desc Get all squad carbon calculation
// @ route GET api/v1/squad/carbon/get/all
export const getAggrgatedCarbon = async (req, res) => {
  try {
    const userId = res.locals.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Login to perfom this action',
        data: null,
      })
    }

    const squads = await Squad.find().select('carbonCalculatorData')
    if (!squads) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'No squads found to perfom this action',
        data: null,
      })
    }
    const carbonCalculators = await CarbonCalculator.find({
      _id: { $in: squads},
    });
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Carbon calculation fetched successfully',
      data: carbonCalculators,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while trying to fetch percentage',
      data: null,
    })
  }
}

// @ desc Controller function to add or update carbon calculator data
// @ route POST api/v1/squad/carbon/upsert
export const upsertCarbonCalculator = async (req, res) => {
  try {
    const { squadId, carbonFootprint, threshold, badgeEarned } = req.body;

    if (!squadId || !carbonFootprint || !threshold || !badgeEarned) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Missing required fields',
      });
    }

    // Find the document with the given squadId and update it if it exists, otherwise insert a new document
    const result = await CarbonCalculator.findOneAndUpdate(
      { squadId }, // Filter to find the document
      {
        squadId,
        carbonFootprint,
        threshold,
        badgeEarned,
      },
      { 
        new: true,      // Return the updated document
        upsert: true,   // Create a new document if it doesn't exist
        setDefaultsOnInsert: true, // Apply default values when creating a new document
      }
    );

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Carbon calculator data upserted successfully',
      data: result,
    });
  } catch (error) {
    Logger.error({ message: error });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: `Failed to upsert carbon calculator data: ${error.message}`,
    });
  }
};

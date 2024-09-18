import { StatusCodes } from "http-status-codes";
import Squad from "../models/squad.model.js"; // Make sure you import your Squad model
import { Logger } from "borgen"; // Assuming you have a logger
import User from "../models/user.model.js"; // Import User model if needed for population
import { Types, ObjectId } from "mongoose";
import { isValidObjectId } from "mongoose";

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
     }
     */
    const { name, description, members } = req.body;
    const creatorId = res.locals.userId;
    const user = await User.findById(creatorId);

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Please Login and try again",
        data: null,
      });
    }
    // Create the squad with the creator as the first member
    let newSquad = new Squad({
      name,
      description,
      members: members ? [creatorId, ...members] : [creatorId],
      admin: user._id,
    });

    user.squads.push(newSquad._id);
    await user.save();

    let data = await newSquad.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Squad created successfully",
      data: {
        squad: {
          id: data._id,
          name: data.name,
          description: data.description,
          members: data.members,
        },
      },
    });
  } catch (error) {
    Logger.error({ message: error });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while creating the squad",
      data: null,
    });
  }
};

// @desc  Join Squad
// @route PUT /api/v1/squad/join/:id
export const joinSquad = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const squadId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Please Login and try again",
        data: null,
      });
    }
    //find squad by Id
    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "You are not allowed to join this squad",
        data: null,
      });
    }
    let members = squad.members;
    //check if member already is in the squad
    if (members.includes(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "You are already a member of this squad",
        data: null,
      });
    }
    user.squads.push(new Types.ObjectId(squadId));
    await user.save();
    squad.members.push(user._id);
    await squad.save();

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Join squad request successful",
      data: {
        name: squad.name,
        id: squad.id,
      },
    });
  } catch (error) {
    Logger.error({ message: error });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while joining the squad",
      data: null,
    });
  }
};

// @desc Leave Squad
// @route PUT /api/v1/squad/leave/:id
export const leaveSquad = async (req, res) => {
  try {
    const squadId = req.params.id;
    const userId = res.locals.userId; // Assuming userId is set in middleware

    if (!squadId || !userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "You are not allowed to perform this action",
        data: null,
      });
    }

    // Find the squad by Id
    const squad = await Squad.findById(squadId);
    if (!squad) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Squad not found",
        data: null,
      });
    }

    // Check if the user is a member of the squad
    if (!squad.members.includes(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "You are not a member of this squad",
        data: null,
      });
    }

    // Remove the user from the squad's members
    squad.members = squad.members.filter(
      (memberId) => memberId.toString() !== userId
    );

    // Save the updated squad
    await squad.save();

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "You have successfully left the squad",
      data: {
        squadId: squad._id,
        userId,
      },
    });
  } catch (error) {
    Logger.error({ message: error });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while leaving the squad",
      data: null,
    });
  }
};

// @desc Get all squads
// @route GET /api/v1/squad/all
export const getAllSquads = async (req, res) => {
  try {
    const squads = await Squad.find().populate("members");

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Fetched all squads successful",
      data: squads,
    });
  } catch (error) {
    Logger.error({ message: error });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while trying to fetch squads",
      data: null,
    });
  }
};

//@desc Update squads
//@route PUT /api/v1/squad/update/:id
export const updateSquad = async (req, res) => {
  try {
    const squadId = req.params.id;
    const userId = res.locals.userId;
    const { name, description } = req.body;

    const squad = await Squad.findById(squadId);
    if (!squad || !userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "You are not allowed to perform this action",
        data: null,
      });
    }
    if (userId != String(squad.admin)) {
      console.log(userId, "|", squad.members);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "You are not allowed to perform this action",
        data: null,
      });
    }

    if (name) squad.name = name;
    if (description) squad.description = description;
    await squad.save();
    //get the creatorId from the squad members
    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Squad details updated successfully",
      data: squad,
    });
  } catch (error) {
    Logger.error({ message: error });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while trying to update the squad details",
      data: null,
    });
  }
};

//@desc Delete Squads
//@route DELETE /api/v1/squad/delete/:id
export const deleteSquad = async (req, res) => {
  try {
    const squadId = req.params.id;
    const userId = res.locals.userId;

    const squad = await Squad.findById(squadId);
    if (!squad || !userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "You are not allowed to perform this action",
        data: null,
      });
    }

    if (userId != String(squad.admin)) {
      console.log(userId, "|", squad.members);
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "You are not allowed to perform this action",
        data: null,
      });
    }
    // Remove the squad from all users' members field
    await User.updateMany(
      { _id: { $in: squad.members } },
      { $pull: { squads: squadId } }
    );

    // Remove the squad from the members field in the Squad document
    await Squad.findByIdAndUpdate(
      squadId,
      { $pull: { members: { $in: squad.members } } }, 
      { new: true }
    );
    await Squad.findByIdAndDelete(squadId);

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Squad deleted successfully",
      data: {
        name: squad.name,
        id: squad.id,
      },
    });
  } catch (error) {
    Logger.error({ message: error });
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while trying to update the squad details",
      data: null,
    });
  }
};

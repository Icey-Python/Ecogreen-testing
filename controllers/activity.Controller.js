import Activity from "../models/activity.model.js";
import User from "../models/user.model.js";
import { StatusCodes } from "http-status-codes";
import { Logger } from "borgen";

const activities = {
  renewableEnergy: {
    maxThreshold: 100,
    description: "Renewable Smart Energy Usage",
  },
  entrepreneurship: {
    maxThreshold: 80,
    description: "Entrepreneurship Startups",
  },
  climateActions: {
    maxThreshold: 90,
    description: "Climate Action Initiatives",
  },
  treePlanting: { maxThreshold: 50, description: "Tree Planting" },
  sustainableActivities: {
    maxThreshold: 70,
    description: "Sustainable Activities",
  },
  ecoGreenMovements: { maxThreshold: 60, description: "Eco Green Movements" },
};

export const registerActivity = async (req, res) => {
  try {
    const userId = res.locals.userId;
    const { activity, value } = req.body;

    // Validate input
    if (!activity || !value || value <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Please provide a valid activity and value.",
      });
    }

    // Check if the activity exists in the predefined activities list
    if (!activities[activity]) {
      return res.status(400).json({
        status: "error",
        message: "Invalid activity type.",
      });
    }

    let userActivity = await Activity.findOne({ user: userId });

    if (!userActivity) {
      userActivity = new Activity({
        user: userId,
        [activity]: 0,
      });
    }

    // Check if the user is already registered for the activity
    if (userActivity[activity] > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: `You are already registered for the ${activity} activity.`,
      });
    }

    // Update the user's activity progress
    const maxThreshold = activities[activity].maxThreshold;

    userActivity[activity] = Math.min(
      userActivity[activity] + value,
      maxThreshold
    );

    // Save the updated user
    await userActivity.save();

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: `Successfully registered for ${activity}`,
      data: userActivity,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while registering for an activity",
      data: null,
    });
  }
};

//@desc Get maximum threshold
//@route GET /api/v1/activity/max-threshold
export const getMaxThreshold = (req, res) => {
  try {
    const thresholds = Object.keys(activities).map((activity) => ({
      activity,
      maxThreshold: activities[activity].maxThreshold,
      description: activities[activity].description,
    }));

    return res.status(200).json({
        status: "success",
        message: "Max thresholds retrieved successfully",
        data: thresholds,});
        
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred during calculating maxThreshold",
      data: null,
    });
  }
};

//@desc Get total user activities
//@route GET /api/v1/activity/total
export const getTotalActivities = async (req, res) => {
    const userId = res.locals.userId;
  
    try {
      // Find the user's activity record
      let userActivity = await Activity.findOne({ user: userId });
  
    
  
      // If no activity is found, return a message
      if (!userActivity) {
        return res.status(StatusCodes.OK).json({
          status: "success",
          message: "No activities registered yet.",
          totalActivities: 0,
        });
      }
  
      // Calculate the total number of activities
      const totalActivities = Object.keys(activities).reduce((acc, activity) => {
        return acc + (userActivity[activity] || 0);
      }, 0);
  
      return res.status(StatusCodes.OK).json({
        status: "success",
        message: "Total activities retrieved successfully.",
        totalActivities,
      });
    } catch (error) {
      Logger.error({ message: error.message });
  
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "An error occurred while getting total activities",
        data: null,
      });
    }
  };
  
//@desc  Calculate percentage of activity completion
//@route GET /api/v1/activity/percentage
export const calculatePercentage = async (req, res) => {
  const userId = res.locals.userId;

  try {
    const userActivity = await Activity.findOne({ user: userId });

    if (!userActivity) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "You have no activity",
        data: null,
      });
    }

    const totalMaxThreshold = Object.values(activities).reduce(
      (acc, activity) => acc + activity.maxThreshold,
      0
    );
    const totalAchieved =
      Object.values(userActivity.toObject()).reduce(
        (acc, value) => acc + value,
        0
      ) - userActivity.user;

    const percentage = (totalAchieved / totalMaxThreshold) * 100;

    res.status(200).json({ totalAchieved, totalMaxThreshold, percentage });
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while calculating percentage",
      data: null,
    });
  }
};

//@desc Calculate user progress activity
//@route GET /api/v1/activity/progress
export const calculateProgress = async (req, res) => {
    const userId = res.locals.userId;
  
    try {
      // Fetch user's activity data
      const userActivity = await Activity.findOne({ user: userId });
  
      if (!userActivity) {
        return res.status(404).json({
          status: "error",
          message: "No activity record found for user",
          data: null,
        });
      }
  
      // Get total number of activity types available
      const totalActivities = Object.keys(activities).length;
  
      // Calculate how many activities have been completed
      const completedActivities = Object.keys(activities).filter((activity) => {
        const userProgress = userActivity[activity] || 0;
        const maxThreshold = activities[activity].maxThreshold;
  
        // Check if the user's activity progress has reached or exceeded the threshold
        return userProgress >= maxThreshold;
      }).length;
  
      // Calculate progress percentage
      const progress = totalActivities
        ? (completedActivities / totalActivities) * 100
        : 0;
  
      // Respond with the progress, total activities, and completed activities
      res.status(200).json({
        status: "success",
        message: "User activity progress calculated successfully",
        data: {
          total: totalActivities,
          completed: completedActivities,
          progress,
        },
      });
    } catch (error) {
      Logger.error({ message: error.message });
  
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "An error occurred while calculating progress",
        data: null,
      });
    }
  };
  
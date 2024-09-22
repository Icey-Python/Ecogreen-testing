import Event from "../models/events.model.js";
import User from "../models/user.model.js";
import { StatusCodes } from "http-status-codes";
import { Logger } from "borgen";
// @desc Create a new event
// @route POST /api/v1/events/create
export const createEvent = async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const createdBy = res.locals.userId;

    if (!title || !description || !date || !location || !createdBy) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "All fields are required",
        data: null,
      });
    }
    const newEvent = new Event({
      title,
      description,
      date,
      location,
      createdBy,
    });

    await newEvent.save();

    res.status(StatusCodes.CREATED).json({
      status: "success",
      message: "Event created successfully.",
      data: newEvent,
    });
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred during login",
      data: null,
    });
  }
};

// @desc Get all events
// @route GET /api/v1/events
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy attendees");
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Events retrieved successfully.",
      data: events,
    });
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred during login",
      data: null,
    });
  }
};

// @desc Get a single event
// @route GET /api/v1/events/:id
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "createdBy attendees"
    );
    if (!event) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Event not found.",
      });
    }
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Event retrieved successfully.",
      data: event,
    });
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred during login",
      data: null,
    });
  }
};
// @desc Update an event
// @route PUT /api/v1/events/:id
export const updateEvent = async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    const userId = res.locals.userId;
    if (!title || !description || !date || !location) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "All fields are required",
        data: {
          title,
          description,
          date,
          location,
        },
      });
    }

    const event = await Event.findOne({ id: req.params.id, createdBy: userId });

    if (!event) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "You are not allowed to perform this action.",
      });
    }
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Event updated successfully.",
      data: event
    });
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred during login",
      data: null,
    });
  }
};

// @desc Delete an event
// @route DELETE /api/v1/events/:id
export const deleteEvent = async (req, res) => {
  try {
    const userId = res.locals.userId
    const event = await Event.findOneAndDelete({id:req.params.id, createdBy: userId});
    if (!event) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "You are not allowed to perform this action",
      });
    }
    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Event deleted successfully.",
    });
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred during login",
      data: null,
    });
  }
};

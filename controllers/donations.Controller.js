import Donation from "../models/donation.model.js";
import User from "../models/user.model.js";
import { StatusCodes } from "http-status-codes";

//@desc Create a donation
//@route POST /api/v1/donations/create
export const createDonation = async (req, res) => {
  try {
    const { pointsDonated, cause, donationId } = req.body;
    const userId = res.locals.userId; 

    // Validate the request body
    if (!pointsDonated || !cause || pointsDonated <= 0) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Please provide valid points to donate and a cause.",
      });
    }

    // Find the user making the donation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "User not found.",
      });
    }

    // Check if the user has enough coins to make the donation
    if (user.balance < pointsDonated) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Insufficient coins balance to make the donation.",
      });
    }

    // Reduce the user's coin balance and increment the total donations
    user.balance -= pointsDonated;
    user.donations += 1;

    // Save the updated user
    await user.save();

    // Create a new donation entry
    const newDonation = new Donation({
      user: userId,
      pointsDonated,
      cause,
      donationId, // Optional: Pass this if you want to manually set donationId; otherwise, it will auto-generate.
    });

    const savedDonation = await newDonation.save();

    res.status(StatusCodes.CREATED).json({
      status: "success",
      message: "Donation created successfully.",
      data: savedDonation,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while creating the donation.",
    });
  }
};

// @desc Get all donations by a user
// @route GET /api/v1/donations
export const getAllUserDonations = async (req, res) => {
    try {
      const userId = res.locals.userId; // Authenticated user
  
      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: "error",
          message: "User not found.",
        });
      }
  
      // Find all donations made by the user, sorted by most recent
      const donations = await Donation.find({ user: userId }).sort({ createdAt: -1 });
  
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Donations retrieved successfully.",
        data: donations,
      });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "An error occurred while retrieving donations.",
      });
    }
  };

  
  // @desc Update a donation
// @route PUT /api/v1/donation/:donationId
export const updateDonation = async (req, res) => {
    try {
      const { donationId } = req.params;
      const { pointsDonated, cause } = req.body;
      const userId = res.locals.userId; // Authenticated user
  
      // Validate the request
      if (!pointsDonated || !cause || pointsDonated <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Please provide valid points to donate and a cause.",
        });
      }
  
      const donation = await Donation.findById(donationId);
      if (!donation) {
        return res.status(StatusCodes.NOT_FOUND).json({
          status: "error",
          message: "Donation not found.",
        });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "User not found.",
        });
      }
  
      // Adjust the user's balance based on the change in donation amount
      const pointsDifference = pointsDonated - donation.pointsDonated;
      if (user.balance < pointsDifference) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          status: "error",
          message: "Insufficient coins balance to update the donation.",
        });
      }
  
      // Update user's balance and save
      user.balance -= pointsDifference;
      await user.save();
  
      // Update donation
      donation.pointsDonated = pointsDonated;
      donation.cause = cause;
      const updatedDonation = await donation.save();
  
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Donation updated successfully.",
        data: updatedDonation,
      });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "An error occurred while updating the donation.",
      });
    }
  };

  
  // @desc Delete a donation
// @route DELETE /api/v1/donation/delete/:donationId
export const deleteDonation = async (req, res) => {
    try {
      const { donationId } = req.params;
      const userId = res.locals.userId; // Authenticated user
      console.log(res.locals.userId);
  
      const donation = await Donation.findById(donationId);
      if (!donation) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "Donation not found.",
        });
      }
  
      const user = await User.findById(userId);
      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          status: "error",
          message: "User not found.",
        });
      }
  
      // Reduce the total donations count for the user
      user.donations -= 1;
      await user.save();
  
      // Delete the donation
      await Donation.deleteOne({ donationId });
  
      res.status(StatusCodes.OK).json({
        status: "success",
        message: "Donation deleted successfully.",
      });
    } catch (error) {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "An error occurred while deleting the donation.",
      });
    }
  };
  
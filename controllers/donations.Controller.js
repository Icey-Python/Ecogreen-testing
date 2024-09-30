import Donation from "../models/donation.model.js";
import User from "../models/user.model.js";
import GreenBank from '../models/greenBank.model.js';
import { StatusCodes } from "http-status-codes";
import { Logger } from 'borgen'


// @desc Create donations by a user
// @route POST /api/v1/donations

export const createDonation = async (req, res) => {
  try {
    const { pointsDonated, cause, requiredAmount } = req.body;
    const userId = res.locals.userId; 

    // Validate the request body
    if (!pointsDonated || !cause || pointsDonated <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Please provide valid points to donate and a cause.",
      });
    }

    // Find the user making the donation
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found.",
      });
    }

    // Check if the user has enough balance to donate
    if (user.balance < pointsDonated) {
      return res.status(400).json({
        status: "error",
        message: "Insufficient coins balance to make the donation.",
      });
    }

    // Find or create a donation for the given cause
    let donation = await Donation.findOne({ cause });
    
    if (!donation) {
      // Create a new donation if one doesn't exist
      donation = new Donation({
        user: userId,
        cause,
        requiredAmount,
        amountDonated: 0
      });
    }

    // Calculate extra points if donation exceeds required amount
    const remainingAmount = donation.requiredAmount - donation.amountDonated;
    let extraPoints = 0;

    if (pointsDonated > remainingAmount) {
      extraPoints = pointsDonated - remainingAmount;
      donation.amountDonated += remainingAmount;
    } else {
      donation.amountDonated += pointsDonated;
    }

    // Create GreenBank entry for extra points
    if (extraPoints > 0) {
      const halfPoints = extraPoints / 2;

      // Update the donation with 50% of the extra points
      donation.amountDonated += halfPoints;
      user.donations+=1

      // Add 50% to the GreenBank
      const greenBank = await GreenBank.findOne({user: userId})
      greenBank.points += halfPoints

      await greenBank.save()

    }
    // Deduct points from user balance
    user.balance -= pointsDonated;

    // Add 10% of donated points to user's balance as donation credits
    const donationCredit = pointsDonated * 0.1;
    user.balance += donationCredit;

    // Track donation credits in an array
    if (!user.donationCredits) {
      user.donationCredits = [];
    }
    user.donationCredits.push({
      amount: donationCredit,
      cause,
      date: new Date(),
    });



    await user.save();

    // Save the donation
    donation.pointsDonated = pointsDonated; // Store the points donated in this transaction
    const savedDonation = await donation.save();

    res.status(201).json({
      status: "success",
      message: "Donation created successfully.",
      data: savedDonation,
    });
  } catch (error) {
    Logger.error({ message: error.message })

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while creating a donation',
      data: null,
    })
  }
}


// @desc Get all donations by a user
// @route GET /api/v1/donations/user/:userId
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
      Logger.error({ message: error.message })
  
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'An error occurred while retrieving donations',
        data: null,
      })
    }
  }

  
 // @desc Update a donation
// @route PUT /api/v1/donation/:donationId
export const updateDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const { pointsDonated, cause, requiredAmount } = req.body;
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

    // Calculate the points difference (new points - existing donation points)
    const pointsDifference = pointsDonated - donation.pointsDonated;

    // Check if the user has enough balance to accommodate the updated donation
    if (pointsDifference > 0 && user.balance < pointsDifference) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Insufficient coins balance to update the donation.",
      });
    }

    // Adjust user's balance based on the points difference
    user.balance -= pointsDifference;
    await user.save();

    // Calculate the remaining amount required for the donation
    const remainingAmount = donation.requiredAmount - donation.amountDonated;
    let extraPoints = 0;

    // If the new donation exceeds the remaining required amount
    if (pointsDonated > remainingAmount) {
      extraPoints = pointsDonated - remainingAmount;
      donation.amountDonated += remainingAmount;
    } else {
      donation.amountDonated += pointsDonated;
    }

    // Handle extra points: 50% to GreenBank, 50% to donation
    if (extraPoints > 0) {
      const halfPoints = extraPoints / 2;

      // Update the donation with 50% of the extra points
      donation.amountDonated += halfPoints;

      // Add 50% to the GreenBank
      const greenBank = new GreenBank({
        user: userId,
        points: halfPoints,
        description: "Extra donation points supporting environmental causes",
      });
      await greenBank.save();
    }

    // Update the donation record
    donation.pointsDonated = pointsDonated;
    donation.cause = cause;
    donation.requiredAmount = requiredAmount; // If you are allowing requiredAmount updates
    const updatedDonation = await donation.save();

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Donation updated successfully.",
      data: updatedDonation,
    });
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while updating the donation",
      data: null,
    });
  }
};

  
  // @desc Delete a donation
// @route DELETE /api/v1/donation/delete/:donationId
export const deleteDonation = async (req, res) => {
  try {
    const { donationId } = req.params;
    const userId = res.locals.userId; // Authenticated user

    // Find the donation by ID
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(StatusCodes.NOT_FOUND).json({
        status: "error",
        message: "Donation not found.",
      });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "User not found.",
      });
    }

    // Restore user's balance by adding back the points donated
    user.balance += donation.pointsDonated;
    user.donations -= 1; // Reduce the user's total donations count

    // Find and remove the corresponding GreenBank entry, if applicable
    const extraPoints = donation.pointsDonated - donation.requiredAmount;
    if (extraPoints > 0) {
      const halfExtraPoints = extraPoints / 2;

      // Restore only half of the extra points to the user's balance
      user.balance += halfExtraPoints;

      // Remove the corresponding GreenBank points
      await GreenBank.findOneAndDelete({
        user: userId,
        points: halfExtraPoints,
        description: "Extra donation points supporting environmental causes",
      });
    }

    // Save the updated user
    await user.save();

    // Delete the donation from the database
    await Donation.deleteOne({ _id: donationId });

    res.status(StatusCodes.OK).json({
      status: "success",
      message: "Donation deleted successfully.",
    });
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while deleting the donation',
      data: null,
    });
  }
};

import cron from "node-cron";
import Donation from "../models/donation.model.js";  
import { Logger } from "borgen" 
import User from "../models/user.model.js";
import Transaction from "../models/transaction.model.js";
import GreenBank from "../models/greenBank.model.js";

const processRecurringDonations = async () => {
  try {
    // Get the current date
    const currentDate = new Date();
    const donations = await Donation.find({ recurring: 'active' });



    for (const donation of donations) {
      // Check if a month has passed since the last donation
      const lastDonationDate = new Date(donation.lastDonationDate);
      const nextDonationDate = new Date(lastDonationDate).setMonth(lastDonationDate.getMonth() + 1);
      console.log(donation)
      if (currentDate >= nextDonationDate) {
        const userId = donation.user; // Get the user ID from donation
        
        // Process the donation
        await processDonation(donation, userId);
      } else {
        Logger.info(`User ${donation.user} has not reached the next donation date.`);
      }
    }
  } catch (error) {
    Logger.error({ message: error.message });
    return { "error": error };
  }
};

// Function to process the donation
const processDonation = async (donation, userId) => {
  try {
    const pointsDonated = donation.requiredAmount; // Using requiredAmount for this example

    // Find the user making the donation
    const user = await User.findById(userId);
    if (!user) {
      Logger.error(`User not found for donation ID ${donation._id}. User ID: ${userId}`);
      return; // Skip to the next donation
    }

    // Check if the user has enough balance to donate
    if (user.balance < pointsDonated) {
      Logger.error(`Insufficient balance for user ${userId} on donation ID ${donation._id}. Required: ${pointsDonated}, Available: ${user.balance}`);
      return; // Skip to the next donation
    }

    // Calculate extra points if donation exceeds required amount
    const remainingAmount = donation.requiredAmount - donation.amountDonated;
    let extraPoints = 0;

    if (pointsDonated > remainingAmount) {
      extraPoints = pointsDonated - remainingAmount;
      donation.amountDonated += Math.floor(remainingAmount) ; // Update donation with required amount
    } else {
      donation.amountDonated += Math.floor(pointsDonated)  ; // Update donation with points donated
    }

    // Create GreenBank entry for extra points
    if (extraPoints > 0) {
      const halfPoints = Math.floor(extraPoints)   / 2;

      // Update the donation with 50% of the extra points
      donation.amountDonated += halfPoints;

      // Add 50% to the GreenBank
      const greenBank = await GreenBank.findOne({ user: userId });
      if (greenBank) {
        greenBank.points += halfPoints; // Update GreenBank with half of the extra points
        await greenBank.save(); // Save the GreenBank update
      }
    }

    // Create a transaction record for the user donation
    const transaction = new Transaction({
      sender: userId,
      receiver: donation._id, // Assuming the donation is treated as a receiver for the transaction
      amount: Math.floor(pointsDonated), // Ensure no decimals in amount
      description: "Donation made by user",
    });
    await transaction.save(); // Save the transaction record


    // Deduct points from user balance
    user.balance -= pointsDonated;

    // Add 10% of donated points to user's balance as donation credits
    const donationCredit = Math.floor(pointsDonated * 0.1)
    user.balance += donationCredit;

    // Track donation credits in an array
    if (!user.donationCredits) {
      user.donationCredits = [];
    }
    user.donationCredits.push({
      amount: donationCredit,
      cause: donation.cause, // Assuming cause is stored in donation
      date: new Date(),
    });

    // Update total points donated by the user
    user.totalPointsDonated = (user.totalPointsDonated || 0) + pointsDonated;

    // Determine the user's donation tier based on total points donated
    updateUserDonationTier(user);

    // Increment the donation count
    user.donations = (user.donations || 0) + 1;
    await user.save(); // Save user updates

    // Update the donation with last donation date
    donation.lastDonationDate = new Date();
    await donation.save(); // Save donation updates

    

    Logger.info(`Processed recurring donation for user ${userId}. New balance: ${user.balance}`);
  } catch (error) {
    Logger.error({ message: error.message });
  }
};

// Function to update the user's donation tier
const updateUserDonationTier = (user) => {
  const tierThresholds = {
    Bronze: 6,
    Silver: 2,
    Titanium: 1,
    Gold: 1,
    Platinum: 1,
    Diamond: 1,
  };

  let currentDonationTier;
  if (user.totalPointsDonated >= 750001) {
    currentDonationTier = "Diamond";
  } else if (user.totalPointsDonated >= 500001) {
    currentDonationTier = "Platinum";
  } else if (user.totalPointsDonated >= 150001) {
    currentDonationTier = "Gold";
  } else if (user.totalPointsDonated >= 50001) {
    currentDonationTier = "Titanium";
  } else if (user.totalPointsDonated >= 10001) {
    currentDonationTier = "Silver";
  } else if (user.totalPointsDonated >= 1000) {
    currentDonationTier = "Bronze";
  }

  // Initialize or update the user's donationTierEntries field if it doesn't exist
  if (!user.donationTierEntries) {
    user.donationTierEntries = {
      Bronze: 0,
      Silver: 0,
      Titanium: 0,
      Gold: 0,
      Platinum: 0,
      Diamond: 0,
    };
  }

  // Update the user's donation tier if it has changed
  if (user.donationTier !== currentDonationTier) {
    user.donationTier = currentDonationTier;
  }

  // Increment the donation count for the current tier only if the threshold has not been reached
  if (user.donationTierEntries[currentDonationTier] < tierThresholds[currentDonationTier]) {
    user.donationTierEntries[currentDonationTier] += 1;
  }
};

// Schedule the recurring donations to be processed daily at midnight
cron.schedule('0 0 * * *', () => {  
  Logger.info('Running recurring donations processing task...');
  processRecurringDonations();
});


export default processRecurringDonations; 
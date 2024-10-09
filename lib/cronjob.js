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
    const pointsDonated = donation.pointsDonated

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
    const remainingAmount = pointsDonated - donation.requiredAmount;
    let extraPoints = 0;
    

    if (pointsDonated < donation.requiredAmount) {
     
      donation.amountDonated += pointsDonated;
    } else {
      extraPoints = pointsDonated - donation.requiredAmount;

      const halfPoints = extraPoints /2

      // Update the donation with 50% of the extra points
      donation.amountDonated += halfPoints + remainingAmount;

      // Add 50% to the GreenBank
      const greenBank = await GreenBank.findOne({ user: userId });
      greenBank.points += halfPoints;
      const transaction = new Transaction({
        sender: userId,
        receiver: userId,
        amount: halfPoints,
        description: "Donation deductions to GreenBank",
      });

      
      await greenBank.save();
    }
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

// Determine the user's donation tier based on total points donated
let currentDonationTier;
if (pointsDonated >= 750001) {
  currentDonationTier = "Diamond";
} else if (pointsDonated >= 500001) {
  currentDonationTier = "Platinum";
} else if (pointsDonated >= 150001) {
  currentDonationTier = "Gold";
} else if (pointsDonated >= 50001) {
  currentDonationTier = "Titanium";
} else if (pointsDonated >= 10001) {
  currentDonationTier = "Silver";
} else if (pointsDonated >= 1000) {
  currentDonationTier = "Bronze";
}

// Increment the donation count for the current tier
 user.donationTierEntries[currentDonationTier] += 1;

 
};

// Schedule the recurring donations to be processed daily at midnight
cron.schedule('0 0 * * *', () => {  
  Logger.info('Running recurring donations processing task...');
  processRecurringDonations();
});


export default processRecurringDonations; 
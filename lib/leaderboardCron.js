import cron from "node-cron";
import { Logger } from "borgen";
import User from "../models/user.model.js";


// Define focus value tiers
const donationFocusValues = [6, 2, 1, 1, 1, 1]; // Tiers for donations
const purchaseFocusValues = [6, 2, 1, 1, 1]; // Tiers for purchases

const calculatePercentage = (userValues, focusValues) => {
  let satisfiedTotal = 0;
  const focusTotal = focusValues.reduce((acc, val) => acc + val, 0);

  for (let i = 0; i < userValues.length; i++) {
    if (userValues[i] > 0) {
      satisfiedTotal += focusValues[i];
    }
  }

  return (satisfiedTotal / focusTotal) * 100;
};
const updateUserScore = async (id, score) => {
  const user = await User.findById(id);
  if (user) {
    user.leaderboardScore = score;
    await user.save();
  }
};
export const leaderboardCron = async() => {
  try {
    //get all users
    const users = await User.find().select('-password')
    if(!users) {
      Logger.error({ message:"Error in leaderboard cron: No users found" })
    }
    //donation, purchase and activity percentages
    for (const user of users) {
      const donationPercentage = calculatePercentage(
        Object.values(user.donationTierEntries),
        donationFocusValues,
      )
      const purchasePercentage = calculatePercentage(
        Object.values(user.purchaseTierEntries),
        purchaseFocusValues,
      )
      const activityPercentage = Object.values(user.activitiesValue).reduce((acc, val) => acc + val, 0) / 3;

      const totalPercentage =
        (donationPercentage + purchasePercentage + activityPercentage) / 3
      user.leaderboardScore = totalPercentage
      updateUserScore(user.id, totalPercentage)
    }
  } catch (error) {
    Logger.error({ message:"Error in leaderboard cron: "+ error.message }) 
  }
}
cron.schedule('* * * * *', () => {
  Logger.info({message:'Running leaderboard task...'});
  leaderboardCron();
});

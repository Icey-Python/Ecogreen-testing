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

export const leaderboardCron = async() => {
    //get all users
    const users = await User.find().select('-password')
    //donation, purchase and activity percentages
    users.forEach(async (user) => {
      const donationPercentage = calculatePercentage(
        Object.values(user.donationTierEntries),
        donationFocusValues,
      )
      const purchasePercentage = calculatePercentage(
        Object.values(user.purchaseTierEntries),
        purchaseFocusValues,
      )
      const activityPercentage = Object.values(user.activitiesValues).reduce((acc, val) => acc + val, 0) / 3;

      const totalPercentage =
        (donationPercentage + purchasePercentage + activityPercentage) / 3
      user.leaderboardScore = totalPercentage
      await user.save()
    });
}
cron.schedule('0 0 * * *', () => {
  Logger.info({message:'Running leaderboard task...'});
  leaderboardCron();
});

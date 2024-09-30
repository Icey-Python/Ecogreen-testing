import cron from 'node-cron';
import Donation from "../models/donation.model.js";
import User from "../models/user.model.js";

// Schedule a job to run every day
cron.schedule('* * * * *', async () => {
  const recurringDonations = await Donation.find({ recurring: 'active' });

  for (const donation of recurringDonations) {
    const daysSinceLastDonation = Math.floor((Date.now() - new Date(donation.lastDonationDate)) / (1000 * 60 * 60 * 24));

    // Check if it's been 30 days since the last donation
    if (daysSinceLastDonation >= 30) {
      const user = await User.findById(donation.user);

      if (user && user.balance >= donation.pointsDonated) {
        // Deduct points and update last donation date
        user.balance -= donation.pointsDonated;
        donation.amountDonated += donation.pointsDonated;
        donation.lastDonationDate = Date.now();

        await user.save();
        await donation.save();

        console.log(`Recurring donation processed for user ${user._id} to cause ${donation.cause}`);
      } else {
        console.log(`User ${user._id} has insufficient balance for recurring donation.`);
      }
    }
  }
});

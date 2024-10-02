import cron from "node-cron";
import { createDonation } from "../controllers/donations.Controller.js"; 
import Donation from "../models/donation.model.js";  
import { Logger } from "borgen" 

const processRecurringDonations = async () => {
  try {
    // Get the current date
    const currentDate = new Date();
    const donations = await Donation.find({ recurring: 'active' });

    for (const donation of donations) {
      // Check if 30 days have passed since the last donation
      const lastDonationDate = new Date(donation.lastDonationDate);
      const daysSinceLastDonation = Math.floor((currentDate - lastDonationDate) / (1000 * 60 * 60 * 24));

      if (daysSinceLastDonation >= 30) {
        const success = await createDonation(donation); // Use the shared logic
        
        if (success) {
          Logger.info(`Processed recurring donation for user ${donation.user}`);
        }
      } else {
        Logger.info(`User ${donation.user} has not reached 30 days since the last donation.`);
      }
    }
  } catch (error) {
    Logger.error({ message: error.message })

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while recurring a donation',
      data: null,
    })
  }
};

// Schedule the recurring donations to be processed daily at midnight
cron.schedule('0 0 * * *', () => {  
  Logger.info('Running recurring donations processing task...');
  processRecurringDonations();
});


export default processRecurringDonations; 
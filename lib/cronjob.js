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
      // Check if a month has passed since the last donation
      const lastDonationDate = new Date(donation.lastDonationDate);
      const nextDonationDate = new Date(lastDonationDate.setMonth(lastDonationDate.getMonth() + 1));

      if (currentDate >= nextDonationDate) {
        const success = await createDonation(donation); // Use the shared logic

        if (success) {

          // Update the lastDonationDate to the current date
          donation.lastDonationDate = new Date();
          await donation.save();

          Logger.info(`Processed recurring donation for user ${donation.user}`);
        }
      } else {
        Logger.info(`User ${donation.user} has not reached the next donation date.`);
      }
    }
  } catch (error) {
    Logger.error({ message: error.message });

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occurred while processing recurring donations',
      data: null,
    });
  }
}
// Schedule the recurring donations to be processed daily at midnight
cron.schedule('0 0 * * *', () => {  
  Logger.info('Running recurring donations processing task...');
  processRecurringDonations();
});


export default processRecurringDonations; 
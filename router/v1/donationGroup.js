import { Router } from "express";
import { 
  createDonation, 
  getAllUserDonations, 
  updateDonation, 
  deleteDonation 
} from "../../controllers/donations.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";

const router = Router();

router.post("/create",userAuth, createDonation); 
router.get("/user/:userId",userAuth, getAllUserDonations); 
router.put("/update/:donationId",userAuth, updateDonation); 
router.delete("/delete/:donationId",userAuth, deleteDonation); 

export default router;

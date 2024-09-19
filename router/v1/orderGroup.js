import { Router } from "express";
import { userAuth } from "../../middleware/userAuth.js";
import { createOrder, deleteOrder } from "../../controllers/order.Controller.js";



const router = Router();

router.post("/create", userAuth, createOrder);
router.delete("/delete/:id", userAuth, deleteOrder);

export default router;

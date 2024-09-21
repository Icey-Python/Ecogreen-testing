import { Router } from "express";
import { userAuth } from "../../middleware/userAuth.js";
import { userAdminAuth } from "../../middleware/userAdminAuth.js";
import { addItemToCart, deleteCartItem, getCartItems, updateCartItem } from "../../controllers/cart.Controller.js";



const router = Router();

router.post("/add",userAuth, addItemToCart );
router.put("/update",userAuth, updateCartItem );
router.get("/all",userAuth, getCartItems)
router.delete("/delete/:productId",userAuth, deleteCartItem );

export default router;

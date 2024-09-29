import { Router } from "express";
import { userAuth } from "../../middleware/userAuth.js";
import { addItemToCart, checkout, deleteCartItem, getCartItems, updateCartItem } from "../../controllers/cart.Controller.js";



const router = Router();

router.post("/add",userAuth, addItemToCart );
router.put("/update",userAuth, updateCartItem );
router.get("/all",userAuth, getCartItems)
router.delete("/delete/:productId",userAuth, deleteCartItem );
router.post("/checkout",userAuth, checkout);

export default router;

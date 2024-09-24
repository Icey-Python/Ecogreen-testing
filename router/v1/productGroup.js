import { Router } from "express";
import Product from "../../models/product.model.js";
import {
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    purchaseProduct,
    getAllProducts,
    getLatestProducts,
    getFlashSales,
    getRecommendedProducts,
    getMostlyPurchasedProducts,
} from "../../controllers/product.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";
import { userAdminAuth } from "../../middleware/userAdminAuth.js";



const router = Router();

router.post("/create",userAuth, createProduct );
router.get("/one/:id",userAuth, getProduct );
router.get("/all",userAdminAuth, getAllProducts );
router.put("/update/:id",userAuth, updateProduct)
router.delete("/delete/:id",userAuth, deleteProduct)
router.post("/purchase/:id",userAuth, purchaseProduct)
router.get("/latest",userAuth, getLatestProducts );
router.get("/flash-sales",userAuth, getFlashSales);
router.get("/recommended/:category",userAuth, getRecommendedProducts);
router.get("/most-purchased",userAuth, getMostlyPurchasedProducts);


export default router;

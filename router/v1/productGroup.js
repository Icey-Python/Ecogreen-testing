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
    addToCart,
} from "../../controllers/product.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";
import { userAdminAuth } from "../../middleware/userAdminAuth.js";
import multer from 'multer'

const upload = multer();
const router = Router();

router.post("/create",userAuth,upload.single('image'),createProduct );
router.get("/one/:id",userAuth, getProduct );
router.get("/all",userAdminAuth, getAllProducts );
router.put("/update/:id",userAuth,upload.single('image'),updateProduct)
router.delete("/delete/:id",userAuth, deleteProduct)
router.post("/purchase/:id",userAuth, purchaseProduct)
router.get("/latest",userAuth, getLatestProducts );
router.get("/flash-sales",userAuth, getFlashSales);
router.get("/recommended/:category",userAuth, getRecommendedProducts);
router.get("/most-purchased",userAuth, getMostlyPurchasedProducts);
router.post("/add-to-cart/:id" , userAuth , addToCart)


export default router;

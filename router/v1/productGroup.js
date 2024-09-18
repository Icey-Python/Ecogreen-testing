import { Router } from "express";
import Product from "../../models/product.model.js";
import { createProduct ,getProduct,getAllProducts, updateProduct, deleteProduct} from "../../controllers/product.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";



const router = Router();

router.post("/create",userAuth, createProduct );
router.get("/one/:id",userAuth, getProduct );
router.get("/all",userAuth, getAllProducts );
router.put("/update/:id",userAuth, updateProduct)
router.delete("/delete/:id",userAuth, deleteProduct)

export default router;

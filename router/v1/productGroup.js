import { Router } from "express";
import Product from "../../models/product.model.js";
import { createProduct ,getProduct,getAllProducts, updateProduct, deleteProduct,purchaseProduct} from "../../controllers/product.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";
import { userAdminAuth } from "../../middleware/userAdminAuth.js";



const router = Router();

router.post("/create",userAuth, createProduct );
router.get("/one/:id",userAuth, getProduct );
router.get("/all",userAdminAuth, getAllProducts );
router.put("/update/:id",userAuth, updateProduct)
router.delete("/delete/:id",userAuth, deleteProduct)
router.post("/purchase/:id",userAuth, purchaseProduct)

export default router;

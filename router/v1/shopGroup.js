import { Router } from 'express'
import { adminAuth } from '../../middleware/adminAuth.js'
import { createShop, deleteShop, getShop, updateShop } from '../../controllers/shop.Controller.js'
import { userAdminAuth } from '../../middleware/userAdminAuth.js'

const router = Router()

router.post('/create',adminAuth,createShop);
router.delete('/delete',adminAuth,deleteShop);
router.put('/update',adminAuth,updateShop);
router.get('/find',userAdminAuth,getShop);
export default router

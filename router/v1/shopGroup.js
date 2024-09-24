import { Router } from 'express'
import { adminAuth } from '../../middleware/adminAuth.js'
import { userAuth } from '../../middleware/userAuth.js'
import { userAdminAuth } from '../../middleware/userAdminAuth.js'

import {
  createShop,
  deleteShop,
  getAllShops,
  getNearbyShops,
  getShop,
  updateShop,
} from '../../controllers/shop.Controller.js'

const router = Router()

router.post('/create', adminAuth, createShop)
router.delete('/delete/:id', adminAuth, deleteShop)
router.put('/update/:id', adminAuth, updateShop)
router.get('/find/all', userAdminAuth, getAllShops)//user specific shop
router.get('/find/nearby', userAuth, getNearbyShops)
router.get('/find/:id', userAdminAuth, getShop)
export default router

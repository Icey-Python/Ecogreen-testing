import {Router} from "express"
import testGroup from './testGroup.js'
import userGroup from './user.Group.js'
import adminGroup from './adminGroup.js'
import squadGroup from './squadGroup.js'
import productGroup from './productGroup.js'


const router = Router();

// Routes
router.use("/test",testGroup)
router.use("/user",userGroup)
router.use("/admin",adminGroup)
router.use("/squad", squadGroup)
router.use("/product", productGroup)

export default router;
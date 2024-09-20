import {Router} from "express"
import testGroup from './testGroup.js'
import userGroup from './user.Group.js'
import adminGroup from './adminGroup.js'
import squadGroup from './squadGroup.js'
import productGroup from './productGroup.js'
import orderGroup from './orderGroup.js'
import reportGroup from './reportGroup.js'
import leaderboardGroup from './leaderboardGroup.js'
import chatGroup from './chatGroup.js'
import postGroup from './postGroup.js' 
const router = Router();

// Routes
router.use("/test",testGroup)
router.use("/user",userGroup)
router.use("/admin",adminGroup)
router.use("/squad", squadGroup)
router.use("/product", productGroup)
router.use("/order", orderGroup)
router.use("/report", reportGroup)
router.use("/leaderboard", leaderboardGroup)
router.use("/chat", chatGroup)
router.use('/post', postGroup)
export default router;

import { Router } from 'express'
import testGroup from './testGroup.js'
import userGroup from './user.Group.js'
import adminGroup from './adminGroup.js'
import squadGroup from './squadGroup.js'
import productGroup from './productGroup.js'
import orderGroup from './orderGroup.js'
import reportGroup from './reportGroup.js'
import leaderboardGroup from './leaderboardGroup.js'
import chatGroup from './chatGroup.js'
import donationGroup from './donationGroup.js'
import postGroup from './postGroup.js'
import cartGroup from './cartGroup.js'
import eventsGroup from './eventsGroup.js'
import greenBankGroup from './greenBankGroup.js'
import shopGroup from './shopGroup.js'
import activityGroup from './activityGroup.js'

const router = Router()

// Routes
router.use('/test', testGroup)
router.use('/user', userGroup)
router.use('/admin', adminGroup)
router.use('/squad', squadGroup)
router.use('/product', productGroup)
router.use('/order', orderGroup)
router.use('/report', reportGroup)
router.use('/leaderboard', leaderboardGroup)
router.use('/chat', chatGroup)
router.use('/donations', donationGroup)
router.use('/post', postGroup)
router.use('/cart', cartGroup)
router.use('/events', eventsGroup)
router.use('/greenBank', greenBankGroup)
router.use('/activity', activityGroup)

router.use('/shop', shopGroup)

export default router

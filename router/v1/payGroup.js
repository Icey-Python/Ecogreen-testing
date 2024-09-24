import { Router } from 'express'
import { generateToken } from '../../middleware/genToken'
import { callback, stkPush } from '../../controllers/pay.Controller'

const router = Router()

router.post('/stk', generateToken, stkPush)
router.post('/callback', callback)

export default router

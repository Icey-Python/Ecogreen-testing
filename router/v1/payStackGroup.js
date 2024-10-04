import { Router } from 'express'
import { userAuth } from '../../middleware/userAuth.js'
import {
  fetchTransfer,
  finalizeTransfer,
  initializeTransfer,
  listTransfers,
  verifyTransfer,
} from '../../controllers/payStackTransfer.js'
import {
  PaystackWebhook,
  fetchTransaction,
  initializePayment,
  listTransactions,
  verifyTransaction,
} from '../../controllers/payStackTransaction.js'
const router = Router()
//transfer
router.post('/transfer/init', userAuth, initializeTransfer)
router.post('/transfer/finalize', userAuth, finalizeTransfer)
router.get('/transfer/verify', userAuth, verifyTransfer)
router.get('/transfer/get', userAuth, fetchTransfer)
router.get('/transfers/all', userAuth, listTransfers)

//transact
router.post('/webhook', PaystackWebhook)
router.post('/init', userAuth, initializePayment)
router.get('/verify', userAuth, verifyTransaction)
router.get('/transaction/get', userAuth, fetchTransaction)
router.get('/transactions/all', userAuth, listTransactions)
export default router

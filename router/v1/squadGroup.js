import { Router } from "express";
import { createSquad, deleteSquad, getAllSquads, joinSquad, leaveSquad, updateSquad } from "../../controllers/squad.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";

const router = Router()


router.post('/create',userAuth,createSquad)
router.put('/join/:id',userAuth,joinSquad)
router.put("/leave/:id",userAuth,leaveSquad)
router.put('/update/:id', userAuth, updateSquad)
router.delete('/delete/:id', userAuth, deleteSquad)
router.get('/all',userAuth,getAllSquads)

export default router;
import { Router } from "express";
import { addMember, approveMember, createSquad, deleteSquad, getAllSquads,leaveSquad, removeMember, requestToJoinSquad, updateSquad } from "../../controllers/squad.Controller.js";
import { userAuth } from "../../middleware/userAuth.js";

const router = Router()


router.post('/create',userAuth,createSquad)
router.put('/join/request/:id',userAuth,requestToJoinSquad)
router.put("/leave/:id",userAuth,leaveSquad)
router.put('/update/:id', userAuth, updateSquad)
router.delete('/delete/:id', userAuth, deleteSquad)
router.get('/all',userAuth,getAllSquads)
router.put('/members/add/:id', userAuth, addMember)
router.put('/members/approve/:id', userAuth, approveMember)
router.delete('/members/delete/:id', userAuth, removeMember)
export default router;

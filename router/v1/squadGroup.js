import { Router } from "express";
import { createSquad, getAllSquads } from "../../controllers/squad.Controller.js";


const router = Router()


router.post('/create', createSquad)
router.get('/all', getAllSquads)

export default router;
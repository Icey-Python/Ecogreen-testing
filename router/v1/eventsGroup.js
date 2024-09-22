import { Router } from "express";
import { userAuth } from "../../middleware/userAuth.js";
import { squadAdminAuth } from "../../middleware/squadAdminAuth.js";
import {
     createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent} from "../../controllers/events.Controller.js";


    const router = Router();


    router.post("/create",squadAdminAuth, createEvent );
    router.get("/all",userAuth, getAllEvents );
    router.get("/:id",userAuth, getEventById)
    router.put("/update/:id",userAuth,squadAdminAuth, updateEvent );
    router.delete("/delete/:id",userAuth,squadAdminAuth, deleteEvent );



    export default router;
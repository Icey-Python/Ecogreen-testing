import { Router } from "express";
import { userAuth } from "../../middleware/userAuth.js";
import { deleteChat, fetchChatMessages, getAllChats, sendChatMessage } from "../../controllers/chat.Controller.js";

const router = Router();

router.post("/message", userAuth, sendChatMessage);
router.get("/message/:id",userAuth, fetchChatMessages);
router.get("/all/",userAuth, getAllChats);
router.delete("/delete/:id", userAuth, deleteChat)

export default router;

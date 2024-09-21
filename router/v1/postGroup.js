import { Router } from "express";
import { userAuth } from "../../middleware/userAuth.js";
import { commentPost, createPost, deleteComment, deletePost, getAllComments, getAllPosts, getPost, likePost, savePost, updatePost } from "../../controllers/post.Controller.js";


const router = Router();

router.post("/create", userAuth, createPost);
router.delete("/delete/:id", userAuth, deletePost);
router.get("/find/one/:id", userAuth, getPost);
router.get("/find/all", userAuth, getAllPosts);
router.put("/update/:id", userAuth, updatePost);
router.put("/like/:id", userAuth, likePost);
router.put("/comment/:id", userAuth, commentPost);
router.put("/comment/delete/:id", userAuth, deleteComment);
router.put("/save/:id", userAuth, savePost);
router.get("/comment/all", userAuth, getAllComments);

export default router;

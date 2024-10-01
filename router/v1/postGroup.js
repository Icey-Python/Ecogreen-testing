import { Router } from 'express'
import { userAuth } from '../../middleware/userAuth.js'
import {
  commentPost,
  createPost,
  deleteComment,
  deletePost,
  getAllComments,
  getAllPosts,
  getPost,
  getSharedPost,
  likePost,
  savePost,
  sharePost,
  updatePost,
} from '../../controllers/post.Controller.js'
import multer from 'multer'
const upload = multer()

const router = Router()

router.post('/create', userAuth,upload.single('image'), createPost)
router.delete('/delete/:id', userAuth, deletePost)
router.get('/find/one/:id', userAuth, getPost)
router.get('/find/all', userAuth, getAllPosts)
router.put('/update/:id', userAuth,upload.single('image'), updatePost)
router.put('/like/:id', userAuth, likePost)
router.put('/comment/:id', userAuth, commentPost)
router.put('/comment/delete/:id', userAuth, deleteComment)
router.put('/save/:id', userAuth, savePost)
router.get('/comment/all/:id', userAuth, getAllComments)
router.post('/share/:id', sharePost)
router.get('/share/view/:id', getSharedPost)

export default router

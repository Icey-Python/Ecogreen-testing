import { StatusCodes } from 'http-status-codes'
import User from '../models/user.model.js'
import { Logger } from 'borgen'
import Post from '../models/post.model.js'
import Squad from '../models/squad.model.js'
import Admin from '../models/admin.model.js'
//@ desc Create post
//@ route POST /api/v1/post/create
export const createPost = async (req, res) => {
  try {
    const userId = res.locals.userId
    const { title, content, image, squadId,category, tags } = req.body
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    if (!squadId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Squad Id is required',
        data: null,
      })
    }
    if (!title) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Title is required',
        data: null,
      })
    }
    if (!content) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Content is required',
        data: null,
      })
    }
    const user = User.findById(userId)
    const squad = User.findById(squadId)
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid user Id',
        data: null,
      })
    }
    if (!squad) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid squad Id',
        data: null,
      })
    }
    if (!squad.members.includes(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    if (squad.moderator.length > 0 && !squad.moderator.includes(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'You are not allowed to perfom this action',
        data: null,
      })
    }
    const post = await Post.create({
      title,
      content,
      creator: userId,
      squad: squadId,
    })

    if (image) post.image = image
    if (category) post.category = category
    if (tags) post.tags = tags
    await post.save()
    return res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'Post created successfully',
      data: post,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to create your post',
      data: null,
    })
  }
}

//@ desc Get all posts
//@ route GET /api/v1/post
export const getAllPosts = async (req, res) => {
  try {
    const userId = res.locals.userId
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    const posts = await Post.find()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Posts fetched successfully',
      data: posts,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to fetch posts',
      data: null,
    })
  }
}

//@ desc Update post
//@ route PUT /api/v1/post/update/:id
export const updatePost = async (req, res) => {
  try {
    const postId = req.params.id
    const userId = res.locals.userId
    const { title, content, image,category, tags} = req.body
    const post = await Post.findById(postId)
    if (!post || !userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }
    const squad = await Squad.findById(post.squad)
    if(!squad.moderators.includes(userId) || userId != String(post.creator)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }
  if(title) post.title = title
  if(content) post.content = content
  if(image) post.image = image
  if(category) post.category = category
  if(tags) post.tags = tags
  await post.save()
  return res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Post updated successfully',
    data: post,
  })
  } 
  catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to update your post',
      data: null,
    })
  }
}
//@ desc Delete post
//@ route DELETE /api/v1/post/delete/:id
export const deletePost = async (req, res) => {
  try {
    const postId = req.params.id
    const userId = res.locals.userId
    const post = await Post.findById(postId)
    if (!post || !userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }

    const squad = await Squad.findById(post.squad)

    if(!squad.moderators.includes(userId) || userId != String(post.creator || !Admin.findById(userId))) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }
    await Post.findByIdAndDelete(postId)
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Post deleted successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to delete your post',
      data: null,
    })
  }
}

//@ desc Get post
//@ route GET /api/v1/post/:id
export const getPost = async (req, res) => {
  try {
    if(!res.locals.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    if (!req.params.id) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please provide post id',
        data: null,
      })
    }
    const postId = req.params.id
    const post = await Post.findById(postId)
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Post fetched successfully',
      data: post,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to fetch your post',
      data: null,
    })
  }
}

//@ desc like post
//@ route PUT /api/v1/post/like/:id
export const likePost = async (req, res) => {
  try {
    if(!res.locals.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    const postId = req.params.id
    const userId = res.locals.userId
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid post Id',
        data: null,
      })
    }
    if (post.likes.includes(userId)) {
      //remove like 
      post.likes = post.likes.filter((like) => like != userId)
      await post.save()
      return res.status(StatusCodes.OK).json({
        status: 'error',
        message: 'You have removed your like from this post',
        data: null,
      })
    }
    post.likes.push(new Types.ObjectId(userId))
    await post.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Post liked successfully',
      data: {
        postId,
        likes: parseInt(post.likes.length,10)+1,
      },
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to like your post',
      data: null,
    })
  }
}

//@ desc comment post
//@ route PUT /api/v1/post/comment/:id
export const commentPost = async (req, res) => {
  try {
    if(!res.locals.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    const postId = req.params.id
    const userId = res.locals.userId
    const { content } = req.body
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid post Id',
        data: null,
      })
    }
    const comment = new Comment({
      content,
      creator: new Types.ObjectId(userId),
      post: new Types.ObjectId(postId),
    })
    await comment.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Comment posted successfully',
      data: comment,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to comment on your post',
      data: null,
    })
  }
}
//@ desc Delete Comment 
//@ route DELETE /api/v1/post/comment/delete/:id
export const deleteComment = async (req, res) => {
  try {
    if(!res.locals.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    const commentId = req.params.id
    if (!commentId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please provide comment id',
        data: null,
      })
    }
    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid comment Id',
        data: null,
      })
    }
    if(!comment.creator.equals(res.locals.userId) || !Admin.findById(res.locals.userId)) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'You are not allowed to perform this action',
        data: null,
      })
    }
    await comment.findByIdAndDelete(commentId)
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Comment deleted successfully',
      data: null,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to delete your comment',
      data: null,
    })
  }
}

//@ desc Get all comments
//@ route GET /api/v1/post/comment/all
export const getAllComments = async (req, res) => {
  try {
    if(!res.locals.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    const postId = req.params.id
    if (!postId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Please provide post id',
        data: null,
      })
    }
    const comments = await Comment.find({ post: postId })
    if (!comments) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid post Id',
        data: null,
      })
    }
    if(comments.length === 0) {
      return res.status(StatusCodes.OK).json({
        status: 'success',
        message: 'No comments found for this post',
        data: null,
      })
    }
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Comments fetched successfully',
      data: comments,
    })
  } catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to fetch comments',
      data: null,
    })
  }
}

// @ desc save post 
// @ route POST /api/v1/post/save/:id
export const savePost = async (req, res) => {
  try {
    if(!res.locals.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: 'error',
        message: 'Please login and try again',
        data: null,
      })
    }
    const postId = req.params.id
    const userId = res.locals.userId
    const user = User.findById(userId)
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid user Id',
        data: null,
      })
    }
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Invalid post Id',
        data: null,
      })
    }

    if(post.saves.includes(new Types.ObjectId(userId))) {
      post.saves.pull(new Types.ObjectId(userId))
      user.saves.pull(new Types.ObjectId(postId))
      await user.save()
      await post.save()

      return res.status(StatusCodes.OK).json({
        status: 'error',
        message: 'You have removed this post from your saves',
        data: null,
      })
    }
    post.saves.push(new Types.ObjectId(userId))
    user.saves.push(new Types.ObjectId(postId))
    await user.save()
    await post.save()
    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Post saved successfully',
      data: {
        postId,
        saves: parseInt(post.saves.length,10)+1,
      },
    })
  }
  catch (error) {
    Logger.error({ message: error })
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: 'error',
      message: 'An error occured while trying to save your post',
      data: null,
    })
  }
}


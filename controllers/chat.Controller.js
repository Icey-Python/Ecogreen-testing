import { StatusCodes } from "http-status-codes";
import Chat from "../models/chat.model.js";
import Message from "../models/message.model.js";
import { Types } from "mongoose";
import { Logger } from "borgen";

// @desc Send messages
// @route POST /api/v1/chat/message
export const sendChatMessage = async (req, res) => {
  try {
    const { message, receiverId } = req.body;
    const senderId = res.locals.userId;

    if (!senderId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Please login and try again",
        data: null,
      });
    }
    if (!receiverId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Please provide receiver id",
        data: null,
      });
    }
    if (!message) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Please provide message",
        data: null,
      });
    }

    if (!Types.ObjectId.isValid(receiverId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid receiver id",
        data: null,
      });
    }

    const chat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chat) {
      let newChat = new Chat({
        participants: [receiverId, senderId],
      });

      let newMessage = new Message({
        message,
        sender: senderId,
      });

      newChat.messages.push(newMessage._id);

      await newChat.save();
      await newMessage.save();

      return res.status(StatusCodes.OK).json({
        status: "success",
        message: "Message sent successfully",
        data: newMessage,
      });
    }

    let newMessage = new Message({
      message,
      sender: senderId,
    });

    chat.messages.push(newMessage._id);

    await chat.save();
    await newMessage.save();

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while sending your message",
      data: null,
    });
  }
};

// @desc fetch messages
// @route GET /api/v1/chat/message/:id
export const fetchChatMessages = async (req, res) => {
  try {
    let chatId = req.params.id;

    if (!Types.ObjectId.isValid(chatId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid chat id",
        data: null,
      });
    }

    let chat = await Chat.findById(chatId).populate("messages");

    if (!chat) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Chat not found",
        data: null,
      });
    }

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Fetched messages successfully",
      data: chat,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching messages",
      data: null,
    });
  }
};

// @Desc Fetch Chats
// @route GET /api/v1/chat/all
export const getAllChats = async (req, res) => {
  try {
    let userId = res.locals.userId;
    //search query to find chats where the userId is a participant
    const chats = await Chat.find({
      participants: { $in: [userId] },
    });

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Fetched chats successfully",
      data: chats,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while fetching chats",
      data: null,
    });
  }
};

// @Delete chat
// @route DELETE /api/v1/chat/delete/:id
export const deleteChat = async (req, res) => {
  try {
    let chatId = req.params.id;
    const userId = res.locals.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Please login and try again",
        data: null,
      });
    }
    if (!chatId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid chat id",
        data: null,
      });
    }

    let deletedChat = await Chat.findByIdAndDelete(chatId);
    if (!deletedChat) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Chat not found",
        data: null,
      });
    }

    await Message.deleteMany({ _id: { $in: deletedChat.messages } });
    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Chat deleted successfully",
      data: null,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while deleting the chat",
      data: null,
    });
  }
};

//@ desc update Chat Seen 
//@ route PUT /api/v1/chat/seen/:id
export const updateChatSeen = async (req, res) => {
  try {
    let chatId = req.params.id;
    const userId = res.locals.userId;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: "error",
        message: "Please login and try again",
        data: null,
      });
    }
    if (!chatId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Invalid chat id",
        data: null,
      });
    }

    let chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "Chat not found",
        data: null,
      });
    }

    if (!chat.participants.includes(userId)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "You are not a participant of this chat",
        data: null,
      });
    }

    const chatMessages = await Message.updateMany({
      id: { $in: chat.messages },
      $set: { seen: true },
    });
    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "Chat seen successfully",
      data: null,
    });
  } catch (error) {
    Logger.error({ message: error.message });
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      status: "error",
      message: "An error occurred while updating the chat",
      data: null,
    });
  }
}

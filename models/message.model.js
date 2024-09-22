import { model, Schema } from 'mongoose'

const MessageSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
)

const Message = model('Message', MessageSchema)

export default Message

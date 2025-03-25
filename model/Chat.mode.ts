import { time, timeStamp } from "console";
import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    message: [
      {
        role: { type: String, required: true },
        content: { type: String, required: true },
        timeStamp: { type: Number, default: Date.now() },
      },
    ],
    userId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Chat = mongoose.models.Chat || mongoose.model("Chat", ChatSchema);

export default Chat;

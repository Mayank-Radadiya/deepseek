export const maxDuration = 60;

import dbConnect from "@/config/db/db.config";
import Chat from "@/model/Chat.mode";

import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const deepSeekApi = process.env.DEEPSEEK_API_KEY;

if (!deepSeekApi) {
  throw new Error("DEEPSEEK_API_KEY is not defined");
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: deepSeekApi,
});

interface Message {
  role: string;
  content: string;
  timeStamp?: number;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId, prompt } = await req.json();

    if (!chatId || !prompt) {
      return NextResponse.json(
        { error: "Missing chatId or prompt" },
        { status: 400 }
      );
    }

    await dbConnect();

    const chat = await Chat.findOne({ _id: chatId, userId });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Ensure message array exists
    if (!Array.isArray(chat.message)) {
      chat.message = [];
    }

    const userPrompt: Message = {
      role: "user",
      content: prompt,
      timeStamp: Date.now(),
    };

    // Use chat.message instead of chat.messages
    chat.messages.push(userPrompt);

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      store: true,
      messages: [{ role: "user", content: prompt }],
    });

    const assistantMessage: Message = {
      role: "assistant",
      content: response.choices[0].message.content || "No response content",
      timeStamp: Date.now(),
    };

    // Use chat.message instead of chat.messages
    chat.messages.push(assistantMessage);

    // Save and handle errors
    try {
      await chat.save();
    } catch (saveError) {
      console.error("Error saving chat:", saveError);
      return NextResponse.json(
        { error: "Failed to save chat" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 200,
      data: assistantMessage,
    });
  } catch (error) {
    console.error("Error in POST /api/chat/ai:", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: "AI service error", details: error.message },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

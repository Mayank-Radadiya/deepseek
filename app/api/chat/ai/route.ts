export const maxDuration = 60
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

export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    const { id, prompt } = await req.json();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    await dbConnect();
    const data = await Chat.findOne({
      userId,
      id,
    });

    if (!data) {
      return new Response("Chat not found", { status: 404 });
    }

    const userPrompt = {
      role: "user",
      content: prompt,
    };

    data.messages.push(userPrompt);

    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324:free",
      store: true,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const messages = response.choices[0].message;
    data.messages.push(messages);
    await data.save();

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error in POST /api/chat/ai:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

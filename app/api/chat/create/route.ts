import dbConnect from "@/config/db/db.config";
import Chat from "@/model/Chat.mode";
import { getAuth } from "@clerk/nextjs/server";
import { NextApiRequest } from "next";
import { NextResponse } from "next/server";

export async function POST(req: NextApiRequest) {
  try {
    const user = getAuth(req);

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const emoji = [
      "😇",
      "😉",
      "😂",
      "😍",
      "😎",
      "🤔",
      "🥳",
      "🤩",
      "😜",
      "😏",
      "😁",
      "😊",
      "🥺",
      "🤯",
      "😅",
      "🙃",
      "😈",
      "😤",
      "🤗",
      "😴",
      "🤡",
      "😵",
      "👻",
      "😬",
      "🥶",
      "💀",
      "🤖",
      "👽",
      "🤑",
      "🤠",
      "😋",
    ];

    const randomEmoji = emoji[Math.floor(Math.random() * emoji.length)];

    const chatData = {
      userId: user.userId,
      name: `New Chat ${randomEmoji}`,
      messages: [],
    };

    await dbConnect();
    const chat = await Chat.create(chatData);
    await chat.save();
    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error creating chat:", error);
    return new NextResponse("Internal Server Error from chat/create route", {
      status: 500,
    });
  }
}

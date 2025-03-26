import dbConnect from "@/config/db/db.config";
import Chat from "@/model/Chat.mode";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = getAuth(req);

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("User ID:", user.userId);

  try {
    await dbConnect();
    const chat = await Chat.find({
      userId: user.userId,
    });

    return NextResponse.json(chat);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return new Response("Internal Server Error from getchat route", {
      status: 500,
    });
  }
}

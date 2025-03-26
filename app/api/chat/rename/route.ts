import dbConnect from "@/config/db/db.config";
import Chat from "@/model/Chat.mode";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { id, newName } = await req.json();
  try {
    const user = getAuth(req);
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    await dbConnect();

    await Chat.findByIdAndUpdate(
      {
        _id: id,
        userId: user.userId,
      },
      {
        name: newName,
      }
    );

    return new Response("Chat update successfully", {
      status: 200,
    });
  } catch (error) {
    console.error("Error Update chat:", error);
    return new Response("Internal Server Error from rename route", {
      status: 500,
    });
  }
}

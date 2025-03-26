import dbConnect from "@/config/db/db.config";
import Chat from "@/model/Chat.mode";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  try {
    const user = getAuth(req);
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }
    await dbConnect();

    const deleteChat = await Chat.deleteOne({
      userId: user.userId,
      _id: id,
    });

    if (!deleteChat) {
      return new Response("Chat not found", { status: 404 });
    }

    return new Response("Chat deleted successfully", {
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting chat:", error);
    return new Response("Internal Server Error from delete route", {
      status: 500,
    });
  }
}

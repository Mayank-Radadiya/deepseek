// Importing necessary tools
import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import User from "@/model/User.model";
import dbConnect from "@/config/db/db.config";

// Define a type for the webhook event data
interface WebhookEventData {
  id: string;
  name: string;
  email: string;
  image_url?: string;
}

// API endpoint to handle POST requests
export async function POST(req: Request) {
  console.log("Webhook received at:", new Date().toISOString());

  const SIGNING_SECRET = process.env.SIGNING_SECRET;
  if (!SIGNING_SECRET) {
    console.error("Missing SIGNING_SECRET");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const wh = new Webhook(SIGNING_SECRET);
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers");
    return new Response(JSON.stringify({ error: "Missing Svix headers" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log("Webhook verified:", evt.type);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response(
      JSON.stringify({ error: "Webhook verification failed" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const eventType = evt.type;
  const userData = evt.data as {
    id: string;
    first_name?: string;
    last_name?: string;
    email_addresses: { email_address: string }[];
    image_url?: string;
  };

  if (!userData.id) {
    console.error("No user ID provided in webhook data");
    return new Response(
      JSON.stringify({ error: "Invalid webhook data: missing user ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const eventData: WebhookEventData = {
    id: userData.id,
    name:
      `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
      "Unnamed User",
    email: userData.email_addresses[0]?.email_address ?? "",
    image_url: userData.image_url,
  };

  if (
    (eventType === "user.created" || eventType === "user.updated") &&
    !eventData.email
  ) {
    console.error("No email address provided in webhook data");
    return new Response(
      JSON.stringify({ error: "Invalid webhook data: missing email" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Connect to the database
  try {
    await dbConnect();
  } catch (err) {
    console.error("Database connection failed:", err);
    return new Response(
      JSON.stringify({ error: "Database connection failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    switch (eventType) {
      case "user.created":
        await User.create({
          _id: eventData.id,
          name: eventData.name,
          email: eventData.email,
          image_url: eventData.image_url,
        });
        console.log("User created:", eventData);
        break;

      case "user.updated":
        await User.findOneAndUpdate(
          { _id: eventData.id },
          {
            name: eventData.name,
            email: eventData.email,
            image_url: eventData.image_url,
          },
          { new: true }
        );
        console.log("User updated:", eventData);
        break;

      default:
        console.warn("Unhandled event type:", eventType);
        return new Response(
          JSON.stringify({ message: `Unhandled event type: ${eventType}` }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    console.error(`Database operation failed for ${eventType}:`, err);
    return new Response(
      JSON.stringify({ error: "Database operation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ message: `Webhook processed: ${eventType}` }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}


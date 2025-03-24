// Importing necessary tools
import { Webhook } from "svix"; // Tool to verify webhook signatures
import { headers } from "next/headers"; // Get HTTP headers in Next.js
import { WebhookEvent } from "@clerk/nextjs/server"; // Type definition for Clerk webhook events
import User from "@/model/User.model"; // Our User database model
import dbConnect from "@/config/db/db.config"; // Database connection function

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

  // Get the secret key from environment variables for verification
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  if (!SIGNING_SECRET) {
    console.error("Missing SIGNING_SECRET");
    throw new Error("Error: Please add SIGNING_SECRET from Clerk to .env");
  }

  // Create a new Webhook verifier with our secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get all headers from the incoming request
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id"); // Unique webhook ID
  const svix_timestamp = headerPayload.get("svix-timestamp"); // Timestamp
  const svix_signature = headerPayload.get("svix-signature"); // Signature

  // Check for required Svix headers
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers");
    return new Response("Error: Missing Svix headers", { status: 400 });
  }

  // Get and stringify the request body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify the webhook signature
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
    console.log("Webhook verified:", evt.type);
  } catch (err) {
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", { status: 400 });
  }

  // Extract event type and data
  const eventType = evt.type;
  const userData = evt.data as {
    id: string;
    first_name?: string;
    last_name?: string;
    email_addresses: { email_address: string }[];
    image_url?: string;
  };

  // Prepare data for processing with explicit typing
  const eventData: WebhookEventData = {
    id: userData.id,
    name:
      `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
      "Unnamed User",
    email: userData.email_addresses[0]?.email_address ?? "",
    image_url: userData.image_url,
  };

  // Validate email for create/update events
  if (
    (eventType === "user.created" || eventType === "user.updated") &&
    !eventData.email
  ) {
    console.error("No email address provided in webhook data");
    return new Response("Error: No email provided", { status: 400 });
  }

  // add mongodb connection
  await dbConnect();

  // add user to database
  if (eventType === "user.created") {
    await User.create({
      _id: eventData.id,
      name: eventData.name,
      email: eventData.email,
      image_url: eventData.image_url,
    });
  }

  // update user in database
  if (eventType === "user.updated") {
    await User.findOneAndUpdate(
      { _id: eventData.id },
      {
        name: eventData.name,
        email: eventData.email,
        image_url: eventData.image_url,
      },
      { new: true }
    );
  }
  // delete user from database
  if (eventType === "user.deleted") {
    await User.findOneAndDelete({ _id: eventData.id })
      .then(() => {
        console.log("User deleted from database");
      })
      .catch((err) => {
        console.error("Error deleting user from database:", err);
      });
  }

  console.log(`Returning response for ${eventType}`);
  return new Response(`Webhook received: ${eventType}`, { status: 200 });
}

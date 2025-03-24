// Importing necessary tools and dependencies
import { Webhook } from "svix"; // Svix library for webhook verification
import { headers } from "next/headers"; // Next.js headers utility
import { WebhookEvent } from "@clerk/nextjs/server"; // Clerk webhook event types
import User from "@/model/User.model";
import dbConnect from "@/config/db/db.config";

// Define a type for the webhook event data to ensure type safety
interface WebhookEventData {
  id: string;
  name: string;
  email: string;
  image_url?: string;
}

// API endpoint to handle POST requests from webhooks
export async function POST(req: Request) {
  // Log when the webhook is received with timestamp
  console.log("Webhook received at:", new Date().toISOString());

  // Get the signing secret from environment variables
  const SIGNING_SECRET = process.env.SIGNING_SECRET;
  // Check if signing secret is available
  if (!SIGNING_SECRET) {
    console.error("Missing SIGNING_SECRET");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Initialize Svix webhook verifier
  const wh = new Webhook(SIGNING_SECRET);
  // Get Svix headers for verification
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Validate presence of required Svix headers
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers");
    return new Response(JSON.stringify({ error: "Missing Svix headers" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse the request body
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
    // Handle verification failure
    console.error("Webhook verification failed:", err);
    return new Response(
      JSON.stringify({ error: "Webhook verification failed" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract event type and user data
  const eventType = evt.type;
  const userData = evt.data as {
    id: string;
    first_name?: string;
    last_name?: string;
    email_addresses: { email_address: string }[];
    image_url?: string;
  };
  
  console.log("Userdata", userData);

  // Validate user ID presence
  if (!userData.id) {
    console.error("No user ID provided in webhook data");
    return new Response(
      JSON.stringify({ error: "Invalid webhook data: missing user ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Structure the event data for processing
  const eventData: WebhookEventData = {
    id: userData.id,
    name:
      `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
      "Unnamed User", // Combine first and last name, fallback to "Unnamed User"
    email: userData.email_addresses[0]?.email_address ?? "", // Get first email or empty string
    image_url: userData.image_url,
  };

  // Validate email presence for create/update events
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

  // Establish database connection
  try {
    await dbConnect();
  } catch (err) {
    console.error("Database connection failed:", err);
    return new Response(
      JSON.stringify({ error: "Database connection failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle different webhook event types
  try {
    switch (eventType) {
      case "user.created":
        // Create new user in database
        await User.create({
          _id: eventData.id,
          name: eventData.name,
          email: eventData.email,
          image_url: eventData.image_url,
        });
        console.log("User created:", eventData);
        break;

      case "user.updated":
        // Update existing user in database
        await User.findOneAndUpdate(
          { _id: eventData.id },
          {
            name: eventData.name,
            email: eventData.email,
            image_url: eventData.image_url,
          },
          { new: true } // Return the updated document
        );
        console.log("User updated:", eventData);
        break;

      default:
        // Log unhandled event types
        console.warn("Unhandled event type:", eventType);
        return new Response(
          JSON.stringify({ message: `Unhandled event type: ${eventType}` }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    // Handle database operation errors
    console.error(`Database operation failed for ${eventType}:`, err);
    return new Response(
      JSON.stringify({ error: "Database operation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Return success response
  return new Response(
    JSON.stringify({ message: `Webhook processed: ${eventType}` }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

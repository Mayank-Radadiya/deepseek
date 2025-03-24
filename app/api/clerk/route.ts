// Importing necessary tools
import { Webhook } from "svix"; // Svix library for verifying webhook signatures
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server"; // Type definition for Clerk webhook events
import User from "@/model/User.model";
import dbConnect from "@/config/db/db.config";

// Define a type for the webhook event data to ensure type safety
interface WebhookEventData {
  id: string;
  name: string;
  email: string;
  image_url?: string;
}

// API endpoint to handle POST requests from Clerk webhooks
export async function POST(req: Request) {
  // Log the exact time the webhook is received for debugging
  console.log("Webhook received at:", new Date().toISOString());

  // Retrieve the signing secret from environment variables for webhook verification
  const SIGNING_SECRET = process.env.SIGNING_SECRET;
  // Check if the signing secret is missing
  if (!SIGNING_SECRET) {
    console.error("Missing SIGNING_SECRET"); // Log the error
    // Return a 500 error response if the secret is not configured
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Initialize Svix Webhook verifier with the signing secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get HTTP headers from the incoming request (no await needed as it's synchronous in Next.js)
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id"); // Unique ID of the webhook event
  const svix_timestamp = headerPayload.get("svix-timestamp"); // Timestamp of the webhook
  const svix_signature = headerPayload.get("svix-signature"); // Signature for verification

  // Validate that all required Svix headers are present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers"); // Log missing headers
    // Return a 400 error if any header is missing
    return new Response(JSON.stringify({ error: "Missing Svix headers" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse the incoming request body as JSON
  const payload = await req.json();
  const body = JSON.stringify(payload); // Stringify it for signature verification

  let evt: WebhookEvent; // Variable to hold the verified webhook event
  // Verify the webhook signature to ensure authenticity
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent; // Cast to WebhookEvent type
    console.log("Webhook verified:", evt.type); // Log successful verification
  } catch (err) {
    console.error("Webhook verification failed:", err); // Log verification failure
    // Return a 400 error if verification fails
    return new Response(
      JSON.stringify({ error: "Webhook verification failed" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract the event type (e.g., "user.created", "user.updated", "user.deleted")
  const eventType = evt.type;
  // Cast the event data to the expected Clerk user data structure
  const userData = evt.data as {
    id: string;
    first_name?: string;
    last_name?: string;
    email_addresses: { email_address: string }[];
    image_url?: string;
  };

  // Ensure the user ID is present in the webhook data
  if (!userData.id) {
    console.error("No user ID provided in webhook data"); // Log missing ID
    // Return a 400 error if the ID is missing
    return new Response(
      JSON.stringify({ error: "Invalid webhook data: missing user ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Construct the event data object with fallback values
  const eventData: WebhookEventData = {
    id: userData.id, // User ID from Clerk
    name:
      `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || // Combine first and last name, or use default
      "Unnamed User",
    email: userData.email_addresses[0]?.email_address ?? "", // First email address, or empty string if missing
    image_url: userData.image_url, // Profile image URL, if provided
  };

  // Validate email presence for create/update events
  if (
    (eventType === "user.created" || eventType === "user.updated") &&
    !eventData.email
  ) {
    console.error("No email address provided in webhook data"); // Log missing email
    // Return a 400 error if email is required but missing
    return new Response(
      JSON.stringify({ error: "Invalid webhook data: missing email" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Establish a connection to the MongoDB database
  try {
    await dbConnect(); // Attempt to connect
    console.log("Database connected successfully"); // Log success (optional for debugging)
  } catch (err) {
    console.error("Database connection failed:", err); // Log connection failure
    // Return a 500 error if the database connection fails
    return new Response(
      JSON.stringify({ error: "Database connection failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle different event types with a try-catch for database operations
  try {
    switch (eventType) {
      case "user.created":
        // Create a new user in the database with the provided data
        await User.create({
          _id: eventData.id, // Use Clerk ID as the MongoDB _id
          name: eventData.name,
          email: eventData.email,
          image_url: eventData.image_url,
        });
        console.log("User created:", eventData); // Log the created user data
        break;

      case "user.updated":
        // Update an existing user in the database
        await User.findOneAndUpdate(
          { _id: eventData.id }, // Find user by Clerk ID
          {
            name: eventData.name,
            email: eventData.email,
            image_url: eventData.image_url,
          },
          { new: true } // Return the updated document
        );
        console.log("User updated:", eventData); // Log the updated user data
        break;

      case "user.deleted":
        // Delete a user from the database by Clerk ID
        const deletedUser = await User.findOneAndDelete({ _id: eventData.id });
        if (deletedUser) {
          console.log("User deleted:", eventData.id); // Log success if user was found and deleted
        } else {
          console.log("User not found for deletion:", eventData.id); // Log if user wasn’t in the database
        }
        break;

      default:
        // Handle unrecognized event types
        console.warn("Unhandled event type:", eventType); // Log a warning
        return new Response(
          JSON.stringify({ message: `Unhandled event type: ${eventType}` }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    // Catch any errors from database operations
    console.error(`Database operation failed for ${eventType}:`, err); // Log the specific error
    // Return a 500 error if a database operation fails
    return new Response(
      JSON.stringify({ error: "Database operation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Return a success response indicating the webhook was processed
  return new Response(
    JSON.stringify({ message: `Webhook processed: ${eventType}` }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

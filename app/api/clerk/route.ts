// Importing necessary tools and dependencies
import { Webhook } from "svix"; // Svix library for verifying webhook signatures from Clerk
import { headers } from "next/headers"; // Next.js utility to access HTTP request headers
import { WebhookEvent } from "@clerk/nextjs/server"; // Type definitions for Clerk webhook events
import User from "@/model/User.model"; // Mongoose model representing the User collection in MongoDB
import dbConnect from "@/config/db/db.config"; // Function to connect to the MongoDB database

// Define a type for the webhook event data to ensure type safety and consistency
interface WebhookEventData {
  id: string; // Unique identifier for the user (from Clerk)
  name: string; // Full name of the user
  email: string; // User's email address
  image_url?: string; // Optional URL for the user's profile image
}

// API endpoint to handle POST requests from Clerk webhooks
export async function POST(req: Request) {
  // Log the timestamp when the webhook is received for debugging purposes
  console.log("Webhook received at:", new Date().toISOString());

  // Retrieve the signing secret from environment variables for webhook verification
  const SIGNING_SECRET = process.env.SIGNING_SECRET;
  // Check if the signing secret is missing, which is required for verification
  if (!SIGNING_SECRET) {
    console.error("Missing SIGNING_SECRET"); // Log the error for debugging
    // Return a 500 error response indicating a server configuration issue
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Initialize the Svix Webhook verifier with the signing secret
  const wh = new Webhook(SIGNING_SECRET);

  // Retrieve HTTP headers from the request (synchronous in Next.js, no await needed)
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id"); // Unique ID of the webhook event
  const svix_timestamp = headerPayload.get("svix-timestamp"); // Timestamp of the webhook
  const svix_signature = headerPayload.get("svix-signature"); // Signature for verification

  // Validate that all required Svix headers are present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing Svix headers"); // Log missing headers for debugging
    // Return a 400 error response if any Svix header is missing
    return new Response(JSON.stringify({ error: "Missing Svix headers" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Parse the incoming request body as JSON
  const payload = await req.json();
  const body = JSON.stringify(payload); // Convert payload to string for verification

  let evt: WebhookEvent; // Variable to store the verified webhook event
  // Attempt to verify the webhook signature to ensure it’s legitimate
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent; // Cast the verified result to WebhookEvent type
    console.log("Webhook verified:", evt.type); // Log successful verification with event type
  } catch (err) {
    // Handle verification failure (e.g., invalid signature)
    console.error("Webhook verification failed:", err); // Log the error
    // Return a 400 error response if verification fails
    return new Response(
      JSON.stringify({ error: "Webhook verification failed" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract the event type (e.g., "user.created", "user.updated", "user.deleted")
  const eventType = evt.type;
  // Cast the event data to match the expected structure from Clerk
  const userData = evt.data as {
    id: string; // User ID
    first_name?: string; // Optional first name
    last_name?: string; // Optional last name
    email_addresses: { email_address: string }[]; // Array of email addresses
    image_url?: string; // Optional profile image URL
  };

  // Log the raw user data from the webhook for debugging
  console.log("Userdata", userData);

  // Ensure the user ID is present, as it’s required for all operations
  if (!userData.id) {
    console.error("No user ID provided in webhook data"); // Log the error
    // Return a 400 error if the ID is missing
    return new Response(
      JSON.stringify({ error: "Invalid webhook data: missing user ID" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Construct the event data object with fallback values for missing fields
  const eventData: WebhookEventData = {
    id: userData.id, // User ID from Clerk
    name:
      `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || // Combine first and last name, or use default
      "Unnamed User",
    email: userData.email_addresses[0]?.email_address ?? "", // First email address, or empty string if missing
    image_url: userData.image_url, // Profile image URL, if provided
  };

  // Log the prepared event data for debugging
  console.log("EventData prepared:", eventData);

  // Validate that an email is provided for create/update events
  if (
    (eventType === "user.created" || eventType === "user.updated") &&
    !eventData.email
  ) {
    console.error("No email address provided in webhook data"); // Log the error
    // Return a 400 error if email is missing for these events
    return new Response(
      JSON.stringify({ error: "Invalid webhook data: missing email" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Attempt to connect to the MongoDB database
  try {
    await dbConnect(); // Establish the database connection
  } catch (err) {
    console.error("Database connection failed:", err); // Log connection failure
    // Return a 500 error if the connection fails
    return new Response(
      JSON.stringify({ error: "Database connection failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Handle different event types with database operations
  try {
    switch (eventType) {
      case "user.created":
        // Create a new user in the database with the provided data
        const newUser = await User.create({
          _id: eventData.id, // Use Clerk ID as the MongoDB _id
          name: eventData.name, // User’s full name
          email: eventData.email, // User’s email address
          image_url: eventData.image_url, // User’s profile image URL
        });
        console.log("User created:", newUser); // Log the created user document
        break;

      case "user.updated":
        // Update an existing user in the database
        const updatedUser = await User.findOneAndUpdate(
          { _id: eventData.id }, // Find user by Clerk ID
          {
            name: eventData.name, // Update name
            email: eventData.email, // Update email
            image_url: eventData.image_url, // Update image URL
          },
          { new: true } // Return the updated document
        );
        console.log("User updated:", updatedUser); // Log the updated user document
        break;

      case "user.deleted":
        // Delete a user from the database by Clerk ID
        const deletedUser = await User.findOneAndDelete({ _id: eventData.id });
        if (deletedUser) {
          console.log("User deleted:", eventData.id); // Log success if user was deleted
        } else {
          console.log("User not found for deletion:", eventData.id); // Log if user wasn’t found
        }
        break;

      default:
        // Handle any unrecognized event types
        console.warn("Unhandled event type:", eventType); // Log a warning
        // Return a 200 response indicating the event type isn’t supported
        return new Response(
          JSON.stringify({ message: `Unhandled event type: ${eventType}` }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (err) {
    // Catch and handle any errors during database operations
    console.error(`Database operation failed for ${eventType}:`, err); // Log the specific error
    // Return a 500 error response for database failures
    return new Response(
      JSON.stringify({ error: "Database operation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Return a success response indicating the webhook was processed successfully
  return new Response(
    JSON.stringify({ message: `Webhook processed: ${eventType}` }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}

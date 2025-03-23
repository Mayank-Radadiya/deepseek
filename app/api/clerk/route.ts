// Importing necessary tools
import { Webhook } from "svix"; // A tool to verify webhook signatures
import { headers } from "next/headers"; // Helps us get HTTP headers in Next.js
import { WebhookEvent } from "@clerk/nextjs/server"; // Type definition for Clerk webhook events
import User from "@/model/User.model"; 

// This is an API endpoint that handles POST requests
export async function POST(req: Request) {
  // Get the secret key from environment variables
  // This secret is used to verify the webhook is genuine
  const SIGNING_SECRET = process.env.SIGNING_SECRET;

  // Check if we have the secret key
  if (!SIGNING_SECRET) {
    throw new Error(
      "Error: Please add SIGNING_SECRET from Clerk."
    );
  }

  // Create a new Webhook verifier with our secret
  const wh = new Webhook(SIGNING_SECRET);

  // Get all headers from the incoming request
  const headerPayload = await headers();
  
  // Get specific security headers from Svix
  const svix_id = headerPayload.get("svix-id"); // Unique ID for this webhook
  const svix_timestamp = headerPayload.get("svix-timestamp"); // When it was sent
  const svix_signature = headerPayload.get("svix-signature"); // Security signature

  // Check if all required security headers are present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing Svix headers", {
      status: 400, // Bad Request
    });
  }

  // Get the data sent in the request body
  const payload = await req.json();
  // Convert it to a string format
  const body = JSON.stringify(payload);

  // This will hold our verified webhook event
  let evt: WebhookEvent;

  // Verify the webhook is genuine
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    // If verification fails, log it and return an error
    console.error("Error: Could not verify webhook:", err);
    return new Response("Error: Verification error", {
      status: 400, // Bad Request
    });
  }

  // Get the type of event (like "user.created")
  const eventType = evt.type;

  // Process the event
  try {
    switch (eventType) {
      // Handle both user creation and updates
      case "user.created":
      case "user.updated": {
        // Get the user data from the event
        const userData = evt.data as {
          id: string;
          first_name?: string;
          last_name?: string;
          email_addresses: { email_address: string }[];
          image_url?: string;
        };

        // Create a full name, use "Unnamed User" if no name provided
        const name =
          `${userData.first_name || ""} ${userData.last_name || ""}`.trim() ||
          "Unnamed User";
        // Get the first email address
        const email = userData.email_addresses[0]?.email_address;

        // Make sure we have an email
        if (!email) {
          throw new Error("No email address provided in webhook data");
        }

        if (eventType === "user.created") {
          // If it's a new user, create a new record in our database
          await User.create({
            _id: userData.id,
            name,
            email,
            image: userData.image_url,
          });
        } else {
          // If it's an update, modify the existing user
          await User.updateOne(
            { _id: userData.id }, // Find user by ID
            {
              $set: { // Update these fields
                name,
                email,
                image: userData.image_url,
              },
            }
          );
        }
        break;
      }

      // Handle user deletion
      case "user.deleted": {
        // Get the deleted user's ID
        const deletedData = evt.data as { id: string };
        // Remove the user from our database
        await User.deleteOne({ _id: deletedData.id });
        break;
      }

      // If we get an event type we don't handle
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    // Success! Send back a positive response
    return new Response(`Webhook processed: ${eventType}`, {
      status: 200, // OK
    });
  } catch (error) {
    // If anything goes wrong during processing
    console.error(`Error processing ${eventType} event:`, error);
    return new Response(`Error processing webhook: ${eventType}`, {
      status: 500, // Server Error
    });
  }
}
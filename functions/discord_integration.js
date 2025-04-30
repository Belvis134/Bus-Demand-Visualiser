const crypto = require('crypto');

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

function verifyDiscordRequest(signature, timestamp, body) {
  try {
    // For verification, the raw body must not be altered.
    const isVerified = crypto.verify(
      null,
      Buffer.from(timestamp + body),
      {
        key: Buffer.from(DISCORD_PUBLIC_KEY, 'hex'),
        format: 'der',
        type: 'spki'
      },
      Buffer.from(signature, 'hex')
    );
    return isVerified;
  } catch (error) {
    console.error("Verification failed:", error);
    return false;
  }
}

exports.handler = async (event, context) => {
  // Use the raw body directly.
  const rawBody = event.body;
  const signature = event.headers['x-signature-ed25519'];
  const timestamp = event.headers['x-signature-timestamp'];

  // Verify that this is coming from Discord.
  if (!verifyDiscordRequest(signature, timestamp, rawBody)) {
    return {
      statusCode: 401,
      body: 'Invalid request signature'
    };
  }

  // Parse JSON
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch(err) {
    return { statusCode: 400, body: 'Bad request' };
  }

  // Handle Ping (Type 1) – Discord sends this initially for verification.
  if (payload.type === 1) {
    return {
      statusCode: 200,
      body: JSON.stringify({ type: 1 })
    };
  }

  // Future endpoints (like handling /heatmap command) would go here.
  // Example for a deferred response if the command processing takes longer:
  if (payload.type === 2) {
    // Immediately respond with a deferred response (Type 5)
    // and process the command asynchronously.
    setTimeout(() => {
      // Process the heatmap command and use Discord's follow-up endpoint
      // to send the final image back. This part is executed after the response.
      // You can't delay the initial response beyond Discord's 3-second window.
      console.log("Processing heatmap command...");
    }, 0);

    return {
      statusCode: 200,
      body: JSON.stringify({ type: 5 })
    };
  }

  // If none of the above match, return an error.
  return {
    statusCode: 400,
    body: 'Unknown interaction type'
  };
};
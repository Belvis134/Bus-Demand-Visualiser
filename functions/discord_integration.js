const nacl = require('tweetnacl');

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;

function verifyDiscordRequest(signature, timestamp, body) {
  try {
    const message = Buffer.from(timestamp + body);
    const signatureBuffer = Buffer.from(signature, 'hex');
    const publicKeyBuffer = Buffer.from(DISCORD_PUBLIC_KEY, 'hex');
    const isVerified = nacl.sign.detached.verify(
      message,
      signatureBuffer,
      publicKeyBuffer
    );
    return isVerified;
  } catch (error) {
    console.error("Verification failed:", error);
    return false;
  }
}

exports.handler = async (event, context) => {
  const isInternalCall = event.headers['x-internal-call'] === 'true';
  const rawBody = event.body;
  // If not an internal call, perform signature verification.
  if (!isInternalCall) {
    // For external calls, read the required headers
    const signature = event.headers['x-signature-ed25519'];
    const timestamp = event.headers['x-signature-timestamp'];
    
    // Verify the request signature only on external calls.
    if (!verifyDiscordRequest(signature, timestamp, rawBody)) {
      return { statusCode: 401, body: 'Invalid request signature' };
    }
  } else {
    console.log("Internal call detected; skipping signature verification.");
  }

  // Parse JSON
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return { statusCode: 400, body: 'Bad request' };
  }

  // Handle Ping (Type 1) – Discord sends this initially for verification.
  if (payload.type === 1) {
    return { statusCode: 200, body: JSON.stringify({ type: 1 }) };
  }

  if (payload.type === 2) {
    // Immediately send a deferred response (Type 5)
    const deferredResponse = { type: 5 };

    // Fire-and-forget our async command processing:
    (async () => {
      try {
        // 1. Start a new session to run your R Shiny app command (specific to your internal logic)
        const heatmapData = await processHeatmapCommand(payload.data.options);
        
        // 2. Once the heatmap is ready, send a follow-up POST to Discord
        await sendDiscordFollowup(payload.token, heatmapData);
        console.log("Heatmap processing complete and follow-up sent.");
      } catch (error) {
        console.error("Error processing heatmap command:", error);
        // Optionally, send an error follow-up notification to Discord.
      }
    })();

    return { statusCode: 200, body: JSON.stringify(deferredResponse) };
  }

  // If none of the above match, return an error.
  return {
    statusCode: 400,
    body: 'Unknown interaction type'
  };
};
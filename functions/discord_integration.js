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
  const rawBody = event.body;
  const isInternalCall = event.headers['x-internal-call'] === 'true';
  
  if (!isInternalCall) {
    const signature = event.headers['x-signature-ed25519'];
    const timestamp = event.headers['x-signature-timestamp'];
    if (!verifyDiscordRequest(signature, timestamp, rawBody)) {
      return { statusCode: 401, body: 'Invalid request signature' };
    }
  } else {
    console.log("Internal call detected; skipping signature verification.");
  }
  
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return { statusCode: 400, body: 'Bad request' };
  }
  
  if (isInternalCall) {
    // Handle the internal call payload (session_data) here.
    // For example, forward the request to your R app, process Datamall access, etc.
    try {
      const heatmap_data = await processInternalHeatmapCommand(payload /* or whatever structure session_data is */);
      // Optionally, return a response that your internal caller expects.
      return { statusCode: 200, body: JSON.stringify({ image_url: heatmap_data.image_url }) };
    } catch (error) {
      console.error("Internal processing error:", error);
      return { statusCode: 500, body: 'Internal processing error' };
    }
  }
  
  // The following still handles Discord interactions.
  if (payload.type === 1) {
    return { statusCode: 200, body: JSON.stringify({ type: 1 }) };
  }
  
  if (payload.type === 2) {
    const deferred_response = { type: 5 };
    (async () => {
      try {
        const heatmapData = await processHeatmapCommand(payload.data.options);
        await sendDiscordFollowup(payload.token, heatmapData);
        console.log("Heatmap processing complete and follow-up sent.");
      } catch (error) {
        console.error("Error processing heatmap command:", error);
      }
    })();
    return { statusCode: 200, body: JSON.stringify(deferred_response) };
  }
  
  return { statusCode: 400, body: 'Unknown interaction type' };
};
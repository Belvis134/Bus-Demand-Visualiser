// ---Receiving Discord data---

let last_data = null;
function pollForData() {
  const storage_url = "https://stc-brdv.fly.dev/discord-data-in";

  fetch(storage_url)
    .then(response => {
      if (!response.ok) {
        throw new Error("Failed to fetch incoming Discord data from Netlify.");
      }
      return response.json();
    })
    .then(inbound_discord_data => {
      // Only log and process if inbound_discord_data is new or not empty
      if (inbound_discord_data && JSON.stringify(inbound_discord_data) !== JSON.stringify(last_data)) {
        console.log("New CSV data received:", inbound_discord_data);
        last_data = inbound_discord_data; // update the last_data variable
        // Send data to BRDV
        Shiny.setInputValue("discord_data", inbound_discord_data );
      }
    })
    .catch(error => {
      console.error("Error fetching data from Netlify:", error);
    });
}

// Ping for data every 3 seconds
setInterval(pollForData, 3000);

// ---Sending image data---

Shiny.addCustomMessageHandler("send_image", function(image_data) {
  // Get the user ID from the inbound Discord data defined above.
  let user_id = last_data.user_id;
  // Post to the /heatmap endpoint.
  fetch("https://stc-brdv.fly.dev/data/heatmap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user_id: user_id,
      image: image_data.src,
      width: image_data.width,
      height: image_data.height,
      alt: image_data.alt
    })
  })
  .then(response => response.json())
  .then(data => {
    if(data.status === "success"){
      console.log("Heatmap image uploaded. Returned URL:", data.url);
    } else {
      console.error("Error from /heatmap server:", data.message);
    }
  })
  .catch(error => {
    console.error("Error uploading heatmap image:", error);
  });
});
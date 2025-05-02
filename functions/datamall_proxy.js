exports.handler = async function (event, context) {
  // Dependencies
  const fetch = require('node-fetch');

  // Handle preflight OPTIONS request for CORS  
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",  // Alternatively, restrict to your specific origin
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      },
      body: ""
    };
  }

  // Extract query parameters sent from the client
  const { date, account_key } = event.queryStringParameters;
  const AccountKey = account_key

  // Construct the Datamall JSON API URL
  const datamall_url = `https://datamall2.mytransport.sg/ltaodataservice/PV/ODBus?Date=${date}`;
  console.log("Datamall URL:", datamall_url);
  console.log("Using AccountKey:", AccountKey);

  try {
    // --- Step 1: Fetch JSON data from Datamall ---
    const response = await fetch(datamall_url, {
      method: "GET",
      headers: {
        'AccountKey': AccountKey,
        'accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error_text = await response.text();
      let error_json = null;
      try{
        error_json = JSON.parse(error_text)
      } catch (e) {}
      if (response.status === 404) {
        if (error_text.trim() === "The requested API was not found") {
          return {
            statusCode: 404,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Invalid account key... Huh?!" })
          };
        } 
        else if (error_text.trim() === "") {
          return {
            statusCode: 404,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "No data found for the given date. Is your provided date within the last 3 months?" })
          };
        }
      } else if (error_json && error_json.fault) {
          return {
            statusCode: 429,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "You have reached the rate limit. Try again after a while." })
          };
      }
    }

    // --- Step 2: Parse JSON data ---
    const json_data = await response.json();

    // --- Step 3: Extract the CSV link from the JSON ---
    const link = json_data.value[0].Link;
    console.log("Extracted CSV link:", link);

    // --- Step 4: Return the CSV link and extracts ZIP buffer, encoding it ---
    const link_response = await fetch(link);
    if (!link_response.ok) {
      return {
        statusCode: link_response.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Failed to fetch the ZIP file from S3." })
      };
    }
    // Read the ZIP file as an ArrayBuffer.
    const zip_buffer = await link_response.buffer();
    // Convert the ArrayBuffer to a Base64-encoded string.
    const zip_base64 = zip_buffer.toString("base64");

    // --- Step 5: Return the encoded ZIP buffer base64 string in a JSON response ---
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ zip_base64: zip_base64 })
    };
  } catch (error) {
    console.error('Error in datamall_proxy:', error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
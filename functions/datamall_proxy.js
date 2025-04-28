const fetch = require('node-fetch');
// Unzipping is required
const unzip = require('adm-zip');

exports.handler = async function (event, context) {
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
  const { year, month, account_key } = event.queryStringParameters;
  
  // Use provided account key or fall back to an environment variable
  const AccountKey = account_key ? account_key : process.env.ACCOUNT_KEY;

  // Construct the Date parameter: for example, "202503"  
  const date = `${year}${month}`;

  // Construct the Datamall JSON API URL
  const datamall_url = `https://datamall2.mytransport.sg/ltaodataservice/PV/ODBus?Date=${date}`;

  try {
    // --- Step 1: Fetch JSON data from Datamall ---
    const json_response = await fetch(datamall_url, {
      method: "GET",
      headers: {
        'AccountKey': AccountKey,
        'accept': 'application/json'
      }
    });

    if (!json_response.ok) {
      return {
        statusCode: json_response.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: `Failed fetching JSON from Datamall. Status: ${json_response.status}` })
      };
    }

    const json_data = await json_response.json();

    // --- Step 2: Extract the CSV link from the JSON ---
    const link = (json_data.value && json_data.value[0] && json_data.value[0].Link) || null;
    if (!link) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "CSV link not found. Possibly rate limited." })
      };
    }

    // --- Step 3: Fetch the CSV (or ZIP file containing CSV) from the link ---
    const csv_response = await fetch(link);
    if (!csv_response.ok) {
      return {
        statusCode: csv_response.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Failed to fetch CSV file from Datamall." })
      };
    }

    // Link returns a ZIP file, needs unzipping.
    const buffer = await csv_response.buffer();
    const zip = new unzip(buffer);
    const zip_entries = zip.getEntries();
    if(zip_entries.length === 0) {
      throw new Error("No entries in ZIP file");
    }
    const csv_text = zip_entries[0].getData().toString('utf8');
    
    // --- Step 4: Return the CSV text with proper CORS headers ---
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",  // Adjust if you want to restrict to specific origins.
        "Content-Type": "text/plain"
      },
      body: csv_text
    };

  } catch (error) {
    console.error('Error in datamall_csv_proxy:', error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: error.message })
    };
  }
};
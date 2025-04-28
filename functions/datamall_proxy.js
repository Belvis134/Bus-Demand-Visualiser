exports.handler = async function(event, context) {
  // Handle preflight OPTIONS request for CORS.
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",            // Or restrict this to your specific origin if you prefer.
        "Access-Control-Allow-Headers": "Content-Type",  // Add other headers if needed.
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      },
      body: ""
    };
  }
  
  // Destructure query parameters
  const { year, month, account_key } = event.queryStringParameters;
  
  // Use the provided account_key if available; otherwise, fall back to an environment variable.
  const AccountKey = account_key ? account_key : process.env.ACCOUNT_KEY;
  
  // Construct the Datamall API URL.
  const apiUrl = `https://datamall2.mytransport.sg/ltaodataservice/PV/ODBus?Date=${year}${month}`;
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'AccountKey': AccountKey,
        'accept': 'application/json'
      }
    });
  
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        body: JSON.stringify({ error: `HTTP error! Status: ${response.status}` })
      };
    }
  
    const data = await response.json();
  
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',  // Ensure the CORS header is present.
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      headers: { 
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ error: error.message })
    };
  }
};
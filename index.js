const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const steamApiKey = event.queryStringParameters.apiKey; // Pass from frontend
  const steamAccountId = event.queryStringParameters.steamid; // Pass from frontend

  if (!steamApiKey || !steamAccountId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing API key or Steam ID." }),
    };
  }

  const steamUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamApiKey}&steamid=${steamAccountId}&include_appinfo=true&include_played_free_games=true&format=json`;

  try {
    const response = await fetch(steamUrl);
    const data = await response.json();

    // Set CORS headers for your Angular app's origin
    const headers = {
      'Access-Control-Allow-Origin': 'https://natanmaia95.github.io', // Or '*' for public access
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS' // Add OPTIONS for preflight requests
    };

    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Error fetching from Steam API:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to fetch games from Steam API." }),
    };
  }
};
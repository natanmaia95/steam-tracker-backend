// vibe coded because whatever man
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch'; // For making HTTP requests in Node.js
import 'dotenv/config'; // Loads .env file (for PORT and ALLOWED_ORIGINS)

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configure CORS for your Angular app ---
// Safely parse allowed origins from environment variable
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const allowedOrigins = allowedOriginsEnv ? allowedOriginsEnv.split(',') : [];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl requests, or same-origin)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'OPTIONS'], // Steam API is GET; OPTIONS for CORS preflight
  allowedHeaders: ['Content-Type'], // Only allow necessary headers
  credentials: false // No cookies/auth headers expected for this simple proxy
};

app.use(cors(corsOptions));
// --- End CORS configuration ---

// Middleware to parse JSON bodies (if you were expecting POST requests with JSON)
app.use(express.json());


// Define the endpoint for proxying Steam's GetOwnedGames API
// Your Angular app will call: GET https://steamtracker.yourdomain.com/steam-proxy/ownedgames?apiKey=...&accountId=...
app.get('/steam-proxy/ownedgames', async (req, res) => {
  const steamApiKey = req.query.apiKey; // Get apiKey from query parameters
  const steamAccountId = req.query.accountId; // Get accountId from query parameters

  // Additional parameters you might want to forward to Steam API
  const includeAppinfo = req.query.include_appinfo || 'true'; // Default to true if not provided
  const includePlayedFreeGames = req.query.include_played_free_games || 'true'; // Default to true
  const format = req.query.format || 'json'; // Default to json

  if (!steamApiKey || !steamAccountId) {
    return res.status(400).json({ message: "Missing API key or Steam ID in request." });
  }

  const steamUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/` +
                   `?key=${steamApiKey}` +
                   `&steamid=${steamAccountId}` +
                   `&include_appinfo=${includeAppinfo}` +
                   `&include_played_free_games=${includePlayedFreeGames}` +
                   `&format=${format}`;

  console.log(`Proxying request to Steam API: ${steamUrl}`); // Log the actual URL being called

  try {
    const steamResponse = await fetch(steamUrl);

    // If Steam API returns a non-2xx status, forward that status and response
    if (!steamResponse.ok) {
      const errorData = await steamResponse.text(); // Get raw error response
      console.error(`Steam API returned non-OK status: ${steamResponse.status}`, errorData);
      return res.status(steamResponse.status).send(errorData); // Forward the exact status and body
    }

    const data = await steamResponse.json();
    return res.status(200).json(data); // Send the successful JSON data back to the Angular app
  } catch (error) {
    console.error("Error fetching from Steam API:", error);
    return res.status(500).json({ message: "Failed to fetch games from Steam API via proxy.", error: error.message });
  }
});

// Basic root route for testing if the server is running
app.get('/', (req, res) => {
  res.send('Steam Tracker Backend Proxy is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express proxy server listening on port ${PORT}`);
});
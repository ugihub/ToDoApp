require("dotenv").config();
const express = require("express");
const { OAuth2Client } = require("google-auth-library");

const app = express();
app.use(express.json());

// Konfigurasi Google OAuth2
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
  console.error("Error: Missing required environment variables.");
  process.exit(1);
}

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

module.exports = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Untuk mendapatkan refresh token
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.redirect(authUrl);
};
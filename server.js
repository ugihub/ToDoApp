require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");
const path = require("path");

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

// Middleware untuk menyajikan file statis (CSS, JS, gambar, dll.)
app.use(express.static(path.join(__dirname)));

// Route untuk halaman awal (/)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Endpoint untuk mengarahkan pengguna ke halaman otorisasi Google
app.get("/api/auth-google", (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline", // Untuk mendapatkan refresh token
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
  res.redirect(authUrl);
});

// Endpoint untuk menangani callback otorisasi Google
app.get("/api/oauth2callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Authorization code is missing.");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user profile info
    const userInfo = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const profileInfo = {
      name: userInfo.data.name,
      email: userInfo.data.email,
      picture: userInfo.data.picture,
    };

    // Save profile info to localStorage (simulated here)
    res.send(`
      <script>
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("profileInfo", JSON.stringify(${JSON.stringify(profileInfo)}));
        window.location.href = "/";
      </script>
    `);
  } catch (error) {
    console.error("Error retrieving user info:", error.response?.data || error.message);
    res.status(500).send("Gagal otorisasi.");
  }
});

// Middleware untuk memastikan token akses valid
async function ensureAccessToken() {
  if (!oauth2Client.credentials.access_token || oauth2Client.isTokenExpiring()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(credentials);
      console.log("Access token diperbarui:", credentials.access_token);
    } catch (error) {
      console.error("Error refreshing access token:", error.response?.data || error.message);
      throw new Error("Gagal memperbarui token akses.");
    }
  }
}

// Endpoint untuk menambahkan acara ke Google Calendar
app.post("/api/add-event", async (req, res) => {
  const { summary, description, startDate, endDate } = req.body;

  if (!summary || !description || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: "Data acara tidak lengkap." });
  }

  try {
    await ensureAccessToken();

    const response = await axios.post(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        summary,
        description,
        start: { dateTime: startDate },
        end: { dateTime: endDate },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 3 * 24 * 60 }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
        },
      }
    );

    res.json({ success: true, eventId: response.data.id });
  } catch (error) {
    console.error("Error adding event to Google Calendar:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Gagal menambahkan acara." });
  }
});

// Endpoint untuk menghapus acara dari Google Calendar
app.post("/api/delete-event", async (req, res) => {
  const { eventId } = req.body;

  if (!eventId) {
    return res.status(400).json({ success: false, message: "Event ID tidak ditemukan." });
  }

  try {
    await ensureAccessToken();

    await axios.delete(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${oauth2Client.credentials.access_token}`,
        },
      }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting event from Google Calendar:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Gagal menghapus acara." });
  }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
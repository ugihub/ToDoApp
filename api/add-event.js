const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    console.error("Error: Missing required environment variables.");
    process.exit(1);
}

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Fungsi untuk memastikan access token valid
async function ensureAccessToken() {
    if (!oauth2Client.credentials.access_token || oauth2Client.isTokenExpiring()) {
        try {
            if (!oauth2Client.credentials.refresh_token) {
                throw new Error("Refresh token tidak ditemukan.");
            }

            console.log("Refreshing access token...");
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);

            console.log("Access token diperbarui:", credentials.access_token);

            // Perbarui token di variabel global
            global.tokens = credentials;
            console.log("Tokens updated in memory:", global.tokens);
        } catch (error) {
            console.error("Error refreshing access token:", error.response?.data || error.message);
            throw new Error("Gagal memperbarui token akses.");
        }
    }
}

module.exports = async (req, res) => {
    const { summary, description, startDate, endDate } = req.body;

    // Validasi input
    if (!summary || !description || !startDate || !endDate) {
        return res.status(400).json({
            success: false,
            message: "Data acara tidak lengkap.",
        });
    }

    // Validasi format tanggal
    const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (!isoDateRegex.test(startDate) || !isoDateRegex.test(endDate)) {
        return res.status(400).json({
            success: false,
            message: "Format tanggal tidak valid. Gunakan format ISO 8601 (YYYY-MM-DDTHH:mm:ss).",
        });
    }

    try {
        // Pastikan token diatur di oauth2Client
        if (!global.tokens.access_token) {
            throw new Error("Access token tidak ditemukan. Silakan otentikasi ulang.");
        }

        oauth2Client.setCredentials(global.tokens);
        console.log("Current tokens:", oauth2Client.credentials);

        // Pastikan access token valid
        await ensureAccessToken();

        // Tambahkan acara ke Google Calendar
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
        res.status(500).json({
            success: false,
            message: "Gagal menambahkan acara.",
            details: error.response?.data || error.message,
        });
    }
};

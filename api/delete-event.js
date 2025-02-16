const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");

// Load environment variables
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    console.error("Error: Missing required environment variables.");
    process.exit(1);
}

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

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

module.exports = async (req, res) => {
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
};
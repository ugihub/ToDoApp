const axios = require("axios");
const { OAuth2Client } = require("google-auth-library");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

module.exports = async (req, res) => {
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

        console.log("User profile info:", profileInfo);

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
        console.error("Error details:", error);

        res.status(500).send("Gagal otorisasi.");
    }
};

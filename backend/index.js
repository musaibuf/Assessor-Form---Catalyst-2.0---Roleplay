const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows the frontend to talk to this backend from a different URL
app.use(express.json());

// --- Google Sheets Auth ---
let auth;
if (process.env.GOOGLE_CREDENTIALS) {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
    auth = new google.auth.GoogleAuth({
        credentials,
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
} else {
    auth = new google.auth.GoogleAuth({
        keyFile: "secret.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
}

// --- Routes ---
app.get('/', (req, res) => {
    res.send('Catalyst Assessor API is Running');
});

app.post('/api/submit', async (req, res) => {
    const { participant, scores, comments } = req.body;

    try {
        const client = await auth.getClient();
        const googleSheets = google.sheets({ version: 'v4', auth: client });
        const spreadsheetId = process.env.SPREADSHEET_ID;

        const rowData = [
            participant.name,
            participant.cnic,
            participant.dealership,
            participant.region,
            scores["Problem Solving"] || "",
            scores["Asking the Right Questions"] || "",
            scores["Listening Skills"] || "",
            scores["Decision-Making Skills"] || "",
            scores["Strategic Sales & Marketing Approach"] || "",
            scores["Social Media"] || "",
            comments.cognitive || "",
            scores["Communication Skills"] || "",
            scores["Building a Positive Environment"] || "",
            scores["Organization Skills & Team Management"] || "",
            comments.interpersonal || ""
        ];

        await googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range: "Sheet1!A:O",
            valueInputOption: "USER_ENTERED",
            resource: { values: [rowData] },
        });

        res.status(200).json({ message: "Saved successfully" });
    } catch (error) {
        console.error("Error saving to Google Sheets:", error);
        res.status(500).json({ message: "Failed to save data", error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Validate environment variables
if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
    console.error("Missing required environment variables.");
    process.exit(1); // Exit the server if API credentials are missing
}

app.post('/api/generate-hobby', async (req, res) => {
    const { hobbyType, skillLevel, goal } = req.body;

    if (!hobbyType || !skillLevel || !goal) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const prompt = `Suggest a hobby activity related to ${hobbyType} for someone with a ${skillLevel} skill level who wants to achieve ${goal}. The activity should take 15-30 minutes.`;

    try {
        const response = await axios.post(
            `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}/completions?api-version=2023-07-01-preview`,
            {
                prompt,
                max_tokens: 100,
                temperature: 0.7
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.AZURE_OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const suggestion = response.data.choices?.[0]?.text?.trim();
        res.json({ suggestion: suggestion || "No suggestion generated." });
    } catch (error) {
        console.error('Error generating hobby suggestion:', error.response?.data || error.message);
        res.status(500).json({ error: 'Error generating suggestion' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
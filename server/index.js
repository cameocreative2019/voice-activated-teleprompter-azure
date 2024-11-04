import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(bodyParser.json());

// Debug middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/api/get-speech-token', async (req, res) => {
  console.log('Token request received');
  console.log('Environment:', {
    key: process.env.AZURE_SPEECH_KEY ? 'Present' : 'Missing',
    region: process.env.AZURE_SPEECH_REGION
  });

  const speechKey = process.env.AZURE_SPEECH_KEY;
  const speechRegion = process.env.AZURE_SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    console.error('Missing credentials');
    return res.status(500).json({
      error: 'Speech key or region not configured'
    });
  }

  try {
    const response = await axios.post(
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      null,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': speechKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('Token retrieved successfully');
    res.json({
      token: response.data,
      region: speechRegion
    });
  } catch (error) {
    console.error('Token error:', error.response ? error.response.data : error);
    res.status(500).json({
      error: 'Failed to retrieve token',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment loaded:', {
    port: PORT,
    hasKey: !!process.env.AZURE_SPEECH_KEY,
    region: process.env.AZURE_SPEECH_REGION
  });
});
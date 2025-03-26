import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const MPESA_BASE_URL = 'https://sandbox.safaricom.co.ke';
const CONSUMER_KEY = process.env.VITE_MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.VITE_MPESA_CONSUMER_SECRET;

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.error('Missing required environment variables:');
  if (!CONSUMER_KEY) console.error('- VITE_MPESA_CONSUMER_KEY');
  if (!CONSUMER_SECRET) console.error('- VITE_MPESA_CONSUMER_SECRET');
  process.exit(1);
}

// Helper function to get M-Pesa access token
async function getMpesaAccessToken() {
  const auth = Buffer.from(
    `${CONSUMER_KEY}:${CONSUMER_SECRET}`
  ).toString('base64');

  try {
    console.log('Getting M-Pesa access token...');
    const response = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      params: {
        grant_type: 'client_credentials'
      }
    });
    console.log('Access token response:', response.data);
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting access token:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      error: error.message
    });
    throw error;
  }
}

// Proxy endpoint for getting access token
app.get('/api/mpesa/token', async (req, res) => {
  try {
    const token = await getMpesaAccessToken();
    res.json({ access_token: token });
  } catch (error) {
    console.error('Token endpoint error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to get access token', details: error.response?.data });
  }
});

// Proxy endpoint for STK push
app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    console.log('STK Push request body:', req.body);
    const token = await getMpesaAccessToken();
    
    console.log('Making STK push request...');
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('STK Push response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('STK push error:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      error: error.message,
      request: error.config
    });
    res.status(500).json({ 
      error: 'Failed to initiate payment',
      details: error.response?.data || error.message
    });
  }
});

// Proxy endpoint for checking transaction status
app.post('/api/mpesa/status', async (req, res) => {
  try {
    console.log('Status check request body:', req.body);
    const token = await getMpesaAccessToken();
    
    if (!req.body.CheckoutRequestID || !req.body.BusinessShortCode || !req.body.Password || !req.body.Timestamp) {
      console.error('Missing required fields in status check request:', req.body);
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'CheckoutRequestID, BusinessShortCode, Password, and Timestamp are required'
      });
    }
    
    console.log('Making status check request...');
    const response = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      req.body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Status check response:', response.data);

    // If we get a response but no ResultCode, treat it as pending
    if (response.data && !response.data.ResultCode) {
      return res.json({
        ResultCode: "1",
        ResultDesc: "Transaction is being processed",
        ...response.data
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Status check error:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      error: error.message,
      request: error.config
    });
    res.status(500).json({ 
      error: 'Failed to check transaction status',
      details: error.response?.data || error.message
    });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', {
    MPESA_BASE_URL,
    CONSUMER_KEY: CONSUMER_KEY ? '***' : undefined,
    CONSUMER_SECRET: CONSUMER_SECRET ? '***' : undefined,
    PORT
  });
});

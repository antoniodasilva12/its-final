import axios from 'axios';

// M-Pesa API endpoints (via our proxy)
const API_ENDPOINTS = {
  OAUTH_TOKEN: 'http://localhost:5001/api/mpesa/token',
  STK_PUSH: 'http://localhost:5001/api/mpesa/stkpush',
  QUERY_STATUS: 'http://localhost:5001/api/mpesa/status'
};

interface STKPushRequest {
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
}

interface STKPushResponse {
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CustomerMessage: string;
}

interface TransactionStatus {
  ResultCode: string;
  ResultDesc: string;
  [key: string]: any;
}

class MpesaService {
  private passKey: string;
  private shortCode: string;

  constructor() {
    // Access environment variables directly
    const shortCode = '174379';
    const passKey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

    if (!passKey || !shortCode) {
      const missing = [];
      if (!passKey) missing.push('VITE_PASSKEY');
      if (!shortCode) missing.push('VITE_SHORTCODE');
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    this.passKey = passKey;
    this.shortCode = shortCode;
  }

  private getTimestamp(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}${hour}${minutes}${seconds}`;
  }

  private generatePassword(timestamp: string): string {
    const str = this.shortCode + this.passKey + timestamp;
    return btoa(str);
  }

  public async initiateSTKPush({
    amount,
    phoneNumber,
    accountReference,
    transactionDesc
  }: STKPushRequest): Promise<STKPushResponse> {
    try {
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);

      // Clean up special characters from strings
      const cleanAccountRef = accountReference.replace(/[^\w\s-]/g, '');
      const cleanTransDesc = transactionDesc.replace(/[^\w\s-]/g, '');

      console.log('Initiating STK push with:', {
        shortCode: this.shortCode,
        timestamp,
        amount,
        phoneNumber,
        accountReference: cleanAccountRef,
        transactionDesc: cleanTransDesc,
        password: password // Log password for debugging
      });

      // First try to get a token to ensure authentication is working
      let accessToken;
      try {
        const tokenResponse = await axios.get(API_ENDPOINTS.OAUTH_TOKEN);
        console.log('Token response:', tokenResponse.data);
        accessToken = tokenResponse.data.access_token;
      } catch (tokenError: any) {
        console.error('Failed to get token:', {
          response: tokenError.response?.data,
          status: tokenError.response?.status,
          message: tokenError.message
        });
        throw new Error('Failed to authenticate with M-Pesa');
      }

      // Now try the STK push with the token in headers
      const stkPayload = {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phoneNumber,
        PartyB: this.shortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: 'https://example.com/callback',
        AccountReference: 'Instant Odds',
        TransactionDesc: 'Get accurate odds instantly'
      };

      console.log('STK push payload:', stkPayload);

      const response = await axios.post(API_ENDPOINTS.STK_PUSH, stkPayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('STK push response:', response.data);

      if (!response.data || !response.data.CheckoutRequestID) {
        console.error('Invalid STK push response:', response.data);
        throw new Error('Invalid response from M-Pesa');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error initiating STK push:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status,
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      if (error.response?.status === 500) {
        throw new Error('M-Pesa service is currently experiencing issues. Please try again later.');
      } else if (error.response?.status === 400) {
        throw new Error('Invalid request to M-Pesa. Please check your phone number and try again.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed with M-Pesa. Please try again.');
      }
      
      throw new Error('Failed to initiate M-Pesa payment: ' + (error.response?.data?.message || error.message));
    }
  }

  public async queryTransactionStatus(checkoutRequestID: string): Promise<TransactionStatus> {
    try {
      const timestamp = this.getTimestamp();
      const password = this.generatePassword(timestamp);

      console.log('Querying transaction status:', {
        shortCode: this.shortCode,
        checkoutRequestID,
        timestamp
      });

      const response = await axios.post(API_ENDPOINTS.QUERY_STATUS, {
        BusinessShortCode: this.shortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestID
      });

      console.log('Status query response:', response.data);

      // Handle case where response doesn't have ResultCode
      if (!response.data.ResultCode) {
        return {
          ResultCode: "1",
          ResultDesc: "Transaction is being processed"
        };
      }

      return response.data;
    } catch (error: any) {
      console.error('Error querying transaction status:', {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      throw new Error('Failed to query transaction status');
    }
  }

  public async waitForPayment(checkoutRequestID: string, maxAttempts = 30): Promise<TransactionStatus> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const status = await this.queryTransactionStatus(checkoutRequestID);
        
        // Check if payment is completed
        if (status.ResultCode === '0') {
          return status; // Payment successful
        }
        
        // If payment failed with a final status
        if (status.ResultCode === '1032') { // Transaction cancelled by user
          throw new Error('Transaction cancelled by user');
        }

        // For any other result code, wait and try again
        console.log(`Payment status (attempt ${attempts + 1}/${maxAttempts}):`, status);
        
        // Wait for 5 seconds before next attempt
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error(`Error checking payment status (attempt ${attempts + 1}/${maxAttempts}):`, error);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }
    
    throw new Error('Payment timeout: Please check your M-Pesa app for the status');
  }
}

export const mpesaService = new MpesaService();

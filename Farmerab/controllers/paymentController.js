const axios = require('axios');
const Order = require("../models/Order.js")

const verifyPayment = async (req, res) => {
  try {
    const { reference, provider } = req.body;

    let verificationResponse;

    switch (provider) {
      case 'paystack':
        verificationResponse = await verifyPaystackPayment(reference);
        break;
      case 'flutterwave':
        verificationResponse = await verifyFlutterwavePayment(reference);
        break;
      default:
        return res.status(400).json({ error: 'Invalid payment provider' });
    }

    if (verificationResponse.success) {
        // const order = Order.isPaid = true;
      // Update order status in your database
    //   const Order = await Order.findOneAndUpdate({ ... })
      
      return res.json({ 
        success: true, 
        message: 'Payment verified successfully',
        data: verificationResponse.data
      });
    }

    res.status(400).json({ 
      success: false, 
      message: 'Payment verification failed' 
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error verifying payment' 
    });
  }
};

// Paystack verification
const verifyPaystackPayment = async (reference) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    return {
      success: response.data.status === 'success',
      data: response.data.data
    };
  } catch (error) {
    throw new Error('Paystack verification failed');
  }
};

// Flutterwave verification
const verifyFlutterwavePayment = async (reference) => {
  try {
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/${reference}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
        }
      }
    );

    return {
      success: response.data.status === 'successful',
      data: response.data.data
    };
  } catch (error) {
    throw new Error('Flutterwave verification failed');
  }
};

module.exports = {
  verifyPayment
};
const express = require('express');
const router = express.Router();
const { verifyPayment } = require('../controllers/paymentController.js');

router.post('/verifyPayment', verifyPayment);
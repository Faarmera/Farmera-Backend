const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/WebhookController');
const { validateWebhookSignature } = require('../middlewares/webhookValidation');

router.post('/flutterwave', 
  validateWebhookSignature('flutterwave'), 
  WebhookController.handleFlutterwaveWebhook
);

router.post('/paystack',
  validateWebhookSignature('paystack'),
  WebhookController.handlePaystackWebhook
);

router.post('/interswitch',
  validateWebhookSignature('interswitch'),
  WebhookController.handleInterswitchWebhook
);
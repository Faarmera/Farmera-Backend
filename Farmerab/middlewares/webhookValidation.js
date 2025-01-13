const validateWebhookSignature = (provider) => {
    return (req, res, next) => {
      try {
        let isValid = false;
        const signature = req.headers['x-webhook-signature'];
  
        switch (provider) {
          case 'flutterwave':
            isValid = validateFlutterwaveSignature(req.body, signature);
            break;
          case 'paystack':
            isValid = validatePaystackSignature(req.body, signature);
            break;
        case 'interswitch':
            isValid = validateInterswitchSignature(req.body, signature);
            break;
          // Add other providers...
        }
  
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
  
        next();
      } catch (error) {
        res.status(401).json({ error: 'Invalid webhook signature' });
      }
    };
  };
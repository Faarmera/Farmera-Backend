class SecurityService {
    validatePaymentRequest(data) {
      // Implement request validation
      const schema = Joi.object({
        amount: Joi.number().positive().required(),
        currency: Joi.string().length(3).default('NGN'),
        provider: Joi.string().valid('flutterwave', 'paystack', 'interswitch').required(),
        customerId: Joi.string().required(),
        // Add more validation rules
      });
  
      const { error } = schema.validate(data);
      if (error) {
        throw new ValidationError(error.details[0].message);
      }
    }
  
    async detectFraud(paymentData) {
      // Implement fraud detection rules
      const rules = [
        this.checkTransactionVelocity,
        this.checkAmountThreshold,
        this.checkGeolocation,
        // Add more rules
      ];
  
      for (const rule of rules) {
        const result = await rule(paymentData);
        if (!result.isValid) {
          throw new FraudDetectionError(result.reason);
        }
      }
    }
  
    async checkTransactionVelocity(paymentData) {
      const timeWindow = 1 * 60 * 60 * 1000; // 1 hour
      const maxTransactions = 10;
  
      const recentTransactions = await Payment.count({
        customerId: paymentData.customerId,
        createdAt: { $gte: new Date(Date.now() - timeWindow) }
      });
  
      return {
        isValid: recentTransactions < maxTransactions,
        reason: 'Transaction velocity exceeded'
      };
    }
  }
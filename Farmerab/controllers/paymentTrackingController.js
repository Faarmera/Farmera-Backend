class PaymentTrackingService {
    async trackPayment(paymentId) {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }
  
      // Implement retry mechanism with exponential backoff
      const maxAttempts = 5;
      const backoffDelay = 1000; // Start with 1 second
  
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await this.verifyPaymentStatus(payment);
          if (result.status === 'SUCCESS' || result.status === 'FAILED') {
            return result;
          }
  
          // Calculate next retry delay with exponential backoff
          const delay = backoffDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
          if (attempt === maxAttempts) {
            throw error;
          }
        }
      }
    }
  
    async verifyPaymentStatus(payment) {
      const provider = this.paymentProviders[payment.provider];
      const result = await provider.verifyPayment(payment.providerRef);
      
      await Payment.updateOne(
        { _id: payment._id },
        { 
          $set: { 
            status: result.status,
            lastVerificationAt: new Date(),
            completedAt: result.status === 'SUCCESS' ? new Date() : null
          },
          $inc: { verificationAttempts: 1 }
        }
      );
  
      return result;
    }
  }
  
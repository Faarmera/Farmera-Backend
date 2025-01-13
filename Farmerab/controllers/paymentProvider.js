// payment/providers/PaystackProvider.js
class PaystackProvider {
    constructor() {
      this.client = axios.create({
        baseURL: 'https://api.paystack.co',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    }
  
    async initializePayment(data) {
      try {
        const response = await this.client.post('/transaction/initialize', {
          amount: data.amount * 100, // Convert to kobo
          email: data.email,
          reference: data.transactionRef,
          callback_url: data.callback_url,
          metadata: data.metadata
        });
  
        return {
          authorizationUrl: response.data.data.authorization_url,
          providerRef: response.data.data.reference
        };
      } catch (error) {
        throw new PaymentProviderError('Paystack initialization failed', error);
      }
    }
  
    async verifyPayment(reference) {
      try {
        const response = await this.client.get(`/transaction/verify/${reference}`);
        const data = response.data.data;
  
        return {
          status: data.status === 'success' ? 'SUCCESS' : 'FAILED',
          amount: data.amount / 100,
          currency: data.currency,
          paymentMethod: data.channel,
          metadata: data.metadata
        };
      } catch (error) {
        throw new PaymentProviderError('Paystack verification failed', error);
      }
    }
  
    verifyWebhookSignature(payload, signature) {
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(payload))
        .digest('hex');
  
      return hash === signature;
    }
  }


// db.payments.createIndex({ transactionRef: 1, status: 1 });
// db.payments.createIndex({ customerId: 1, createdAt: -1 });


// curl https://api.paystack.co/transaction/initialize
// -H "Authorization: Bearer YOUR_SECRET_KEY"
// -H "Content-Type: application/json"
// -d '{ "email": "customer@email.com", 
//       "amount": "500000"
//     }'
// -X POST
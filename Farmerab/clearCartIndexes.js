const mongoose = require('mongoose');
require('dotenv').config();
const Cart = require ("../Farmerab/models/Cart.js")

const clearCartIndexes = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('Connected to MongoDB');

    // Drop all indexes from the carts collection
    await mongoose.connection.collection('carts').dropIndexes();
    console.log('Successfully dropped all cart indexes');

    // This will be done automatically when Mongoose starts, 
    // but you can force it:
    // await Cart.syncIndexes();

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error:', error);
  }
};

clearCartIndexes();
module.exports = clearCartIndexes
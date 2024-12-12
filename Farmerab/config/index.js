const mongoose = require("mongoose");
const {seedRoles} = require("../controllers/roleController.js")

const connectDB = async () => {
  try {
      const ApplicationDB = await mongoose.connect(process.env.DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${ApplicationDB.connection.host}`);
    await seedRoles()
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

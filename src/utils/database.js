const mongoose = require('mongoose');
const chalk = require('chalk');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(chalk.green.bold('✓ MongoDB Connected'));
    return conn;
  } catch (error) {
    console.error(chalk.red.bold('✗ MongoDB Connection Error:'), error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User';

dotenv.config();

const removeQAs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/reqwise');
    console.log('Connected to MongoDB');

    const result = await User.deleteMany({
      role: 'QA',
      email: { $regex: /^qa\d+@reqwise\.com$/i }
    });

    console.log(`Deleted ${result.deletedCount} QA accounts.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

removeQAs();

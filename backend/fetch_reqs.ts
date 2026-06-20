import mongoose from 'mongoose';
import { Requirement } from './src/models/Requirement';
import { AiValidationService } from './src/services/AiValidationService';
import dotenv from 'dotenv';
dotenv.config();

async function testQualityGate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/reqwise');
    const req = await Requirement.findOne();
    if (!req) {
        console.log('No requirements found.');
        process.exit(0);
    }
    console.log(`Evaluating requirement: ${req.title}`);
    const result = await AiValidationService.evaluateRequirementQuality(req._id);
    console.log('Evaluation Result:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testQualityGate();

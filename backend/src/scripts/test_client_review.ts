import { connectDB } from '../config/db';
import { Requirement } from '../models/Requirement';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function test() {
  await connectDB();
  const reqs = await Requirement.find({ status: 'CLIENT_REVIEW' });
  console.log(`Found ${reqs.length} requirements in CLIENT_REVIEW status`);
  for (const r of reqs) {
    console.log(`- ID: ${r._id}, Status: "${r.status}", Client: ${r.client}`);
  }
  process.exit(0);
}

test();

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    // 1. Login as client
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'client1@reqwise.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    
    // 2. Fetch requirements
    const reqsRes = await axios.get('http://localhost:5000/api/requirements', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const clientReviewReqs = reqsRes.data.requirements.filter((r: any) => r.status === 'CLIENT_REVIEW');
    console.log(`Found ${clientReviewReqs.length} reqs in CLIENT_REVIEW`);
    
    if (clientReviewReqs.length > 0) {
      const targetReq = clientReviewReqs[0];
      console.log(`Testing ACCEPT on req: ${targetReq._id}`);
      
      try {
        const decisionRes = await axios.post('http://localhost:5000/api/reviews/client/decision', {
          requirementId: targetReq._id,
          decision: 'ACCEPT'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Success:', decisionRes.data);
      } catch (e: any) {
        console.error('Error from server:', e.response?.data || e.message);
      }
    }
  } catch (error: any) {
    console.error('Test script failed:', error.response?.data || error.message);
  }
}

test();

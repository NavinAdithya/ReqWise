import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    // 1. Login as client6
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'client6@reqwise.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    // 2. Fetch requirements
    const reqsRes = await fetch('http://localhost:5000/api/requirements', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const reqsData = await reqsRes.json();
    
    const clientReviewReqs = reqsData.requirements.filter((r: any) => r.status === 'CLIENT_REVIEW');
    console.log(`Found ${clientReviewReqs.length} reqs in CLIENT_REVIEW`);
    
    if (clientReviewReqs.length > 0) {
      const targetReq = clientReviewReqs[0];
      console.log(`Testing ACCEPT on req: ${targetReq._id}, Current Status: ${targetReq.status}`);
      
      const decisionRes = await fetch('http://localhost:5000/api/reviews/client/decision', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          requirementId: targetReq._id,
          decision: 'ACCEPT'
        })
      });
      const decisionData = await decisionRes.json();
      console.log('Response from server:', decisionData);
    }
  } catch (error: any) {
    console.error('Test script failed:', error);
  }
}

test();

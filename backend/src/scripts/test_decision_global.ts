import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    // 1. Login as ADMIN
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin1@reqwise.com',
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
    console.log(`Found ${clientReviewReqs.length} reqs in CLIENT_REVIEW total.`);
    if (clientReviewReqs.length > 0) {
      console.log('Sample client review requirement:', clientReviewReqs[0]);
    }
  } catch (error: any) {
    console.error('Test script failed:', error);
  }
}

test();

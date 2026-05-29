import http from 'http';

const testCases = [
  { name: 'Genuine Batch', code: 'PAN8812', expectedVerified: true, expectedStatus: 'verified' },
  { name: 'Fake Batch', code: 'FAKE999', expectedVerified: false, expectedStatus: 'warning' },
  { name: 'Expired Batch', code: 'EXP1023', expectedVerified: false, expectedStatus: 'expired' },
  { name: 'Recalled Batch', code: 'MET9901', expectedVerified: false, expectedStatus: 'recalled' }
];

async function runTest(testCase) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ batchCode: testCase.code });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/medicines/verify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const passed = parsed.verified === testCase.expectedVerified && parsed.status === testCase.expectedStatus;
          console.log(`Test [${testCase.name}] - Batch ${testCase.code}: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
          if (!passed) {
            console.log(`  Expected: verified=${testCase.expectedVerified}, status=${testCase.expectedStatus}`);
            console.log(`  Got: verified=${parsed.verified}, status=${parsed.status}`);
          }
          resolve(passed);
        } catch (e) {
          console.log(`Test [${testCase.name}] - Batch ${testCase.code}: ❌ FAILED (Parse Error)`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`Test [${testCase.name}] - Batch ${testCase.code}: ❌ FAILED (Request Error)`);
      console.error(e.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function runAll() {
  console.log('Running Medicine Verification API Tests...');
  console.log('Note: Ensure your server is running on localhost:5000 and the database is seeded.\n');
  
  // Also need an authenticated request but the backend might not require auth token in test mode or we need to bypass?
  // Wait, looking at the code `verifyMedicine` uses `req.user.id`. Let's check `routes/medicineRoutes.js` if it's protected.
}

runAll();

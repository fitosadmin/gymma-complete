const http = require('http');

const data = JSON.stringify({
  'S0_Q1': false, 'S0_Q2': false, 'S0_Q3': false, 'S0_Q4': false, 'S0_Q5': false, 'S0_Q7': false,
  'S1_AGE': 25, 'S1_SEX': 'M', 'S1_HEIGHT': 175.0, 'S1_WEIGHT': 70.0, 'S1_BODY_COMP_GOAL': 'Build muscle',
  'S2_SLEEP': 8, 'S2_SLEEP_QUALITY': 4, 'S2_STRESS': 'Low', 'S2_OCCUPATION': 'Active', 'S2_NUTRITION': 'Consistent',
  'S3_DURATION': 'Never', 'S3_COMPOUNDS': [], 'S3_PROGRAM': false, 'S3_FREQUENCY': 0, 'S3_1RM_AWARE': false,
  'S4_PRIMARY': 'Hypertrophy', 'S4_TIMELINE': '12',
  'S5_DAYS': 4, 'S5_TIME': 60, 'S5_GYM_TYPE': 'Commercial',
  'S6_CURRENT_INJURY': false, 'S6_PAST_SURGERY': false, 'S6_PHYSIO': false,
});

const req = http.request({
  hostname: '127.0.0.1',
  port: 3002,
  path: '/api/v1/assessments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();

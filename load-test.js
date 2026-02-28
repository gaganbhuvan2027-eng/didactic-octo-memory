import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },    // Ramp up to 50 users
    { duration: '10m', target: 50 },   // Hold 50 users for 10 minutes
    { duration: '1m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'http://localhost:3000';
const TEST_USER_ID = '3793404f-b53e-49ac-a159-d502a00d31b8';

export default function () {
  const payload = JSON.stringify({
    interviewType: 'technical',
    userId: TEST_USER_ID,
    duration: 15,
    difficulty: 'intermediate',
  });

  const res = http.post(`${BASE_URL}/api/interview/start`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'request handled': (r) => r.status === 200 || r.status === 402,
    'no server crash': (r) => r.status < 500,
  });

  sleep(2);
}
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const newman = require('newman');
if (!process.env.AUTH_TEST_PASSWORD) throw Error('Set AUTH_TEST_PASSWORD to your local login password.');
newman.run({
  collection: require('../postman_collection.json'),
  envVar: [
    { key: 'username', value: process.env.AUTH_USERNAME || 'admin' },
    { key: 'password', value: process.env.AUTH_TEST_PASSWORD },
    { key: 'baseUrl', value: process.env.API_BASE_URL || 'http://localhost:3000' },
  ],
}, (err, summary) => {
  if (err) { console.error('Postman runner failed'); process.exitCode = 1; return; }
  // Export only counts and assertion names, never request passwords or session cookies.
  const report = { testedAt: new Date().toISOString(), stats: summary.run.stats,
    failures: summary.run.failures.map(f => ({ name: f.error?.name, test: f.error?.test })) };
  fs.writeFileSync(path.join(__dirname, '../reports/newman-results.json'), JSON.stringify(report, null, 2));
  console.log('Requests:', report.stats.requests.total, 'Failed assertions:', report.stats.assertions.failed);
  if (report.failures.length) process.exitCode = 1;
});

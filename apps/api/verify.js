const { exec } = require('child_process');
const http = require('http');

console.log('Starting NestJS on port 3008...');
const api = exec('npx nest start', { env: { ...process.env, PORT: 3008 } });

api.stdout.on('data', (data) => console.log(`[API]: ${data.trim()}`));
api.stderr.on('data', (data) => console.error(`[API ERR]: ${data.trim()}`));

setTimeout(() => {
  console.log('\nPinging health endpoint http://localhost:3008/api/health...');
  http
    .get('http://localhost:3008/api/health', (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        console.log('\n--- VERIFICATION SUCCESS ---');
        console.log('Response JSON:', rawData);
        api.kill('SIGTERM');
        process.exit(0);
      });
    })
    .on('error', (e) => {
      console.error(`\n--- VERIFICATION FAILED ---`);
      console.error(`Got error: ${e.message}`);
      api.kill('SIGTERM');
      process.exit(1);
    });
}, 10000);

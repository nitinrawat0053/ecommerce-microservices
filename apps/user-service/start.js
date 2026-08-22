const fs = require('fs');
const envContent = fs.readFileSync('../../.env', 'utf8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    process.env[key.trim()] = valueParts.join('=').trim();
  }
});
require('./dist/server.js');

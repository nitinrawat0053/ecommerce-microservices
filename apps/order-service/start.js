const { execSync } = require('child_process');
const fs = require('fs');

// Read .env file
const envContent = fs.readFileSync('../../.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Set env vars
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

// Start server
require('./dist/server.js');

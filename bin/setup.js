#!/usr/bin/env node

/**
 * Ares Command — First-Time Setup
 * 
 * Checks for OpenClaw installation, creates .env.local if missing,
 * and validates the environment.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.local');
const ENV_EXAMPLE = path.join(ROOT, '.env.example');
const OPENCLAW_HOME = process.env.OPENCLAW_HOME || path.join(os.homedir(), '.openclaw');

console.log('🛡️  Ares Command Setup\n');
console.log('─'.repeat(50));

// 1. Check OpenClaw installation
console.log('\n📂 Checking OpenClaw installation...');
if (fs.existsSync(OPENCLAW_HOME)) {
  const configPath = path.join(OPENCLAW_HOME, 'openclaw.json');
  if (fs.existsSync(configPath)) {
    console.log(`   ✅ Found OpenClaw at: ${OPENCLAW_HOME}`);
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const agentCount = config?.agents?.list?.length || 0;
      console.log(`   ✅ Configuration loaded (${agentCount} agent${agentCount !== 1 ? 's' : ''} registered)`);
    } catch (e) {
      console.log('   ⚠️  openclaw.json exists but could not be parsed');
    }
  } else {
    console.log(`   ⚠️  OpenClaw directory found at ${OPENCLAW_HOME} but no openclaw.json`);
    console.log('      Run your OpenClaw installer first, or create the config manually.');
  }
} else {
  console.log(`   ❌ OpenClaw not found at: ${OPENCLAW_HOME}`);
  console.log('      Install OpenClaw first: https://github.com/TheRoboticsClub/openclaw');
  console.log(`      Or set OPENCLAW_HOME environment variable to your installation path.`);
}

// 2. Create .env.local if missing
console.log('\n📋 Checking environment configuration...');
if (fs.existsSync(ENV_FILE)) {
  console.log(`   ✅ .env.local already exists`);
} else if (fs.existsSync(ENV_EXAMPLE)) {
  fs.copyFileSync(ENV_EXAMPLE, ENV_FILE);
  console.log(`   ✅ Created .env.local from .env.example`);
} else {
  const defaultEnv = `# Ares Command — OpenClaw Configuration
# Auto-detected from ~/.openclaw by default. Override if installed elsewhere.
# OPENCLAW_HOME=${OPENCLAW_HOME}
NEXT_PUBLIC_BASE_URL=http://localhost:44000
`;
  fs.writeFileSync(ENV_FILE, defaultEnv);
  console.log(`   ✅ Created .env.local with defaults`);
}

// 3. Check node_modules
console.log('\n📦 Checking dependencies...');
if (fs.existsSync(path.join(ROOT, 'node_modules'))) {
  console.log('   ✅ node_modules present');
} else {
  console.log('   ⚠️  node_modules not found. Run: npm install');
}

// 4. Summary
console.log('\n' + '─'.repeat(50));
console.log('\n🚀 Setup complete! Start Ares Command with:\n');
console.log('   npm run dev          # Development mode');
console.log('   npm run build        # Production build');
console.log('   npm run start        # Production server');
console.log(`\n   Dashboard: http://localhost:44000\n`);

#!/usr/bin/env node

/**
 * Ares Command — CLI Launcher
 * 
 * Usage:
 *   npx ares-command          # Start the dev server
 *   npx ares-command build    # Build for production
 *   npx ares-command start    # Start the production server
 *   npx ares-command setup    # Run first-time setup
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const command = args[0] || 'dev';

// Ensure we're operating from the package root
process.chdir(ROOT);

const COMMANDS = {
  dev: () => {
    console.log('\n🛡️  Ares Command — Starting development server...\n');
    run('npx', ['next', 'dev', '--port', '44000']);
  },
  build: () => {
    console.log('\n🛡️  Ares Command — Building for production...\n');
    run('npx', ['next', 'build']);
  },
  start: () => {
    console.log('\n🛡️  Ares Command — Starting production server...\n');
    run('npx', ['next', 'start', '--port', '44000']);
  },
  setup: () => {
    console.log('\n🛡️  Ares Command — Running setup...\n');
    require('./setup');
  },
  help: () => {
    console.log(`
🛡️  Ares Command — Executive Agent Management Platform

Usage:
  ares-command [command]

Commands:
  dev       Start the development server (default)
  build     Build the production bundle
  start     Start the production server
  setup     Run first-time environment setup
  help      Show this help message

Environment:
  OPENCLAW_HOME    Path to your OpenClaw installation (default: ~/.openclaw)
  PORT             Override server port (default: 44000)
`);
  },
};

if (!COMMANDS[command]) {
  console.error(`Unknown command: ${command}`);
  COMMANDS.help();
  process.exit(1);
}

COMMANDS[command]();

function run(cmd, cmdArgs) {
  const child = spawn(cmd, cmdArgs, {
    stdio: 'inherit',
    cwd: ROOT,
    env: { ...process.env },
    shell: true,
  });

  child.on('close', (code) => {
    process.exit(code || 0);
  });

  // Forward interrupt signals
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));
}

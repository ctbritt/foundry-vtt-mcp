#!/usr/bin/env node

/**
 * Ultra-Thin MCP Wrapper
 *
 * This is the SIMPLEST possible stdio→TCP bridge.
 * The backend is always running inside Foundry, so this just pipes.
 *
 * Reddit said this architecture is impossible. Here's the proof.
 *
 * Total complexity: ~30 lines. That's it.
 */

import net from 'net';

// Backend connection (always running inside Foundry module)
const BACKEND_HOST = process.env.FOUNDRY_HOST || '127.0.0.1';
const BACKEND_PORT = 31414;

// Connect to the always-running backend
const socket = net.connect({
  host: BACKEND_HOST,
  port: BACKEND_PORT
}, () => {
  // Bi-directional pipe: stdin ↔ socket ↔ stdout
  process.stdin.pipe(socket);
  socket.pipe(process.stdout);
});

// Error handling
socket.on('error', (err) => {
  process.stderr.write(`Cannot connect to Foundry MCP backend: ${err.message}\n`);
  process.stderr.write(`Is Foundry VTT running? Backend should be on ${BACKEND_HOST}:${BACKEND_PORT}\n`);
  process.exit(1);
});

socket.on('close', () => process.exit(0));
process.stdin.on('end', () => socket.end());

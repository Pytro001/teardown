// Starts the API (port 8303) and the Vite dev server (port 5303) together.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const envFlag = existsSync('.env') ? ['--env-file=.env'] : [];
const procs = [
  spawn(process.execPath, [...envFlag, 'server/index.mjs'], { stdio: 'inherit' }),
  spawn('npx', ['vite', '--port', '5303', '--strictPort'], { stdio: 'inherit', shell: process.platform === 'win32' })
];
const stop = () => { procs.forEach((p) => p.kill('SIGTERM')); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', (code) => { if (code) { console.error('a process exited with', code); stop(); } }));

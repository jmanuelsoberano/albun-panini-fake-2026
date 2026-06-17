import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmExecPath = process.env.npm_execpath;
const checks = [
  ['run', 'format:check'],
  ['run', 'check:angular-practices'],
  ['run', 'build'],
  ['run', 'test:ci'],
  ['run', 'smoke:focusables'],
  ['run', 'smoke:hosting'],
  ['run', 'smoke:keyboard-real'],
];

function run(args) {
  return new Promise((resolve, reject) => {
    const command = npmExecPath ? process.execPath : npmCommand;
    const commandArgs = npmExecPath ? [npmExecPath, ...args] : args;
    const child = spawn(command, commandArgs, {
      shell: false,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${npmCommand} ${args.join(' ')} exited with ${code}`));
    });
  });
}

try {
  for (const args of checks) {
    await run(args);
  }

  console.log('Angular migration verification passed.');
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const path = require('path');
const fs = require('fs');
// const find = require('find-process');
const homedir = require('os').homedir();
const stdin = process.openStdin();
var readline = require('readline');
const spawn = require('child_process').spawn;

let directoryPath = path.join(homedir);

readline.emitKeypressEvents(process.stdin);

function defaultPrint() {
  process.stdout.write(`NodeJs SHELL::  ${directoryPath} $`);
}

console.log('Please input commands-');
defaultPrint();
process.stdin.on('data', async (cmd) => {
  var command = cmd.toString().trim();

  var activeProcess = null;

  switch (command) {
    case 'cd':
      directoryPath = homedir;
      console.log(directoryPath);
      break;
    case 'pwd':
      console.log(process.cwd());
      break;
    case 'exit':
      console.log('exiting bash');
      process.exit();
      break;
    default:
  }

  // cd commands with arguments

  if (command.startsWith('cd ')) {
    const args = command.slice(3);
    if (path.isAbsolute(args)) {
      directoryPath = args;
    } else {
      const anotherPath = path.join(directoryPath, args);
      directoryPath = path.resolve(directoryPath, anotherPath);
    }
  }
  // ls command with arguments
  else if (command.startsWith('ls')) {
    const length = command.length;
    var pathToConsider = null;
    if (length > 3) {
      const args = command.slice(3);
      pathToConsider = path.join(directoryPath, args);
    } else {
      console.log(directoryPath);
      pathToConsider = directoryPath;
    }
    try {
      const files = await fs.promises.readdir(pathToConsider);
      files.forEach(function (file) {
        console.log(file);
      });
    } catch (err) {
      if (err) {
        console.log('Failed to scan the directory: ' + err);
      }
    }
  }

  // FG
  else if (command.startsWith('fg ')) {
    const args = command.slice(3);
    try {
      const list = await find('pid', args);
      console.log(list);
    } catch (err) {
      console.log(err.stack || err);
    }
  } else {
    try {
      const args = command.split(' ');
      const spawnProcess = spawn(args[0], args.slice(1, args.length), {
        stdio: 'inherit',
      });
      activeProcess = spawnProcess;
    } catch {
      activeProcess = null;
      console.log('Error! Please try again');
    }
  }

  // CTRL SIGNAL TO SPAWN PROCESS
  process.on('SIGINT', () => {
    if (activeProcess) {
      activeProcess.kill('SIGINT');
      activeProcess = null;
      console.log('child process stoped');
    } else {
      process.stdout.write('\n');
      process.exit();
    }
  });

  // CTRL Z
  process.on('SIGTSTP', () => {
    if (activeProcess) {
      activeProcess.kill('SIGTSTP');
      process.stdout.write('\nProcess Stopped. PID: ' + activeProcess.pid);
      activeProcess = null;
    }
    process.stdout.write('\n');
  });

  defaultPrint();
});

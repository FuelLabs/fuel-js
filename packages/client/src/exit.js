const readline = require('readline');

// no op method
const noop = () => {};

// handle CNTRL+C exits
function exit(method = noop) {
  // readline setup
  readline.emitKeypressEvents(process.stdin);

  // key press
  process.stdin.on('keypress', (ch, key) => {
    if (key && key.ctrl && key.name == 'c') {
      console.log('exiting sync loop...');
      method();
    }
  });

  // on clean exit
  process.on('SIGINT', method);
  process.on("SIGTERM", method);
  process.on("SIGINT", method);
  process.on("exit", method);

  // raw mode
  if (typeof process.stdin.setRawMode === 'function') {
    process.stdin.setRawMode(true);
  }
}

module.exports = exit;

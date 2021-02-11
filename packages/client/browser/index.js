// const worker = require('./')
// const sync = new Worker('./worker.js');
const regeneratorRuntime = require('regenerator-runtime');
const logic = require('@fuel-js/logic');
const database = require('@fuel-js/database');
const interface = require('@fuel-js/interface');
const protocol = require('@fuel-js/protocol');
const ethers = require('ethers');
const config = require('../src/config.browser');

// a9b7ff2bcfcc44de9c63d35d3adf5fa0

// loop continue var, keep pointer in object
let loop = {
  continue: false,
};
let syncing = false;
let tick = 0;
let provider = null;
let connected = false;

function updateConsole(message){
  const _console = document.getElementById('console');
  document.getElementById('console').innerHTML += `<div>${message}</div>`;
  _console.scrollTop = _console.scrollHeight;
  tick++;

  if (tick % 20 === 0) {
    updateMemory();
    updateStorage();
  }
}

function megabyte(bytes = 0) {
  return Math.round(bytes / 1000000);
}

function updateMemory() {
  if (window.performance) {
    const stats = window.performance.memory;
    const total = stats.jsHeapSizeLimit;
    const used = stats.usedJSHeapSize;

    document.getElementById('memory')
      .innerHTML = `<small>Memory: ${megabyte(used)}mb used / ${megabyte(total)}mb total</small>`;
    return;
  }

  document.getElementById('memory')
    .innerHTML = `<small>Memory: N/A</small>`;
}

function updateStorage() {
  if (navigator.storage) {
    return navigator.storage.estimate()
    .then(stats => {
      document.getElementById('storage')
        .innerHTML = `<small>| Storage: ${megabyte(stats.usage)}mb used / ${megabyte(stats.quota)}mb total</small>`;
    })
    .catch(updateConsole);
  }

  document.getElementById('storage')
    .innerHTML = `<small>| Storage: N/A</small>`;
}

function infuraOrRPCFromKey(provider = {}) {
  if (provider) {
    return { provider };
  }

  const value = document.getElementById('key').value;

  if (!value.trim().length && !provider) {
    throw new Error('Please provide either a valid Infura key or RPC URL (e.g. http://localhost:8545)');
  }

  localStorage.setItem('key', value);

  if (value.indexOf('http') !== -1) {
    return { rpc: value.trim() };
  }

  return { infura: value.trim() };
}

window.onbeforeunload = function() {
  loop.continue = false;
  updateConsole('Warning: click "Stop" before exiting, otherwise your DB may be currupted and must be resynced from scratch!');
  updateConsole('close attempt, stopping sync...');
  return true;
};

// load key if available
const key = localStorage.getItem('key');
if (key) {
  document.getElementById('key').value = key;
}

updateConsole('This client will be used to provide liquidity on Fuel for exchange and fast exits..');

// settings configuration defaults
const settings = (opts = {}) => config({
  network: 'rinkeby',
  // infura: 'a9b7ff2bcfcc44de9c63d35d3adf5fa0',
  clear: false,
  console: {
    log: message => updateConsole(message),
    error: error => updateConsole(error),
  },
  loop,
  ...opts,
});

document.getElementById('query').addEventListener('keyup', evt => {
  // logical sync for fuel using settings
  if (evt.keyCode === 13) {
    const blockHeight = parseInt(evt.target.value, 10);

    if (!isNaN(blockHeight)) {
      settings({ ...infuraOrRPCFromKey(provider) })
      .db.get([ interface.db.block, blockHeight ])
      .then(blockRLP => {
        const block = protocol.block.BlockHeader(blockRLP);
        const obj = block.object();

        updateConsole(`
  <pre>
    <code>
  Block #${blockHeight}:
             Producer : ${obj.producer}
  Previous Block Hash : ${obj.previousBlockHash}
               Height : ${obj.height}
Ethereum Block Number : ${obj.blockNumber}
           Num Tokens : ${obj.numTokens}
        Num Addresses : ${obj.numAddresses}
                Roots : ${obj.roots}
    </code>
  </pre>
        `);
      })
      .catch(console.error);
    }
  }
});

document.getElementById('clear').addEventListener('click', () => {
  // logical sync for fuel using settings
  if (!syncing && window.confirm('Are you sure you want to clear your DB?')) {
    loop.continue = true;
    syncing = true;

    try {
      logic.sync(settings({ clear: true, ...infuraOrRPCFromKey(provider) }))
      .then(() => {
        syncing = false;
        updateConsole('sync stopped');
      })
      .catch(updateConsole);
    } catch (error) {
      updateConsole(error.message);
    }
  }
});

function start() {
  try {
    loop.continue = true;
    syncing = true;

    // logical sync for fuel using settings
    logic.sync(settings({ ...infuraOrRPCFromKey(provider) }))
    .then(() => {
      syncing = false;
      updateConsole('sync stopped');
    })
    .catch(updateConsole);
  } catch (error) {
    updateConsole(error.message);
  }
}

document.getElementById('start').addEventListener('click', () => {
  if (!syncing) {
    start();
  }
});

document.getElementById('stop').addEventListener('click', () => {
  if (syncing) {
    updateConsole('stopping sync...');
    loop.continue = false;
  }
  // sync.postMessage('stop');
});

function updateConnected() {
  /*
  document.getElementById('start').classList.toggle('not-visible');
  document.getElementById('stop').classList.toggle('not-visible');
  document.getElementById('clear').classList.toggle('not-visible');
  */
  document.getElementById('connect').classList.toggle('not-visible');
  document.getElementById('key').classList.toggle('not-visible');
  document.getElementById('watch').classList.toggle('not-visible');
}

document.getElementById('connect').addEventListener('click', () => {
  if (!syncing) {
    updateConsole('connecting to web3...');

    // set the provider object
    provider = new ethers.providers.Web3Provider(window.web3.currentProvider);

    // enabled
    provider.provider.enable().then(() => {
      // connected true
      connected = true;

      provider.getNetwork().then((network) => {

        if (network.name === 'rinkeby') {
          // web3 enabled
          updateConsole('web3 enabled');
          updateConsole('Warning: click "Stop" before exiting, otherwise your DB may be currupted and must be resynced from scratch!');

          // connected
          updateConnected();

          // start syncing
          start();
        } else {

          updateConsole('Please change your provider network to "Rinkeby".');

        }

      });
    });
  }
});

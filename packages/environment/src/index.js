const { ContractFactory, Wallet, providers } = require('ethers');
const utils = require('@fuel-js/utils');
const ganache = require('ganache-core');
const BN = require('bn.js');
const compile = require('./compile');
const deployer = require('./deploy');

const { createHarness, tapeTapLike, mochaTapLike } = require('zora');
const { JsonRpcProvider } = require('ethers/providers');
const harness = createHarness();
const { test } = harness;

let accounts = [
  new utils.SigningKey('0xf72e1c49ef6662accff15221f2581defd6522248e0aad76b4391bf1140a9dd36'),
  new utils.SigningKey('0x6ffd1ce2688b802196b6f8aac601c1e00cd94fd8aab8d64a25c13d3a115e5652'),
  new utils.SigningKey('0xa2f349d333d8097ffaa0109847dbde83c08e01cbbd3758ad4eb9a194b56d475d'),
  new utils.SigningKey('0x1c9bbaad098c769b09c81917430e819a917e6d521fbdc2e54adf128d745c2327'),
  new utils.SigningKey('0xdccea3f8285d22bc27f01e6e67f89960560ac58998996af92a80f852d7b6311c'),
];

const gasLimit = '0xFFFFFFFFFF';

const providerConfig = {
  accounts: accounts.map(account => ({
    balance: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
    secretKey: account.privateKey,
  })),
  allowUnlimitedContractSize: true,
  vmErrorsOnRPCResponse: true,
  gasLimit: '0x1fffffffffffff',
  gasPrice: '0x3b9aca00',
  debug: false,
  logger: { log: () => {} },
  callGasLimit: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
};
const ganacheProvider = ganache.provider(providerConfig);
let provider = new providers.Web3Provider(ganacheProvider);
const server = ganache.server(providerConfig);
let usingServer = false;

if (process.env.genacheServer) {
  console.log(`genache listening at http://localhost:${process.env.server || 8545}`);
  server.listen(process.env.server || 8545);
  provider = new providers.JsonRpcProvider(
    `http://localhost:${process.env.server || 8545}`,
  );
  usingServer = true;
}

let wallets = [
  new Wallet(accounts[0].privateKey, provider),
  new Wallet(accounts[1].privateKey, provider),
  new Wallet(accounts[2].privateKey, provider),
  new Wallet(accounts[3].privateKey, provider),
  new Wallet(accounts[4].privateKey, provider),
];

function setWallets(_wallets = []) {
  wallets = _wallets;
}

function setProvider(_provider = {}) {
  provider = _provider;
}

function setPrivateKey(privateKey = '0x', _index = 0) {
  accounts[_index] = new utils.SigningKey(privateKey);
  wallets[_index] = new Wallet(accounts[_index].privateKey, provider);
}

let overrides = { gasLimit: '0x3d0900' };

function setOverrides(opts = {}) {
  overrides = opts;
}

function getOverrides() {
  return overrides;
}

function getProvider() {
  return provider;
}

function getAccounts() {
  return accounts;
}

function getWallets() {
  return wallets;
}

async function deploy(abi, bytecode, args, wallet = null, opts = null) {
  try {
    const _wallet = (wallet || wallets[0]);
    const factory = new ContractFactory(abi, bytecode, _wallet);
    const contract = await factory.deploy(...args, {
      gasLimit: '0xFFFFFFFFF',
      nonce: await provider.getTransactionCount(_wallet.address),
      ...(opts || {}),
    });

    return await contract.deployed();
  } catch (error) {
    throw new Error(error);
  }
}

function rpc(method, ...args) {
  if (usingServer) {
    return provider.send(method, args);
  }

  return new Promise((resolve, reject) => ganacheProvider.sendAsync({ method, params: args }, (err, result) => {
    if (err) return reject(err);
    if (result) return resolve(result);
  }));
}

async function increaseTime(amount) {
  try {
    // EVM Mine
    await rpc('evm_increaseTime', amount);
  } catch (error) {
    throw new Error(error);
  }
}

async function increaseBlock(blocks = 1, time = utils.unixtime()) {
  try {
    // EVM Mine
    const num = utils.bigNumberify(blocks).toNumber();
    for (var i = 0; i < num; i++) {
      await rpc('evm_mine', utils.unixtime() + 13);
    }
  } catch (error) {
    throw new Error(error);
  }
}

const call = obj => provider.call(obj);

const equalBig = t => (x, y, message) => t.equal(utils.hexlify(utils.stripZeros(utils.bigNumberify(x).toHexString())),
  utils.hexlify(utils.stripZeros(utils.bigNumberify(y).toHexString())),
  message);

function wrapper (name, method) {
  return test(name, async t => {
    Object.assign(t, {
      equalHex: (x, y, message) => t.equal(utils.hexlify(x).toLowerCase(), utils.hexlify(y).toLowerCase(), message),
      equalBig: equalBig(t),
      catch: (p, message) => p.then(e => t.ok(0, message)).catch(() => t.ok(true, message)),
      error: (error, errors) => {
        if (error.hashes) {
          const hash = error.hashes[0];
          const err = error.results[hash];
          const id = utils.hexDataSlice(err.return, 28, 32);
          t.ok(0, `${err.error} ${errors[id]} ${id} ${error.message}`);
        } else {
          console.error(error);
          t.ok(0, error.message);
        }
      },
      throw: (f, errorMessage, message) => {
        try {
          f();
          t.equal(null, errorMessage, message || errorMessage);
        } catch (error) {
          t.equal(error.message, errorMessage, message || errorMessage);
        }
      },
      deploy,
      setOverrides,
      setProvider,
      setPrivateKey,
      getWallets,
      getOverrides,
      setWallets,
      getAccounts,
      getProvider,
      wallets,
      provider,
      increaseTime,
      increaseBlock,
      logs: async (contract, data = {}) => {
        try {
          const logs = (await provider.getLogs(Object.assign({
            fromBlock: 0,
            toBlock: 'latest',
            topics: [],
            address: contract.address,
          }, data, {
            topics: (data.topics || [])
              .map(v => v && v.slice(0, 2) !== '0x'
                ? contract.interface.events[v].topic
                : v)
          } )));

          return logs.map(v => contract.interface.parseLog(v));
        } catch (error) {
          t.ok(0, error.message);
          throw new Error(error.message);
        }
      },
      wait: async (tx, message, errors, log) => {
        try {
          const value = await (await tx).wait();
          t.equal(value.status, 1, message);

          if (log) {
            value.logs.map(log => {
              if (log.topics[3]) {
                const id = utils.hexDataSlice(log.topics[3], 28, 32);
                const fraud = errors[id];

                if (fraud) {
                  console.log(`fraud detected ${fraud} ${id} ${message}`);
                }
              }
            });

            value.logs.map(v => console.log(v.topics));
            console.log(value.logs);
          }

          return value;
        } catch (error) {
          if (log) {
            console.error(error);
          }

          if (errors && error.hashes) {
            const hash = error.hashes[0];
            const err = error.results[hash];
            const id = utils.hexDataSlice(err.return, 28, 32);
            console.log(`${err.error} ${errors[id]} ${id} ${error.message}`);
          }

          t.ok(0, error.message);
        }
      },
      balanceEqual: async (addr, value, message) => {
        try {
          equalBig(t)(await provider.getBalance(addr), value);
        } catch (error) {
          t.ok(0, error.message);
        }
      },
      getBlockNumber: () => provider.getBlockNumber(),
      getBalance: (v) => provider.getBalance(v),
      revert: async (tx, result = '0x', message, errors, logit) => {
        try {
          const value = await (await tx).wait();
          t.ok(0, message);
        } catch (error) {
          const hash = error.hashes[0];
          t.equal(error.results[hash].error, 'revert', message);
          t.equal(utils.hexlify(utils.stripZeros(utils.bigNumberify(error.results[hash].return).toHexString())),
            utils.hexlify(utils.stripZeros(utils.bigNumberify(result).toHexString())), message)

          if (errors) {
            const id = utils.hexDataSlice(error.results[hash].return, 28, 32);
          }

          if (logit) {
            console.error(error);
          }
        }
      },
      equalRLP: (x, y, message) => t.equal(utils.RLP.encode(x), utils.RLP.encode(y), message),
    });

    await method(t);
  });
};

const findConfigurationFlag = (name) => {
  if (typeof process !== 'undefined') {
    return process.env[name] === 'true' || process.env[name] === '1';
    // @ts-ignore
  } else if (typeof window !== 'undefined') {
    // @ts-ignore
    return !(!window[name]);
  }
  return false;
};

// Custom Zora test harness with TAP_EXIT support for process EXIT 0
harness
  .report(tapeTapLike)
  .then(() => {
    // or in this case, our test program is for node so we want to set the exit code ourselves in case of failing test.
    const exitCode = harness.pass === true ? 0 : 1;
    if (findConfigurationFlag('TAP_EXIT')) {
      process.exit(exitCode);
    }
  });

module.exports = {
  deployer,
  wallets,
  accounts,
  compile,
  provider,
  deploy,
  call,
  utils,
  test: wrapper,
  increaseTime,
  setProvider,
  setPrivateKey,
  setOverrides,
  getOverrides,
  rpc,
  utils,
  overrides,
  BN,
  gasLimit,
};

// git clone fuellabs/fuel
// npm install
// npm run build
// parse, copy and allocate JSON to appropriate repos in fuel-js
// namely: bytecode, abi, errors
// this will add Fuel builds to the repo

const write = require('write');

const Fuel = require('../fuel/src/builds/Fuel.json');
const FuelDeployments = require('../fuel/src/deployments/Fuel.json');
const OwnedProxy = require('../fuel/src/builds/OwnedProxy.json');
const HTLC = require('../fuel/src/builds/HTLC.json');
const ERC20 = require('../fuel/src/builds/ERC20.json');

const mapJS = `const Fuel = require('./Fuel.json');
const ERC20 = require('./ERC20.json');
const HTLC = require('./HTLC.json');
const OwnedProxy = require('./OwnedProxy.json');

module.exports = {
  Fuel,
  ERC20,
  HTLC,
  ERC20,
};
`;

(async () => {
  try {

    await write('./packages/errors/src/Fuel.json',
      JSON.stringify(Fuel.errors, null, 2), { overwrite: true });
    await write('./packages/errors/src/OwnedProxy.json',
      JSON.stringify(OwnedProxy.errors, null, 2), { overwrite: true });
    await write('./packages/errors/src/HTLC.json',
      JSON.stringify(HTLC.errors, null, 2), { overwrite: true });
    await write('./packages/errors/src/ERC20.json',
      JSON.stringify(ERC20.errors, null, 2), { overwrite: true });
    await write('./packages/errors/src/index.js',
      mapJS, { overwrite: true });

    await write('./packages/bytecode/src/Fuel.json',
      JSON.stringify(Fuel.bytecode, null, 2), { overwrite: true });
    await write('./packages/bytecode/src/OwnedProxy.json',
      JSON.stringify(OwnedProxy.bytecode, null, 2), { overwrite: true });
    await write('./packages/bytecode/src/HTLC.json',
      JSON.stringify(HTLC.bytecode, null, 2), { overwrite: true });
    await write('./packages/bytecode/src/ERC20.json',
      JSON.stringify(ERC20.bytecode, null, 2), { overwrite: true });
    await write('./packages/bytecode/src/index.js',
      mapJS, { overwrite: true });

    await write('./packages/abi/src/Fuel.json',
      JSON.stringify(Fuel.abi, null, 2), { overwrite: true });
    await write('./packages/abi/src/OwnedProxy.json',
      JSON.stringify(OwnedProxy.abi, null, 2), { overwrite: true });
    await write('./packages/abi/src/HTLC.json',
      JSON.stringify(HTLC.abi, null, 2), { overwrite: true });
    await write('./packages/abi/src/ERC20.json',
      JSON.stringify(ERC20.abi, null, 2), { overwrite: true });
    await write('./packages/abi/src/index.js',
      mapJS, { overwrite: true });

    const deployments = `
module.exports = ${JSON.stringify(FuelDeployments, null, 2)};
`;
    await write('./packages/deployments/src/index.js',
      deployments, { overwrite: true });

  } catch (error) {
    console.error(error);
  }
})();

// Core modules
const solc = require('solc');
const readFile = require('fs-readfile-promise');
const write = require('write');

// Parse and Compile
async function compile() {
  try {
    var output = JSON.parse(solc.compile(JSON.stringify({
      language: 'Solidity',
      sources: {
        'FuelUtility.sol': {
          content: await readFile('./contracts/FuelUtility.sol', 'utf8'),
        },
      },
      settings: { outputSelection: { '*': { '*': [ '*' ] } } },
    })));

    // Contract Bytecode
    return '0x' + output.contracts['FuelUtility.sol']['FuelUtility'].evm.bytecode.object;
  } catch (error) {
    console.log('Compiling error while building Fuel bytecode', error);

    process.exit();
  }
}

// Compile if Environment says so
if (process.env.COMPILE) {
  // Compile Fuel
  compile()
    .then(code => write('./contracts/FuelUtility.code.js', `module.exports = "${code}";`))
    .then(() => 'FuelUtility COMPILED')
    .catch(console.log);
}

// Export methods
module.exports = {
  compile,
};

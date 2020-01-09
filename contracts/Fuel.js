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
        'Fuel.sol': {
          content: await readFile('./contracts/Fuel.sol', 'utf8'),
        },
      },
      settings: { outputSelection: { '*': { '*': [ '*' ] } } },
    })));

    // is errors in compiling
    const isErrors = (output.errors || []).filter(v => v.type !== 'Warning').length;
    if (isErrors) {
      console.log(output.errors);

      process.exit();
      return;
    }

    // Contract Bytecode
    return '0x' + output.contracts['Fuel.sol']['Fuel'].evm.bytecode.object;
  } catch (error) {
    console.log('Compiling error while building Fuel bytecode', error);

    process.exit();
  }
}

// Compile if Environment says so
if (process.env.COMPILE) {
  // Compile Fuel
  compile()
    .then(code => write('./contracts/Fuel.code.js', `module.exports = "${code}";`))
    .then(() => 'Fuel COMPILED')
    .catch(console.log);
}

// Export methods
module.exports = {
  compile,
};

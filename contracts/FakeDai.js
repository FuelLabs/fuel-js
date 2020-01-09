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
        'FakeDai.sol': {
          content: await readFile('./contracts/FakeDai.sol', 'utf8'),
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
    return '0x' + output.contracts['FakeDai.sol']['FakeDai'].evm.bytecode.object;
  } catch (error) {
    console.log('Compiling error while building Fuel bytecode', error);

    process.exit();
  }
}

// Compile if Environment says so
if (process.env.COMPILE) {
  // Compile Fuel
  compile()
    .then(code => write('./contracts/FakeDai.code.js', `module.exports = "${code}";`))
    .then(() => 'FakeDai COMPILED')
    .catch(console.log);
}

// Export methods
module.exports = {
  compile,
};

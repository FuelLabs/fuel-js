const yulp = require('yulp');
const solc = require('solc');
const readFile = require('fs-readfile-promise');
const write = require('write');
const fs = require('fs');

// Parse and Compile
async function compile(config) {
  try {
    let yulpResult = null;
    let yulpError = null;

    try {
      yulpResult = yulp.compile(await readFile(config.in, 'utf8'), config.base ? fs : null, config.base);
    } catch (yulpErrors) {
      console.error(yulpErrors);
      throw new Error(yulpErrors);
    }

    console.log('yul+ compiled');

    let output = JSON.parse(solc.compile(JSON.stringify({
      "language": "Yul",
      "sources": { "Target.yul": { "content": yulp.print(yulpResult.results) } },
      "settings": {
        "outputSelection": { "*": { "*": ["*"], "": [ "*" ] } },
        "optimizer": {
          "enabled": true,
          "runs": 0,
          "details": {
            "yul": true
          }
        }
      }
    })));

    // is errors in compiling
    const isErrors = (output.errors || [])
      .filter(v => v.type !== 'Warning').length;

    // Is errors
    if (isErrors || yulpError) {
      console.error('Compiling errors', output.errors);

      process.exit();
      return;
    }

    // Contract Code
    const bytecode = '0x' + output.contracts['Target.yul'][config.object]
      .evm.bytecode.object;

    const result = {
      bytecode,
      abi: yulpResult.signatures.map(v => v.abi.slice(4, -1))
        .concat(yulpResult.topics.map(v => v.abi.slice(6, -1))),
      errors: yulpResult.errors,
      // yul: yulp.print(yulpResult.results),
    };

    // Output as a file
    if (config.out) {
      // should be a json file
      let outin = {};

      try {
        outin = JSON.parse(await readFile(config.out, 'utf8'));
      } catch (err) {}

      await write(config.out, JSON.stringify({ ...outin, ...result }, null, 2));
      await write(config.out + '.yul', yulp.print(yulpResult.results));
    }

    // Contract Bytecode
    return result;
  } catch (error) {
    console.error('Compiling error while building Fuel bytecode', error);
    process.exit();
  }
}

// Export methods
module.exports = compile;

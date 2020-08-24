#!/usr/bin/env node
'use strict';
const logic = require('@fuel-js/logic');
const config = require('./config.local');
const cli = require('./cli');
const wallet = require('./wallet');
const exit = require('./exit');

// help / version / flags from command line
const cl = cli();

// loop continue var, keep pointer in object
let loop = { continue: true };

// loop exit
exit(() => {
  loop.continue = false;
});

// start async loop
(async () => {

  try {

    // setup or load a wallet
    const operator = await wallet(cl.flags);

    // settings configuration defaults
    const settings = config({
      network: 'rinkeby',
      ...(cl.flags.environment ? process.env : {}),
      ...cl.flags,
      loop,
      operator,
    });

    // logical sync for fuel using settings
    await logic.sync(settings);

    // exit process once complete
    process.exit(0);
  } catch (clientError) {
    console.error(clientError);
    process.exit(0);
  }

})();

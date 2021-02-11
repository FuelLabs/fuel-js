(async () => {

  // run all tests
  await require('./sync');
  await require('./genesis');
  await require('./mempool');
  await require('./sync');
  await require('./produce');
  await require('./transact');
  await require('./prover');
  await require('./correctness');
  await require('./root-force');
  await require('./third-party-production');
  await require('./in-flight');

})();

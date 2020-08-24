(async () => {

  // run all tests
  await require('./sync');
  await require('./genesis');
  await require('./mempool');
  await require('./sync');
  await require('./process');
  await require('./produce');
  await require('./transact');

})();

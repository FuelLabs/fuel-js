// OR...
const { exec, spawn } = require('child_process');

exec("find ./ -name '*test*.js'", (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }

    const testsArr = stdout.trim().split("\n")
      .filter(v => v.indexOf('node_modules') === -1)
      .filter(v => v !== './/nodes/sync.test.js')
      .filter(v => v !== './/tests/test.Fuel.js');

    for(var i = 0; i < testsArr.length; i++) {
      console.log(`
Testing ${testsArr[i]}
        `);
      try {
        require('child_process').execSync(
          `node ${testsArr[i]} | ./node_modules/.bin/tap-mocha-reporter spec`,
          {stdio: 'inherit'}
          );
      } catch (error) {
        console.log(error);
      }
    }
});

require('regenerator-runtime');
import { Wallet, utils, dbs } from "../index";

async function app() {
  try {
    const signer = new utils.SigningKey(utils.randomBytes(32)); // warning: not secure entropy generation..
    const { faucet, transfer, tokens, balance } = new Wallet({
      signer,
      db: new dbs.Index(),
      api: 'https://fuel-lambda.now.sh/',
    });

    await faucet();

    await transfer(500, tokens.fakeDai, signer.address);

    console.log(await balance(tokens.fakeDai));


    // const signer = new utils.SigningKey(utils.randomBytes(32)); // warning: not secure entropy generation..
    // const { faucet, transfer, tokens, sync, balance } = new Wallet({ signer, db: new dbs.Index(), api: 'https://fuel-lambda.now.sh/' });

    // await faucet();

    // await sync();

    // await transfer(500, tokens.fakeDai, signer.address);

    // await sync();

    // console.log(utils.formatEther(await balance(tokens.fakeDai)));


    // const signer = new utils.SigningKey(utils.randomBytes(32));
    // const signer2 = new utils.SigningKey(utils.randomBytes(32)); // utils.randomBytes(32));
    // const { faucet, transfer, balance, tokenID, tokens, post, sync } = new Wallet({ signer, db: new dbs.Index() });

    // await sync();

    // await faucet();

    // console.log(await tokenID(tokens.fakeDai));

    // console.log(utils.formatEther(await balance(tokens.fakeDai)));

    /*
    await sync();


    console.time('Transact');
    await transfer(utils.parseEther('1.3'), tokens.fakeDai, signer2.address);
    console.timeEnd('Transact');
    //await transfer(utils.parseEther('1.5'), tokens.fakeDai, signer2.address);
    await transfer(utils.parseEther('1.4'), tokens.fakeDai, signer2.address);
    */

    // console.log(utils.formatEther(await balance(tokens.fakeDai)));

    // console.log(utils.formatEther(await balance(tokens.fakeDai)));

    /*
    console.log(await post('https://fuel-lambda.now.sh/account', { // https://fuel-lambda.now.sh/account
      address: '0x99b722ccd2d6baf0325bf9524bc2e5d3411330b3',
    }));
    */

    /*
      storage: '0x00',
      token: '0x01',
      tokenID: '0x02',
      block: '0x03',
      transactionRoot: '0x04',
      deposit: '0x05',
      Deposit: '0x05',
      UTXO: '0x06',
      blockTip: '0x07',
      account: '0x08',
      withdraw: '0x09',
      transaction: '0x10',
      ethereumBlockProcessed: '0x11',
      lastEthereumFraudBlock: '0x12',
      numTokens: '0x13',
      mempool: '0x14',
      mempoolSpend: '0x15',
      mempoolTransaction: '0x16',
      withdrawal: '0x17',
      */


  } catch (error) {
    console.log(error);
  }
}

app()
.then(console.log)
.catch(console.log);

/*
const signer = new utils.SigningKey(utils.randomBytes(32)); // warning: not secure entropy generation..
const { faucet, transfer, tokens } = new Wallet({ signer, db: new dbs.LocalStorage() });

await faucet();

await transfer(500, tokens.fakeDai, signer.address);
*/

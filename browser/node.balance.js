const axios = require('axios');
const PubNub = require('pubnub');

// Listen
const listen = async (account, cb) => {
  try {
    // CB, empty callback method
    let __cb = () => {};

    // uuid
    const uuid = PubNub.generateUUID();

    // Set global cb
    __cb = cb;

    const pubnub = new PubNub({
      subscribeKey: "sub-c-11502102-5035-11ea-814d-0ecb550e9de2",
      uuid,
      // ssl: true, // option to turn that off?
    });

    pubnub.addListener({
      message: async msg => {
        try {
          if (cb) {
            __cb(null, result);
          }
        } catch (error) {
          __cb(error, null);
        }
      },
      error: msg => {
        __cb(msg, null);
      },
    });

    return pubnub.subscribe({
      channels: [
        String('0x' + __chainId + account.slice(2)).toLowerCase(),
      ],
    });
  } catch (error) {
    throw new errors.ByPassError(error);
  }
};

async function getBalance(account) {
  try {
    return (await axios
      .post('https://fuel-lambda.fuellabs.now.sh/balance', {
        address: account,
        tokenID: '0x01',
      })).data.result;
  } catch (error) {
    console.log(error);
  }
}

(async ()=> {

  try {
    console.log('initial balances',
      await getBalance('0x1C5A77d9FA7eF466951B2F01F724BCa3A5820b63'),
      await getBalance('0x5526B0E157f217dB52C9b56268D3e999A9c53bf5'));

    await listen('0x1C5A77d9FA7eF466951B2F01F724BCa3A5820b63', () => {
      console.log('balance 1 updated!',
        await getBalance('0x1C5A77d9FA7eF466951B2F01F724BCa3A5820b63'));
    });

    await listen('0x5526B0E157f217dB52C9b56268D3e999A9c53bf5', () => {
      console.log('balance 2 updated!',
        await getBalance('0x5526B0E157f217dB52C9b56268D3e999A9c53bf5'));
    });
  } catch (error) {
    console.log(error);
  }

})();

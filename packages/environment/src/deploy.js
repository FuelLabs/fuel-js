// @description node based deployment process
const { Wallet, ContractFactory, providers } = require('ethers');
const utils = require('@fuel-js/utils');

async function deploy({ privateKey, chainId, providerURL, gasLimit, methods, bytecode }) {
  try {
    const wallet = new Wallet(privateKey, new providers.JsonRpcProvider(providerURL));
    const factory = new ContractFactory(methods, bytecode, wallet);

    const contract = await factory.deploy(wallet.address, {
      gasLimit: gasLimit || 4000000,
    });

    return await contract.deployed();
  } catch (error) {
    throw new utils.ByPassError(error);
  }
}

module.exports = deploy;

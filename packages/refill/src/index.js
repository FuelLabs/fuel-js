const ethers = require('ethers');

// Mulisend bytecode
const bytecode = '0x60806040526040516102023803806102028339818101604052604081101561002657600080fd5b810190808051604051939291908464010000000082111561004657600080fd5b8382019150602082018581111561005c57600080fd5b825186602082028301116401000000008211171561007957600080fd5b8083526020830192505050908051906020019060200280838360005b838110156100b0578082015181840152602081019050610095565b50505050905001604052602001805160405193929190846401000000008211156100d957600080fd5b838201915060208201858111156100ef57600080fd5b825186602082028301116401000000008211171561010c57600080fd5b8083526020830192505050908051906020019060200280838360005b83811015610143578082015181840152602081019050610128565b50505050905001604052505050805182511461015e57600080fd5b60008090505b81518110156101e75781818151811061017957fe5b602002602001015173ffffffffffffffffffffffffffffffffffffffff166108fc8483815181106101a657fe5b60200260200101519081150290604051600060405180830381858888f193505050501580156101d9573d6000803e3d6000fd5b508080600101915050610164565b503373ffffffffffffffffffffffffffffffffffffffff16fffe';

// Send data
const abi = ['constructor(uint256[] amounts, address[] recipients)'];

// refill, will use the wallet account to refill all accounts in array at target balance of Ether
async function refill(wallet = {}, accounts = [], targetBalance = 0, opts = {
  gasLimit: 6000000,
}) {
  try {
    let total = ethers.utils.bigNumberify(0);
    let amounts = [];
    let recipients = [];

    for (const account of accounts) {
      const balance = await wallet.provider.getBalance(account);

      // if balance is less than tagret, add to amounts / recipients list
      if (balance.lt(targetBalance)) {
        recipients.push(account);
        amounts.push(targetBalance.sub(balance));
        total = total.add(targetBalance.sub(balance));
      }
    }

    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy(amounts, recipients, {
      ...opts,
      value: total,
    });

    // wait for transaction to process.
    return await contract.deployTransaction.wait();
  } catch (error) {
    throw new Error(error.message);
  }
}

module.exports = refill;

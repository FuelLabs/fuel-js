const app = require('./app');
const ethers = require('ethers');
const utils = require('@fuel-js/utils');
const { ERC20, Fuel } = require('@fuel-js/contracts');

(async () => {
    await app({
        localDeployment: async (flags = {}) => {
            // If deploy.
            console.log('Using RPC provider: ' + flags.rpc);
            const provider = new ethers.providers.JsonRpcProvider(flags.rpc);
            const signer = provider.getSigner();
            const account = (await provider.listAccounts())[0];
            const factory = new ethers.ContractFactory(Fuel.abi, Fuel.bytecode, signer);
            const tx = await factory.deploy(
                account,
                70, // finalization delay at 20
                4,
                4,
                utils.parseEther('1.0'),
                "Fuel",
                "1.1.0",
                0,
                utils.keccak256('0xdeadbeaf'),
            );

            const contract = await tx.deployed();

            async function increaseBlock() {
                try {
                    await signer.sendTransaction({
                        to: account,
                        value: 1,
                        data: '0x',
                    });
                } catch (err) {console.log(err);}
            }

            async function plugin() {
                await increaseBlock();
            }

            return {
                provider,
                contract: contract.address,
                increaseBlock,
                plugin,
            };
        },
    })
    .then(console.log)
    .catch(console.error);

    return;

})();

/*
// Start the main app loop.

*/
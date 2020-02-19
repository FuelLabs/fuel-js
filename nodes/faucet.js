const { utils, Wallet } = require('ethers');
const _utils = require('../utils/utils');
const interfaces = require('../interfaces/interfaces');
const types = require('../types/types');
const structs = require('../structs/structs');
const MemoryDB = require('../dbs/MemoryDB');
const errors = require('../errors/errors');
const { FuelDBKeys } = require('../interfaces/interfaces');
const { intakeTransaction } = require('../transactions/intakeTransaction');

// UTXO Prefix key length..
const utxoDBKeyLength = interfaces.FuelDBKeys.UTXO.length;

// Sync DB to Chain
async function faucet({ db, mempool, requests, accounts, spendableInputs,
  tokenID, logger, amount, signerKey, pubnub }) {

  // Check Types
  types.TypeDB(db);
  types.TypeDB(mempool);
  types.TypeDB(requests);
  types.TypeDB(accounts);
  types.TypeDB(spendableInputs);
  types.TypeObject(signerKey);

  // pubnub
  if (typeof pubnub !== 'undefined') {
    types.TypeObject(pubnub);
  }

  // Loger Handling
  if (!logger) {
    logger = new structs.EmptyLogger();
  } else {
    types.TypeObject(logger);
  }

  // No failure
  let catastrophicFailure = false;

  // Start
  logger.log('Faucet started.');

  // Keep going forever..
  while (!catastrophicFailure) {
    try {
      // Addresses requesting funds..
      let outputAddresses = await structs.getRequests(requests, 7); // 7 to allow for change..
      let inputEntries = await structs.getSpendableInputs(spendableInputs, 8);

      // Logger
      logger.log(`[Fuel Faucet] ${(new Date())} | input entries ${inputEntries.length} | output addresses ${outputAddresses.length}`);

      // Check if any requests..
      if (outputAddresses.length > 0) {
        let inputs = [];
        let outputs = [];

        let spendableInputChanges = [];
        let requestRemovals = [];
        let currentBalance = _utils.big(0);

        // Crafy inputs
        for (var inputIndex = 0; inputIndex < inputEntries.length; inputIndex++) {
          // Get DB key
          const inputType = inputEntries[inputIndex].key.substr(0, 4);

          // Based on DB key use deposit or utxo
          if (inputType === interfaces.FuelDBKeys.deposit) {
            const depositHashID = '0x' + inputEntries[inputIndex].key
              .slice(utxoDBKeyLength).toLowerCase();
            const deposit = await structs.getDeposit(spendableInputs, depositHashID);

            // Get UTXO increase balance amount
            currentBalance = currentBalance.add(deposit.proof.amount);

            // Add input to spendables..
            inputs.push(new structs.TransactionInputDeposit({
              depositHashID,
              witnessReference: 0,
            }));

            // Remove Input from Available spendable inputs..
            spendableInputChanges.push({
              type: 'del',
              key: interfaces.FuelDBKeys.deposit + depositHashID.slice(2),
            });
          } else {
            const utxoID = '0x' + inputEntries[inputIndex].key
              .slice(utxoDBKeyLength).toLowerCase();
            const utxo = await structs.getUTXO(spendableInputs, utxoID);

            // Get UTXO increase balance amount
            currentBalance = currentBalance.add(utxo.proof.amount);

            // Change
            if (utxo.proof.type === interfaces.FuelInputTypes.Change) {
              inputs.push(new structs.TransactionInputChange({
                utxoID: utxoID,
                witnessReference: 0,
              }));
            }

            // UTXO
            if (utxo.proof.type === interfaces.FuelInputTypes.UTXO) {
              inputs.push(new structs.TransactionInputUTXO({
                utxoID: utxoID,
                witnessReference: 0,
              }));
            }

            // Remove Input from Available spendable inputs..
            spendableInputChanges.push({
              type: 'del',
              key: interfaces.FuelDBKeys.UTXO + utxoID.slice(2),
            });
          }
        }

        // Index Items
        for (var index = 0; index < outputAddresses.length; index++) {
          // Ip and address
          const { key, address } = outputAddresses[index];

          // Add to removals
          requestRemovals.push({
            type: 'del',
            key,
          });

          // Craft 7 outputs
          outputs.push(new structs.TransactionOutputUTXO({
            amount,
            tokenID,
            owner: address,
          }));

          // Get UTXO increase balance amount
          currentBalance = currentBalance.sub(amount);
        }

        // No balance check..
        if (currentBalance.lte(0)) {
          throw new Error('Low or no balance!!');
        }

        // Current balance
        outputs.push(new structs.TransactionOutputChange({
          amount: currentBalance,
          tokenID,
          ownerAsWitnessIndex: 0,
        }));

        // Create Unsigned Transaction payload
        const unsignedTransaction = new structs.TransactionUnsigned({
          inputs,
          outputs,
        });

        // Post in
        try {
          // Attempt transaction intake, foils complex tx dependency ordering attack
          await intakeTransaction({
            transaction: unsignedTransaction.rlp([
              new structs.TransactionWitness(structs.constructWitness(unsignedTransaction, signerKey))
            ]),
            db: db,
            mempool: mempool,
            accounts: accounts,
            force: true, // accept without considering fees..
            batchAll: true,
            pubnub,
          });
        } catch (error) {
          console.log(error);
          throw new Error('Intake error!');
        }

        const spendableInput = new structs.UTXOProof({
          transactionHashId: unsignedTransaction.hash,
          outputIndex: outputs.length - 1, // i.e. last change output
          type: interfaces.FuelInputTypes.Change,
          amount: currentBalance,
          tokenID,
          owner: 0,
        });

        // Spendable Inputs
        spendableInputChanges.push({
          type: 'put',
          key: interfaces.FuelDBKeys.UTXO + spendableInput.hash.slice(2),
          value: spendableInput.rlp(),
        });

        // Remove all request tickets
        await spendableInputs.batch(spendableInputChanges); // Remove inputs spent
        await requests.batch(requestRemovals); // Remove request

        // Clear
        inputs = null;
        outputs = null;
        spendableInputChanges = null;
        requestRemovals = null;
      }
    } catch (error) {
      console.error(error);
      logger.error(error);
    }

    // Wait
    await _utils.wait(1000);
  }
};

module.exports = faucet;

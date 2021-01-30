const { struct } = require('@fuel-js/struct');
const utils = require('@fuel-js/utils');

const WithdrawProof = struct(
  `uint256 rootIndex,
  bytes32 transactionLeafHash,
  uint256 outputIndex`
);

const Withdraw = struct(`address account,
  address tokenAddress,
  uint256 amount,
  uint256 blockHeight,
  uint256 rootIndex,
  bytes32 transactionLeafHash,
  uint8 outputIndex,
  uint256 transactionIndex`);

function computeWithdrawId(rootIndex, transactionLeafHash, outputIndex) {
  return utils.keccak256(
    utils.hexZeroPad(utils.hexlify(rootIndex), 32)
     + utils.hexZeroPad(transactionLeafHash, 32).slice(2)
     + utils.hexZeroPad(utils.hexlify(outputIndex), 32).slice(2)
  );
}

module.exports = {
  WithdrawProof,
  Withdraw,
  computeWithdrawId,
};

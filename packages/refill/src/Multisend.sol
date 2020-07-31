pragma solidity ^0.5.11;

contract Multisend {
    constructor(uint256[] memory amounts, address payable[] memory recipients) public payable {
        require(amounts.length == recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            recipients[i].transfer(amounts[i]);
        }
        selfdestruct(msg.sender);
    }
}

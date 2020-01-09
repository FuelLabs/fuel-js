pragma solidity ^0.5.1;

contract Proxy {
  event AuthorizationChange(address authorized);

  address public owner; // owner cannot be changed past construction
  address public authorized; // authorized is a hot key

  constructor(address _owner) public {
    owner = _owner;
  }

  function changeAuthorized(address _authorized) external {
    assert(msg.sender == owner);
    authorized = _authorized;
    emit AuthorizationChange(_authorized);
  }

  function transact(address dest, uint256 value, bytes calldata data) external {
    assert(msg.sender == authorized);
    assert(dest.call.value(value)(data));
  }
}

contract ProxyFactory {
  event ProxyCreated(address proxy);

  function create() {
    address proxy = address(new Proxy(msg.sender));
    emit ProxyCreated(proxy);
  }
}

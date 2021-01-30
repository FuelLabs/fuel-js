object "Revert" {
  code {
    datacopy(0, dataoffset("Runtime"), datasize("Runtime"))
    return(0, datasize("Runtime"))
  }
  object "Runtime" {
    code {
function require(arg, message) {
  if lt(arg, 1) {
    mstore(0, message)
    revert(0, 32)
  }
}

function mslice(position, length) -> result {
  result := div(mload(position), exp(2, sub(256, mul(length, 8))))
}

      calldatacopy(0, 0, calldatasize())

      switch mslice(0, 4)

      /// @dev Return a valid balance.
      case 0x70a08231 {
        mstore(0, 5000)
        return (0, 32)
      }

      /// @dev Revert on transfer.
      case 0xa9059cbb {
        require(0, 0x01)
      }

      /// @dev Attempt double deposit (i.e. same block.).
      case 0x352e6552 {
        calldatacopy(0, 4, calldatasize())
        let fuelAddress := mload(0)
        let ownerAddress := mload(32)
        let tokenAddress := mload(64)

        // We commit our first witness.
        mstore(0, 0xf9609f08) mstore(add(0,32), ownerAddress) mstore(add(0,64), tokenAddress)
        require(call(gas(), fuelAddress, 0, 28, 68, 0, 0), 0x02)

        // Attempt same deposit in the same block. should throw.
        require(call(gas(), fuelAddress, 0, 28, 68, 0, 0), 0x03)
      }

      /// @dev Attempt double witness commitment (i.e. same block, same data, same caller).
      case 0x4c97815b {
        calldatacopy(0, 4, calldatasize())
        let fuelAddress := mload(0)
        let witness := mload(32)

        // We commit our first witness.
        mstore(0, 0xcc4c0b4b) mstore(add(0,32), witness)
        require(call(gas(), fuelAddress, 0, 28, 36, 0, 0), 0x02)

        // In the same block we commit the same witness, this should fail, we flag: already-committed.
        require(call(gas(), fuelAddress, 0, 28, 36, 0, 0), 0x04)
      }

      /// @dev Invaid Signature.
      default {
        require(0, 0x05)
      }
    }
  }
}
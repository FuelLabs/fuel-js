object "OwnedProxy" {
  code {
        function safeAdd(x, y) -> z {
          z := add(x, y)
          require(or(eq(z, x), gt(z, x)), 0)
        }
        
        function safeSub(x, y) -> z {
          z := sub(x, y)
          require(or(eq(z, x), lt(z, x)), 0)
        }
        
        function safeMul(x, y) -> z {
          if gt(y, 0) {
            z := mul(x, y)
            require(eq(div(z, y), x), 0)
          }
        }
        
          function safeDiv(x, y) -> z {
            require(gt(y, 0), 0)
            z := div(x, y)
          }
          
function require(arg, message) {
  if lt(arg, 1) {
    mstore(0, message)
    revert(0, 32)
  }
}

    // Storage indexes
    

    // Register constructor with compiler
    let _constructor := 0x00

    // Store hot address in state
    codecopy(0, safeSub(codesize(), 64), 32)
    sstore(0, mload(0))

    // To Runtime (32 additional for the constructor argument operator)
    datacopy(0, dataoffset("Runtime"), safeAdd(datasize("Runtime"), 64))
    return(0, safeAdd(datasize("Runtime"), 64))
  }
  object "Runtime" {
    code {
  function gte(x, y) -> result {
    if or(gt(x, y), eq(x, y)) {
      result := 0x01
    }
  }
  
        function safeAdd(x, y) -> z {
          z := add(x, y)
          require(or(eq(z, x), gt(z, x)), 0)
        }
        
        function safeSub(x, y) -> z {
          z := sub(x, y)
          require(or(eq(z, x), lt(z, x)), 0)
        }
        
        function safeMul(x, y) -> z {
          if gt(y, 0) {
            z := mul(x, y)
            require(eq(div(z, y), x), 0)
          }
        }
        
          function safeDiv(x, y) -> z {
            require(gt(y, 0), 0)
            z := div(x, y)
          }
          
function require(arg, message) {
  if lt(arg, 1) {
    mstore(0, message)
    revert(0, 32)
  }
}

function mslice(position, length) -> result {
  result := div(mload(position), exp(2, sub(256, mul(length, 8))))
}

      // if no calldata stop
      if iszero(calldatasize()) { stop() }

      // Storage indexes
      

      // Copy cold key from contract bytes to memory, than to stack
      codecopy(0, safeSub(codesize(), 32), 32)
      let cold := mload(0)

      // Load hot key from storage into stack
      let hot := sload(0)

      // Copy calldata signature to memory
      calldatacopy(0, 0, 4)
      switch mslice(0, 4)

      /// @notice Hot wallet may use transact to make transactions
      /// @param destination the destination address of the transaction
      /// @param value the value of the transaction
      /// @param data the bytes data of the transaction
      case 0xc4627c5d {
        // Check calldataize underflow.
        require(gte(calldatasize(), 68), 0x01)
        require(or(eq(caller(), hot), eq(caller(), cold)), 0x02)
        
        // Copy dest to mem.
        calldatacopy(0, 4, calldatasize())

        // Caller must be cold, otherwise dest must be target.
        // Re-entrancy protection for hot wallet.
        require(or(
          eq(caller(), cold),
          eq(mload(0), sload(1))
        ), 0x03)

        // Copy transaction data to memory except the 4 byte sig, make call.
        require(call(gas(), mload(0), mload(32), safeAdd(mload(64), 32), mload(96), 0, 0),
          0x04)
      }

      /// @notice Only the cold wallet may change the hot wallet address
      /// @param hot the address of the hot wallet
      case 0x776d1a01 {
        // Check calldata size and enforce caller be only the cold wallet
        require(eq(calldatasize(), 36), 0x05)
        require(eq(caller(), cold), 0x06)

        // Copy new hot address from calldata, put it in storage
        calldatacopy(0, 4, 32)
        sstore(1, mload(0))
      }

      /// @notice Only the cold wallet may change the hot wallet address
      /// @param hot the address of the hot wallet
      case 0x1e77933e {
        // Check calldata size and enforce caller be only the cold wallet
        require(eq(calldatasize(), 36), 0x05)
        require(eq(caller(), cold), 0x06)

        // Copy new hot address from calldata, put it in storage
        calldatacopy(0, 4, 32)
        sstore(0, mload(0))
      }

      // Revert on no valid signature.
      default {
        revert(0, 0)
      }

      // Stop all execution
      stop()
    }
  }
}
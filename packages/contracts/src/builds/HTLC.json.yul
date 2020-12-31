object "HTLC" {
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

    // Register constructor with compiler
    let _constructor := 0x00

    // To Runtime (32 additional for the constructor argument operator)
    datacopy(0, dataoffset("Runtime"), safeAdd(datasize("Runtime"), 32))
    return(0, safeAdd(datasize("Runtime"), 32))
  }
  object "Runtime"   {
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

    

    /// @notice Compute storage key for single-element object.
    /// @return Key as bytes32
    function mappingKey(storageIndex, key) -> storageKey {
        mstore(0, storageIndex) mstore(add(0,32), key)
        storageKey := keccak256(0, 64)
    }

    /// @notice Compute storage key for two-element object.
    /// @return Key as bytes32
    function mappingKey2(storageIndex, key, key2) -> storageKey {
        mstore(0, storageIndex) mstore(add(0,32), key) mstore(add(0,64), key2)
        storageKey := keccak256(0, 96)
    }

    /// @notice Compute storage key for three-element object.
    /// @return Key as bytes32
    function mappingKey3(storageIndex, key, key2, key3) -> storageKey {
        mstore(0, storageIndex) mstore(add(0,32), key) mstore(add(0,64), key2) mstore(add(0,96), key3)
        storageKey := keccak256(0, 128)
    }
  
      // We use the zero value to represent the Ether token
      

      // Get the operator from constructor
      codecopy(0, safeSub(codesize(), 32), 32)
      let operator := mload(0)

      // State Indexes
      

      // Calldata Signature
      calldatacopy(0, 0, 4)
      switch mslice(0, 4)

      /// @notice Operator can register a hash time lock from existing ether / ERC20 balance in contract
      /// @param owner the account that will receive funds upon successful preimage presentation
      /// @param token the ERC20 token address, or zero / null address for Ether
      /// @param digest the hash digest (digest === keccak256(preImage))
      /// @param expiry the HTLC expiry block number in ethereum block numbers
      /// @param amount the amount to lock for the HTLC
      case 0x2b660100 {
        // Copy calldata arguments to memory from the signature onward
        calldatacopy(0, 4, 160)

        // Build the release hash from calldata
        let hash := keccak256(0, 160)

        // Token address to stack
        let token := mload(32)
        let amount := mload(128)

        // Log Registered event
        log2(0, 0, 0x10906fae603eebfac53ddc0f103bee8a044dd7643c425c7a90f921dfa15ef62c, hash)

        // Total new locked balance to stack
        let totalBalanceLocked := safeAdd(sload(mappingKey(0, token)), amount)

        // Ensure the caller is the operator
        require(eq(operator, caller()), 0x01)

        // Handle token cases
        switch token

        // Token is Ether
        case 0 {
          // Ensure Ether balance >= new total
          require(gte(balance(address()), totalBalanceLocked),
            0x02)
        }

        // Token is an ERC20
        default {
          // get ERC20 balance of from toen
          mstore(0, 0x70a08231) mstore(add(0,32), address())
          require(call(gas(), token, 0, 28, 36, 0, 32), 0x03)
          let tokenBalance := mload(0)

          // Ensure balance >= new total
          require(gte(tokenBalance, totalBalanceLocked),
            0x04)
        }

        // Notate new hash in storage and remap total locked for toen
        sstore(mappingKey(1, hash), 0x01)
        sstore(mappingKey(0, token), totalBalanceLocked)
      }

      /// @notice Release a hash timelock
      /// @param owner the account that will receive funds upon successful preimage presentation
      /// @param token the ERC20 token address, or zero / null address for Ether
      /// @param digest the hash digest (digest === keccak256(preImage))
      /// @param expiry the HTLC expiry block number in ethereum block numbers
      /// @param amount the amount to send for the contract
      /// @param preimage the HTLC pre-image of the digest
      case 0xa49f2c25 {
        // Copy calldata to memory from signature onward
        calldatacopy(0, 4, 160)

        // Build release hash from calldata
        let hash := keccak256(0, 160)

        // Log Registered event
        log2(0, 0, 0x6eec2dd2382427616d4ea7ef183b16091feac4e2e63c8b55f25215f132df8d14, hash)

        // Build cases of is HTLC expired or preimage provded correct
        let expired := gt(number(), mload(128))
        let correct := eq(keccak256(160, 32), mload(64))

        // Move aspects of calldata to stack
        let owner := mload(0)
        let amount := mload(128)
        let token := mload(32)

        // Calculate new token lock totals from state
        let totalBalanceLocked := safeSub(sload(mappingKey(0, token)), amount)

        // Ensure hash is registered
        require(sload(mappingKey(1, hash)), 0x05)

        // Ensure contract is expired or pre-image is correct
        require(or(expired, correct), "expired-or-preimage")

        // If the HTLC is not expired, than pre-image must be correct, do release sequence
        if iszero(expired) {
          switch token

          // If the token is Ether
          case 0 {
            require(call(gas(), owner, amount, 0, 0, 0, 0), 0x06)
          }

          // If the token is an ERC20
          default {
            mstore(0, 0xa9059cbb) mstore(add(0,32), owner) mstore(add(0,64), amount)
            require(call(gas(), token, 0, 28, 68, 0, 0), 0x07)
          }
        }

        // Store new totals for this token
        sstore(mappingKey(0, token), totalBalanceLocked)

        // Clear hash from memory
        sstore(mappingKey(1, hash), 0x00)
      }

      /// @notice Registered getter
      /// @param owner the account that will receive funds upon successful preimage presentation
      /// @returns notReleased a bool is this hash released or not
      case 0x5524d548 {
        calldatacopy(0, 4, 32)
        mstore(0, sload(mappingKey(1, mload(0))))
        return(0, 32)
      }

      /// @notice locked balance getter
      /// @param token the token to specify locked balance
      /// @returns balanceLocked the total balance locked for the specified token
      case 0xcbf9fe5f {
        calldatacopy(0, 4, 32)
        mstore(0, sload(mappingKey(0, mload(0))))
        return(0, 32)
      }

      /// @notice locked balance getter
      /// @return returns the liquidity provider oprerator address
      case 0x570ca735 {
        mstore(0, operator)
        return(0, 32)
      }

      // Stop execution
      stop()
    }
  }
}
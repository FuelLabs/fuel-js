object "HTLCFactory" {
  code {
    // To Runtime
    datacopy(0, dataoffset("Runtime"), datasize("Runtime"))
    return(0, datasize("Runtime"))
  }
  object "Runtime" {
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

function mslice(position, length) -> result {
  result := div(mload(position), exp(2, sub(256, mul(length, 8))))
}

      // The HTLC contract code
      
      
      
      
      

      // The HTLC create2 salt
      

      /// @notice Create an HTLC contract
      function createHTLC(owner, destination, token, digest, expiry, amount) -> addr {
        // Assign the contract code and constructor arguments to memory
        mstore(0, 0x61012380600f600039806000f350fe600060c4606e8239805160805143111515) mstore(add(0,32), 0x6032576020600460c437606051602060c420141515602c578182fd5b60205190) mstore(add(0,64), 0x505b60405115605a5763a9059cbb60c4528060e45260a0516101045281826044) mstore(add(0,96), 0x60e0856040515af1505b80ff5050000000000000000000000000000000000000)
        mstore(safeAdd(110, 0), owner)
        mstore(safeAdd(110, 32), destination)
        mstore(safeAdd(110, 64), token)
        mstore(safeAdd(110, 96), digest)
        mstore(safeAdd(110, 128), expiry)
        mstore(safeAdd(110, 160), amount)
        addr := create2(0, 0, safeAdd(110, 196), 0xa46ff7e2eb85eecf4646f2c151221bcd9c079a3dcb63cb87962413cfaae53947)

        // log HTLC created
        log2(0, 0,
          0x1449abf21e49fd025f33495e77f7b1461caefdd3d4bb646424a3f445c4576a5b,
          addr)
      }

      /// @notice Calculate an HTLC contract address
      function calculateHTLCAddress(owner, destination, token, digest, expiry, amount) -> addr {
        // Assign the contract code and constructor arguments to memory
        mstore(0, 0x61012380600f600039806000f350fe600060c4606e8239805160805143111515) mstore(add(0,32), 0x6032576020600460c437606051602060c420141515602c578182fd5b60205190) mstore(add(0,64), 0x505b60405115605a5763a9059cbb60c4528060e45260a0516101045281826044) mstore(add(0,96), 0x60e0856040515af1505b80ff5050000000000000000000000000000000000000)
        mstore(safeAdd(110, 0), owner)
        mstore(safeAdd(110, 32), destination)
        mstore(safeAdd(110, 64), token)
        mstore(safeAdd(110, 96), digest)
        mstore(safeAdd(110, 128), expiry)
        mstore(safeAdd(110, 160), amount)

        // Build construction params
        mstore(53, keccak256(0, safeAdd(110, 196)))
        mstore8(0, 0xff)
        mstore(1, shl(96, address()))
        mstore(21, 0xa46ff7e2eb85eecf4646f2c151221bcd9c079a3dcb63cb87962413cfaae53947)

        // Address from create2 hash
        addr := shr(96, shl(96, keccak256(0, 85)))
      }

      // Handle Signatures
      calldatacopy(0, 0, 4)
      switch mslice(0, 4)

      /// @notice Create a Hash Time Lock Contract (HTLC)
      /// @param returnOwner the return owner of the hash time lock contract
      /// @param owner the account that will receive funds upon successful preimage presentation
      /// @param token the ERC20 token address, or zero / null address for Ether
      /// @param digest the hash digest (digest === keccak256(preImage))
      /// @param expiry the HTLC expiry block number in ethereum block numbers
      /// @param the amount to send for the contract
      case 0x536280b9 {
        // Copy necessary calldata arguments into memory past the 4 byte method signature
        calldatacopy(0, 4, 196)

        // Create the hash time lock contract
        let htlcAddress := createHTLC(
          mload(0),
          mload(32),
          mload(64),
          mload(96),
          mload(128),
          mload(160))

        // Return the HTLC address
        mstore(0, htlcAddress)
        return (0, 32)
      }

      /// @notice Create and execute the Hash Time Lock Contract (HTLC)
      /// @param returnOwner the return owner of the hash time lock contract
      /// @param owner the account that will receive funds upon successful preimage presentation
      /// @param token the ERC20 token address, or zero / null address for Ether
      /// @param digest the hash digest (digest === keccak256(preImage))
      /// @param expiry the HTLC expiry block number in ethereum block numbers
      /// @param preimage provide the pre-image to execute the htlc contract
      /// @param the amount to send for the contract
      case 0x3194a39b {
        // Copy calldata into memory past the 4 byte method signature
        calldatacopy(0, 4, 196)

        // Load the preimage into stack, do this before createHTLC sequence for memory saftey
        let preImage := mload(196)

        // Create the Hash Time Lock Contract
        let htlcAddress := createHTLC(
          mload(0),
          mload(32),
          mload(64),
          mload(96),
          mload(128),
          mload(160))

        // Call the HTLC contract with the preimage
        mstore(4, preImage)
        let success := call(gas(), htlcAddress, 0, 0, 36, 0, 0)

        // Return bool success
        mstore(0, success)
        return (0, 32)
      }

      /// @notice Calculate the HTLC address of a given contract
      /// @param returnOwner the return owner of the hash time lock contract
      /// @param owner the account that will receive funds upon successful preimage presentation
      /// @param token the ERC20 token address, or zero / null address for Ether
      /// @param digest the hash digest (digest === keccak256(preImage))
      /// @param expiry the HTLC expiry block number in ethereum block numbers
      /// @param the amount to send for the contract
      case 0xfb3589fd {
        // Copy calldata into memory past the 4 byte method signature
        calldatacopy(0, 4, 196)

        // Calculate the HTLC address
        let htlcAddress := calculateHTLCAddress(
          mload(0),
          mload(32),
          mload(64),
          mload(96),
          mload(128),
          mload(160))

        // Return the HTLC address
        mstore(0, htlcAddress)
        return (0, 32)
      }
    }
  }
}
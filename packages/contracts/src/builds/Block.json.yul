object "Block"   {
  code {
  function gte(x, y) -> result {
    if or(gt(x, y), eq(x, y)) {
      result := 0x01
    }
  }
  
  function lte(x, y) -> result {
    if or(lt(x, y), eq(x, y)) {
      result := 0x01
    }
  }
  
  function neq(x, y) -> result {
    result := iszero(eq(x, y))
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


function Constructor.name(pos) -> res {
  res := mslice(Constructor.name.position(pos), 32)
}



function Constructor.name.position(_pos) -> _offset {
  
      
        function Constructor.name.position._chunk0(pos) -> __r {
          __r := 0xa0
        }
      
        function Constructor.name.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Constructor.name.position._chunk0(_pos), add(Constructor.name.position._chunk1(_pos), 0))
    
}



function Constructor.operator.position(_pos) -> _offset {
  
      
        function Constructor.operator.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function Constructor.operator.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Constructor.operator.position._chunk0(_pos), add(Constructor.operator.position._chunk1(_pos), 0))
    
}



function Constructor.finalizationDelay.position(_pos) -> _offset {
  
      
        function Constructor.finalizationDelay.position._chunk0(pos) -> __r {
          __r := 0x20
        }
      
        function Constructor.finalizationDelay.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Constructor.finalizationDelay.position._chunk0(_pos), add(Constructor.finalizationDelay.position._chunk1(_pos), 0))
    
}



function Constructor.submissionDelay.position(_pos) -> _offset {
  
      
        function Constructor.submissionDelay.position._chunk0(pos) -> __r {
          __r := 0x40
        }
      
        function Constructor.submissionDelay.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Constructor.submissionDelay.position._chunk0(_pos), add(Constructor.submissionDelay.position._chunk1(_pos), 0))
    
}



function Constructor.penaltyDelay.position(_pos) -> _offset {
  
      
        function Constructor.penaltyDelay.position._chunk0(pos) -> __r {
          __r := 0x60
        }
      
        function Constructor.penaltyDelay.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Constructor.penaltyDelay.position._chunk0(_pos), add(Constructor.penaltyDelay.position._chunk1(_pos), 0))
    
}



function Constructor.bondSize.position(_pos) -> _offset {
  
      
        function Constructor.bondSize.position._chunk0(pos) -> __r {
          __r := 0x80
        }
      
        function Constructor.bondSize.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Constructor.bondSize.position._chunk0(_pos), add(Constructor.bondSize.position._chunk1(_pos), 0))
    
}



function Constructor.version(pos) -> res {
  res := mslice(Constructor.version.position(pos), 32)
}



function Constructor.version.position(_pos) -> _offset {
  
      
        function Constructor.version.position._chunk0(pos) -> __r {
          __r := 0xc0
        }
      
        function Constructor.version.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Constructor.version.position._chunk0(_pos), add(Constructor.version.position._chunk1(_pos), 0))
    
}



function RootHeader.keccak256(pos) -> _hash {
  _hash := keccak256(pos, RootHeader.size(pos))
}



function RootHeader.size(pos) -> _offset {
  _offset := sub(RootHeader.offset(pos), pos)
}



function RootHeader.offset(pos) -> _offset {
  _offset := RootHeader.fee.offset(pos)
}



function RootHeader.fee.offset(pos) -> _offset {
_offset := add(RootHeader.fee.position(pos), 32)
}



function RootHeader.fee.position(_pos) -> _offset {
  
      
        function RootHeader.fee.position._chunk0(pos) -> __r {
          __r := 0x94
        }
      
        function RootHeader.fee.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(RootHeader.fee.position._chunk0(_pos), add(RootHeader.fee.position._chunk1(_pos), 0))
    
}



function RootHeader.producer.position(_pos) -> _offset {
  
      
        function RootHeader.producer.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function RootHeader.producer.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(RootHeader.producer.position._chunk0(_pos), add(RootHeader.producer.position._chunk1(_pos), 0))
    
}



function RootHeader.merkleTreeRoot.position(_pos) -> _offset {
  
      
        function RootHeader.merkleTreeRoot.position._chunk0(pos) -> __r {
          __r := 0x14
        }
      
        function RootHeader.merkleTreeRoot.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(RootHeader.merkleTreeRoot.position._chunk0(_pos), add(RootHeader.merkleTreeRoot.position._chunk1(_pos), 0))
    
}



function RootHeader.commitmentHash.position(_pos) -> _offset {
  
      
        function RootHeader.commitmentHash.position._chunk0(pos) -> __r {
          __r := 0x34
        }
      
        function RootHeader.commitmentHash.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(RootHeader.commitmentHash.position._chunk0(_pos), add(RootHeader.commitmentHash.position._chunk1(_pos), 0))
    
}



function RootHeader.length.position(_pos) -> _offset {
  
      
        function RootHeader.length.position._chunk0(pos) -> __r {
          __r := 0x54
        }
      
        function RootHeader.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(RootHeader.length.position._chunk0(_pos), add(RootHeader.length.position._chunk1(_pos), 0))
    
}



function RootHeader.feeToken.position(_pos) -> _offset {
  
      
        function RootHeader.feeToken.position._chunk0(pos) -> __r {
          __r := 0x74
        }
      
        function RootHeader.feeToken.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(RootHeader.feeToken.position._chunk0(_pos), add(RootHeader.feeToken.position._chunk1(_pos), 0))
    
}



function Constructor.finalizationDelay(pos) -> res {
  res := mslice(Constructor.finalizationDelay.position(pos), 32)
}



function Constructor.operator(pos) -> res {
  res := mslice(Constructor.operator.position(pos), 32)
}



function Constructor.bondSize(pos) -> res {
  res := mslice(Constructor.bondSize.position(pos), 32)
}



function Constructor.submissionDelay(pos) -> res {
  res := mslice(Constructor.submissionDelay.position(pos), 32)
}



function BlockHeader.keccak256(pos) -> _hash {
  _hash := keccak256(pos, BlockHeader.size(pos))
}



function BlockHeader.size(pos) -> _offset {
  _offset := sub(BlockHeader.offset(pos), pos)
}



function BlockHeader.offset(pos) -> _offset {
  _offset := BlockHeader.roots.offset(pos)
}



function BlockHeader.roots.offset(pos) -> _offset {
_offset := add(BlockHeader.roots.position(pos), mul(BlockHeader.roots.length(pos), 32))
}



function BlockHeader.roots.length(pos) -> res {
  res := mslice(BlockHeader.roots.length.position(pos), 2)
}



function BlockHeader.roots.length.position(_pos) -> _offset {
  
      
        function BlockHeader.roots.length.position._chunk0(pos) -> __r {
          __r := 0xb4
        }
      
        function BlockHeader.roots.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(BlockHeader.roots.length.position._chunk0(_pos), add(BlockHeader.roots.length.position._chunk1(_pos), 0))
    
}



function BlockHeader.producer.position(_pos) -> _offset {
  
      
        function BlockHeader.producer.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function BlockHeader.producer.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(BlockHeader.producer.position._chunk0(_pos), add(BlockHeader.producer.position._chunk1(_pos), 0))
    
}



function BlockHeader.previousBlockHash.position(_pos) -> _offset {
  
      
        function BlockHeader.previousBlockHash.position._chunk0(pos) -> __r {
          __r := 0x14
        }
      
        function BlockHeader.previousBlockHash.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(BlockHeader.previousBlockHash.position._chunk0(_pos), add(BlockHeader.previousBlockHash.position._chunk1(_pos), 0))
    
}



function BlockHeader.height.position(_pos) -> _offset {
  
      
        function BlockHeader.height.position._chunk0(pos) -> __r {
          __r := 0x34
        }
      
        function BlockHeader.height.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(BlockHeader.height.position._chunk0(_pos), add(BlockHeader.height.position._chunk1(_pos), 0))
    
}



function BlockHeader.blockNumber.position(_pos) -> _offset {
  
      
        function BlockHeader.blockNumber.position._chunk0(pos) -> __r {
          __r := 0x54
        }
      
        function BlockHeader.blockNumber.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(BlockHeader.blockNumber.position._chunk0(_pos), add(BlockHeader.blockNumber.position._chunk1(_pos), 0))
    
}



function BlockHeader.numTokens.position(_pos) -> _offset {
  
      
        function BlockHeader.numTokens.position._chunk0(pos) -> __r {
          __r := 0x74
        }
      
        function BlockHeader.numTokens.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(BlockHeader.numTokens.position._chunk0(_pos), add(BlockHeader.numTokens.position._chunk1(_pos), 0))
    
}



function BlockHeader.numAddresses.position(_pos) -> _offset {
  
      
        function BlockHeader.numAddresses.position._chunk0(pos) -> __r {
          __r := 0x94
        }
      
        function BlockHeader.numAddresses.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(BlockHeader.numAddresses.position._chunk0(_pos), add(BlockHeader.numAddresses.position._chunk1(_pos), 0))
    
}



function BlockHeader.roots.position(_pos) -> _offset {
  
      
        function BlockHeader.roots.position._chunk0(pos) -> __r {
          __r := 0xb6
        }
      
        function BlockHeader.roots.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(BlockHeader.roots.position._chunk0(_pos), add(BlockHeader.roots.position._chunk1(_pos), 0))
    
}


    

    function mul32(x) -> result {
      result := safeMul(x, 32)
    }

    function eqor(x, y, z) -> result {
      result := or(eq(x, y), eq(x, z))
    }

    function round32(x) -> result {
      result := safeMul(safeDiv(x, 32), 32)

      if lt(result, x) {
        result := safeAdd(x, 32)
      }
    }

    function transfer(amount, token, owner) {
      require(gt(amount, 0), 0x01)
      require(gt(owner, 0), 0x02)
      require(gte(token, 0), 0x03)

      switch token

      case 0 {
        require(call(gas(), owner, amount, 0, 0, 0, 0), 0x04)
      }

      default {
        mstore(0, 0xa9059cbb) mstore(add(0,32), owner) mstore(add(0,64), amount)
        require(call(gas(), token, 0, 28, 68, 0, 32), 0x05)
        require(gt(mload(0), 0), 0x06)
      }
    }
  
    

    let Constructor.abi := 0x00

    

    function Constructor.copy(pos) {
      codecopy(pos, safeSub(codesize(), 416), 416)
    }

    function Constructor.verify(pos) {
      let nameLen := mload(Constructor.name(0))
      let versionLen := mload(Constructor.version(0))

      require(and(gt(nameLen, 0), lte(nameLen, 32)), "name-length")
      require(and(gt(versionLen, 0), lte(versionLen, 32)), "version-length")
    }

    function Constructor.name.copy(cpos, pos) {
      let len := mload(Constructor.name(cpos))
      let val := mload(safeAdd(Constructor.name(cpos), 32))
      mstore(pos, 32) mstore(add(pos,32), len) mstore(add(pos,64), val)
    }

    function Constructor.name.hash(pos) -> hash {
      hash := keccak256(safeAdd(safeAdd(pos, 256), 64), mload(Constructor.name(pos)))
    }

    function Constructor.version.copy(cpos, pos) {
      let len := mload(Constructor.version(cpos))
      let val := mload(safeAdd(Constructor.version(cpos), 32))
      mstore(pos, 32) mstore(add(pos,32), len) mstore(add(pos,64), val)
    }

    function Constructor.version.hash(pos) -> hash {
      hash := keccak256(safeAdd(safeAdd(pos, 320), 64), mload(Constructor.version(pos)))
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
  
    
    

    /// @notice Get number of registered tokens.
    /// @return Number of tokens as uint256
    function numTokens() -> num {
      num := sload(2)
    }

    /// @notice Get ID of registered token.
    /// @return ID of token as uint256
    function tokenId(addr) -> id {
      id := sload(mappingKey(7, addr))
    }

    /// @notice Register a new token with a sequentially assigned ID.
    function indexToken(addr, id) {
      sstore(mappingKey(7, addr), id)
      sstore(2, safeAdd(id, 1))
      log3(0, 0,
          0x73c163cd50614894c0ab5238e0e9a17a39bbc4a6c5dc6a2cac9dd95f319f1c48,
          addr,
          id)
    }

    /// @notice Return ID of token, assigning a new one if necessary.
    /// @return ID of token as uint256
    function commitToken(addr) -> id {
      id := tokenId(addr)

      if and(neq(addr, 0), iszero(id)) {
        id := numTokens()

        // here we enforce the token ID maximum, keeping token ID's under 4 bytes in length
        require(lt(id, 0xFFFFFFFF), 0x07)
        indexToken(addr, id)
      }
    }
  
    // Maximum size of list of transactions, in bytes
    
    // Maximum number of transactions in list of transactions
    

    /// @notice Transaction root header object. Contains Merkle tree root and important metadata.
    

    /// @notice Get block number of a registered root.
    /// @return Ethereum block number the root was registered at as uin256
    function rootBlockNumberAt(root) -> blockNumber {
      blockNumber := sload(mappingKey(3, root))
    }

    /// @notice Clear a registered root from storage.
    function clearRoot(root) {
      sstore(mappingKey(3, root), 0)
    }

    function commitRoot(merkleTreeRoot, commitmentHash, length, token, fee) {
      // Caller/msg.sender must not be a contract
      require(eq(origin(), caller()), 0x08)
      require(eq(extcodesize(caller()), 0), 0x09)

      // Calldata size must be at least as big as the minimum transaction size (44 bytes)
      require(gte(length, 44), 0x0a)
      // Calldata max size enforcement (~2M gas / 16 gas per byte/64kb payload target)
      require(lte(length, 32000), 0x0b)
      require(lte(calldatasize(), safeAdd(32000, mul32(6))), 0x0c)

      // Fee token must be already registered
      require(gte(token, 0), 0x0d)
      require(lt(token, numTokens()), 0x0e)

      // Build root
      mstore(0, caller()) mstore(add(0,32), merkleTreeRoot) mstore(add(0,64), commitmentHash) mstore(add(0,96), length) mstore(add(0,128), token) mstore(add(0,160), fee)
      // Hash the block header with an offset of 12 bytes, since first field is a 32-12=20 byte address.
      let root := RootHeader.keccak256(12)

      // Root must not have been registered yet
      let rootBlockNumber := sload(mappingKey(3, root))
      require(eq(rootBlockNumber, 0), 0x0f)

      // Register root with current block number
      sstore(mappingKey(3, root), number())

      // Store caller in data
      mstore(0, caller()) mstore(add(0,32), token) mstore(add(0,64), fee) mstore(add(0,96), length)
      log4(
        0,
        mul32(4),
        0xcedb4993325661af27ac77872d7b5433cef3ca1036245c261019fd999310dee3,
        root,
        merkleTreeRoot,
        commitmentHash
      )
    }
  
    

    /// @notice Get number of registered addresses.
    /// @return Number of addresses as uint256
    function numAddresses() -> num {
      num := sload(8)
    }

    /// @notice Get ID of registered address.
    /// @return ID of address as uint256
    function addressId(addr) -> id {
      id := sload(mappingKey(9, addr))
    }

    /// @notice Register a new address with a sequentially assigned ID.
    function indexAddress(addr, id) {
      sstore(mappingKey(9, addr), id)
      sstore(8, safeAdd(id, 1))
      log3(0, 0,
          0xa9434c943c361e848a4336c1b7068a71a438981cb3ad555c21a0838f3d5b5f53,
          addr,
          id)
    }

    /// @notice Return ID of address, assigning a new one if necessary.
    /// @return ID of address as uint256
    function commitAddress(addr) -> id {
      id := addressId(addr)

      if and(neq(addr, 0), iszero(id)) {
        id := numAddresses()
        indexAddress(addr, id)
      }
    }
  
    

    /// @notice Block header object
    

    /// @notice Helper function to get finalization delay, extracted from constructor.
    /// @return Finalization delay in Ethereum blocks as uint256
    function FINALIZATION_DELAY() -> delay {
      Constructor.copy(0)
      delay := Constructor.finalizationDelay(0)
    }

    /// @notice Get rollup block tip (i.e. current height).
    /// @return Block tip as uint256
    function blockTip() -> blockNumber {
      blockNumber := sload(6)
    }

    /// @notice Get rollup blockhash for given rollup block height.
    /// @return Blockhash as bytes32
    function blockCommitment(blockHeight) -> blockHash {
      blockHash := sload(mappingKey(1, blockHeight))
    }

    /// @notice Get penalty block number. The operator is penalized until this block number.
    /// @return Ethereum block number as uint256
    function getPenalty() -> blockNumber {
      blockNumber := sload(0)
    }

    /// @notice Set penalty block number as delay from current block number. The operator is penalized until this block number.
    function setPenalty(delay) {
      sstore(0, safeAdd(number(), delay))
    }

    /// @notice Commits a new rollup block.
    function commitBlock(minBlockNumber, minBlockHash, height, rootsLength, rootsPosition) {
      let _blockTip := blockTip()
      let previousBlockHash := blockCommitment(safeSub(height, 1))

      // To avoid Ethereum re-org attacks, commitment transactions include a minimum
      //  Ethereum block number and block hash. Check will fail if transaction is > 256 block old.
      require(gt(number(), minBlockNumber), 0x10)
      require(eq(blockhash(minBlockNumber), minBlockHash), 0x11)

      // Check that new rollup blocks builds on top of the tip
      require(eq(height, safeAdd(_blockTip, 1)), 0x12)

      // Require at least one root submission
      require(gt(rootsLength, 0), 0x13)

      // Require at most the maximum number of root submissions
      require(lte(rootsLength, 128), 0x14)

      // Get the rollup operator
      Constructor.copy(0)
      let producer := Constructor.operator(0)

      // Require value be bond size
      require(eq(callvalue(), Constructor.bondSize(0)), 0x15)

      // Clear submitted roots from storage
      for { let rootIndex := 0 } lt(rootIndex, rootsLength) { rootIndex := safeAdd(rootIndex, 1) } {
        let rootHash := mload(safeAdd(rootsPosition, safeMul(rootIndex, 32)))
        let rootBlockNumber := rootBlockNumberAt(rootHash)

        // Check root exists
        require(gt(rootBlockNumber, 0), 0x16)

        // Check whether block producer has the right to commit rollup block
        // In penalty mode (second condition is true), anyone can commit a block with roots without delay
        // In normal mode (second condition is false), only the operator can commit a block before waiting the root delay
        if and(lt(number(), safeAdd(rootBlockNumber, Constructor.submissionDelay(0))),
          gt(number(), getPenalty())) {
          require(eq(caller(), producer), 0x17)
        }

        // Clear root from storage
        clearRoot(rootHash)
      }

      // Build a BlockHeader object
      mstore(safeSub(rootsPosition, 34), numAddresses())
      mstore(safeSub(rootsPosition, 66), numTokens())
      mstore(safeSub(rootsPosition, 98), number())
      mstore(safeSub(rootsPosition, 130), height)
      mstore(safeSub(rootsPosition, 162), previousBlockHash)
      mstore(safeSub(rootsPosition, 194), caller())
      sstore(
        mappingKey(1, height),
        BlockHeader.keccak256(safeSub(rootsPosition, 182))
      )

      // Save new rollup block height as the tip
      sstore(6, height)

      // Build log out of calldata
      mstore(safeSub(rootsPosition, 160), caller())
      mstore(safeSub(rootsPosition, 128), numTokens())
      mstore(safeSub(rootsPosition, 96), numAddresses())
      mstore(safeSub(rootsPosition, 64), 128)
      mstore(safeSub(rootsPosition, 32), rootsLength)
      log3(
        safeSub(rootsPosition, 160),
        safeAdd(160, mul32(rootsLength)),
        0x2521e5f2f7ee2cc8938e535746c063cc841d508a3036af3032bea136cad013a9,
        previousBlockHash,
        height
      )
    }
  }
}
object "Fuel"   {
  code {
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



function Constructor.operator(pos) -> res {
  res := mslice(Constructor.operator.position(pos), 32)
}



function Constructor.genesis(pos) -> res {
  res := mslice(Constructor.genesis.position(pos), 32)
}



function Constructor.genesis.position(_pos) -> _offset {
  
      
        function Constructor.genesis.position._chunk0(pos) -> __r {
          __r := 0x0100
        }
      
        function Constructor.genesis.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Constructor.genesis.position._chunk0(_pos), add(Constructor.genesis.position._chunk1(_pos), 0))
    
}



function Constructor.chainId.position(_pos) -> _offset {
  
      
        function Constructor.chainId.position._chunk0(pos) -> __r {
          __r := 0xe0
        }
      
        function Constructor.chainId.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Constructor.chainId.position._chunk0(_pos), add(Constructor.chainId.position._chunk1(_pos), 0))
    
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
        require(lt(id, 0xFFFFFFFF), 0x01)
        indexToken(addr, id)
      }
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
  
    // Constants
    
    
    

    // Copy constructor arguments to memory, verify construction
    Constructor.copy(0)
    Constructor.verify(0)
    let operator := Constructor.operator(0)
    let genesis := Constructor.genesis(0)

    // Index the ETH token ID and zero address
    indexToken(0, 0)
    indexAddress(0, 0)

    // Log genesis block
    mstore(0, operator) mstore(add(0,32), 1) mstore(add(0,64), 1) mstore(add(0,96), 128) mstore(add(0,128), 0)
    log3(
      0,
      160,
      0x2521e5f2f7ee2cc8938e535746c063cc841d508a3036af3032bea136cad013a9,
      0,
      0
    )

    // Implicitly commit genesis block
    sstore(mappingKey(1, 0), genesis)

    // Add extra data for block producer
    let dataSize := safeAdd(datasize("Runtime"), 416)

    // Goto runtime
    datacopy(0, dataoffset("Runtime"), dataSize)
    return(0, dataSize)
  }

  /// @notice Public methods
  object "Runtime" 
     {
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



function BlockHeader.height(pos) -> res {
  res := mslice(BlockHeader.height.position(pos), 32)
}



function BlockHeader.blockNumber(pos) -> res {
  res := mslice(BlockHeader.blockNumber.position(pos), 32)
}



function BlockHeader.roots(pos, i) -> res {
  res := mslice(add(BlockHeader.roots.position(pos),
    mul(i, 32)), 32)
}

function BlockHeader.roots.slice(pos) -> res {
  res := mslice(BlockHeader.roots.position(pos),
    BlockHeader.roots.length(pos))
}



function Constructor.chainId(pos) -> res {
  res := mslice(Constructor.chainId.position(pos), 32)
}



function Constructor.chainId.position(_pos) -> _offset {
  
      
        function Constructor.chainId.position._chunk0(pos) -> __r {
          __r := 0xe0
        }
      
        function Constructor.chainId.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Constructor.chainId.position._chunk0(_pos), add(Constructor.chainId.position._chunk1(_pos), 0))
    
}



function Signature.type(pos) -> res {
  res := mslice(Signature.type.position(pos), 1)
}



function Signature.type.position(_pos) -> _offset {
  
      
        function Signature.type.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function Signature.type.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Signature.type.position._chunk0(_pos), add(Signature.type.position._chunk1(_pos), 0))
    
}



function Signature.size(pos) -> _offset {
  _offset := sub(Signature.offset(pos), pos)
}



function Signature.offset(pos) -> _offset {
  _offset := Signature.v.offset(pos)
}



function Signature.v.offset(pos) -> _offset {
_offset := add(Signature.v.position(pos), 1)
}



function Signature.v.position(_pos) -> _offset {
  
      
        function Signature.v.position._chunk0(pos) -> __r {
          __r := 0x41
        }
      
        function Signature.v.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Signature.v.position._chunk0(_pos), add(Signature.v.position._chunk1(_pos), 0))
    
}



function Signature.r.position(_pos) -> _offset {
  
      
        function Signature.r.position._chunk0(pos) -> __r {
          __r := 0x01
        }
      
        function Signature.r.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Signature.r.position._chunk0(_pos), add(Signature.r.position._chunk1(_pos), 0))
    
}



function Signature.s.position(_pos) -> _offset {
  
      
        function Signature.s.position._chunk0(pos) -> __r {
          __r := 0x21
        }
      
        function Signature.s.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Signature.s.position._chunk0(_pos), add(Signature.s.position._chunk1(_pos), 0))
    
}



function Caller.size(pos) -> _offset {
  _offset := sub(Caller.offset(pos), pos)
}



function Caller.offset(pos) -> _offset {
  _offset := Caller.blockNumber.offset(pos)
}



function Caller.blockNumber.offset(pos) -> _offset {
_offset := add(Caller.blockNumber.position(pos), 4)
}



function Caller.blockNumber.position(_pos) -> _offset {
  
      
        function Caller.blockNumber.position._chunk0(pos) -> __r {
          __r := 0x15
        }
      
        function Caller.blockNumber.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Caller.blockNumber.position._chunk0(_pos), add(Caller.blockNumber.position._chunk1(_pos), 0))
    
}



function Caller.type.position(_pos) -> _offset {
  
      
        function Caller.type.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function Caller.type.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Caller.type.position._chunk0(_pos), add(Caller.type.position._chunk1(_pos), 0))
    
}



function Caller.owner.position(_pos) -> _offset {
  
      
        function Caller.owner.position._chunk0(pos) -> __r {
          __r := 0x01
        }
      
        function Caller.owner.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Caller.owner.position._chunk0(_pos), add(Caller.owner.position._chunk1(_pos), 0))
    
}



function Producer.size(pos) -> _offset {
  _offset := sub(Producer.offset(pos), pos)
}



function Producer.offset(pos) -> _offset {
  _offset := Producer.hash.offset(pos)
}



function Producer.hash.offset(pos) -> _offset {
_offset := add(Producer.hash.position(pos), 32)
}



function Producer.hash.position(_pos) -> _offset {
  
      
        function Producer.hash.position._chunk0(pos) -> __r {
          __r := 0x01
        }
      
        function Producer.hash.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Producer.hash.position._chunk0(_pos), add(Producer.hash.position._chunk1(_pos), 0))
    
}



function Producer.type.position(_pos) -> _offset {
  
      
        function Producer.type.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function Producer.type.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Producer.type.position._chunk0(_pos), add(Producer.type.position._chunk1(_pos), 0))
    
}



function Signature.v(pos) -> res {
  res := mslice(Signature.v.position(pos), 1)
}



function Signature.r(pos) -> res {
  res := mslice(Signature.r.position(pos), 32)
}



function Signature.s(pos) -> res {
  res := mslice(Signature.s.position(pos), 32)
}



function Input.type(pos) -> res {
  res := mslice(Input.type.position(pos), 1)
}



function Input.type.position(_pos) -> _offset {
  
      
        function Input.type.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function Input.type.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Input.type.position._chunk0(_pos), add(Input.type.position._chunk1(_pos), 0))
    
}



function Output.amount.position(_pos) -> _offset {
  
      
        function Output.amount.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function Output.amount.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function Output.amount.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(Output.amount.position._chunk1(pos), 0)), 1), 1)
        }
      

      _offset := add(Output.amount.position._chunk0(_pos), add(Output.amount.position._chunk1(_pos), add(Output.amount.position._chunk2(_pos), 0)))
    
}



function Output.type.position(_pos) -> _offset {
  
      
        function Output.type.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function Output.type.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Output.type.position._chunk0(_pos), add(Output.type.position._chunk1(_pos), 0))
    
}



function Output.token.length.position(_pos) -> _offset {
  
      
        function Output.token.length.position._chunk0(pos) -> __r {
          __r := 0x01
        }
      
        function Output.token.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Output.token.length.position._chunk0(_pos), add(Output.token.length.position._chunk1(_pos), 0))
    
}



function Output.token.position(_pos) -> _offset {
  
      
        function Output.token.position._chunk0(pos) -> __r {
          __r := 0x02
        }
      
        function Output.token.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Output.token.position._chunk0(_pos), add(Output.token.position._chunk1(_pos), 0))
    
}



function Output.token.length(pos) -> res {
  res := mslice(Output.token.length.position(pos), 1)
}



function Output.amount.shift.position(_pos) -> _offset {
  
      
        function Output.amount.shift.position._chunk0(pos) -> __r {
          __r := 0x02
        }
      
        function Output.amount.shift.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function Output.amount.shift.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(Output.amount.shift.position._chunk1(pos), 0)), 1), 1)
        }
      

      _offset := add(Output.amount.shift.position._chunk0(_pos), add(Output.amount.shift.position._chunk1(_pos), add(Output.amount.shift.position._chunk2(_pos), 0)))
    
}



function Output.amount.length.position(_pos) -> _offset {
  
      
        function Output.amount.length.position._chunk0(pos) -> __r {
          __r := 0x03
        }
      
        function Output.amount.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function Output.amount.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(Output.amount.length.position._chunk1(pos), 0)), 1), 1)
        }
      

      _offset := add(Output.amount.length.position._chunk0(_pos), add(Output.amount.length.position._chunk1(_pos), add(Output.amount.length.position._chunk2(_pos), 0)))
    
}



function Output.amount.shift(pos) -> res {
  res := mslice(Output.amount.shift.position(pos), 1)
}



function Output.amount.length(pos) -> res {
  res := mslice(Output.amount.length.position(pos), 1)
}



function Output.type(pos) -> res {
  res := mslice(Output.type.position(pos), 1)
}



function Output.size(pos) -> _offset {
  _offset := sub(Output.offset(pos), pos)
}



function Output.offset(pos) -> _offset {
  _offset := Output.owner.offset(pos)
}



function Output.owner.offset(pos) -> _offset {
_offset := add(Output.owner.position(pos), mul(Output.owner.length(pos), 1))
}



function Output.owner.length(pos) -> res {
  res := mslice(Output.owner.length.position(pos), 1)
}



function Output.owner.length.position(_pos) -> _offset {
  
      
        function Output.owner.length.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function Output.owner.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function Output.owner.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(Output.owner.length.position._chunk1(pos), 0)), 1), 1)
        }
      
        function Output.owner.length.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(Output.owner.length.position._chunk2(pos), 0))), 1), 1)
        }
      

      _offset := add(Output.owner.length.position._chunk0(_pos), add(Output.owner.length.position._chunk1(_pos), add(Output.owner.length.position._chunk2(_pos), add(Output.owner.length.position._chunk3(_pos), 0))))
    
}



function Output.owner.position(_pos) -> _offset {
  
      
        function Output.owner.position._chunk0(pos) -> __r {
          __r := 0x05
        }
      
        function Output.owner.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function Output.owner.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(Output.owner.position._chunk1(pos), 0)), 1), 1)
        }
      
        function Output.owner.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(Output.owner.position._chunk2(pos), 0))), 1), 1)
        }
      

      _offset := add(Output.owner.position._chunk0(_pos), add(Output.owner.position._chunk1(_pos), add(Output.owner.position._chunk2(_pos), add(Output.owner.position._chunk3(_pos), 0))))
    
}



function OutputHTLC.size(pos) -> _offset {
  _offset := sub(OutputHTLC.offset(pos), pos)
}



function OutputHTLC.offset(pos) -> _offset {
  _offset := OutputHTLC.returnOwner.offset(pos)
}



function OutputHTLC.returnOwner.offset(pos) -> _offset {
_offset := add(OutputHTLC.returnOwner.position(pos), mul(OutputHTLC.returnOwner.length(pos), 1))
}



function OutputHTLC.returnOwner.length(pos) -> res {
  res := mslice(OutputHTLC.returnOwner.length.position(pos), 1)
}



function OutputHTLC.returnOwner.length.position(_pos) -> _offset {
  
      
        function OutputHTLC.returnOwner.length.position._chunk0(pos) -> __r {
          __r := 0x29
        }
      
        function OutputHTLC.returnOwner.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function OutputHTLC.returnOwner.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(OutputHTLC.returnOwner.length.position._chunk1(pos), 0)), 1), 1)
        }
      
        function OutputHTLC.returnOwner.length.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(OutputHTLC.returnOwner.length.position._chunk2(pos), 0))), 1), 1)
        }
      
        function OutputHTLC.returnOwner.length.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x04, add(pos, add(mul(mslice(add(0x01, add(pos, 0)), 1), 1), add(OutputHTLC.returnOwner.length.position._chunk3(pos), 0)))), 1), 1)
        }
      

      _offset := add(OutputHTLC.returnOwner.length.position._chunk0(_pos), add(OutputHTLC.returnOwner.length.position._chunk1(_pos), add(OutputHTLC.returnOwner.length.position._chunk2(_pos), add(OutputHTLC.returnOwner.length.position._chunk3(_pos), add(OutputHTLC.returnOwner.length.position._chunk4(_pos), 0)))))
    
}



function OutputHTLC.type.position(_pos) -> _offset {
  
      
        function OutputHTLC.type.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function OutputHTLC.type.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(OutputHTLC.type.position._chunk0(_pos), add(OutputHTLC.type.position._chunk1(_pos), 0))
    
}



function OutputHTLC.token.length.position(_pos) -> _offset {
  
      
        function OutputHTLC.token.length.position._chunk0(pos) -> __r {
          __r := 0x01
        }
      
        function OutputHTLC.token.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(OutputHTLC.token.length.position._chunk0(_pos), add(OutputHTLC.token.length.position._chunk1(_pos), 0))
    
}



function OutputHTLC.token.position(_pos) -> _offset {
  
      
        function OutputHTLC.token.position._chunk0(pos) -> __r {
          __r := 0x02
        }
      
        function OutputHTLC.token.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(OutputHTLC.token.position._chunk0(_pos), add(OutputHTLC.token.position._chunk1(_pos), 0))
    
}



function OutputHTLC.token.length(pos) -> res {
  res := mslice(OutputHTLC.token.length.position(pos), 1)
}



function OutputHTLC.amount.shift.position(_pos) -> _offset {
  
      
        function OutputHTLC.amount.shift.position._chunk0(pos) -> __r {
          __r := 0x02
        }
      
        function OutputHTLC.amount.shift.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function OutputHTLC.amount.shift.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(OutputHTLC.amount.shift.position._chunk1(pos), 0)), 1), 1)
        }
      

      _offset := add(OutputHTLC.amount.shift.position._chunk0(_pos), add(OutputHTLC.amount.shift.position._chunk1(_pos), add(OutputHTLC.amount.shift.position._chunk2(_pos), 0)))
    
}



function OutputHTLC.amount.length.position(_pos) -> _offset {
  
      
        function OutputHTLC.amount.length.position._chunk0(pos) -> __r {
          __r := 0x03
        }
      
        function OutputHTLC.amount.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function OutputHTLC.amount.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(OutputHTLC.amount.length.position._chunk1(pos), 0)), 1), 1)
        }
      

      _offset := add(OutputHTLC.amount.length.position._chunk0(_pos), add(OutputHTLC.amount.length.position._chunk1(_pos), add(OutputHTLC.amount.length.position._chunk2(_pos), 0)))
    
}



function OutputHTLC.amount.position(_pos) -> _offset {
  
      
        function OutputHTLC.amount.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function OutputHTLC.amount.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function OutputHTLC.amount.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(OutputHTLC.amount.position._chunk1(pos), 0)), 1), 1)
        }
      

      _offset := add(OutputHTLC.amount.position._chunk0(_pos), add(OutputHTLC.amount.position._chunk1(_pos), add(OutputHTLC.amount.position._chunk2(_pos), 0)))
    
}



function OutputHTLC.amount.length(pos) -> res {
  res := mslice(OutputHTLC.amount.length.position(pos), 1)
}



function OutputHTLC.owner.length.position(_pos) -> _offset {
  
      
        function OutputHTLC.owner.length.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function OutputHTLC.owner.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function OutputHTLC.owner.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(OutputHTLC.owner.length.position._chunk1(pos), 0)), 1), 1)
        }
      
        function OutputHTLC.owner.length.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(OutputHTLC.owner.length.position._chunk2(pos), 0))), 1), 1)
        }
      

      _offset := add(OutputHTLC.owner.length.position._chunk0(_pos), add(OutputHTLC.owner.length.position._chunk1(_pos), add(OutputHTLC.owner.length.position._chunk2(_pos), add(OutputHTLC.owner.length.position._chunk3(_pos), 0))))
    
}



function OutputHTLC.owner.position(_pos) -> _offset {
  
      
        function OutputHTLC.owner.position._chunk0(pos) -> __r {
          __r := 0x05
        }
      
        function OutputHTLC.owner.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function OutputHTLC.owner.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(OutputHTLC.owner.position._chunk1(pos), 0)), 1), 1)
        }
      
        function OutputHTLC.owner.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(OutputHTLC.owner.position._chunk2(pos), 0))), 1), 1)
        }
      

      _offset := add(OutputHTLC.owner.position._chunk0(_pos), add(OutputHTLC.owner.position._chunk1(_pos), add(OutputHTLC.owner.position._chunk2(_pos), add(OutputHTLC.owner.position._chunk3(_pos), 0))))
    
}



function OutputHTLC.owner.length(pos) -> res {
  res := mslice(OutputHTLC.owner.length.position(pos), 1)
}



function OutputHTLC.digest.position(_pos) -> _offset {
  
      
        function OutputHTLC.digest.position._chunk0(pos) -> __r {
          __r := 0x05
        }
      
        function OutputHTLC.digest.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function OutputHTLC.digest.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(OutputHTLC.digest.position._chunk1(pos), 0)), 1), 1)
        }
      
        function OutputHTLC.digest.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(OutputHTLC.digest.position._chunk2(pos), 0))), 1), 1)
        }
      
        function OutputHTLC.digest.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x04, add(pos, add(mul(mslice(add(0x01, add(pos, 0)), 1), 1), add(OutputHTLC.digest.position._chunk3(pos), 0)))), 1), 1)
        }
      

      _offset := add(OutputHTLC.digest.position._chunk0(_pos), add(OutputHTLC.digest.position._chunk1(_pos), add(OutputHTLC.digest.position._chunk2(_pos), add(OutputHTLC.digest.position._chunk3(_pos), add(OutputHTLC.digest.position._chunk4(_pos), 0)))))
    
}



function OutputHTLC.expiry.position(_pos) -> _offset {
  
      
        function OutputHTLC.expiry.position._chunk0(pos) -> __r {
          __r := 0x25
        }
      
        function OutputHTLC.expiry.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function OutputHTLC.expiry.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(OutputHTLC.expiry.position._chunk1(pos), 0)), 1), 1)
        }
      
        function OutputHTLC.expiry.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(OutputHTLC.expiry.position._chunk2(pos), 0))), 1), 1)
        }
      
        function OutputHTLC.expiry.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x04, add(pos, add(mul(mslice(add(0x01, add(pos, 0)), 1), 1), add(OutputHTLC.expiry.position._chunk3(pos), 0)))), 1), 1)
        }
      

      _offset := add(OutputHTLC.expiry.position._chunk0(_pos), add(OutputHTLC.expiry.position._chunk1(_pos), add(OutputHTLC.expiry.position._chunk2(_pos), add(OutputHTLC.expiry.position._chunk3(_pos), add(OutputHTLC.expiry.position._chunk4(_pos), 0)))))
    
}



function OutputHTLC.returnOwner.position(_pos) -> _offset {
  
      
        function OutputHTLC.returnOwner.position._chunk0(pos) -> __r {
          __r := 0x2a
        }
      
        function OutputHTLC.returnOwner.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function OutputHTLC.returnOwner.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x01, add(OutputHTLC.returnOwner.position._chunk1(pos), 0)), 1), 1)
        }
      
        function OutputHTLC.returnOwner.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(OutputHTLC.returnOwner.position._chunk2(pos), 0))), 1), 1)
        }
      
        function OutputHTLC.returnOwner.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x04, add(pos, add(mul(mslice(add(0x01, add(pos, 0)), 1), 1), add(OutputHTLC.returnOwner.position._chunk3(pos), 0)))), 1), 1)
        }
      

      _offset := add(OutputHTLC.returnOwner.position._chunk0(_pos), add(OutputHTLC.returnOwner.position._chunk1(_pos), add(OutputHTLC.returnOwner.position._chunk2(_pos), add(OutputHTLC.returnOwner.position._chunk3(_pos), add(OutputHTLC.returnOwner.position._chunk4(_pos), 0)))))
    
}



function OutputReturn.size(pos) -> _offset {
  _offset := sub(OutputReturn.offset(pos), pos)
}



function OutputReturn.offset(pos) -> _offset {
  _offset := OutputReturn.data.offset(pos)
}



function OutputReturn.data.offset(pos) -> _offset {
_offset := add(OutputReturn.data.position(pos), mul(OutputReturn.data.length(pos), 1))
}



function OutputReturn.data.length(pos) -> res {
  res := mslice(OutputReturn.data.length.position(pos), 2)
}



function OutputReturn.data.length.position(_pos) -> _offset {
  
      
        function OutputReturn.data.length.position._chunk0(pos) -> __r {
          __r := 0x01
        }
      
        function OutputReturn.data.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(OutputReturn.data.length.position._chunk0(_pos), add(OutputReturn.data.length.position._chunk1(_pos), 0))
    
}



function OutputReturn.type.position(_pos) -> _offset {
  
      
        function OutputReturn.type.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function OutputReturn.type.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(OutputReturn.type.position._chunk0(_pos), add(OutputReturn.type.position._chunk1(_pos), 0))
    
}



function OutputReturn.data.position(_pos) -> _offset {
  
      
        function OutputReturn.data.position._chunk0(pos) -> __r {
          __r := 0x03
        }
      
        function OutputReturn.data.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(OutputReturn.data.position._chunk0(_pos), add(OutputReturn.data.position._chunk1(_pos), 0))
    
}



function Output.token.slice(pos) -> res {
  res := mslice(Output.token.position(pos), Output.token.length(pos))
}



function Output.owner.slice(pos) -> res {
  res := mslice(Output.owner.position(pos), Output.owner.length(pos))
}



function OutputHTLC.returnOwner.slice(pos) -> res {
  res := mslice(OutputHTLC.returnOwner.position(pos), OutputHTLC.returnOwner.length(pos))
}



function TransactionProof.tokenAddress(pos) -> res {
  res := mslice(TransactionProof.tokenAddress.position(pos), 20)
}



function TransactionProof.tokenAddress.position(_pos) -> _offset {
  
      
        function TransactionProof.tokenAddress.position._chunk0(pos) -> __r {
          __r := 0x01b4
        }
      
        function TransactionProof.tokenAddress.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.tokenAddress.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.tokenAddress.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.tokenAddress.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.tokenAddress.position._chunk2(pos), 0))), 2), 32)
        }
      
        function TransactionProof.tokenAddress.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x0171, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(TransactionProof.tokenAddress.position._chunk3(pos), 0)))), 2), 1)
        }
      
        function TransactionProof.tokenAddress.position._chunk5(pos) -> __r {
          __r := mul(mslice(add(0x0173, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(mul(mslice(add(0x016c, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), 0))), 2), 32), add(TransactionProof.tokenAddress.position._chunk4(pos), 0))))), 1), 32)
        }
      

      _offset := add(TransactionProof.tokenAddress.position._chunk0(_pos), add(TransactionProof.tokenAddress.position._chunk1(_pos), add(TransactionProof.tokenAddress.position._chunk2(_pos), add(TransactionProof.tokenAddress.position._chunk3(_pos), add(TransactionProof.tokenAddress.position._chunk4(_pos), add(TransactionProof.tokenAddress.position._chunk5(_pos), 0))))))
    
}



function TransactionProof.blockProducer.position(_pos) -> _offset {
  
      
        function TransactionProof.blockProducer.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function TransactionProof.blockProducer.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionProof.blockProducer.position._chunk0(_pos), add(TransactionProof.blockProducer.position._chunk1(_pos), 0))
    
}



function TransactionProof.previousBlockHash.position(_pos) -> _offset {
  
      
        function TransactionProof.previousBlockHash.position._chunk0(pos) -> __r {
          __r := 0x14
        }
      
        function TransactionProof.previousBlockHash.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionProof.previousBlockHash.position._chunk0(_pos), add(TransactionProof.previousBlockHash.position._chunk1(_pos), 0))
    
}



function TransactionProof.blockHeight.position(_pos) -> _offset {
  
      
        function TransactionProof.blockHeight.position._chunk0(pos) -> __r {
          __r := 0x34
        }
      
        function TransactionProof.blockHeight.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionProof.blockHeight.position._chunk0(_pos), add(TransactionProof.blockHeight.position._chunk1(_pos), 0))
    
}



function TransactionProof.blockNumber.position(_pos) -> _offset {
  
      
        function TransactionProof.blockNumber.position._chunk0(pos) -> __r {
          __r := 0x54
        }
      
        function TransactionProof.blockNumber.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionProof.blockNumber.position._chunk0(_pos), add(TransactionProof.blockNumber.position._chunk1(_pos), 0))
    
}



function TransactionProof.numTokens.position(_pos) -> _offset {
  
      
        function TransactionProof.numTokens.position._chunk0(pos) -> __r {
          __r := 0x74
        }
      
        function TransactionProof.numTokens.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionProof.numTokens.position._chunk0(_pos), add(TransactionProof.numTokens.position._chunk1(_pos), 0))
    
}



function TransactionProof.numAddresses.position(_pos) -> _offset {
  
      
        function TransactionProof.numAddresses.position._chunk0(pos) -> __r {
          __r := 0x94
        }
      
        function TransactionProof.numAddresses.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionProof.numAddresses.position._chunk0(_pos), add(TransactionProof.numAddresses.position._chunk1(_pos), 0))
    
}



function TransactionProof.roots.length.position(_pos) -> _offset {
  
      
        function TransactionProof.roots.length.position._chunk0(pos) -> __r {
          __r := 0xb4
        }
      
        function TransactionProof.roots.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionProof.roots.length.position._chunk0(_pos), add(TransactionProof.roots.length.position._chunk1(_pos), 0))
    
}



function TransactionProof.roots.position(_pos) -> _offset {
  
      
        function TransactionProof.roots.position._chunk0(pos) -> __r {
          __r := 0xb6
        }
      
        function TransactionProof.roots.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionProof.roots.position._chunk0(_pos), add(TransactionProof.roots.position._chunk1(_pos), 0))
    
}



function TransactionProof.roots.length(pos) -> res {
  res := mslice(TransactionProof.roots.length.position(pos), 2)
}



function TransactionProof.rootProducer.position(_pos) -> _offset {
  
      
        function TransactionProof.rootProducer.position._chunk0(pos) -> __r {
          __r := 0xb6
        }
      
        function TransactionProof.rootProducer.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.rootProducer.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.rootProducer.position._chunk1(pos), 0)), 2), 32)
        }
      

      _offset := add(TransactionProof.rootProducer.position._chunk0(_pos), add(TransactionProof.rootProducer.position._chunk1(_pos), add(TransactionProof.rootProducer.position._chunk2(_pos), 0)))
    
}



function TransactionProof.merkleTreeRoot.position(_pos) -> _offset {
  
      
        function TransactionProof.merkleTreeRoot.position._chunk0(pos) -> __r {
          __r := 0xca
        }
      
        function TransactionProof.merkleTreeRoot.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.merkleTreeRoot.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.merkleTreeRoot.position._chunk1(pos), 0)), 2), 32)
        }
      

      _offset := add(TransactionProof.merkleTreeRoot.position._chunk0(_pos), add(TransactionProof.merkleTreeRoot.position._chunk1(_pos), add(TransactionProof.merkleTreeRoot.position._chunk2(_pos), 0)))
    
}



function TransactionProof.commitmentHash.position(_pos) -> _offset {
  
      
        function TransactionProof.commitmentHash.position._chunk0(pos) -> __r {
          __r := 0xea
        }
      
        function TransactionProof.commitmentHash.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.commitmentHash.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.commitmentHash.position._chunk1(pos), 0)), 2), 32)
        }
      

      _offset := add(TransactionProof.commitmentHash.position._chunk0(_pos), add(TransactionProof.commitmentHash.position._chunk1(_pos), add(TransactionProof.commitmentHash.position._chunk2(_pos), 0)))
    
}



function TransactionProof.rootLength.position(_pos) -> _offset {
  
      
        function TransactionProof.rootLength.position._chunk0(pos) -> __r {
          __r := 0x010a
        }
      
        function TransactionProof.rootLength.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.rootLength.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.rootLength.position._chunk1(pos), 0)), 2), 32)
        }
      

      _offset := add(TransactionProof.rootLength.position._chunk0(_pos), add(TransactionProof.rootLength.position._chunk1(_pos), add(TransactionProof.rootLength.position._chunk2(_pos), 0)))
    
}



function TransactionProof.feeToken.position(_pos) -> _offset {
  
      
        function TransactionProof.feeToken.position._chunk0(pos) -> __r {
          __r := 0x012a
        }
      
        function TransactionProof.feeToken.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.feeToken.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.feeToken.position._chunk1(pos), 0)), 2), 32)
        }
      

      _offset := add(TransactionProof.feeToken.position._chunk0(_pos), add(TransactionProof.feeToken.position._chunk1(_pos), add(TransactionProof.feeToken.position._chunk2(_pos), 0)))
    
}



function TransactionProof.fee.position(_pos) -> _offset {
  
      
        function TransactionProof.fee.position._chunk0(pos) -> __r {
          __r := 0x014a
        }
      
        function TransactionProof.fee.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.fee.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.fee.position._chunk1(pos), 0)), 2), 32)
        }
      

      _offset := add(TransactionProof.fee.position._chunk0(_pos), add(TransactionProof.fee.position._chunk1(_pos), add(TransactionProof.fee.position._chunk2(_pos), 0)))
    
}



function TransactionProof.rootIndex.position(_pos) -> _offset {
  
      
        function TransactionProof.rootIndex.position._chunk0(pos) -> __r {
          __r := 0x016a
        }
      
        function TransactionProof.rootIndex.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.rootIndex.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.rootIndex.position._chunk1(pos), 0)), 2), 32)
        }
      

      _offset := add(TransactionProof.rootIndex.position._chunk0(_pos), add(TransactionProof.rootIndex.position._chunk1(_pos), add(TransactionProof.rootIndex.position._chunk2(_pos), 0)))
    
}



function TransactionProof.merkleProof.length.position(_pos) -> _offset {
  
      
        function TransactionProof.merkleProof.length.position._chunk0(pos) -> __r {
          __r := 0x016c
        }
      
        function TransactionProof.merkleProof.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.merkleProof.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.merkleProof.length.position._chunk1(pos), 0)), 2), 32)
        }
      

      _offset := add(TransactionProof.merkleProof.length.position._chunk0(_pos), add(TransactionProof.merkleProof.length.position._chunk1(_pos), add(TransactionProof.merkleProof.length.position._chunk2(_pos), 0)))
    
}



function TransactionProof.merkleProof.position(_pos) -> _offset {
  
      
        function TransactionProof.merkleProof.position._chunk0(pos) -> __r {
          __r := 0x016e
        }
      
        function TransactionProof.merkleProof.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.merkleProof.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.merkleProof.position._chunk1(pos), 0)), 2), 32)
        }
      

      _offset := add(TransactionProof.merkleProof.position._chunk0(_pos), add(TransactionProof.merkleProof.position._chunk1(_pos), add(TransactionProof.merkleProof.position._chunk2(_pos), 0)))
    
}



function TransactionProof.merkleProof.length(pos) -> res {
  res := mslice(TransactionProof.merkleProof.length.position(pos), 2)
}



function TransactionProof.inputOutputIndex.position(_pos) -> _offset {
  
      
        function TransactionProof.inputOutputIndex.position._chunk0(pos) -> __r {
          __r := 0x016e
        }
      
        function TransactionProof.inputOutputIndex.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.inputOutputIndex.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.inputOutputIndex.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.inputOutputIndex.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.inputOutputIndex.position._chunk2(pos), 0))), 2), 32)
        }
      

      _offset := add(TransactionProof.inputOutputIndex.position._chunk0(_pos), add(TransactionProof.inputOutputIndex.position._chunk1(_pos), add(TransactionProof.inputOutputIndex.position._chunk2(_pos), add(TransactionProof.inputOutputIndex.position._chunk3(_pos), 0))))
    
}



function TransactionProof.transactionIndex.position(_pos) -> _offset {
  
      
        function TransactionProof.transactionIndex.position._chunk0(pos) -> __r {
          __r := 0x016f
        }
      
        function TransactionProof.transactionIndex.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.transactionIndex.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.transactionIndex.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.transactionIndex.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.transactionIndex.position._chunk2(pos), 0))), 2), 32)
        }
      

      _offset := add(TransactionProof.transactionIndex.position._chunk0(_pos), add(TransactionProof.transactionIndex.position._chunk1(_pos), add(TransactionProof.transactionIndex.position._chunk2(_pos), add(TransactionProof.transactionIndex.position._chunk3(_pos), 0))))
    
}



function TransactionProof.transaction.length.position(_pos) -> _offset {
  
      
        function TransactionProof.transaction.length.position._chunk0(pos) -> __r {
          __r := 0x0171
        }
      
        function TransactionProof.transaction.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.transaction.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.transaction.length.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.transaction.length.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.transaction.length.position._chunk2(pos), 0))), 2), 32)
        }
      

      _offset := add(TransactionProof.transaction.length.position._chunk0(_pos), add(TransactionProof.transaction.length.position._chunk1(_pos), add(TransactionProof.transaction.length.position._chunk2(_pos), add(TransactionProof.transaction.length.position._chunk3(_pos), 0))))
    
}



function TransactionProof.transaction.position(_pos) -> _offset {
  
      
        function TransactionProof.transaction.position._chunk0(pos) -> __r {
          __r := 0x0173
        }
      
        function TransactionProof.transaction.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.transaction.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.transaction.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.transaction.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.transaction.position._chunk2(pos), 0))), 2), 32)
        }
      

      _offset := add(TransactionProof.transaction.position._chunk0(_pos), add(TransactionProof.transaction.position._chunk1(_pos), add(TransactionProof.transaction.position._chunk2(_pos), add(TransactionProof.transaction.position._chunk3(_pos), 0))))
    
}



function TransactionProof.transaction.length(pos) -> res {
  res := mslice(TransactionProof.transaction.length.position(pos), 2)
}



function TransactionProof.data.length.position(_pos) -> _offset {
  
      
        function TransactionProof.data.length.position._chunk0(pos) -> __r {
          __r := 0x0173
        }
      
        function TransactionProof.data.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.data.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.data.length.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.data.length.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.data.length.position._chunk2(pos), 0))), 2), 32)
        }
      
        function TransactionProof.data.length.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x0171, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(TransactionProof.data.length.position._chunk3(pos), 0)))), 2), 1)
        }
      

      _offset := add(TransactionProof.data.length.position._chunk0(_pos), add(TransactionProof.data.length.position._chunk1(_pos), add(TransactionProof.data.length.position._chunk2(_pos), add(TransactionProof.data.length.position._chunk3(_pos), add(TransactionProof.data.length.position._chunk4(_pos), 0)))))
    
}



function TransactionProof.data.position(_pos) -> _offset {
  
      
        function TransactionProof.data.position._chunk0(pos) -> __r {
          __r := 0x0174
        }
      
        function TransactionProof.data.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.data.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.data.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.data.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.data.position._chunk2(pos), 0))), 2), 32)
        }
      
        function TransactionProof.data.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x0171, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(TransactionProof.data.position._chunk3(pos), 0)))), 2), 1)
        }
      

      _offset := add(TransactionProof.data.position._chunk0(_pos), add(TransactionProof.data.position._chunk1(_pos), add(TransactionProof.data.position._chunk2(_pos), add(TransactionProof.data.position._chunk3(_pos), add(TransactionProof.data.position._chunk4(_pos), 0)))))
    
}



function TransactionProof.data.length(pos) -> res {
  res := mslice(TransactionProof.data.length.position(pos), 1)
}



function TransactionProof.signatureFeeToken.position(_pos) -> _offset {
  
      
        function TransactionProof.signatureFeeToken.position._chunk0(pos) -> __r {
          __r := 0x0174
        }
      
        function TransactionProof.signatureFeeToken.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.signatureFeeToken.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.signatureFeeToken.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.signatureFeeToken.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.signatureFeeToken.position._chunk2(pos), 0))), 2), 32)
        }
      
        function TransactionProof.signatureFeeToken.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x0171, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(TransactionProof.signatureFeeToken.position._chunk3(pos), 0)))), 2), 1)
        }
      
        function TransactionProof.signatureFeeToken.position._chunk5(pos) -> __r {
          __r := mul(mslice(add(0x0173, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(mul(mslice(add(0x016c, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), 0))), 2), 32), add(TransactionProof.signatureFeeToken.position._chunk4(pos), 0))))), 1), 32)
        }
      

      _offset := add(TransactionProof.signatureFeeToken.position._chunk0(_pos), add(TransactionProof.signatureFeeToken.position._chunk1(_pos), add(TransactionProof.signatureFeeToken.position._chunk2(_pos), add(TransactionProof.signatureFeeToken.position._chunk3(_pos), add(TransactionProof.signatureFeeToken.position._chunk4(_pos), add(TransactionProof.signatureFeeToken.position._chunk5(_pos), 0))))))
    
}



function TransactionProof.signatureFee.position(_pos) -> _offset {
  
      
        function TransactionProof.signatureFee.position._chunk0(pos) -> __r {
          __r := 0x0194
        }
      
        function TransactionProof.signatureFee.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.signatureFee.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.signatureFee.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.signatureFee.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.signatureFee.position._chunk2(pos), 0))), 2), 32)
        }
      
        function TransactionProof.signatureFee.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x0171, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(TransactionProof.signatureFee.position._chunk3(pos), 0)))), 2), 1)
        }
      
        function TransactionProof.signatureFee.position._chunk5(pos) -> __r {
          __r := mul(mslice(add(0x0173, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(mul(mslice(add(0x016c, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), 0))), 2), 32), add(TransactionProof.signatureFee.position._chunk4(pos), 0))))), 1), 32)
        }
      

      _offset := add(TransactionProof.signatureFee.position._chunk0(_pos), add(TransactionProof.signatureFee.position._chunk1(_pos), add(TransactionProof.signatureFee.position._chunk2(_pos), add(TransactionProof.signatureFee.position._chunk3(_pos), add(TransactionProof.signatureFee.position._chunk4(_pos), add(TransactionProof.signatureFee.position._chunk5(_pos), 0))))))
    
}



function TransactionProof.returnOwner(pos) -> res {
  res := mslice(TransactionProof.returnOwner.position(pos), 20)
}



function TransactionProof.returnOwner.position(_pos) -> _offset {
  
      
        function TransactionProof.returnOwner.position._chunk0(pos) -> __r {
          __r := 0x01c8
        }
      
        function TransactionProof.returnOwner.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.returnOwner.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.returnOwner.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.returnOwner.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.returnOwner.position._chunk2(pos), 0))), 2), 32)
        }
      
        function TransactionProof.returnOwner.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x0171, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(TransactionProof.returnOwner.position._chunk3(pos), 0)))), 2), 1)
        }
      
        function TransactionProof.returnOwner.position._chunk5(pos) -> __r {
          __r := mul(mslice(add(0x0173, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(mul(mslice(add(0x016c, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), 0))), 2), 32), add(TransactionProof.returnOwner.position._chunk4(pos), 0))))), 1), 32)
        }
      

      _offset := add(TransactionProof.returnOwner.position._chunk0(_pos), add(TransactionProof.returnOwner.position._chunk1(_pos), add(TransactionProof.returnOwner.position._chunk2(_pos), add(TransactionProof.returnOwner.position._chunk3(_pos), add(TransactionProof.returnOwner.position._chunk4(_pos), add(TransactionProof.returnOwner.position._chunk5(_pos), 0))))))
    
}



function TransactionProof.inputOutputIndex(pos) -> res {
  res := mslice(TransactionProof.inputOutputIndex.position(pos), 1)
}



function OutputHTLC.digest(pos) -> res {
  res := mslice(OutputHTLC.digest.position(pos), 32)
}



function OutputHTLC.expiry(pos) -> res {
  res := mslice(OutputHTLC.expiry.position(pos), 4)
}



function UTXO.keccak256(pos) -> _hash {
  _hash := keccak256(pos, UTXO.size(pos))
}



function UTXO.size(pos) -> _offset {
  _offset := sub(UTXO.offset(pos), pos)
}



function UTXO.offset(pos) -> _offset {
  _offset := UTXO.returnOwner.offset(pos)
}



function UTXO.returnOwner.offset(pos) -> _offset {
_offset := add(UTXO.returnOwner.position(pos), 32)
}



function UTXO.returnOwner.position(_pos) -> _offset {
  
      
        function UTXO.returnOwner.position._chunk0(pos) -> __r {
          __r := 0x0100
        }
      
        function UTXO.returnOwner.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(UTXO.returnOwner.position._chunk0(_pos), add(UTXO.returnOwner.position._chunk1(_pos), 0))
    
}



function UTXO.transactionId.position(_pos) -> _offset {
  
      
        function UTXO.transactionId.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function UTXO.transactionId.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(UTXO.transactionId.position._chunk0(_pos), add(UTXO.transactionId.position._chunk1(_pos), 0))
    
}



function UTXO.outputIndex.position(_pos) -> _offset {
  
      
        function UTXO.outputIndex.position._chunk0(pos) -> __r {
          __r := 0x20
        }
      
        function UTXO.outputIndex.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(UTXO.outputIndex.position._chunk0(_pos), add(UTXO.outputIndex.position._chunk1(_pos), 0))
    
}



function UTXO.outputType.position(_pos) -> _offset {
  
      
        function UTXO.outputType.position._chunk0(pos) -> __r {
          __r := 0x40
        }
      
        function UTXO.outputType.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(UTXO.outputType.position._chunk0(_pos), add(UTXO.outputType.position._chunk1(_pos), 0))
    
}



function UTXO.owner.position(_pos) -> _offset {
  
      
        function UTXO.owner.position._chunk0(pos) -> __r {
          __r := 0x60
        }
      
        function UTXO.owner.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(UTXO.owner.position._chunk0(_pos), add(UTXO.owner.position._chunk1(_pos), 0))
    
}



function UTXO.amount.position(_pos) -> _offset {
  
      
        function UTXO.amount.position._chunk0(pos) -> __r {
          __r := 0x80
        }
      
        function UTXO.amount.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(UTXO.amount.position._chunk0(_pos), add(UTXO.amount.position._chunk1(_pos), 0))
    
}



function UTXO.token.position(_pos) -> _offset {
  
      
        function UTXO.token.position._chunk0(pos) -> __r {
          __r := 0xa0
        }
      
        function UTXO.token.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(UTXO.token.position._chunk0(_pos), add(UTXO.token.position._chunk1(_pos), 0))
    
}



function UTXO.digest.position(_pos) -> _offset {
  
      
        function UTXO.digest.position._chunk0(pos) -> __r {
          __r := 0xc0
        }
      
        function UTXO.digest.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(UTXO.digest.position._chunk0(_pos), add(UTXO.digest.position._chunk1(_pos), 0))
    
}



function UTXO.expiry.position(_pos) -> _offset {
  
      
        function UTXO.expiry.position._chunk0(pos) -> __r {
          __r := 0xe0
        }
      
        function UTXO.expiry.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(UTXO.expiry.position._chunk0(_pos), add(UTXO.expiry.position._chunk1(_pos), 0))
    
}



function TransactionProof.feeToken(pos) -> res {
  res := mslice(TransactionProof.feeToken.position(pos), 32)
}



function TransactionProof.fee(pos) -> res {
  res := mslice(TransactionProof.fee.position(pos), 32)
}



function TransactionLeaf.inputs.length.position(_pos) -> _offset {
  
      
        function TransactionLeaf.inputs.length.position._chunk0(pos) -> __r {
          __r := 0x05
        }
      
        function TransactionLeaf.inputs.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionLeaf.inputs.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x02, add(TransactionLeaf.inputs.length.position._chunk1(pos), 0)), 1), 8)
        }
      
        function TransactionLeaf.inputs.length.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(TransactionLeaf.inputs.length.position._chunk2(pos), 0))), 2), 1)
        }
      

      _offset := add(TransactionLeaf.inputs.length.position._chunk0(_pos), add(TransactionLeaf.inputs.length.position._chunk1(_pos), add(TransactionLeaf.inputs.length.position._chunk2(_pos), add(TransactionLeaf.inputs.length.position._chunk3(_pos), 0))))
    
}



function TransactionLeaf.length.position(_pos) -> _offset {
  
      
        function TransactionLeaf.length.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function TransactionLeaf.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionLeaf.length.position._chunk0(_pos), add(TransactionLeaf.length.position._chunk1(_pos), 0))
    
}



function TransactionLeaf.metadata.length.position(_pos) -> _offset {
  
      
        function TransactionLeaf.metadata.length.position._chunk0(pos) -> __r {
          __r := 0x02
        }
      
        function TransactionLeaf.metadata.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionLeaf.metadata.length.position._chunk0(_pos), add(TransactionLeaf.metadata.length.position._chunk1(_pos), 0))
    
}



function TransactionLeaf.metadata.position(_pos) -> _offset {
  
      
        function TransactionLeaf.metadata.position._chunk0(pos) -> __r {
          __r := 0x03
        }
      
        function TransactionLeaf.metadata.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(TransactionLeaf.metadata.position._chunk0(_pos), add(TransactionLeaf.metadata.position._chunk1(_pos), 0))
    
}



function TransactionLeaf.metadata.length(pos) -> res {
  res := mslice(TransactionLeaf.metadata.length.position(pos), 1)
}



function TransactionLeaf.witnesses.length.position(_pos) -> _offset {
  
      
        function TransactionLeaf.witnesses.length.position._chunk0(pos) -> __r {
          __r := 0x03
        }
      
        function TransactionLeaf.witnesses.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionLeaf.witnesses.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x02, add(TransactionLeaf.witnesses.length.position._chunk1(pos), 0)), 1), 8)
        }
      

      _offset := add(TransactionLeaf.witnesses.length.position._chunk0(_pos), add(TransactionLeaf.witnesses.length.position._chunk1(_pos), add(TransactionLeaf.witnesses.length.position._chunk2(_pos), 0)))
    
}



function TransactionLeaf.witnesses.position(_pos) -> _offset {
  
      
        function TransactionLeaf.witnesses.position._chunk0(pos) -> __r {
          __r := 0x05
        }
      
        function TransactionLeaf.witnesses.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionLeaf.witnesses.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x02, add(TransactionLeaf.witnesses.position._chunk1(pos), 0)), 1), 8)
        }
      

      _offset := add(TransactionLeaf.witnesses.position._chunk0(_pos), add(TransactionLeaf.witnesses.position._chunk1(_pos), add(TransactionLeaf.witnesses.position._chunk2(_pos), 0)))
    
}



function TransactionLeaf.witnesses.length(pos) -> res {
  res := mslice(TransactionLeaf.witnesses.length.position(pos), 2)
}



function TransactionProof.signatureFee.offset(pos) -> _offset {
_offset := add(TransactionProof.signatureFee.position(pos), 32)
}



function TransactionLeaf.witnesses.offset(pos) -> _offset {
_offset := add(TransactionLeaf.witnesses.position(pos), mul(TransactionLeaf.witnesses.length(pos), 1))
}



function Input.witnessReference(pos) -> res {
  res := mslice(Input.witnessReference.position(pos), 1)
}



function Input.witnessReference.position(_pos) -> _offset {
  
      
        function Input.witnessReference.position._chunk0(pos) -> __r {
          __r := 0x01
        }
      
        function Input.witnessReference.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Input.witnessReference.position._chunk0(_pos), add(Input.witnessReference.position._chunk1(_pos), 0))
    
}



function TransactionLeaf.inputs.position(_pos) -> _offset {
  
      
        function TransactionLeaf.inputs.position._chunk0(pos) -> __r {
          __r := 0x07
        }
      
        function TransactionLeaf.inputs.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionLeaf.inputs.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x02, add(TransactionLeaf.inputs.position._chunk1(pos), 0)), 1), 8)
        }
      
        function TransactionLeaf.inputs.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(TransactionLeaf.inputs.position._chunk2(pos), 0))), 2), 1)
        }
      

      _offset := add(TransactionLeaf.inputs.position._chunk0(_pos), add(TransactionLeaf.inputs.position._chunk1(_pos), add(TransactionLeaf.inputs.position._chunk2(_pos), add(TransactionLeaf.inputs.position._chunk3(_pos), 0))))
    
}



function TransactionLeaf.inputs.offset(pos) -> _offset {
_offset := add(TransactionLeaf.inputs.position(pos), mul(TransactionLeaf.inputs.length(pos), 1))
}



function TransactionLeaf.inputs.length(pos) -> res {
  res := mslice(TransactionLeaf.inputs.length.position(pos), 2)
}



function TransactionLeaf.metadata(pos, i) -> res {
  res := mslice(add(TransactionLeaf.metadata.position(pos),
    mul(i, 8)), 8)
}

function TransactionLeaf.metadata.slice(pos) -> res {
  res := mslice(TransactionLeaf.metadata.position(pos),
    TransactionLeaf.metadata.length(pos))
}



function TransactionLeaf.outputs.position(_pos) -> _offset {
  
      
        function TransactionLeaf.outputs.position._chunk0(pos) -> __r {
          __r := 0x09
        }
      
        function TransactionLeaf.outputs.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionLeaf.outputs.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x02, add(TransactionLeaf.outputs.position._chunk1(pos), 0)), 1), 8)
        }
      
        function TransactionLeaf.outputs.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(TransactionLeaf.outputs.position._chunk2(pos), 0))), 2), 1)
        }
      
        function TransactionLeaf.outputs.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x05, add(pos, add(mul(mslice(add(0x02, add(pos, 0)), 1), 8), add(TransactionLeaf.outputs.position._chunk3(pos), 0)))), 2), 1)
        }
      

      _offset := add(TransactionLeaf.outputs.position._chunk0(_pos), add(TransactionLeaf.outputs.position._chunk1(_pos), add(TransactionLeaf.outputs.position._chunk2(_pos), add(TransactionLeaf.outputs.position._chunk3(_pos), add(TransactionLeaf.outputs.position._chunk4(_pos), 0)))))
    
}



function TransactionLeaf.outputs.length.position(_pos) -> _offset {
  
      
        function TransactionLeaf.outputs.length.position._chunk0(pos) -> __r {
          __r := 0x07
        }
      
        function TransactionLeaf.outputs.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionLeaf.outputs.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0x02, add(TransactionLeaf.outputs.length.position._chunk1(pos), 0)), 1), 8)
        }
      
        function TransactionLeaf.outputs.length.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x03, add(pos, add(TransactionLeaf.outputs.length.position._chunk2(pos), 0))), 2), 1)
        }
      
        function TransactionLeaf.outputs.length.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x05, add(pos, add(mul(mslice(add(0x02, add(pos, 0)), 1), 8), add(TransactionLeaf.outputs.length.position._chunk3(pos), 0)))), 2), 1)
        }
      

      _offset := add(TransactionLeaf.outputs.length.position._chunk0(_pos), add(TransactionLeaf.outputs.length.position._chunk1(_pos), add(TransactionLeaf.outputs.length.position._chunk2(_pos), add(TransactionLeaf.outputs.length.position._chunk3(_pos), add(TransactionLeaf.outputs.length.position._chunk4(_pos), 0)))))
    
}



function TransactionLeaf.outputs.offset(pos) -> _offset {
_offset := add(TransactionLeaf.outputs.position(pos), mul(TransactionLeaf.outputs.length(pos), 1))
}



function TransactionLeaf.outputs.length(pos) -> res {
  res := mslice(TransactionLeaf.outputs.length.position(pos), 2)
}



function TransactionProof.blockNumber(pos) -> res {
  res := mslice(TransactionProof.blockNumber.position(pos), 32)
}



function TransactionProof.transactionIndex(pos) -> res {
  res := mslice(TransactionProof.transactionIndex.position(pos), 2)
}



function TransactionProof.rootIndex(pos) -> res {
  res := mslice(TransactionProof.rootIndex.position(pos), 2)
}



function TransactionProof.blockHeight(pos) -> res {
  res := mslice(TransactionProof.blockHeight.position(pos), 32)
}



function TransactionLeaf.metadata.offset(pos) -> _offset {
_offset := add(TransactionLeaf.metadata.position(pos), mul(TransactionLeaf.metadata.length(pos), 8))
}



function Caller.owner(pos) -> res {
  res := mslice(Caller.owner.position(pos), 20)
}



function Caller.blockNumber(pos) -> res {
  res := mslice(Caller.blockNumber.position(pos), 4)
}



function TransactionProof.blockProducer(pos) -> res {
  res := mslice(TransactionProof.blockProducer.position(pos), 20)
}



function Producer.hash(pos) -> res {
  res := mslice(Producer.hash.position(pos), 32)
}



function TransactionProof.transaction.keccak256(pos) -> _hash {
  _hash := keccak256(TransactionProof.transaction.position(pos),
    mul(TransactionProof.transaction.length(pos),
          TransactionProof.transaction.size()))
}



function TransactionProof.transaction.size() -> _size {
  _size := 1
}



function TransactionProof.merkleTreeRoot(pos) -> res {
  res := mslice(TransactionProof.merkleTreeRoot.position(pos), 32)
}



function BlockHeader.producer(pos) -> res {
  res := mslice(BlockHeader.producer.position(pos), 20)
}



function Constructor.penaltyDelay(pos) -> res {
  res := mslice(Constructor.penaltyDelay.position(pos), 32)
}



function InputDeposit.owner(pos) -> res {
  res := mslice(InputDeposit.owner.position(pos), 20)
}



function InputDeposit.owner.position(_pos) -> _offset {
  
      
        function InputDeposit.owner.position._chunk0(pos) -> __r {
          __r := 0x02
        }
      
        function InputDeposit.owner.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(InputDeposit.owner.position._chunk0(_pos), add(InputDeposit.owner.position._chunk1(_pos), 0))
    
}



function InputDeposit.type.position(_pos) -> _offset {
  
      
        function InputDeposit.type.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function InputDeposit.type.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(InputDeposit.type.position._chunk0(_pos), add(InputDeposit.type.position._chunk1(_pos), 0))
    
}



function InputDeposit.witnessReference.position(_pos) -> _offset {
  
      
        function InputDeposit.witnessReference.position._chunk0(pos) -> __r {
          __r := 0x01
        }
      
        function InputDeposit.witnessReference.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(InputDeposit.witnessReference.position._chunk0(_pos), add(InputDeposit.witnessReference.position._chunk1(_pos), 0))
    
}



function RootHeader.commitmentHash(pos) -> res {
  res := mslice(RootHeader.commitmentHash.position(pos), 32)
}



function RootHeader.merkleTreeRoot(pos) -> res {
  res := mslice(RootHeader.merkleTreeRoot.position(pos), 32)
}



function Metadata.transactionIndex(pos) -> res {
  res := mslice(Metadata.transactionIndex.position(pos), 2)
}



function Metadata.transactionIndex.position(_pos) -> _offset {
  
      
        function Metadata.transactionIndex.position._chunk0(pos) -> __r {
          __r := 0x05
        }
      
        function Metadata.transactionIndex.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Metadata.transactionIndex.position._chunk0(_pos), add(Metadata.transactionIndex.position._chunk1(_pos), 0))
    
}



function Metadata.blockHeight.position(_pos) -> _offset {
  
      
        function Metadata.blockHeight.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function Metadata.blockHeight.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Metadata.blockHeight.position._chunk0(_pos), add(Metadata.blockHeight.position._chunk1(_pos), 0))
    
}



function Metadata.rootIndex.position(_pos) -> _offset {
  
      
        function Metadata.rootIndex.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function Metadata.rootIndex.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Metadata.rootIndex.position._chunk0(_pos), add(Metadata.rootIndex.position._chunk1(_pos), 0))
    
}



function Metadata.blockHeight(pos) -> res {
  res := mslice(Metadata.blockHeight.position(pos), 4)
}



function Metadata.rootIndex(pos) -> res {
  res := mslice(Metadata.rootIndex.position(pos), 1)
}



function MetadataDeposit.blockNumber(pos) -> res {
  res := mslice(MetadataDeposit.blockNumber.position(pos), 4)
}



function MetadataDeposit.blockNumber.position(_pos) -> _offset {
  
      
        function MetadataDeposit.blockNumber.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function MetadataDeposit.blockNumber.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(MetadataDeposit.blockNumber.position._chunk0(_pos), add(MetadataDeposit.blockNumber.position._chunk1(_pos), 0))
    
}



function MetadataDeposit.token.position(_pos) -> _offset {
  
      
        function MetadataDeposit.token.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function MetadataDeposit.token.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(MetadataDeposit.token.position._chunk0(_pos), add(MetadataDeposit.token.position._chunk1(_pos), 0))
    
}



function MetadataDeposit.token(pos) -> res {
  res := mslice(MetadataDeposit.token.position(pos), 4)
}



function TransactionProof.numTokens(pos) -> res {
  res := mslice(TransactionProof.numTokens.position(pos), 32)
}



function Metadata.outputIndex(pos) -> res {
  res := mslice(Metadata.outputIndex.position(pos), 1)
}



function Metadata.outputIndex.position(_pos) -> _offset {
  
      
        function Metadata.outputIndex.position._chunk0(pos) -> __r {
          __r := 0x07
        }
      
        function Metadata.outputIndex.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Metadata.outputIndex.position._chunk0(_pos), add(Metadata.outputIndex.position._chunk1(_pos), 0))
    
}



function TransactionProof.numAddresses(pos) -> res {
  res := mslice(TransactionProof.numAddresses.position(pos), 32)
}



function TransactionLeaf.size(pos) -> _offset {
  _offset := sub(TransactionLeaf.offset(pos), pos)
}



function TransactionLeaf.offset(pos) -> _offset {
  _offset := TransactionLeaf.outputs.offset(pos)
}



function TransactionLeaf.length(pos) -> res {
  res := mslice(TransactionLeaf.length.position(pos), 2)
}



function InputHTLC.preImage.keccak256(pos) -> _hash {
  _hash := keccak256(InputHTLC.preImage.position(pos),
    InputHTLC.preImage.size())
}



function InputHTLC.preImage.position(_pos) -> _offset {
  
      
        function InputHTLC.preImage.position._chunk0(pos) -> __r {
          __r := 0x02
        }
      
        function InputHTLC.preImage.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(InputHTLC.preImage.position._chunk0(_pos), add(InputHTLC.preImage.position._chunk1(_pos), 0))
    
}



function InputHTLC.type.position(_pos) -> _offset {
  
      
        function InputHTLC.type.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function InputHTLC.type.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(InputHTLC.type.position._chunk0(_pos), add(InputHTLC.type.position._chunk1(_pos), 0))
    
}



function InputHTLC.witnessReference.position(_pos) -> _offset {
  
      
        function InputHTLC.witnessReference.position._chunk0(pos) -> __r {
          __r := 0x01
        }
      
        function InputHTLC.witnessReference.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(InputHTLC.witnessReference.position._chunk0(_pos), add(InputHTLC.witnessReference.position._chunk1(_pos), 0))
    
}



function InputHTLC.preImage.size() -> _size {
  _size := 32
}



function TransactionProof.data(pos, i) -> res {
  res := mslice(add(TransactionProof.data.position(pos),
    mul(i, 32)), 32)
}

function TransactionProof.data.slice(pos) -> res {
  res := mslice(TransactionProof.data.position(pos),
    TransactionProof.data.length(pos))
}



function TransactionProof.size(pos) -> _offset {
  _offset := sub(TransactionProof.offset(pos), pos)
}



function TransactionProof.offset(pos) -> _offset {
  _offset := TransactionProof.returnOwner.offset(pos)
}



function TransactionProof.returnOwner.offset(pos) -> _offset {
_offset := add(TransactionProof.returnOwner.position(pos), 20)
}



function Deposit.token(pos) -> res {
  res := mslice(Deposit.token.position(pos), 32)
}



function Deposit.token.position(_pos) -> _offset {
  
      
        function Deposit.token.position._chunk0(pos) -> __r {
          __r := 0x20
        }
      
        function Deposit.token.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Deposit.token.position._chunk0(_pos), add(Deposit.token.position._chunk1(_pos), 0))
    
}



function Deposit.owner.position(_pos) -> _offset {
  
      
        function Deposit.owner.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function Deposit.owner.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Deposit.owner.position._chunk0(_pos), add(Deposit.owner.position._chunk1(_pos), 0))
    
}



function Deposit.blockNumber(pos) -> res {
  res := mslice(Deposit.blockNumber.position(pos), 32)
}



function Deposit.blockNumber.position(_pos) -> _offset {
  
      
        function Deposit.blockNumber.position._chunk0(pos) -> __r {
          __r := 0x40
        }
      
        function Deposit.blockNumber.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Deposit.blockNumber.position._chunk0(_pos), add(Deposit.blockNumber.position._chunk1(_pos), 0))
    
}



function Deposit.keccak256(pos) -> _hash {
  _hash := keccak256(pos, Deposit.size(pos))
}



function Deposit.size(pos) -> _offset {
  _offset := sub(Deposit.offset(pos), pos)
}



function Deposit.offset(pos) -> _offset {
  _offset := Deposit.value.offset(pos)
}



function Deposit.value.offset(pos) -> _offset {
_offset := add(Deposit.value.position(pos), 32)
}



function Deposit.value.position(_pos) -> _offset {
  
      
        function Deposit.value.position._chunk0(pos) -> __r {
          __r := 0x60
        }
      
        function Deposit.value.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Deposit.value.position._chunk0(_pos), add(Deposit.value.position._chunk1(_pos), 0))
    
}



function TransactionProof.signatureFeeToken(pos) -> res {
  res := mslice(TransactionProof.signatureFeeToken.position(pos), 32)
}



function TransactionProof.signatureFee(pos) -> res {
  res := mslice(TransactionProof.signatureFee.position(pos), 32)
}



function Deposit.owner(pos) -> res {
  res := mslice(Deposit.owner.position(pos), 32)
}



function WithdrawalMetadata.keccak256(pos) -> _hash {
  _hash := keccak256(pos, WithdrawalMetadata.size(pos))
}



function WithdrawalMetadata.size(pos) -> _offset {
  _offset := sub(WithdrawalMetadata.offset(pos), pos)
}



function WithdrawalMetadata.offset(pos) -> _offset {
  _offset := WithdrawalMetadata.outputIndex.offset(pos)
}



function WithdrawalMetadata.outputIndex.offset(pos) -> _offset {
_offset := add(WithdrawalMetadata.outputIndex.position(pos), 32)
}



function WithdrawalMetadata.outputIndex.position(_pos) -> _offset {
  
      
        function WithdrawalMetadata.outputIndex.position._chunk0(pos) -> __r {
          __r := 0x40
        }
      
        function WithdrawalMetadata.outputIndex.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(WithdrawalMetadata.outputIndex.position._chunk0(_pos), add(WithdrawalMetadata.outputIndex.position._chunk1(_pos), 0))
    
}



function WithdrawalMetadata.rootIndex.position(_pos) -> _offset {
  
      
        function WithdrawalMetadata.rootIndex.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function WithdrawalMetadata.rootIndex.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(WithdrawalMetadata.rootIndex.position._chunk0(_pos), add(WithdrawalMetadata.rootIndex.position._chunk1(_pos), 0))
    
}



function WithdrawalMetadata.transactionLeafHash.position(_pos) -> _offset {
  
      
        function WithdrawalMetadata.transactionLeafHash.position._chunk0(pos) -> __r {
          __r := 0x20
        }
      
        function WithdrawalMetadata.transactionLeafHash.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(WithdrawalMetadata.transactionLeafHash.position._chunk0(_pos), add(WithdrawalMetadata.transactionLeafHash.position._chunk1(_pos), 0))
    
}



function UTXO.owner(pos) -> res {
  res := mslice(UTXO.owner.position(pos), 32)
}



function UTXO.token(pos) -> res {
  res := mslice(UTXO.token.position(pos), 32)
}



function UTXO.amount(pos) -> res {
  res := mslice(UTXO.amount.position(pos), 32)
}



function Deposit.value(pos) -> res {
  res := mslice(Deposit.value.position(pos), 32)
}



function RootHeader.feeToken(pos) -> res {
  res := mslice(RootHeader.feeToken.position(pos), 32)
}



function RootHeader.fee(pos) -> res {
  res := mslice(RootHeader.fee.position(pos), 32)
}



function RootHeader.length(pos) -> res {
  res := mslice(RootHeader.length.position(pos), 32)
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
  
    // Offset in memory at which to start the call data copy
    

    /// @notice Copy all calldata to memory.
    function calldata.copy() {
      // Require calldata is available.
      require(gt(calldatasize(), 0), 0x02)

      // Copy calldata.
      calldatacopy(1024, 0, calldatasize())
    }

    /// @notice payable requirement, ensure value is not used.
    function nonpayable() {
      require(iszero(callvalue()), 0x03)
    }

    /// @notice Get function signature.
    /// @return Function signature as bytes4
    function calldata.signature() -> sig {
      sig := mslice(1024, 4)
    }

    /// @notice Get one word.
    /// @return Word as bytes32
    function calldata.word(index) -> word {
      word := mload(safeAdd(safeAdd(1024, 4), safeMul(index, 32)))
    }

    function abi.offset(offset) -> position {
      position := safeAdd(offset, safeAdd(36, 1024))
    }

    function abi.length(offset) -> length {
      length := mload(safeAdd(offset, safeAdd(4, 1024)))
    }

    function return.word(word) {
      mstore(0, word)
      return(0, 32)
    }

    function calldata.offset() -> offset {
      offset := safeAdd(1024, calldatasize())
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
      require(gt(amount, 0), 0x04)
      require(gt(owner, 0), 0x05)
      require(gte(token, 0), 0x06)

      switch token

      case 0 {
        require(call(gas(), owner, amount, 0, 0, 0, 0), 0x07)
      }

      default {
        mstore(0, 0xa9059cbb) mstore(add(0,32), owner) mstore(add(0,64), amount)
        require(call(gas(), token, 0, 28, 68, 0, 32), 0x08)
        require(gt(mload(0), 0), 0x09)
      }
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
        require(lt(id, 0xFFFFFFFF), 0x01)
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
      require(eq(origin(), caller()), 0x0a)
      require(eq(extcodesize(caller()), 0), 0x0b)

      // Calldata size must be at least as big as the minimum transaction size (44 bytes)
      require(gte(length, 44), 0x0c)
      // Calldata max size enforcement (~2M gas / 16 gas per byte/64kb payload target)
      require(lte(length, 32000), 0x0d)
      require(lte(calldatasize(), safeAdd(32000, mul32(6))), 0x0e)

      // Fee token must be already registered
      require(gte(token, 0), 0x0f)
      require(lt(token, numTokens()), 0x10)

      // Build root
      mstore(0, caller()) mstore(add(0,32), merkleTreeRoot) mstore(add(0,64), commitmentHash) mstore(add(0,96), length) mstore(add(0,128), token) mstore(add(0,160), fee)
      // Hash the block header with an offset of 12 bytes, since first field is a 32-12=20 byte address.
      let root := RootHeader.keccak256(12)

      // Root must not have been registered yet
      let rootBlockNumber := sload(mappingKey(3, root))
      require(eq(rootBlockNumber, 0), 0x11)

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
      require(gt(number(), minBlockNumber), 0x12)
      require(eq(blockhash(minBlockNumber), minBlockHash), 0x13)

      // Check that new rollup blocks builds on top of the tip
      require(eq(height, safeAdd(_blockTip, 1)), 0x14)

      // Require at least one root submission
      require(gt(rootsLength, 0), 0x15)

      // Require at most the maximum number of root submissions
      require(lte(rootsLength, 128), 0x16)

      // Get the rollup operator
      Constructor.copy(0)
      let producer := Constructor.operator(0)

      // Require value be bond size
      require(eq(callvalue(), Constructor.bondSize(0)), 0x17)

      // Clear submitted roots from storage
      for { let rootIndex := 0 } lt(rootIndex, rootsLength) { rootIndex := safeAdd(rootIndex, 1) } {
        let rootHash := mload(safeAdd(rootsPosition, safeMul(rootIndex, 32)))
        let rootBlockNumber := rootBlockNumberAt(rootHash)

        // Check root exists
        require(gt(rootBlockNumber, 0), 0x18)

        // Check whether block producer has the right to commit rollup block
        // In penalty mode (second condition is true), anyone can commit a block with roots without delay
        // In normal mode (second condition is false), only the operator can commit a block before waiting the root delay
        if and(lt(number(), safeAdd(rootBlockNumber, Constructor.submissionDelay(0))),
          gt(number(), getPenalty())) {
          require(eq(caller(), producer), 0x19)
        }

        // Clear root from storage.
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
  
    

    /// @notice Verifies a block and root header.
    /// @param blockHeader Position in memory of block header object.
    /// @param root Position in memory of root header object. If `0`, only verify the block header, not the root header.
    /// @param rootIndex Position in memory of root index.
    /// @param assertFinalized Enum flag. 0: Assert finalized. 1: Assert not finalized. 2: No assert.
    function verifyHeader(blockHeader, root, rootIndex, assertFinalized) {
      // Block must be known (already committed)
      require(eq(blockCommitment(BlockHeader.height(blockHeader)), BlockHeader.keccak256(blockHeader)),
          0x1a)

      // Load finalization delay parameter from constructor
      Constructor.copy(0)
      let finalizationDelay := Constructor.finalizationDelay(0)

      // If asserting finalized, block must be finalizable
      if eq(assertFinalized, 1) {
        require(gte(
          number(),
          safeAdd(BlockHeader.blockNumber(blockHeader), finalizationDelay)
        ), 0x1b)
      }

      // If asserting not finalized, block must not be finalizable
      if eq(assertFinalized, 0) {
        require(lt(
          number(),
          safeAdd(BlockHeader.blockNumber(blockHeader), finalizationDelay)
        ), 0x1c)
      }

      // If root header is present, verify it
      if gt(root, 0) {
        // Check bounds on transaction root index
        require(lt(rootIndex, BlockHeader.roots.length(blockHeader)),
            0x1d)

        // Hash of root header must match root header hash from proof
        require(eq(
            RootHeader.keccak256(root),
            BlockHeader.roots(blockHeader, rootIndex)),
            0x1e)
      }
    }
  
    
    

    function eip712.domain() -> EIP712Domain {
      Constructor.copy(0)
      let chainId := Constructor.chainId(0)
      let nameHash := Constructor.name.hash(0)
      let versionHash := Constructor.version.hash(0)
      mstore(0, 0xbe1f30900ea0b603c03bc6ce517b4795fbdb08cc0b4b6e316e19199becde9754) mstore(add(0,32), nameHash) mstore(add(0,64), versionHash) mstore(add(0,96), chainId) mstore(add(0,128), address())
      EIP712Domain := keccak256(0, safeMul(5, 32))
    }

    function eip712.transaction(unsignedHashId) -> EIP712Transaction {
      mstore(0, 0xcfa11514192b8d3d6bcda9639281831e60687a67997d39912c7eb7a7a8041ad3) mstore(add(0,32), unsignedHashId)
      EIP712Transaction := keccak256(0, 64)
    }

    function eip712(unsignedHashId) -> hashId {
      let EIP712Transaction := eip712.transaction(unsignedHashId)
      let EIP712Domain := eip712.domain()
      mstore(0, 0x1901) mstore(add(0,32), EIP712Domain) mstore(add(0,64), EIP712Transaction)
      hashId := keccak256(30, 66)
    }
  
    // Size of metadata object in bytes
    

    /// @notice Metadata object. Points to an exact entry in the ledger.
    

    /// @notice Metadata for Deposit objects.
    
  
    

    

    

    

    /// @notice Get authorized transaction ID by owner and Ethereum block number.
    /// @return Transaction ID as bytes32
    // TODO can this be transactionID => owner?
    // TODO care for re-org attacks
    function witnessAt(owner, blockNumber) -> id {
      id := sload(mappingKey2(10, owner, blockNumber))
    }

    /// @notice Register a new Caller witness for a transaction ID.
    function commitWitness(id) {
      // Witness must not already be registered
      require(eq(witnessAt(caller(), number()), 0), 0x1f)
      // Store the transaction hash keyed by the caller and block number
      sstore(mappingKey2(10, caller(), number()), id)
      // Build WitnessCommitted log and emit
      mstore(0, number())
      log3(0, 32, 0x341ba990467944d1f03e07e000a6ba6e631223bd8b9b996aaec9f199bef89c62,
        caller(),
        id)
    }

    /// @notice Get size of witness object.
    /// @return Size of witness object, in bytes as uint256
    function witnessSize(witness) -> size {
      switch Signature.type(witness)

      case 0 {
        size := Signature.size(witness)
      }

      case 1 {
        size := Caller.size(witness)
      }

      case 2 {
        size := Producer.size(witness)
      }

      default { // avoid infinite loops
        size := 66
      }
    }

    /// @notice ecrecover helper function.
    function ecrecover(digestHash, witness) -> account {
      mstore(0, digestHash)
      mstore(32, Signature.v(witness))
      mstore(64, Signature.r(witness))
      mstore(96, Signature.s(witness))

      let result := call(3000, 1, 0, 0, 128, 128, 32) // 4 chunks, return at 128
      require(gt(result, 0), 0x20)
      account := mload(128)
    }
  
    

    /// @notice Generic input. Transfer and Root.
    

    /// @notice A Deposit input.
    

    /// @notice An HTLC input.
    

    /// @notice Get size of an input object.
    /// @return Size of input in bytes as uint256
    function inputSize(input) -> size {
      switch Input.type(input)

      case 2 {
        size := 34
      }

      case 1 {
        size := 22
      }

      default {
        size := 2
      }
    }

    /// @notice Compute hash of input.
    /// @return Keccak256 hash of input as bytes32
    function inputKeccak256(input) -> hash {
      hash := keccak256(input, inputSize(input))
    }
  
    

    /// @notice Generic output. Transfer and Withdraw.
    

    /// @notice An HTLC output.
    

    /// @notice A Return output. Not added to rollup state.
    

    /// @notice A rollup state element: a UTXO. The UTXO ID is the hash of its fields.
    

    /// @notice Parse out the amount from an output object.
    function outputAmount(output) -> amount {
      let pos := Output.amount.position(output)
      let shift := Output.amount.shift(output)
      let len := Output.amount.length(output)

      require(lte(len, 32), "amount-length-overflow")
      require(lte(shift, 256), "amount-shift-overflow")
      require(lte(safeAdd(shift, safeMul(len, 8)), 256), "amount-overflow")

      amount := shl(shift, mslice(pos, len))
    }

    /// @notice Get the size of an output object.
    function outputSize(output) -> size {
      switch Output.type(output)

      case 0 {
        size := Output.size(output)
      }

      case 1 {
        size := Output.size(output)
      }

      case 2 {
        size := OutputHTLC.size(output)
      }

      case 3 {
        size := OutputReturn.size(output)
      }

      default { // avoid infinite loops
        size := 20
      }
    }

    /// @notice Parse out the token ID from an output object.
    function outputToken(output) -> id {
      id := Output.token.slice(output)
    }

    /// @notice Checks non-Return output owner.
    /// @return If output owner matches as bool
    function ownerEquates(output, owner) -> result {
      let len := Output.owner.length(output)

      // Length of owner field must be <= 20 bytes
      require(gt(len, 0), 0x21)
      require(lte(len, 20), 0x22)

      switch len

      case 20 { // raw address
        result := or(
          eq(Output.owner.slice(output), owner),
          eq(Output.owner.slice(output), calculateFunnelAddress(owner))
        )
      }

      default { // registered address ID
        let id := Output.owner.slice(output)
        result := or(
          eq(id, addressId(owner)),
          eq(id, addressId(calculateFunnelAddress(owner)))
        )
      }
    }

    /// @notice Checks HTLC's return owner.
    /// @return If output owner matches as bool
    function returnOwnerEquals(output, owner) -> result {
      let len := OutputHTLC.returnOwner.length(output)

      require(gt(len, 0), 0x21)
      require(lte(len, 20), 0x22)

      switch len

      case 20 { // raw address
        result := or(
          eq(OutputHTLC.returnOwner.slice(output), owner),
          eq(OutputHTLC.returnOwner.slice(output), calculateFunnelAddress(owner))
        )
      }

      default { // registered address ID
        let id := OutputHTLC.returnOwner.slice(output)
        result := or(
          eq(id, addressId(owner)),
          eq(id, addressId(calculateFunnelAddress(owner)))
        )
      }
    }
  
    // Minimum transaction size in bytes
    
    // Maximum transaction size in bytes
    
    // Maximum number of inputs per transaction
    
    // Maximum number of outputs per transaction
    
    // Empty leaf hash default value
    

    /// @notice Merkle proof to specific input or output of a transaction in the rollup chain.
    

    /// @notice Leaf of transaction Merkle tree.
    

    /// @notice Helper function to load a UTXO into memory for later use.
    function TransactionProof.UTXO.assign(proof, pos) {
      let output := selectOutput(proof)

      // Return-type outputs are unspendable
      require(neq(Output.type(output), 3),
        0x23)

      // Owner must match
      require(ownerEquates(output, TransactionProof.tokenAddress(proof)),
        0x24)

      // For HTLC UTXOs, return owner must match
      if eq(Output.type(output), 2) {
        require(returnOwnerEquals(output, TransactionProof.returnOwner(proof)),
          0x25)
      }

      // Save the UTXO to memory
      mstore(
        pos,
        transactionId(proof)  // return witness
      ) mstore(
        add(pos,32),
        TransactionProof.inputOutputIndex(proof)  // return witness
      ) mstore(
        add(pos,64),
        Output.type(output)  // return witness
      ) mstore(
        add(pos,96),
        TransactionProof.tokenAddress(proof)  // return witness
      ) mstore(
        add(pos,128),
        outputAmount(output)  // return witness
      ) mstore(
        add(pos,160),
        Output.token.slice(output)  // return witness
      ) mstore(
        add(pos,192),
        0  // return witness
      ) mstore(
        add(pos,224), // digest
        0  // return witness
      ) mstore(
        add(pos,256), // expiry
        0  // return witness
      )

      // If the UTXO is an HTLC type, make sure to save the extra required fields
      if eq(Output.type(output), 2) {
        mstore(safeAdd(pos, 192), OutputHTLC.digest(output))
        mstore(safeAdd(pos, 224), OutputHTLC.expiry(output))
        mstore(safeAdd(pos, 256), TransactionProof.returnOwner(proof))
      }
    }

    /// @notice Hash a UTXO.
    /// @return The UTXO's hash as a bytes32
    function TransactionProof.UTXO.keccak256(proof) -> hash {
      // Assign UTXO to memory
      TransactionProof.UTXO.assign(proof, 0)

      // Hash UTXO to get UTXO ID
      hash := UTXO.keccak256(0)
    }

    /// @notice Find the position of the start of the block substructure.
    /// @return Position of block substructure as uint256
    function TransactionProof.block(proof) -> pos {
      pos := TransactionProof.blockProducer.position(proof)
    }

    /// @notice Find the position of start of the root substructure.
    /// @return Position of root substructure as uint256
    function TransactionProof.root(proof) -> pos {
      pos := TransactionProof.rootProducer.position(proof)
    }

    ////////////////////////////////////////////////////////////////////////////
    // ABI Encoded Structures (Non-Tight Packed/Rolled)
    ////////////////////////////////////////////////////////////////////////////

    /// @notice Calculate the fee of a root. This is feerate x length of transactions in bytes.
    /// @return Fee for root as uint256
    function rootFee(proof, token) -> sum {
      if eq(TransactionProof.feeToken(proof), token) {
        sum := safeMul(TransactionProof.transaction.length(proof), TransactionProof.fee(proof))
      }
    }

    /// @notice Get transaction ID from proof.
    /// @return Transaction ID as bytes32
    function transactionId(proof) -> hash {
      let leaf := TransactionProof.transaction.position(proof)
      // Transaction IDs are the EIP-712 hash of the non-witness transaction data.
      // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
      let start := TransactionLeaf.inputs.length.position(leaf)
      let end := TransactionProof.signatureFee.offset(proof)
      hash := eip712(keccak256(start, safeSub(end, start)))
    }

    /// @notice Find the position of the witness at a given index.
    /// @return Position of witness as uint256
    function TransactionProof.witness(proof, index) -> pos {
      let leaf := TransactionProof.transaction.position(proof)
      pos := TransactionLeaf.witnesses.position(leaf)

      // Iterate through list of witnesses until index is reached
      for {} gt(index, 0) {} {
        pos := safeAdd(pos, witnessSize(pos))
        index := safeSub(index, 1)
      }

      require(lt(pos, TransactionLeaf.witnesses.offset(leaf)), 0x26)
    }

    /// @notice Find the position of the witness with proof-specified index.
    /// @return Position of witness as uint256
    function TransactionProof.input.witness(proof) -> pos {
      let index := Input.witnessReference(selectInput(proof))
      pos := TransactionProof.witness(proof, index)
    }

    /// @notice Find the position of the input with proof-specified index.
    /// @return Position of input as uint256
    function selectInput(proof) -> pos {
      let leaf := TransactionProof.transaction.position(proof)
      let index := TransactionProof.inputOutputIndex(proof)
      pos := TransactionLeaf.inputs.position(leaf)

      require(lt(index, 8), 0x27)

      for {} gt(index, 0) {} {
        pos := safeAdd(pos, inputSize(pos))
        index := safeSub(index, 1)
      }

      require(lt(pos, TransactionLeaf.inputs.offset(leaf)), 0x28)
    }

    /// @notice Extract metadata of output referenced by input from proof.
    /// @return Metadata as bytes8
    function inputReferencedMetadata(proof) -> id {
      let leaf := TransactionProof.transaction.position(proof)
      let index := TransactionProof.inputOutputIndex(proof)
      id := TransactionLeaf.metadata(leaf, index)
    }

    /// @notice Find the position of the output with proof-specified index.
    /// @return Position of output as uint256
    function selectOutput(proof) -> pos {
      let leaf := TransactionProof.transaction.position(proof)
      let index := TransactionProof.inputOutputIndex(proof)
      pos := TransactionLeaf.outputs.position(leaf)

      require(lt(index, 8), 0x29)

      for {} gt(index, 0) {} {
        pos := safeAdd(pos, outputSize(pos))
        index := safeSub(index, 1)
      }

      require(lt(pos, TransactionLeaf.outputs.offset(leaf)), 0x2a)
    }

    /// @notice Check if HTLC output has timed out.
    /// @return If the output has timed out as bool
    function outputExpired(input, proof) -> result {
      let output := selectOutput(input)
      let blockNumber := TransactionProof.blockNumber(proof)
      result := gt(blockNumber, OutputHTLC.expiry(output))
    }

    /// @notice Get total length of witneses, in bytes.
    /// @return Length of witnesses as uint256
    function witnessesLength(leaf) -> len {
      let pos := TransactionLeaf.witnesses.position(leaf)
      let end := TransactionLeaf.witnesses.offset(leaf)

      // Iterate over witness lengths and accumulate
      for {} lt(pos, end) {} {
        pos := safeAdd(pos, witnessSize(pos))
        len := safeAdd(len, 1)
      }
    }

    /// @notice Get total length of inputs, in bytes.
    /// @return Length of inputs as uint256
    function inputsLength(leaf) -> len {
      let pos := TransactionLeaf.inputs.position(leaf)
      let end := TransactionLeaf.inputs.offset(leaf)

      // Iterate over input lengths and accumulate
      for {} lt(pos, end) {} {
        pos := safeAdd(pos, inputSize(pos))
        len := safeAdd(len, 1)
      }
    }

    /// @notice Get total length of outputs, in bytes.
    /// @return Length of outputs as uint256
    function TransactionProof.outputs.length(proof) -> len {
      let leaf := TransactionProof.transaction.position(proof)
      let pos := TransactionLeaf.outputs.position(leaf)
      let end := TransactionLeaf.outputs.offset(leaf)

      // Iterate over output lengths and accumulate
      for {} lt(pos, end) {} {
        pos := safeAdd(pos, outputSize(pos))
        len := safeAdd(len, 1)
      }
    }

    /// @notice Extract input metadata from proof.
    /// @return Input metadata as bytes8.
    function inputMetadata(proof) -> id {
      mstore(4, TransactionProof.inputOutputIndex(proof))
      mstore(3, TransactionProof.transactionIndex(proof))
      mstore(1, TransactionProof.rootIndex(proof))
      mstore(0, TransactionProof.blockHeight(proof))
      id := mslice(28, 8)
    }

    /// @notice Extract output metadata from proof.
    /// @return Output metadata as bytes8.
    function outputMetadata(proof) -> id {
      mstore(4, TransactionProof.inputOutputIndex(proof))
      mstore(3, TransactionProof.transactionIndex(proof))
      mstore(1, TransactionProof.rootIndex(proof))
      mstore(0, TransactionProof.blockHeight(proof))
      id := mslice(28, 8)
    }

    /// @notice Find the position of the metadata with given index.
    /// @return Position of metadata as uint256
    function selectMetadata(proof, index) -> pos {
      let leaf := TransactionProof.transaction.position(proof)
      pos := TransactionLeaf.metadata.position(leaf)

      require(lt(index, 8), 0x27)

      for {} gt(index, 0) {} {
        pos := safeAdd(pos, 8)
        index := safeSub(index, 1)
      }

      require(lt(pos, TransactionLeaf.metadata.offset(leaf)), 0x28)
    }

    /// @notice Recover witness address from proof.
    /// @return Recovered address as address. 0 on fail.
    function recoverFromWitness(witness, proof) -> addr {
      switch Signature.type(witness)

      case 0 {
        addr := ecrecover(transactionId(proof), witness)
      }

      case 1 {
        addr := Caller.owner(witness)

        if neq(witnessAt(addr, Caller.blockNumber(witness)), transactionId(proof)) {
          addr := 0
        }
      }

      case 2 {
        addr := TransactionProof.blockProducer(proof)

        if neq(Producer.hash(witness), transactionId(proof)) {
          addr := 0
        }
      }

      default { require(0, 0x2b) }
    }

    /// @notice ecrecover witness with proof-specified index.
    /// @return Recovered address as address
    function TransactionProof.input.recoverWitness(proof) -> addr {
      let witness := TransactionProof.input.witness(proof)
      addr := recoverFromWitness(witness, proof)
    }
  
    // Maximum Merkle tree height
    

    /// @notice Verify a Merkle proof.
    /// @param transactionProof Position in memory of transaction proof.
    /// @return Boolean flag: if the leaf is *not* the rightmost.
    function verifyMerkleProof(transactionProof) -> leftish {
      // Memory position of number of nodes in Merkle proof
      let treeHeight := TransactionProof.merkleProof.length(transactionProof)
      // Memory position of Merkle branch
      let branchStartPosition := TransactionProof.merkleProof.position(transactionProof)
      // Memory position of transaction index (which indicates left or right sibling at each depth)
      let transactionIndex := TransactionProof.transactionIndex(transactionProof)

      // Check bound on Merkle tree height
      require(lt(treeHeight, 256),
        0x2c)

      // Temporary computed hash
      let computedHash := 0

      // If the transaction (leaf) has a length, then hash it to get leaf node value
      if gt(TransactionProof.transaction.length(transactionProof), 0) {
        computedHash := TransactionProof.transaction.keccak256(transactionProof)
      }

      // Reset rightmost detection variable (clear any previous use of this stack position).
      // This keeps track of if the leaf is *not* rightmost in the tree.
      leftish := 0x00

      // Iterate through Merkle proof depths
      // https://crypto.stackexchange.com/questions/31871/what-is-the-canonical-way-of-creating-merkle-tree-branches
      for { let depth := 0 } lt(depth, treeHeight) { depth := safeAdd(depth, 1) } {
        // Position of the sibling hash value
        let siblingHash := mload(safeAdd(branchStartPosition, safeMul(depth, 32)))

        // Determine proof direction (intuitively: bit value at depth)
        switch eq(smod(transactionIndex, 2), 0)

        // Direction is left branch
        case 1 {
            mstore(mul32(1), computedHash)
            mstore(mul32(2), siblingHash)

            // Leftishness detected in proof, this is not the rightmost leaf
            leftish := 0x01
        }

        // Direction is right branch
        case 0 {
            mstore(mul32(1), siblingHash)
            mstore(mul32(2), computedHash)
        }

        // Direction is invalid
        default {
          revert(0, 0)
        }

        // Compute parent node hash value
        computedHash := keccak256(mul32(1), mul32(2))

        // Shift transaction index right by 1 so that depth is always at lowest bit
        transactionIndex := shr(1, transactionIndex)
      }

      // Computed Merkle tree root must match provided Merkle tree root
      require(eq(computedHash, TransactionProof.merkleTreeRoot(transactionProof)),
        0x2d)
    }
  
    /// @notice Verify a transaction proof.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param assertFinalized Enum flag. 0: Assert finalized. 1: Assert not finalized. 2: No assert.
    function verifyTransactionProof(transactionProof, assertFinalized) {
      // Verify the block header
      verifyHeader(
        TransactionProof.block(transactionProof),
        TransactionProof.root(transactionProof),
        TransactionProof.rootIndex(transactionProof),
        assertFinalized
      )

      // Verify the Merkle inclusion proof
      pop(verifyMerkleProof(transactionProof))

      // Transaction must be at least one byte long
      require(gt(TransactionProof.transaction.length(transactionProof), 0),
        0x2e)

      // Ensure the selector index is less than 8.
      require(lt(TransactionProof.inputOutputIndex(transactionProof), 8),
        0x2f)
    }
  
    /// @dev Fraud finalization period.
    

    /// @notice This will commit a fraud hash in storage.
    function commitFraudHash(fraudHash) {
      // We store the caller / fraud hash 5 blocks into the future.
      sstore(
        mappingKey2(11, caller(), fraudHash),
        number()
      )
    }

    /// @notice Ensure that the calldata provided matches the fraud commitment hash.
    function requireValidFraudCommitment() {
      // Compute the fraud hash from calldata.
      let fraudHash := keccak256(1024, calldatasize())

      // Get the fraud commitment from block storage.
      let commitmentBlockNumber := sload(
        mappingKey2(11, caller(), fraudHash)
      )

      // Check the fraud commitment exists.
      require(gt(commitmentBlockNumber, 0), 0x30)

      // Require that the commitment blockNumber + period >= current block number.
      require(gte(
        number(),
        safeAdd(commitmentBlockNumber, 10)
      ), 0x31)
    }

    /// @notice Either assertion must pass or process fraud proof
    function assertOrFraud(assertion, fraudCode, block) {
      // Assert or begin fraud state change sequence
      if lt(assertion, 1) {
        // Fraud block details
        let fraudBlockHeight := BlockHeader.height(block)
        let fraudBlockProducer := BlockHeader.producer(block)

        // Fraud block must not be the genesis rollup block
        require(gt(fraudBlockHeight, 0), 0x32)

        // Copy constructor args to memory
        Constructor.copy(0)
        let bondSize := Constructor.bondSize(0)
        let penaltyDelay := Constructor.penaltyDelay(0)

        // Fraud block must not be finalizable yet
        require(lt(number(), safeAdd(BlockHeader.blockNumber(block), Constructor.finalizationDelay(0))),
          0x33)

        // Log block tips (old / new)
        log4(
          0,
          0,
          0x62a5229d18b497dceab57b82a66fb912a8139b88c6b7979ad25772dc9d28ddbd,
          blockTip(),
          safeSub(fraudBlockHeight, 1),
          fraudCode
        )

        // Roll back rollup chain: set new block tip to before fraud block
        sstore(6, safeSub(fraudBlockHeight, 1))

        // Set the penalty as an offset from current Ethereum block number.
        // This removes mempool submission delay requirements for everyone and operator priority.
        setPenalty(penaltyDelay)

        // Transfer half the bond for this block
        transfer(safeDiv(bondSize, 2), 0, caller())

        // Stop execution from here
        stop()
      }
    }
  
    /// @notice Helper function: extract owner of input.
    /// @param transactionProof Position in memory of transaction proof.
    /// @return Address of owner of input.
    function inputOwner(transactionProof) -> addr {
      // Get offset of input specified in the proof.
      let input := selectInput(transactionProof)

      // Only for deposits, return the owner of the deposit. Otherwise, return 0.
      if eq(Input.type(input), 1) {
        addr := InputDeposit.owner(input)
      }
    }

    /// @notice Prove a double spend happened.
    /// @param transactionProofA Position in memory of proof of UTXO being spent once.
    /// @param transactionProofB Position in memory of proof of UTXO being spent again.
    function proveDoubleSpend(transactionProofA, transactionProofB) {
      // Verify both transaction proofs
      verifyTransactionProof(transactionProofA, 2)
      verifyTransactionProof(transactionProofB, 0)

       // Inputs must be different in the ledger
      require(neq(inputMetadata(transactionProofA), inputMetadata(transactionProofB)),
        0x34)

      // Note: here we need to also get the owner, which is missing from deposit metadata,
      //  to uniquely index deposits. See: Metadata::MetadataDeposit.

      // Get hash of referenced metadata and input owner (only for deposits) for A
      mstore(0, inputReferencedMetadata(transactionProofA)) mstore(add(0,32), inputOwner(transactionProofA))
      let hashA := keccak256(0, 64)

      // Get hash of referenced metadata and input owner (only for deposits) for B
      mstore(0, inputReferencedMetadata(transactionProofB)) mstore(add(0,32), inputOwner(transactionProofB))
      let hashB := keccak256(0, 64)

      // Hashes must be different, otherwise a double spend happened
      assertOrFraud(neq(hashA, hashB), 0x35, transactionProofB)
    }
  
    /// @notice Helper: compute Merkle root of list of transactions.
    /// @param transactions Position in memory to list of transactions.
    /// @param transactionsLength
    /// @param fraudBlock
    /// @return Merkle root as bytes32
    function constructMerkleTreeRoot(transactions, transactionsLength, fraudBlock) -> merkleTreeRoot {
      // Initialize memory position to position of start of transaction list
      let memoryPosition := transactions
      // Holds computed hashes
      let freshMemoryPosition := safeAdd(calldata.offset(), 64)
      let transactionIndex := 0

      // Loop through each transaction (leaf in Merkle tree) and hash it
      for {} lt(memoryPosition, safeAdd(transactions, transactionsLength)) {} {
        // Extract length of current transaction
        let len := safeAdd(mslice(memoryPosition, 2), 2)

        // Transaction length must be above minimum
        assertOrFraud(gte(len, 44),
            0x36, fraudBlock)

        // Transaction length must be below maximum
        assertOrFraud(lte(len, 896),
            0x37, fraudBlock)

        // Computed length must not be greater than provided payload
        assertOrFraud(lte(safeSub(memoryPosition, transactions), transactionsLength),
          0x38, fraudBlock)

        // Compute leaf hash and save it in memory
        mstore(freshMemoryPosition, keccak256(memoryPosition, len))

        // Increment memory position to point to next transaction
        memoryPosition := safeAdd(memoryPosition, len)

        // Increment computed hashes memory position by 32 bytes
        freshMemoryPosition := safeAdd(freshMemoryPosition, 32)

        transactionIndex := safeAdd(transactionIndex, 1)

        // Number of transactions in list of transactions must not exceed max allowed
        assertOrFraud(lt(transactionIndex, 2048),
            0x39, fraudBlock)
      }

      // Total transaction list length must match provided length
      assertOrFraud(eq(memoryPosition, safeAdd(transactions, transactionsLength)),
          0x38, fraudBlock)

      //////////////////////////////////
      // Now Merkleize nodes into a binary Merkle tree
      //////////////////////////////////

      // Move to a new memory position
      memoryPosition := safeSub(freshMemoryPosition, safeMul(transactionIndex, 32))

      // Create binary Merkle tree
      for {} gt(transactionIndex, 0) {} { // loop through tree Heights (starting at base)
        if gt(mod(transactionIndex, 2), 0) { // fix uneven children count (i.e. add a zero hash)
          mstore(safeAdd(memoryPosition, safeMul(transactionIndex, 32)), 0) // add 0x00...000 child hash
          transactionIndex := safeAdd(transactionIndex, 1) // increase count for zero child hash
          freshMemoryPosition := safeAdd(freshMemoryPosition, 32) // increase fresh memory past new child
        }

        for { let i := 0 } lt(i, transactionIndex) { i := safeAdd(i, 2) } { // loop through child hashes at this height
          mstore(freshMemoryPosition, keccak256(safeAdd(memoryPosition, safeMul(i, 32)), 64)) // hash two children together
          freshMemoryPosition := safeAdd(freshMemoryPosition, 32) // increase fresh memory past new child hash
        }

        memoryPosition := safeSub(freshMemoryPosition, safeMul(transactionIndex, 16)) // set new memory position
        transactionIndex := safeDiv(transactionIndex, 2) // half nodes (i.e. next height)

         // shim 1 to zero (stop), i.e. top height end..
        if lt(transactionIndex, 2) { transactionIndex := 0 }
      }

      // Merkle root has been computed
      merkleTreeRoot := mload(memoryPosition)
    }

    /// @notice Prove a block is malformed: a root does not correctly commit to a list of transactions.
    /// @param block
    /// @param root
    /// @param rootIndex
    /// @param transactions  Position in memory to list of transactions committed to in root.
    /// @param transactionsLength Length of transactions list in bytes.
    function proveMalformedBlock(block, root, rootIndex, transactions, transactionsLength) {
      // Verify the header
      verifyHeader(
        block,
        root,
        rootIndex,
        0
      )

      // Require that commitment hash is the hash of transaction provided
      require(
        eq(
          RootHeader.commitmentHash(root),
          keccak256(transactions, transactionsLength)
        ),
        0x3a
      )

      // Computed Merkle root of transactions must match commtted Merkle root
      assertOrFraud(
        eq(
          RootHeader.merkleTreeRoot(root),
          constructMerkleTreeRoot(transactions, transactionsLength, block)
        ),
        0x3b, block
      )
    }
  
    /// @notice Helper: prove transaction proof index is not fraudulant
    /// @param metadata Position in memory of metadata object (a metadata).
    /// @param transactionProof Position in memory of transaction proof.
    function proveTransactionIndex(metadata, transactionProof) {
      // Transaction index must be bounded
      assertOrFraud(gte(Metadata.transactionIndex(metadata), 0),
        0x3c, transactionProof)

      // If the block height and root index is the current
      switch and(
        eq(Metadata.blockHeight(metadata), TransactionProof.blockHeight(transactionProof)),
        eq(Metadata.rootIndex(metadata), TransactionProof.rootIndex(transactionProof))
      )
      case 1 {
        // Root index overflow max now set to current Transaction index
        assertOrFraud(lt(Metadata.transactionIndex(metadata), TransactionProof.transactionIndex(transactionProof)),
          0x3d, transactionProof)
      }
      case 0 {
        // Overflow is the max transaction index (further overflow enforced in invalidInput)
        assertOrFraud(lt(Metadata.transactionIndex(metadata), 2048),
          0x3d, transactionProof)
      }
    }

    /// @notice Helper: prove metadata is invalid.
    /// @param leaf Position in memory of leaf object (a transaction).
    /// @param transactionProof Position in memory of transaction proof.
    function proveMetadata(leaf, transactionProof) {
      // Position in memory to inputs in leaf
      let pos := TransactionLeaf.inputs.position(leaf)
      let end := TransactionLeaf.inputs.offset(leaf)
      // Position in memory of metadata in leaf
      let metadata := TransactionLeaf.metadata.position(leaf)

      // Loop over inputs in leaf
      for {} lt(pos, end) {} {
        switch Input.type(pos)

        // For Deposit inputs
        case 1 {
          // Ethereum block number of deposit must be positive and non-zero
          assertOrFraud(gt(MetadataDeposit.blockNumber(metadata), 0),
            0x3e, transactionProof)

          // Transaction must spend deposit at least one block after it was made
          assertOrFraud(lt(MetadataDeposit.blockNumber(metadata),
            TransactionProof.blockNumber(transactionProof)),
            0x3f, transactionProof)

          // Token ID must be positive
          assertOrFraud(gte(MetadataDeposit.token(metadata), 0),
            0x40, transactionProof)

          // Token ID of deposit must be bounded by block's number of registered tokens
          assertOrFraud(lt(MetadataDeposit.token(metadata),
            TransactionProof.numTokens(transactionProof)),
            0x41, transactionProof)
        }

        // For all other input types
        default {
          // Block height must be past genesis block
          assertOrFraud(gt(Metadata.blockHeight(metadata), 0),
            0x42, transactionProof)

          // Output must be created before it was spent (can be spent in the same block)
          assertOrFraud(lte(Metadata.blockHeight(metadata), TransactionProof.blockHeight(transactionProof)),
            0x43, transactionProof)

          // Root index must be bounded
          assertOrFraud(gte(Metadata.rootIndex(metadata), 0),
            0x44, transactionProof)

          // If metadata is referencing current block
          switch eq(Metadata.blockHeight(metadata),
            TransactionProof.blockHeight(transactionProof))
          case 1 {
            // Overflow is now the current root index
            assertOrFraud(lte(Metadata.rootIndex(metadata), TransactionProof.rootIndex(transactionProof)),
              0x45, transactionProof)
          }
          case 0 {
            // Overflow is the max root index (further overflow enforced in invalidInput)
            assertOrFraud(lt(Metadata.rootIndex(metadata), 128),
              0x45, transactionProof)
          }

          // Prove correctness of transaction proof index
          proveTransactionIndex(metadata, transactionProof)

          // Output index must be bounded
          assertOrFraud(gte(Metadata.outputIndex(metadata), 0),
            0x46, transactionProof)
          assertOrFraud(lt(Metadata.outputIndex(metadata), 8),
            0x47, transactionProof)

          // Root input must always select tx and output index 0, in an older block
          if eq(Input.type(pos), 3) {
            assertOrFraud(lt(Metadata.blockHeight(metadata), TransactionProof.blockHeight(transactionProof)),
              0x48, transactionProof)

            assertOrFraud(eq(Metadata.transactionIndex(metadata), 0),
              0x49, transactionProof)

            assertOrFraud(eq(Metadata.outputIndex(metadata), 0),
              0x4a, transactionProof)
          }
        }

        pos := safeAdd(pos, inputSize(pos))
        metadata := safeAdd(metadata, 8)
      }

      // Actual metadata length must match claimed length in leaf
      assertOrFraud(eq(metadata, TransactionLeaf.metadata.offset(leaf)),
        0x4b, transactionProof)
    }

    /// @notice Helper: prove witnesses are invalid.
    /// @param leaf Position in memory of leaf object (a transaction).
    /// @param transactionProof Position in memory of transaction proof.
    function proveWitnesses(leaf, transactionProof) {
      let pos := TransactionLeaf.witnesses.position(leaf)
      let end := TransactionLeaf.witnesses.offset(leaf)
      let index := 0

      for {} lt(pos, end) {} {
        assertOrFraud(lt(Signature.type(pos), 3), 0x2b, transactionProof)

        switch Signature.type(pos)

        case 0 {}

        case 1 {
          let stateWitness := witnessAt(Caller.owner(pos), Caller.blockNumber(pos))
          assertOrFraud(gt(stateWitness, 0), 0x4c, transactionProof)

          assertOrFraud(lt(Caller.blockNumber(pos), TransactionProof.blockNumber(transactionProof)),
            0x4d, transactionProof)
        }

        case 2 {}

        pos := safeAdd(pos, witnessSize(pos))
        index := safeAdd(index, 1)

        assertOrFraud(lte(index, 8), 0x4e, transactionProof)
      }

      assertOrFraud(eq(pos, end), 0x4f, transactionProof)
    }

    /// @notice Helper: prove sizes are invalid.
    /// @param leaf Position in memory of leaf object (a transaction).
    /// @param transactionProof Position in memory of transaction proof.
    function proveSizes(leaf, transactionProof) {
      let metadataSize := TransactionLeaf.metadata.length(leaf)
      let inputsSize := inputsLength(leaf)

      assertOrFraud(eq(metadataSize, inputsSize),
         0x50, transactionProof)
    }

    /// @notice Helper: prove output value is invalid.
    /// @param pos Position in memory of leaf outputs object.
    /// @param transactionProof Position in memory of transaction proof.
    function proveOutputValue(pos, transactionProof) {
      let _numTokens := TransactionProof.numTokens(transactionProof)

      assertOrFraud(gt(Output.token.length(pos), 0),
        0x51, transactionProof)

      assertOrFraud(lte(Output.token.length(pos), 4),
        0x52, transactionProof)

      assertOrFraud(lt(Output.token.slice(pos), _numTokens),
        0x53, transactionProof)

      assertOrFraud(gte(Output.amount.shift(pos), 0),
        0x54, transactionProof)

      assertOrFraud(lt(Output.amount.shift(pos), 256),
        0x55, transactionProof)

      assertOrFraud(gt(Output.amount.length(pos), 0),
        0x56, transactionProof)

      assertOrFraud(lte(Output.amount.length(pos), 32),
        0x57, transactionProof)

      assertOrFraud(eq(mod(Output.amount.shift(pos), 8), 0),
        0x58, transactionProof)

      let amountLen := safeAdd(Output.amount.shift(pos),
        safeMul(Output.amount.length(pos), 8))

      assertOrFraud(lte(amountLen, 256),
        0x57, transactionProof)
    }

    /// @notice Helper: prove output owner is invalid.
    /// @param pos Position in memory of leaf outputs object.
    /// @param transactionProof Position in memory of transaction proof.
    function proveOutputOwner(pos, transactionProof) {
      let _numAddresses := TransactionProof.numAddresses(transactionProof)

      assertOrFraud(gt(Output.owner.length(pos), 0),
        0x59, transactionProof)

      assertOrFraud(lte(Output.owner.length(pos), 20),
        0x5a, transactionProof)

      if lt(Output.owner.length(pos), 20) {
        assertOrFraud(lt(Output.owner.slice(pos), _numAddresses),
          0x5b, transactionProof)
      }
    }

    /// @notice Helper: prove HTLC output return owner is invalid.
    /// @param pos Position in memory of leaf outputs object.
    /// @param transactionProof Position in memory of transaction proof.
    function proveOutputReturnOwner(pos, transactionProof) {
      let _numAddresses := TransactionProof.numAddresses(transactionProof)

      assertOrFraud(gt(OutputHTLC.returnOwner.length(pos), 0),
        0x5c, transactionProof)

      assertOrFraud(lte(OutputHTLC.returnOwner.length(pos), 20),
        0x5d, transactionProof)

      if lt(OutputHTLC.returnOwner.length(pos), 20) {
        assertOrFraud(lt(OutputHTLC.returnOwner.slice(pos), _numAddresses),
          0x5e, transactionProof)
      }
    }

    /// @notice Helper: prove outputs are invalid.
    /// @param leaf Position in memory of leaf object (a transaction).
    /// @param transactionProof Position in memory of transaction proof.
    function proveOutputs(leaf, transactionProof) {
      let witnessLength := witnessesLength(leaf)
      let pos := TransactionLeaf.outputs.position(leaf)
      let end := TransactionLeaf.outputs.offset(leaf)
      let index := 0

      for {} lt(pos, end) {} {
        switch Output.type(pos)

        case 0 {
          proveOutputValue(pos, transactionProof)
          proveOutputOwner(pos, transactionProof)
        }

        case 1 {
          proveOutputValue(pos, transactionProof)
          proveOutputOwner(pos, transactionProof)
        }

        case 2 {
          proveOutputValue(pos, transactionProof)
          proveOutputOwner(pos, transactionProof)
          proveOutputReturnOwner(pos, transactionProof)
        }

        case 3 {
          assertOrFraud(gt(OutputReturn.data.length(pos), 0),
            0x5f, transactionProof)

          assertOrFraud(lte(OutputReturn.data.length(pos), 512),
            0x60, transactionProof)
        }

        default {
          assertOrFraud(0, 0x61, transactionProof)
        }

        pos := safeAdd(pos, outputSize(pos))
        index := safeAdd(index, 1)

        assertOrFraud(lte(index, 8), 0x62, transactionProof)
      }

      assertOrFraud(eq(pos, end), 0x63, transactionProof)
    }

    /// @notice Helper: prove inputs are invalid.
    /// @param leaf Position in memory of leaf object (a transaction).
    /// @param transactionProof Position in memory of transaction proof.
    function proveInputs(leaf, transactionProof) {
      let witnessLength := witnessesLength(leaf)
      let pos := TransactionLeaf.inputs.position(leaf)
      let end := TransactionLeaf.inputs.offset(leaf)
      let index := 0

      for {} lt(pos, end) {} {
        assertOrFraud(gte(Input.type(pos), 0),
           0x64, transactionProof)
        assertOrFraud(lt(Input.type(pos), 4),
           0x65, transactionProof)

        assertOrFraud(gte(Input.witnessReference(pos), 0),
           0x66, transactionProof)
        assertOrFraud(lt(Input.witnessReference(pos), witnessLength),
          0x67, transactionProof)

        pos := safeAdd(pos, inputSize(pos))
        index := safeAdd(index, 1)
      }

      assertOrFraud(lte(index, 8), 0x68, transactionProof)
      assertOrFraud(eq(pos, end), 0x69, transactionProof)
    }

    /// @notice Prove that a transaction was invalid.
    /// @param transactionProof Position in memory of transaction proof.
    function proveInvalidTransaction(transactionProof) {
      verifyTransactionProof(transactionProof, 0)

      let leaf := TransactionProof.transaction.position(transactionProof)
      let size := TransactionLeaf.metadata.length(leaf)

      assertOrFraud(gt(size, 0), 0x6a, transactionProof)
      assertOrFraud(lte(size, 8), 0x4b, transactionProof)

      size := TransactionLeaf.witnesses.length(leaf)

      assertOrFraud(gt(size, 0), 0x6b, transactionProof)
      assertOrFraud(lte(size, 896), 0x4f, transactionProof)

      size := TransactionLeaf.inputs.length(leaf)

      assertOrFraud(gte(size, 2), 0x6c, transactionProof)
      assertOrFraud(lte(size, 896), 0x6d, transactionProof)

      size := TransactionLeaf.outputs.length(leaf)

      assertOrFraud(gte(size, 3), 0x6e, transactionProof)
      assertOrFraud(lte(size, 896), 0x6f, transactionProof)

      size := TransactionLeaf.size(leaf)

      assertOrFraud(gte(size, 44), 0x70, transactionProof)
      assertOrFraud(lte(size, 896), 0x71, transactionProof)
      assertOrFraud(eq(size, safeAdd(TransactionLeaf.length(leaf), 2)), 0x72, transactionProof)

      proveWitnesses(leaf, transactionProof)
      proveInputs(leaf, transactionProof)
      proveOutputs(leaf, transactionProof)
      proveSizes(leaf, transactionProof)
      proveMetadata(leaf, transactionProof)
    }
  
    // Produced from the Funnel.yulp contract.
    // const FunnelContract0 := 0x604d600d600039604d6000f3fe60006020602d82393381511415602b57608036
    // const FunnelContract1 := 0x14156028573681823780816044603c8485515af1505b33ff5b50000000000000
    
    
    

    // The Fixed salt.
    

    function createFunnel(recipient) -> addr {
      addr := calculateFunnelAddress(recipient)

      if eq(extcodesize(addr), 0) {
        mstore(0, 0x6062600d60003960626000f3fe60006020603582393381511415603357608036) mstore(add(0,32),
          0x14156030573681823780816044603c8485515af11515602f578081fd5b5b33ff) mstore(add(0,64),
          0x5b50000000000000000000000000000000000000000000000000000000000000)
        mstore(66, address())
        mstore(98, recipient)
        addr := create2(0, 0, 130, 0xa46ff7e2eb85eecf4646f2c151221bcd9c079a3dcb63cb87962413cfaae53947)
      }
    }

    function calculateFunnelAddress(recipient) -> addr {
      mstore(0, 0x6062600d60003960626000f3fe60006020603582393381511415603357608036) mstore(add(0,32),
        0x14156030573681823780816044603c8485515af11515602f578081fd5b5b33ff) mstore(add(0,64),
        0x5b50000000000000000000000000000000000000000000000000000000000000)
      mstore(66, address())
      mstore(98, recipient)

      mstore(53, keccak256(0, 130))
      mstore8(0, 0xff)
      mstore(1, shl(96, address()))
      mstore(21, 0xa46ff7e2eb85eecf4646f2c151221bcd9c079a3dcb63cb87962413cfaae53947)

      addr := shr(96, shl(96, keccak256(0, 85)))
    }
  
    

    /// @notice Get deposit at key
    /// @return Amount of tokens as uint256
    function depositAt(owner, token, blockNumber) -> amount {
      amount := sload(mappingKey3(4, owner, token, blockNumber))
    }

    /// @notice Handle token deposit.
    function deposit(owner, token) {
      // Get token ID (0 for ETH).
      // If token has not yet been deposited, a new token ID will be assigned.
      let _tokenId := commitToken(token)

      // Build create2 deposit funnel contract
      let funnel := createFunnel(owner)

      // Variables
      let amount := 0

      // handle different tokens
      switch token

      // If ETH
      case 0 {
          amount := balance(funnel)
          require(gt(amount, 0), 0x73)
          require(call(gas(), funnel, 0, 0, 0, 0, 0), 0x74)
          require(eq(balance(funnel), 0), 0x75)
      }

      // If ERC-20
      default {
        require(or(iszero(balance(funnel)), eq(token, 0)), 0x76)

        mstore(0, 0x70a08231) mstore(add(0,32), funnel)
        require(call(gas(), token, 0, 28, 36, 0, 32), 0x77)
        amount := mload(0)
        require(gt(amount, 0), 0x78)

        mstore(0, token) mstore(add(0,32), 0xa9059cbb) mstore(add(0,64), address()) mstore(add(0,96), amount)
        require(call(gas(), funnel, 0, 0, 128, 0, 0), 0x79)

        mstore(0, 0x70a08231) mstore(add(0,32), funnel)
        require(call(gas(), token, 0, 28, 36, 0, 32), 0x77)
        require(iszero(mload(0)), 0x7a)
      }

      // Load current balance from storage
      // Deposits are uniquely identified by owner, token, and Ethereum block numbers, so a second deposit in the same block will simply update a single deposit object
      let balanceAmount := depositAt(owner, _tokenId, number())
      sstore(mappingKey3(4, owner, _tokenId, number()), safeAdd(balanceAmount, amount))

      mstore(0, amount)
      log3(0, mul32(1),
        0x5dee5732ff6c20f2db5d2eb497dbb3cfc9bf1126f758a758efc772793b1639bf,
        owner,
        _tokenId)
    }
  
    /// @notice Prove that an input is invalid.
    /// @param inputProof Position in memory of input proof.
    /// @param transactionProof Position in memory of transaction proof.
    function proveInvalidInput(inputProof, transactionProof) {
      // Verify transaction inclusion proof
      verifyTransactionProof(transactionProof, 0)
      // Position in memory of input from transaction proof
      let input := selectInput(transactionProof)
      // Position in memory of metadata from transaction proof
      let metadata := selectMetadata(
        transactionProof, 
        TransactionProof.inputOutputIndex(transactionProof)
      )

      // Special case: handle Deposit input
      if eq(Input.type(input), 1) {
        // Retrieve amount for deposit ID in proof from storage
        let depositAmount := depositAt(
          InputDeposit.owner(input),
          MetadataDeposit.token(metadata),
          MetadataDeposit.blockNumber(metadata)
        )

        // Amount in deposit must be positive and non-zero
        assertOrFraud(gt(depositAmount, 0), 0x7b,
          transactionProof)

        stop()
      }

      // Verify the proof
      verifyHeader(
        TransactionProof.block(inputProof),
        TransactionProof.root(inputProof),
        TransactionProof.rootIndex(inputProof),
        2
      )

      // Check that block height in input proof matches block height in transaction proof
      require(eq(Metadata.blockHeight(metadata),
        TransactionProof.blockHeight(inputProof)), 0x7c)

      // Root index in input proof must be bounded by number of roots in transaction proof
      assertOrFraud(lt(Metadata.rootIndex(metadata),
        TransactionProof.roots.length(inputProof)), 0x7d, transactionProof)

      // Check that root index in input proof matches root index in transaction proof
      require(eq(Metadata.rootIndex(metadata),
        TransactionProof.rootIndex(inputProof)), 0x7e)

      // Special case: handle Root input
      // We stop here at the root, as we only need the block / root header for checking fraud
      if eq(Input.type(input), 3) {
        stop()
      }

      // If transaction of input proof is rightmost in its Merkle tree then:
      if eq(verifyMerkleProof(inputProof), 0x00) {
        // Here we are checking is the transaction index lte the rightmost index
        // if it is past the rightmost index its overflowing and is an invalid reference
        assertOrFraud(lte(Metadata.transactionIndex(metadata),
          TransactionProof.transactionIndex(inputProof)), 0x7f,
          transactionProof)
      }

      // Check that transaction index in input proof matches transaction index in transaction proof
      require(eq(Metadata.transactionIndex(metadata),
        TransactionProof.transactionIndex(inputProof)), 0x80)

      // The length of the transaction in the input proof must be positive and non-zero
      assertOrFraud(gt(TransactionProof.transaction.length(inputProof), 0),
        0x2e, transactionProof)

      // Get position of output from input proof
      let output := selectOutput(inputProof)

      // Output index in input proof must be bounded by number of outputs in transaction proof
      assertOrFraud(lt(Metadata.outputIndex(metadata),
        TransactionProof.outputs.length(inputProof)), 0x81,
        transactionProof)

      // Check that output index in input proof matches with output index in transaction proof
      require(eq(Metadata.outputIndex(metadata),
        TransactionProof.inputOutputIndex(inputProof)), 0x82)

      // Output type must not be Withdraw of Return (those outputs can't be spent and are proven elsewhere)
      assertOrFraud(neq(Output.type(output), 1),
        0x83, transactionProof)
      assertOrFraud(neq(Output.type(output), 3),
        0x84, transactionProof)

      // Do final checks based on input type
      switch Input.type(input)

      // No restrictions on spending Transfer outputs, so automatic fraud
      case 0 {
        assertOrFraud(eq(Output.type(output), 0),
          0x85, transactionProof)
      }

      // Spending HTLC outputs depends on timeout expiry
      case 2 {
        assertOrFraud(eq(Output.type(output), 2),
          0x86, transactionProof)

        // If spending transaction is before timeout then:
        // Timeout is using Ethereum block number, not rollup block height
        if lt(TransactionProof.blockNumber(transactionProof),
          OutputHTLC.expiry(output)) {
          // The hash of the preimage in the transaction proof must match the digest in the input proof
          assertOrFraud(eq(OutputHTLC.digest(output),
            InputHTLC.preImage.keccak256(input)), 0x87, transactionProof)
        }
      }
    }
  
    /// @notice Verify input proofs.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of input proofs.
    function verifyInputs(transactionProof, inputProofs) {
      // Verify transaction proof
      verifyTransactionProof(transactionProof, 0)

      // Get positions of leaf and input
      let leaf := TransactionProof.transaction.position(transactionProof)
      let pos := TransactionLeaf.inputs.position(leaf)
      let index := 0

      // Loop over inputs and verify each input proof
      for {} lt(pos, TransactionLeaf.inputs.offset(leaf)) {} {
        switch Input.type(pos)

        case 0 {
          verifyTransactionProof(inputProofs, 2)

          require(eq(outputMetadata(inputProofs), TransactionLeaf.metadata(leaf, index)),
            0x88)

          require(eq(TransactionProof.UTXO.keccak256(inputProofs),
            TransactionProof.data(transactionProof, index)), 0x89)

          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        case 1 {
          let metadata := selectMetadata(transactionProof, index)

          require(eq(Deposit.token(inputProofs), MetadataDeposit.token(metadata)),
            0x8a)

          require(eq(Deposit.blockNumber(inputProofs), MetadataDeposit.blockNumber(metadata)),
            0x8b)

          require(eq(Deposit.keccak256(inputProofs),
            TransactionProof.data(transactionProof, index)), 0x8c)

          inputProofs := safeAdd(inputProofs, Deposit.size(inputProofs))
        }

        case 3 {
          verifyTransactionProof(inputProofs, 2)

          require(eq(RootHeader.keccak256(TransactionProof.rootProducer.position(inputProofs)),
            TransactionProof.data(transactionProof, index)), 0x8d)

          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        case 2 {
          verifyTransactionProof(inputProofs, 2)

          require(eq(outputMetadata(inputProofs), TransactionLeaf.metadata(leaf, index)),
            0x88)

          require(eq(TransactionProof.UTXO.keccak256(inputProofs),
            TransactionProof.data(transactionProof, index)), 0x89)

          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        index := safeAdd(index, 1)
        pos := safeAdd(pos, inputSize(pos))
      }
    }
  
    /// @notice Helper: prove a witness is invalid.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of inputs proofs.
    function proveWitness(transactionProof, inputProofs) {
      // Assert fee token signed over is the fee in the root.
      require(
        eq(TransactionProof.signatureFeeToken(transactionProof),
          TransactionProof.feeToken(transactionProof)),
        0x8e
      )

      // Assert fee signed over is the fee in the root.
      require(
        eq(TransactionProof.signatureFee(transactionProof),
          TransactionProof.fee(transactionProof)),
        0x8f
      )
      
      // Get position in memory of start of leaf (i.e. transaction)
      let leaf := TransactionProof.transaction.position(transactionProof)
      // Get position in memory of start of transaction inputs
      let pos := TransactionLeaf.inputs.position(leaf)
      let index := 0

      // Loop over inputs. For each input, the recovered account address must match the owner.
      for {} lt(pos, TransactionLeaf.inputs.offset(leaf)) {} {
        switch Input.type(pos)

        case 0 {
          if eq(index, TransactionProof.inputOutputIndex(transactionProof)) {
            assertOrFraud(ownerEquates(selectOutput(inputProofs),
              TransactionProof.input.recoverWitness(transactionProof)), 0x90, transactionProof)
          }

          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        case 1 {
          if eq(index, TransactionProof.inputOutputIndex(transactionProof)) {
            assertOrFraud(eq(Deposit.owner(inputProofs),
              TransactionProof.input.recoverWitness(transactionProof)),
              0x91, transactionProof)
          }

          inputProofs := safeAdd(inputProofs, Deposit.size(inputProofs))
        }

        case 3 {
          if eq(index, TransactionProof.inputOutputIndex(transactionProof)) {
            assertOrFraud(eq(TransactionProof.blockProducer(inputProofs),
              TransactionProof.input.recoverWitness(transactionProof)), 0x92, transactionProof)
          }

          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        case 2 {
          if eq(index, TransactionProof.inputOutputIndex(transactionProof)) {
            switch outputExpired(inputProofs, transactionProof)

            case 1 {
              assertOrFraud(returnOwnerEquals(selectOutput(inputProofs),
                TransactionProof.input.recoverWitness(transactionProof)),
                0x93, transactionProof)
            }

            case 0 {
              assertOrFraud(ownerEquates(selectOutput(inputProofs),
                TransactionProof.input.recoverWitness(transactionProof)),
                0x94, transactionProof)
            }
          }

          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        if eq(index, TransactionProof.inputOutputIndex(transactionProof)) {
          assertOrFraud(neq(TransactionProof.input.recoverWitness(transactionProof), 0),
            0x95, transactionProof)
        }

        index := safeAdd(index, 1)
        pos := safeAdd(pos, inputSize(pos))
      }
    }

    /// @notice Prove a witness was invalid.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of inputs proofs.
    function proveInvalidWitness(transactionProof, inputProofs) {
      verifyInputs(transactionProof, inputProofs)
      proveWitness(transactionProof, inputProofs)
    }
  
    /// @notice Metadata of a withdrawal transcation in the rollup. Points to an entry in a block.
    

    /// @notice Check if the withdrawal has already need processed.
    /// @return If the withdrawal has already been processed as bool
    function isWithdrawalProcessed(blockHeight, withdrawalId) -> result {
      result := sload(mappingKey2(5, blockHeight, withdrawalId))
    }

    /// @notice Do a withdrawal.
    function withdraw(transactionProof) {
      // Verify transaction proof
      verifyTransactionProof(transactionProof, 1)

      // Select the output from the proof
      let output := selectOutput(transactionProof)

      // Get token address from the proof, and owner
      let tokenAddress := TransactionProof.tokenAddress(transactionProof)
      let owner := TransactionProof.returnOwner(transactionProof)

      // Owner must match
      require(ownerEquates(output, owner), 0x96)

      // Token ID must match
      require(eq(Output.token.slice(output), tokenId(tokenAddress)),
        0x97)

      // Output type must be Withdraw
      require(eq(Output.type(output), 1),
          0x98)

      // Get transaction details
      let transactionLeafHash := TransactionProof.transaction.keccak256(transactionProof)
      let outputIndex := TransactionProof.inputOutputIndex(transactionProof)
      let blockHeight := TransactionProof.blockHeight(transactionProof)

      // Construct withdrawal ID
      mstore(0, TransactionProof.rootIndex(transactionProof)) mstore(add(0,32), transactionLeafHash) mstore(add(0,64), outputIndex)
      let withdrawalId := WithdrawalMetadata.keccak256(0)

      // This withdrawal must not have been processed yet
      require(eq(isWithdrawalProcessed(blockHeight, withdrawalId), 0x00),
        0x99)

      // Transfer amount out
      transfer(outputAmount(output), tokenAddress, owner)

      // Set withdrawal as processed
      sstore(mappingKey2(5, blockHeight, withdrawalId), 0x01)

      // Construct log for withdrawal
      mstore(
        0,
        tokenAddress
      ) mstore(
        add(0,32),
        outputAmount(output)
      ) mstore(
        add(0,64),
        TransactionProof.rootIndex(transactionProof)
      ) mstore(
        add(0,96),
        outputIndex
      ) mstore(
        add(0,128),
        TransactionProof.transactionIndex(transactionProof)
      )
      log4(
        0,
        mul32(5),
        0x227167f13f6a5dd1ba19c2a3a0050c5b942e9834fc839346a7a5d8f6718c9341,
        owner,
        blockHeight,
        transactionLeafHash
      )
    }

    /// @notice Withdraw a block producer bond from a finalizable block.
    function bondWithdraw(blockHeader) {
      // Setup block producer withdrawal ID (i.e. zero)
      let withdrawalId := 0

      // Setup block height
      let blockHeight := BlockHeader.height(blockHeader)

      // Verify block header is finalized
      verifyHeader(blockHeader, 0, 0, 1)

      // Caller must be block producer
      require(eq(BlockHeader.producer(blockHeader), caller()),
          0x19)

      // Block bond withdrawal must not have been processed yet
      require(eq(isWithdrawalProcessed(blockHeight, withdrawalId), 0x00),
          0x9a)

      // Get bond amount
      Constructor.copy(0)
      let bondSize := Constructor.bondSize(0)

      // Transfer bond back to block producer
      transfer(bondSize, 0, caller())

      // Set withdrawal as processed
      sstore(mappingKey2(5, blockHeight, withdrawalId), 0x01)

      // Log withdrawal data and topics
      mstore(0, 0) mstore(add(0,32), bondSize) mstore(add(0,64), 0) mstore(add(0,96), 0) mstore(add(0,128), 0)
      log4(
        0,
        mul32(5),
        0x227167f13f6a5dd1ba19c2a3a0050c5b942e9834fc839346a7a5d8f6718c9341,
        caller(),
        blockHeight,
        0
      )
    }
  
    /// @notice Verify proof of data.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of input proofs.
    function verifyData(transactionProof, inputProofs) {
      // Get starting position in memory of input in transaction proof
      let pos := TransactionLeaf.inputs.position(TransactionProof.transaction.position(transactionProof))
      let index := 0

      // Loop through each input until we've reached the end of the inputs in transaction proof
      for {} lt(pos, TransactionLeaf.inputs.offset(TransactionProof.transaction.position(transactionProof))) {} {
        switch Input.type(pos)

        case 0 {
          // here we compare the provided data hash to the supplied utxo hash to enforce proper proof construction
          require(eq(TransactionProof.data(transactionProof, index), UTXO.keccak256(inputProofs)),
            0x9b)

          inputProofs := safeAdd(inputProofs, UTXO.size(inputProofs))
        }

        case 1 {
          // here we compare the provided data hash to the supplied deposit hash to enforce proper proof construction
          require(eq(TransactionProof.data(transactionProof, index), Deposit.keccak256(inputProofs)),
            0x9c)

          inputProofs := safeAdd(inputProofs, Deposit.size(inputProofs))
        }

        case 2 {
          // here we compare the provided data hash to the supplied utxo hash to enforce proper proof construction
          require(eq(TransactionProof.data(transactionProof, index), UTXO.keccak256(inputProofs)),
            0x9b)

          inputProofs := safeAdd(inputProofs, UTXO.size(inputProofs))
        }

        case 3 {
          // here we compare the provided data hash to the supplied root header hash to enforce proper proof construction
          require(eq(TransactionProof.data(transactionProof, index), RootHeader.keccak256(inputProofs)),
            0x9d)

          inputProofs := safeAdd(inputProofs, RootHeader.size(inputProofs))
        }

        default { require(0, 0x9e) }

        pos := safeAdd(pos, inputSize(pos))
        index := safeAdd(index, 1)
      }
    }
  
    /// @notice Verify a witness proof.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of input proofs.
    function verifyWitness(transactionProof, inputProofs) {
      let witness := TransactionProof.witness(transactionProof, 0)
      let leaf := TransactionProof.transaction.position(transactionProof)
      let input := TransactionLeaf.inputs.position(leaf)

      switch Signature.type(witness)

      // Witness is a signature
      case 0 {
        switch Input.type(input)

        // Deposit: recovered address must match input owner
        case 1 {
          require(eq(
            ecrecover(transactionId(transactionProof), witness),
            Deposit.owner(inputProofs)
          ), 0x9f)
        }

        // Root: recovered address must match block producer of input
        case 3 {
          require(eq(
            ecrecover(transactionId(transactionProof), witness),
            TransactionProof.blockProducer(inputProofs)
          ), 0x9f)
        }

        // Transfer: recovered address must match input owner
        default {
          require(eq(
            ecrecover(transactionId(transactionProof), witness),
            UTXO.owner(inputProofs)
          ), 0x9f)
        }
      }

      // Witness is a caller (i.e. contract authorized a transaction)
      case 1 {
        require(eq(
          witnessAt(Caller.owner(witness), Caller.blockNumber(witness)),
          transactionId(transactionProof)
        ), 0xa0)
      }

      // Witness is address of producer (implied by producer of block)
      case 2 {
        require(eq(Producer.hash(witness), transactionId(transactionProof)),
          0xa1)
      }

      default { require(0, 0x2b) }
    }
  
    /// @notice Fraudulant summing, incase of overflow, we conclude fraud.
    /// @param x The first value to sum.
    /// @param y The second value to sum.
    /// @param transactionProof The fraudulant proof incase summing overflows.
    /// @return z The sum of the two values.
    function assertAddOrFraud(x, y, transactionProof) -> z {
      z := add(x, y)
      assertOrFraud(or(eq(z, x), gt(z, x)), 0xa2, transactionProof)
    }

    /// @notice Fraudulant multiplying, incase of overflow, we conclude fraud.
    /// @param x The first value to multiply.
    /// @param y The second value to multiply.
    /// @return z The multiple of the two values.
    function assertMulOrFraud(x, y, transactionProof) -> z {
      if gt(y, 0) {
        /// @dev this should be unsafeMul
        z := mul(x, y)
        /// @dev should be unsave div?
        assertOrFraud(eq(div(z, y), x), 0xa3, transactionProof)
      }
    }

    /// @notice Compute sum of inputs in token specified in transaction proof.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of inputs proofs.
    /// @return Sum of inputs in token.
    function ins(transactionProof, inputProofs) -> sum {
      let pos := TransactionLeaf.inputs.position(TransactionProof.transaction.position(transactionProof))
      let token := tokenId(TransactionProof.tokenAddress(transactionProof))

      for {} lt(pos, TransactionLeaf.inputs.offset(TransactionProof.transaction.position(transactionProof))) {} {
        switch Input.type(pos)

        case 0 {
          if eq(token, UTXO.token(inputProofs)) {
            sum := assertAddOrFraud(sum, UTXO.amount(inputProofs), transactionProof)
          }

          inputProofs := safeAdd(inputProofs, UTXO.size(inputProofs))
        }

        case 1 {
          if eq(token, Deposit.token(inputProofs)) {
            sum := assertAddOrFraud(sum, Deposit.value(inputProofs), transactionProof)
          }

          inputProofs := safeAdd(inputProofs, Deposit.size(inputProofs))
        }

        case 2 {
          if eq(token, UTXO.token(inputProofs)) {
            sum := assertAddOrFraud(sum, UTXO.amount(inputProofs), transactionProof)
          }

          inputProofs := safeAdd(inputProofs, UTXO.size(inputProofs))
        }

        case 3 {
          if eq(token, RootHeader.feeToken(inputProofs)) {
            sum := assertAddOrFraud(sum, 
              assertMulOrFraud(RootHeader.fee(inputProofs), RootHeader.length(inputProofs), transactionProof)
              , transactionProof)
          }

          inputProofs := safeAdd(inputProofs, RootHeader.size(inputProofs))
        }

        default { require(0, 0x9e) }

        pos := safeAdd(pos, inputSize(pos))
      }
    }

    /// @notice Compute sum of outputs in given token.
    /// @param token Token ID.
    /// @param transactionProof Position in memory of transaction proof.
    /// @return Sum of outputs in token.
    function outs(token, transactionProof) -> sum {
      let leaf := TransactionProof.transaction.position(transactionProof)
      let pos := TransactionLeaf.outputs.position(leaf)
      let end := TransactionLeaf.outputs.offset(leaf)

      for {} lt(pos, end) {} {
        if and(
          lt(Output.type(pos), 3),
          eq(token, Output.token.slice(pos))
        ) {
          sum := assertAddOrFraud(sum, outputAmount(pos), transactionProof)
        }

        pos := safeAdd(pos, outputSize(pos))
      }
    }

    /// @notice Helper function to prove that sum of outputs violates sum of inputs, assuming proofs are verified.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of inputs proofs.
    function proveSum(transactionProof, inputProofs) {
      let token := tokenId(TransactionProof.tokenAddress(transactionProof))
      let outsum := assertAddOrFraud(
        rootFee(transactionProof, token),
        outs(token, transactionProof),
        transactionProof)
      let insum := ins(transactionProof, inputProofs)

      assertOrFraud(eq(outsum, insum), 0xa4, transactionProof)
    }

    /// @notice Prove that the sum of outputs violates the sum of inputs.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of inputs proofs.
    function proveInvalidSum(transactionProof, inputProofs) {
      verifyTransactionProof(transactionProof, 0)
      verifyWitness(transactionProof, inputProofs)
      verifyData(transactionProof, inputProofs)
      proveSum(transactionProof, inputProofs)
    }
  
      // Load calldata to memory
      calldata.copy()

      // Call a different method depending on method signature in calldata
      switch calldata.signature()

      /// @notice Deposit a token.
      /// @param account Address of token owner.
      /// @param token Token address.
      /// @dev Deposit::deposit
      case 0xf9609f08 {
        // Ensure non-payable.
        nonpayable()

        // Deposit.
        deposit(calldata.word(0), calldata.word(1))
      }

      /// @notice Commit a new root.
      /// @param merkleTreeRoot Root of transactions tree.
      /// @param token Token ID for fee payments for this root.
      /// @param fee Feerate for this root.
      /// @param transactions List of transactions.
      /// @dev Root::commitRoot
      case 0xb4cb0fbc {
        nonpayable()

        commitRoot(calldata.word(0),
          keccak256(abi.offset(calldata.word(3)), abi.length(calldata.word(3))),
          abi.length(calldata.word(3)),
          calldata.word(1),
          calldata.word(2))
      }

      /// @notice Commit a new block.
      /// @param minimum Minimum Ethereum block number that this commitment is valid for.
      /// @param minimumHash Minimum Ethereum block hash that this commitment is valid for.
      /// @param height Rollup block height.
      /// @param roots List of roots in block.
      /// @dev Block::commitBlock
      case 0x80b39a1f {
        commitBlock(
          calldata.word(0),
          calldata.word(1),
          calldata.word(2),
          abi.length(calldata.word(3)),
          abi.offset(calldata.word(3))
        )
      }

      /// @notice Commit a new witness. Used for authorizing rollup transactions via an Ethereum smart contract.
      /// @param transactionId Transaction ID to authorize.
      /// @dev Witness::commitWitness
      case 0xcc4c0b4b {
        nonpayable()
        commitWitness(calldata.word(0))
      }

      /// @notice Register a new address for cheaper transactions.
      /// @param addr Address to register.
      /// @return New ID assigned to address, or existing ID if already assigned.
      /// @dev Address::commitAddress
      case 0xdd1d9bc3 {
        nonpayable()
        return.word(commitAddress(calldata.word(0)))
      }

      /// @notice Register a fraud commitment hash.
      /// @param fraudHash The hash of the calldata used for a fraud commitment.
      /// @dev Uses the message sender (caller()) in the commitment.
      case 0xf44bfd14 {
        nonpayable()
        commitFraudHash(calldata.word(0))
      }

      //////////////////////////////////////////////////////////////////////////
      /// FRAUD PROOFS BEGIN
      //////////////////////////////////////////////////////////////////////////

      /// @notice Prove that a block was malformed.
      /// @param blockHeader Block header.
      /// @param rootHeader Full root header.
      /// @param rootIndex Index to root in block header.
      /// @param transactions List of transactions committed to in root.
      /// @dev provers::MalformedBlock::proveMalformedBlock
      case 0x679a178f {
        nonpayable()
        requireValidFraudCommitment()
        let block := abi.offset(calldata.word(0))
        let root := abi.offset(calldata.word(1))
        let rootIndex := calldata.word(2)
        let transactions := abi.offset(calldata.word(3))
        let transactionsLength := abi.length(calldata.word(3))

        proveMalformedBlock(block, root, rootIndex, transactions, transactionsLength)
      }

      /// @notice Prove that a transaction was invalid.
      /// @param transactionProof Proof.
      /// @dev provers::InvalidTransaction::proveInvalidTransaction
      case 0x6f2ba873 {
        nonpayable()
        requireValidFraudCommitment()
        
        proveInvalidTransaction(abi.offset(calldata.word(0)))
      }

      /// @notice Prove that an input was invalid.
      /// @param proofA First proof.
      /// @param proofB Second proof.
      /// @dev provers::InvalidInput::proveInvalidInput
      case 0xa86735c3 {
        nonpayable()
        requireValidFraudCommitment()

        let transactionProofA := abi.offset(calldata.word(0))
        let transactionProofB := abi.offset(calldata.word(1))

        proveInvalidInput(transactionProofA, transactionProofB)
      }

      /// @notice Prove that a UTXO was double-spent.
      /// @param proofA Proof of UTXO being spent once.
      /// @param proofB Proof of UTXO being spent again.
      /// @dev provers::DoubleSpend::proveDoubleSpend
      case 0xbe4be780 {
        nonpayable()
        requireValidFraudCommitment()

        let transactionProofA := abi.offset(calldata.word(0))
        let transactionProofB := abi.offset(calldata.word(1))

        proveDoubleSpend(transactionProofA, transactionProofB)
      }

      /// @notice Prove that a witness was invalid.
      /// @param transactionProof Memory offset to start of transaction proof.
      /// @param inputProofs Memory offset of start of input proofs.
      /// @dev provers::InvalidWitness::proveInvalidWitness
      case 0x67df9aa7 {
        nonpayable()
        requireValidFraudCommitment()
        proveInvalidWitness(abi.offset(calldata.word(0)), abi.offset(calldata.word(1)))
      }

      /// @notice Prove that a transation produced more than it consumed.
      /// @param transactionProof Memory offset to start of transaction proof.
      /// @param inputProofs Memory offset of start of input proofs.
      /// @dev provers::InvalidSum::proveInvalidSum
      case 0x84e9520c {
        nonpayable()
        requireValidFraudCommitment()
        proveInvalidSum(abi.offset(calldata.word(0)), abi.offset(calldata.word(1)))
      }

      //////////////////////////////////////////////////////////////////////////
      /// FRAUD PROOFS END
      //////////////////////////////////////////////////////////////////////////

      /// @notice Complete a withdrawal.
      /// @param proof Inclusion proof for withdrawal on the rollup chain.
      /// @dev Withdraw::withdraw
      case 0x0968f264 {
        nonpayable()
        withdraw(abi.offset(calldata.word(0)))
      }

      /// @notice Withdraw the block proposer's bond for a finalized block.
      /// @param blockHeader Rollup block header of block to withdraw bond for.
      /// @dev Withdraw::bondWithdraw
      case 0xdfefa73e {
        nonpayable()
        bondWithdraw(abi.offset(calldata.word(0)))
      }

      /// @notice Get the transaction ID a registered witness authorizes.
      /// @param account Authorizing address.
      /// @param blockNumber Ethereum block number registration took place.
      /// @return Transaction ID being authorized, 0 if witness is not registered.
      /// @dev Witness::witnessAt
      case 0xd5c27d3a {
        return.word(witnessAt(calldata.word(0),
          calldata.word(1)))
      }

      /// @notice Calculate the funnel contract address for an account.
      /// @param account Account to calculate address for.
      /// @return Fuel contract address.
      /// @dev FunnelFactory::calculateFunnelAddress
      case 0xf0e7574e {
        return.word(calculateFunnelAddress(calldata.word(0)))
      }

      /// @notice Get the operator address.
      /// @return The operator address.
      case 0x570ca735 {
        Constructor.copy(0)
        return(Constructor.operator.position(0), 32)
      }

      /// @notice Get the rollup block height tip.
      /// @return The tip height.
      /// @dev Block::blockTip
      case 0xeba953cb {
        return.word(blockTip())
      }

      /// @notice Get number of registered tokens.
      /// @return The number of registered tokens.
      /// @dev Tokens::numTokens
      case 0x8e499bcf {
        return.word(numTokens())
      }

      /// @notice Get token ID of a token.
      /// @param token Address of token contract.
      /// @return The token ID. 0 if not registered.
      /// @dev Tokens::tokenId
      case 0x7ca31724 {
        return.word(tokenId(calldata.word(0)))
      }

      /// @notice Get number of registered addresses.
      /// @return The number of registered addresses.
      /// @dev Address::numAddresses
      case 0x2f8646d6 {
        return.word(numAddresses())
      }

      /// @notice Get address ID of an address.
      /// @param owner Registered address.
      /// @return The address ID. 0 if not registered.
      /// @dev Address::addressId
      case 0x078002ac {
        return.word(addressId(calldata.word(0)))
      }

      /// @notice Get deposit amount for a particular deposit.
      /// @param account Account that deposited.
      /// @param token Deposited token ID.
      /// @param blockNumber Ethereum block number the deposit was made.
      /// @return The deposit amount. 0 if no deposit made.
      /// @dev Deposit::depositAt
      case 0x861a0f52 {
        return.word(depositAt(
          calldata.word(0),
          calldata.word(1),
          calldata.word(2)
        ))
      }

      /// @notice Get block hash for a given rollup block height.
      /// @param blockHeight Rollup block height.
      /// @return The rollup block hash at the height.
      /// @dev Block::blockCommitment
      case 0x18f0b751 {
        return.word(blockCommitment(calldata.word(0)))
      }

      /// @notice Get a fraud commitment hash.
      /// @param fraudHash The keccak256(proveFraud calldata)
      /// @param caller The producer of the fraud hash.
      /// @return The block number.
      case 0x2fa5bb25 {
        return.word(sload(mappingKey2(
          11,
          calldata.word(0),
          calldata.word(1)
        )))
      }

      /// @notice Get Ethereum block number root was committed at.
      /// @param root Root.
      /// @return The Ethereum block number.
      /// @dev Root::rootBlockNumberAt
      case 0x29e0235c {
        return.word(rootBlockNumberAt(calldata.word(0)))
      }

      /// @notice Is a withdrawal processed (completed).
      /// @param blockHeight Rollup block height of withdrawal.
      /// @param withdrawalId Withdrawal ID.
      /// @return If the withdrawal has been processed.
      /// @dev Withdraw::isWithdrawalProcessed
      case 0xa3ca865e {
        return.word(isWithdrawalProcessed(calldata.word(0), calldata.word(1)))
      }

      /// @notice Get bond size constant.
      /// @return Bond size.
      case 0x23eda127 {
        Constructor.copy(0)
        return(Constructor.bondSize.position(0), 32)
      }

      /// @notice Get maximum size of transactions committed to in a root constant, in bytes.
      /// @return Max root size.
      case 0x16e2bcd5 {
        return.word(32000)
      }

      /// @notice Get submission delay constant. Ethereum blocks non-operator must wait after committing a root before committing to a block that includes it.
      /// @return Submission delay.
      case 0xb29a9069 {
        Constructor.copy(0)
        return(Constructor.submissionDelay.position(0), 32)
      }

      /// @notice Get finalization delay constant. Ethereum blocks before rollup blocks are finalized.
      /// @return Finalization delay.
      case 0x88dd56ec {
        Constructor.copy(0)
        return(Constructor.finalizationDelay.position(0), 32)
      }

      /// @notice Get penalty delay constant. Ethereum blocks after a fraud during which anyone may commit new blocks without submission delay.
      /// @return Penalty delay.
      case 0x8d683c50 {
        Constructor.copy(0)
        return(Constructor.penaltyDelay.position(0), 32)
      }

      /// @notice Get Ethereum block number until which operator is penalized.
      /// @return Current penalty block.
      case 0x0edd2ffc {
        return.word(getPenalty())
      }

      /// @notice Get contract name.
      /// @return Name.
      case 0x06fdde03 {
        Constructor.copy(0)
        Constructor.name.copy(0, 0)
        return(0, 96)
      }

      /// @notice Get contract version.
      /// @return Version.
      case 0x54fd4d50 {
        Constructor.copy(0)
        Constructor.version.copy(0, 0)
        return(0, 96)
      }

      /// @notice Not one of the above, invalid method signature.
      default {
        require(0, 0xa5)
      }

      // Ensure execution stops
      stop()
    }
  }
}
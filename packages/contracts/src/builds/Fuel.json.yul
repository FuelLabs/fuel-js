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



function Constructor.bondSize(pos) -> res {
  res := mslice(Constructor.bondSize.position(pos), 32)
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


    /// @dev the Constructor arguments (abi encoded).
    

    // The abi injection for the constructor.
    let Constructor.abi := 0x00

    // The constructor total size in bytes (fixed).
    

    /// @notice Copy the constructor arguments from code.
    function Constructor.copy(pos) {
      codecopy(pos, safeSub(codesize(), 416), 416)
    }

    /// @notice Verify the constructor arguments from code.
    function Constructor.verify(pos) {
      // Get the constructor params from memory.
      let nameLen := mload(Constructor.name(0))
      let versionLen := mload(Constructor.version(0))
      let bond := Constructor.bondSize(0)

      // Ensure name length.
      require(and(gt(nameLen, 0), lte(nameLen, 32)), 0x01)

      // Ensure version length.
      require(and(gt(versionLen, 0), lte(versionLen, 32)), 0x02)

      // Ensure the bond is divisble by 2.
      require(and(gt(bond, 0), eq(mod(bond, 2), 0)), 0x03)
    }

    /// @notice Copy the constructor name to memory.
    function Constructor.name.copy(cpos, pos) {
      let len := mload(Constructor.name(cpos))
      let val := mload(safeAdd(Constructor.name(cpos), 32))
      mstore(pos, 32) mstore(add(pos,32), len) mstore(add(pos,64), val)
    }

    /// @notice Return the hash of the constructor name.
    function Constructor.name.hash(pos) -> hash {
      hash := keccak256(safeAdd(safeAdd(pos, 256), 64), mload(Constructor.name(pos)))
    }

    /// @notice Return the version of the constructor.
    function Constructor.version.copy(cpos, pos) {
      let len := mload(Constructor.version(cpos))
      let val := mload(safeAdd(Constructor.version(cpos), 32))
      mstore(pos, 32) mstore(add(pos,32), len) mstore(add(pos,64), val)
    }

    /// @notice Return the version hash from the constructor.
    function Constructor.version.hash(pos) -> hash {
      hash := keccak256(safeAdd(safeAdd(pos, 320), 64), mload(Constructor.version(pos)))
    }
  
    /// @dev The various Ethereum state storage indexes.
    

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
    /// @return ID of token as uint256.
    function commitToken(addr) -> id {
      // Get the token id of this Contract address.
      id := tokenId(addr)

      // If the address is not zero (i.e. ether or empty) and the id is not Ether (i.e. zero), continue.
      if and(neq(addr, 0), iszero(id)) {
        // Get the total number of tokens from state.
        id := numTokens()

        // Here we enforce the token ID maximum, keeping token ID's under 4 bytes in length. Theory check.
        require(lt(id, 0xFFFFFFFF), 0x04)

        // Index token address to id.
        indexToken(addr, id)
      }
    }
  
    

    /// @notice Get number of registered addresses.
    /// @return Number of addresses as uint256.
    function numAddresses() -> num {
      num := sload(8)
    }

    /// @notice Get ID of registered address.
    /// @return ID of address as uint256.
    function addressId(addr) -> id {
      id := sload(mappingKey(9, addr))
    }

    /// @notice Register a new address with a sequentially assigned ID.
    /// @param addr The ERC20 token address to register.
    /// @param id The id to register this token at.
    function indexAddress(addr, id) {
      // Map the address to the token id.
      sstore(
        mappingKey(
          9,
          addr
        ),
        id
      )

      // Increase the total number of tokens.
      sstore(
        8,
        safeAdd(id, 1)
      )

      // Emit the AddressIndexed event.
      log3(0, 0,
          0xa9434c943c361e848a4336c1b7068a71a438981cb3ad555c21a0838f3d5b5f53,
          addr,
          id)
    }

    /// @notice Return ID of address, assigning a new one if necessary.
    /// @return ID of address as uint256.
    function commitAddress(addr) -> id {
      // Get the address Id of the provided address.
      id := addressId(addr)

      // Ensure the ID is not registered.
      if and(neq(addr, 0), iszero(id)) {
        id := numAddresses()
        indexAddress(addr, id)
      }
    }
  
    // Constants.
    
    
    

    // Copy constructor arguments to memory, verify construction.
    Constructor.copy(0)
    Constructor.verify(0)
    let operator := Constructor.operator(0)
    let genesis := Constructor.genesis(0)

    // Index the ETH token ID and zero address.
    indexToken(0, 0)
    indexAddress(0, 0)

    // Log genesis block.
    mstore(0, operator) mstore(add(0,32), 1) mstore(add(0,64), 1) mstore(add(0,96), 128) mstore(add(0,128), 0)
    log3(
      0,
      160,
      0x2521e5f2f7ee2cc8938e535746c063cc841d508a3036af3032bea136cad013a9,
      0,
      0
    )

    // Implicitly commit genesis block.
    sstore(mappingKey(1, 0), genesis)

    // Add extra data for block producer.
    let dataSize := safeAdd(datasize("Runtime"), 416)

    // Goto runtime.
    datacopy(0, dataoffset("Runtime"), dataSize)
    return(0, dataSize)
  }

  /// @notice Public methods.
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



function Constructor.bondSize(pos) -> res {
  res := mslice(Constructor.bondSize.position(pos), 32)
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



function TransactionProof.merkleTreeRoot(pos) -> res {
  res := mslice(TransactionProof.merkleTreeRoot.position(pos), 32)
}



function TransactionProof.inputProofs.position(_pos) -> _offset {
  
      
        function TransactionProof.inputProofs.position._chunk0(pos) -> __r {
          __r := 0x01de
        }
      
        function TransactionProof.inputProofs.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.inputProofs.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.inputProofs.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.inputProofs.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.inputProofs.position._chunk2(pos), 0))), 2), 32)
        }
      
        function TransactionProof.inputProofs.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x0171, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(TransactionProof.inputProofs.position._chunk3(pos), 0)))), 2), 1)
        }
      
        function TransactionProof.inputProofs.position._chunk5(pos) -> __r {
          __r := mul(mslice(add(0x0173, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(mul(mslice(add(0x016c, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), 0))), 2), 32), add(TransactionProof.inputProofs.position._chunk4(pos), 0))))), 1), 32)
        }
      

      _offset := add(TransactionProof.inputProofs.position._chunk0(_pos), add(TransactionProof.inputProofs.position._chunk1(_pos), add(TransactionProof.inputProofs.position._chunk2(_pos), add(TransactionProof.inputProofs.position._chunk3(_pos), add(TransactionProof.inputProofs.position._chunk4(_pos), add(TransactionProof.inputProofs.position._chunk5(_pos), 0))))))
    
}



function TransactionProof.inputProofs.length.position(_pos) -> _offset {
  
      
        function TransactionProof.inputProofs.length.position._chunk0(pos) -> __r {
          __r := 0x01dc
        }
      
        function TransactionProof.inputProofs.length.position._chunk1(pos) -> __r {
          __r := pos
        }
      
        function TransactionProof.inputProofs.length.position._chunk2(pos) -> __r {
          __r := mul(mslice(add(0xb4, add(TransactionProof.inputProofs.length.position._chunk1(pos), 0)), 2), 32)
        }
      
        function TransactionProof.inputProofs.length.position._chunk3(pos) -> __r {
          __r := mul(mslice(add(0x016c, add(pos, add(TransactionProof.inputProofs.length.position._chunk2(pos), 0))), 2), 32)
        }
      
        function TransactionProof.inputProofs.length.position._chunk4(pos) -> __r {
          __r := mul(mslice(add(0x0171, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(TransactionProof.inputProofs.length.position._chunk3(pos), 0)))), 2), 1)
        }
      
        function TransactionProof.inputProofs.length.position._chunk5(pos) -> __r {
          __r := mul(mslice(add(0x0173, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), add(mul(mslice(add(0x016c, add(pos, add(mul(mslice(add(0xb4, add(pos, 0)), 2), 32), 0))), 2), 32), add(TransactionProof.inputProofs.length.position._chunk4(pos), 0))))), 1), 32)
        }
      

      _offset := add(TransactionProof.inputProofs.length.position._chunk0(_pos), add(TransactionProof.inputProofs.length.position._chunk1(_pos), add(TransactionProof.inputProofs.length.position._chunk2(_pos), add(TransactionProof.inputProofs.length.position._chunk3(_pos), add(TransactionProof.inputProofs.length.position._chunk4(_pos), add(TransactionProof.inputProofs.length.position._chunk5(_pos), 0))))))
    
}



function UTXO.owner(pos) -> res {
  res := mslice(UTXO.owner.position(pos), 32)
}



function Deposit.owner(pos) -> res {
  res := mslice(Deposit.owner.position(pos), 32)
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



function UTXO.expiry(pos) -> res {
  res := mslice(UTXO.expiry.position(pos), 32)
}



function UTXO.returnOwner(pos) -> res {
  res := mslice(UTXO.returnOwner.position(pos), 32)
}



function TransactionProof.signatureFeeToken(pos) -> res {
  res := mslice(TransactionProof.signatureFeeToken.position(pos), 32)
}



function TransactionProof.signatureFee(pos) -> res {
  res := mslice(TransactionProof.signatureFee.position(pos), 32)
}



function BlockHeader.producer(pos) -> res {
  res := mslice(BlockHeader.producer.position(pos), 20)
}



function Constructor.penaltyDelay(pos) -> res {
  res := mslice(Constructor.penaltyDelay.position(pos), 32)
}



function RootHeader.commitmentHash(pos) -> res {
  res := mslice(RootHeader.commitmentHash.position(pos), 32)
}



function RootHeader.merkleTreeRoot(pos) -> res {
  res := mslice(RootHeader.merkleTreeRoot.position(pos), 32)
}



function Metadata.blockHeight(pos) -> res {
  res := mslice(Metadata.blockHeight.position(pos), 4)
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



function Metadata.rootIndex(pos) -> res {
  res := mslice(Metadata.rootIndex.position(pos), 1)
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
  _offset := TransactionProof.inputProofs.offset(pos)
}



function TransactionProof.inputProofs.offset(pos) -> _offset {
_offset := add(TransactionProof.inputProofs.position(pos), mul(TransactionProof.inputProofs.length(pos), 1))
}



function TransactionProof.inputProofs.length(pos) -> res {
  res := mslice(TransactionProof.inputProofs.length.position(pos), 2)
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



function Deposit.amount(pos) -> res {
  res := mslice(Deposit.amount.position(pos), 32)
}



function Deposit.amount.position(_pos) -> _offset {
  
      
        function Deposit.amount.position._chunk0(pos) -> __r {
          __r := 0x60
        }
      
        function Deposit.amount.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(Deposit.amount.position._chunk0(_pos), add(Deposit.amount.position._chunk1(_pos), 0))
    
}



function Deposit.keccak256(pos) -> _hash {
  _hash := keccak256(pos, Deposit.size(pos))
}



function Deposit.size(pos) -> _offset {
  _offset := sub(Deposit.offset(pos), pos)
}



function Deposit.offset(pos) -> _offset {
  _offset := Deposit.amount.offset(pos)
}



function Deposit.amount.offset(pos) -> _offset {
_offset := add(Deposit.amount.position(pos), 32)
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



function UTXO.token(pos) -> res {
  res := mslice(UTXO.token.position(pos), 32)
}



function UTXO.amount(pos) -> res {
  res := mslice(UTXO.amount.position(pos), 32)
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


    /// @dev the Constructor arguments (abi encoded).
    

    // The abi injection for the constructor.
    let Constructor.abi := 0x00

    // The constructor total size in bytes (fixed).
    

    /// @notice Copy the constructor arguments from code.
    function Constructor.copy(pos) {
      codecopy(pos, safeSub(codesize(), 416), 416)
    }

    /// @notice Verify the constructor arguments from code.
    function Constructor.verify(pos) {
      // Get the constructor params from memory.
      let nameLen := mload(Constructor.name(0))
      let versionLen := mload(Constructor.version(0))
      let bond := Constructor.bondSize(0)

      // Ensure name length.
      require(and(gt(nameLen, 0), lte(nameLen, 32)), 0x01)

      // Ensure version length.
      require(and(gt(versionLen, 0), lte(versionLen, 32)), 0x02)

      // Ensure the bond is divisble by 2.
      require(and(gt(bond, 0), eq(mod(bond, 2), 0)), 0x03)
    }

    /// @notice Copy the constructor name to memory.
    function Constructor.name.copy(cpos, pos) {
      let len := mload(Constructor.name(cpos))
      let val := mload(safeAdd(Constructor.name(cpos), 32))
      mstore(pos, 32) mstore(add(pos,32), len) mstore(add(pos,64), val)
    }

    /// @notice Return the hash of the constructor name.
    function Constructor.name.hash(pos) -> hash {
      hash := keccak256(safeAdd(safeAdd(pos, 256), 64), mload(Constructor.name(pos)))
    }

    /// @notice Return the version of the constructor.
    function Constructor.version.copy(cpos, pos) {
      let len := mload(Constructor.version(cpos))
      let val := mload(safeAdd(Constructor.version(cpos), 32))
      mstore(pos, 32) mstore(add(pos,32), len) mstore(add(pos,64), val)
    }

    /// @notice Return the version hash from the constructor.
    function Constructor.version.hash(pos) -> hash {
      hash := keccak256(safeAdd(safeAdd(pos, 320), 64), mload(Constructor.version(pos)))
    }
  
    // Offset in memory at which to start the call data copy
    

    /// @notice Copy all calldata to memory.
    function calldata.copy() {
      // Require calldata is available.
      require(gt(calldatasize(), 0), 0x05)

      // Copy calldata.
      calldatacopy(1024, 0, calldatasize())
    }

    /// @notice payable requirement, ensure value is not used.
    function nonpayable() {
      require(iszero(callvalue()), 0x06)
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

    /// @notice Return the abi offset.
    function abi.offset(offset) -> position {
      position := safeAdd(offset, safeAdd(36, 1024))
    }

    /// @notice Return the abi length.
    function abi.length(offset) -> length {
      length := mload(safeAdd(offset, safeAdd(4, 1024)))
    }

    /// @notice Return a single word from memory.
    function return.word(word) {
      mstore(0, word)
      return(0, 32)
    }

    /// @notice Return the calldata offset memory position.
    function calldata.offset() -> offset {
      offset := safeAdd(1024, calldatasize())
    }
  
    /// @dev Used as a constant Ether value.
    

    /// @notice Used as a multiply by 32 simple.
    function mul32(x) -> result {
      result := safeMul(x, 32)
    }

    /// @notice Simple equal or.
    function eqor(x, y, z) -> result {
      result := or(eq(x, y), eq(x, z))
    }

    /// @notice Round value down to 32.
    function round32(x) -> result {
      result := safeMul(safeDiv(x, 32), 32)

      if lt(result, x) {
        result := safeAdd(x, 32)
      }
    }

    /// @notice Math pow.
    /// @param base The base to be raised by the exponent.
    /// @param exponent The exponent value.
    /// @return result The result of base ^ exponent.
    function power(base, exponent) -> result {
        result := 1
        for { let i := 0 } lt(i, exponent) { i := safeAdd(i, 1) } {
            result := safeMul(result, base)
        }
    }

    /// @notice Sha256 hash 1 word as memory position `start`.
    /// @param start The starting memory position sha256(start, start + 1 word)
    function sha256(start) -> res {
      pop(staticcall(gas(), 2, start, 32, 0, 32))
      res := mload(0)
    }

    /// @notice Transfer amount either Ether or ERC20.
    /// @param amount The amount to transfer.
    /// @param token The token address (0 for Ether).
    /// @param owner The destination owner address.
    function transfer(amount, token, owner) {
      require(gt(amount, 0), 0x07)
      require(gt(owner, 0), 0x08)
      require(gte(token, 0), 0x09)

      // Based upon the token address switch.
      switch token

      // Handle case with Ether.
      case 0 {
        require(call(gas(), owner, amount, 0, 0, 0, 0), 0x0a)
      }

      // Handle ERC20 case.
      default {
        mstore(0, 0xa9059cbb) mstore(add(0,32), owner) mstore(add(0,64), amount)
        require(call(gas(), token, 0, 28, 68, 0, 32), 0x0b)
        require(gt(mload(0), 0), 0x0c)
      }
    }
  
    /// @dev The various Ethereum state storage indexes.
    

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
    /// @return ID of token as uint256.
    function commitToken(addr) -> id {
      // Get the token id of this Contract address.
      id := tokenId(addr)

      // If the address is not zero (i.e. ether or empty) and the id is not Ether (i.e. zero), continue.
      if and(neq(addr, 0), iszero(id)) {
        // Get the total number of tokens from state.
        id := numTokens()

        // Here we enforce the token ID maximum, keeping token ID's under 4 bytes in length. Theory check.
        require(lt(id, 0xFFFFFFFF), 0x04)

        // Index token address to id.
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

    /// @notice Commit a root to chain.
    /// @param merkleTreeRoot The merkle tee root hash.
    /// @param commitmentHash The commitment hash.
    /// @param length The total length of the committed data.
    /// @param token The root fee token identifier (id).
    /// @param fee The root fee amount.
    function commitRoot(merkleTreeRoot, commitmentHash, length, token, fee) {
      // Caller/msg.sender must not be a contract
      require(eq(origin(), caller()), 0x0d)

      // If the contract is a caller, prevent it.
      require(eq(extcodesize(caller()), 0), 0x0e)

      // Calldata size must be at least as big as the minimum transaction size (44 bytes)
      require(gte(length, 44), 0x0f)

      // Calldata max size enforcement (~2M gas / 16 gas per byte/64kb payload target)
      require(lte(length, 32000), 0x10)
      require(
        lte(
          calldatasize(),
          safeAdd(
            32000,
            mul32(6)
          )
        ),
        0x11
      )

      // Fee token must be already registered
      require(gte(token, 0), 0x12)
      require(lt(token, numTokens()), 0x13)

      // Build root
      mstore(0,
        caller()
      ) mstore(add(0,32),
        merkleTreeRoot
      ) mstore(add(0,64),
        commitmentHash
      ) mstore(add(0,96),
        length
      ) mstore(add(0,128),
        token
      ) mstore(add(0,160),
        fee
      )
      // Hash the block header with an offset of 12 bytes, since first field is a 32-12=20 byte address.
      let root := RootHeader.keccak256(12)

      // Root must not have been registered yet
      let rootBlockNumber := sload(mappingKey(3, root))
      require(eq(rootBlockNumber, 0), 0x14)

      // Register root with current block number
      sstore(mappingKey(3, root), number())

      // Store caller in data
      mstore(0,
        caller()
      ) mstore(add(0,32),
        token
      ) mstore(add(0,64),
        fee
      ) mstore(add(0,96),
        length
      )
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
    /// @return Number of addresses as uint256.
    function numAddresses() -> num {
      num := sload(8)
    }

    /// @notice Get ID of registered address.
    /// @return ID of address as uint256.
    function addressId(addr) -> id {
      id := sload(mappingKey(9, addr))
    }

    /// @notice Register a new address with a sequentially assigned ID.
    /// @param addr The ERC20 token address to register.
    /// @param id The id to register this token at.
    function indexAddress(addr, id) {
      // Map the address to the token id.
      sstore(
        mappingKey(
          9,
          addr
        ),
        id
      )

      // Increase the total number of tokens.
      sstore(
        8,
        safeAdd(id, 1)
      )

      // Emit the AddressIndexed event.
      log3(0, 0,
          0xa9434c943c361e848a4336c1b7068a71a438981cb3ad555c21a0838f3d5b5f53,
          addr,
          id)
    }

    /// @notice Return ID of address, assigning a new one if necessary.
    /// @return ID of address as uint256.
    function commitAddress(addr) -> id {
      // Get the address Id of the provided address.
      id := addressId(addr)

      // Ensure the ID is not registered.
      if and(neq(addr, 0), iszero(id)) {
        id := numAddresses()
        indexAddress(addr, id)
      }
    }
  
    /// @notice Max number of transaction roots per block.
    

    /// @notice Block header object.
    

    /// @notice Helper function to get finalization delay, extracted from constructor.
    /// @return Finalization delay in Ethereum blocks as uint256.
    function FINALIZATION_DELAY() -> delay {
      Constructor.copy(0)
      delay := Constructor.finalizationDelay(0)
    }

    /// @notice Get rollup block tip (i.e. current height).
    /// @return Block tip as uint256.
    function blockTip() -> blockNumber {
      blockNumber := sload(6)
    }

    /// @notice Get rollup blockhash for given rollup block height.
    /// @return Blockhash as bytes32.
    function blockCommitment(blockHeight) -> blockHash {
      blockHash := sload(mappingKey(1, blockHeight))
    }

    /// @notice Get penalty block number. The operator is penalized until this block number.
    /// @return Ethereum block number as uint256.
    function getPenalty() -> blockNumber {
      blockNumber := sload(0)
    }

    /// @notice Set penalty block number as delay from current block number. The operator is penalized until this block number.
    function setPenalty(delay) {
      sstore(0, safeAdd(number(), delay))
    }

    /// @notice Commits a new rollup block.
    function commitBlock(minBlockNumber, minBlockHash, height, rootsLength, rootsPosition) {
      // Grab the current blockTip from state.
      let _blockTip := blockTip()

      // Grab the previous commitment hash from state.
      let previousBlockHash := blockCommitment(safeSub(height, 1))

      // To avoid Ethereum re-org attacks, commitment transactions include a minimum
      //  Ethereum block number and block hash. Check will fail if transaction is > 256 block old.
      require(gt(number(), minBlockNumber), 0x15)
      require(eq(blockhash(minBlockNumber), minBlockHash), 0x16)

      // Check that new rollup blocks builds on top of the tip.
      require(eq(height, safeAdd(_blockTip, 1)), 0x17)

      // Require at least one root submission.
      require(gt(rootsLength, 0), 0x18)

      // Require at most the maximum number of root submissions.
      require(lte(rootsLength, 128), 0x19)

      // Get the rollup operator.
      Constructor.copy(0)
      let producer := Constructor.operator(0)

      // Require value be bond size.
      require(eq(callvalue(), Constructor.bondSize(0)), 0x1a)

      // Clear submitted roots from storage.
      for { let rootIndex := 0 } lt(rootIndex, rootsLength) { rootIndex := safeAdd(rootIndex, 1) } {
        let rootHash := mload(safeAdd(rootsPosition, safeMul(rootIndex, 32)))
        let rootBlockNumber := rootBlockNumberAt(rootHash)

        // Check root exists.
        require(gt(rootBlockNumber, 0), 0x1b)

        // Check whether block producer has the right to commit rollup block.
        // In penalty mode (second condition is true), anyone can commit a block with roots without delay.
        // In normal mode (second condition is false), only the operator can commit a block before waiting the root delay.
        if and(lt(number(), safeAdd(rootBlockNumber, Constructor.submissionDelay(0))),
          gt(number(), getPenalty())) {
          require(eq(caller(), producer), 0x1c)
        }

        // Clear root from storage.
        clearRoot(rootHash)
      }

      // Build a BlockHeader object.
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

      // Save new rollup block height as the tip.
      sstore(6, height)

      // Build BlockCommitted log from calldata.
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
      // Block must be known (already committed).
      require(
        eq(
          blockCommitment(BlockHeader.height(blockHeader)),
          BlockHeader.keccak256(blockHeader)
        ),
        0x1d
      )

      // Load finalization delay parameter from constructor.
      Constructor.copy(0)

      // Select the finalization delay from Constructor data.
      let finalizationDelay := Constructor.finalizationDelay(0)

      // If asserting finalized, block must be finalizable.
      if eq(assertFinalized, 1) {
        require(
          gte(
            number(),
            safeAdd(BlockHeader.blockNumber(blockHeader), finalizationDelay)
          ),
          0x1e
        )
      }

      // If asserting not finalized, block must not be finalizable.
      if eq(assertFinalized, 0) {
        require(
          lt(
            number(),
            safeAdd(BlockHeader.blockNumber(blockHeader), finalizationDelay)
          ),
          0x1f
        )
      }

      // Extra check. Ensure the block height is less than the current block tip.
      require(
        lte(
          BlockHeader.height(blockHeader),
          blockTip()
        ),
        0x20
      )

      // If root header memory position is present, verify it.
      if gt(root, 0) {
        // Check bounds on transaction root index.
        require(
          lt(
            rootIndex,
            BlockHeader.roots.length(blockHeader)
          ),
          0x21
        )

        // Hash of root header must match root header hash from proof.
        require(
          eq(
            RootHeader.keccak256(root),
            BlockHeader.roots(blockHeader, rootIndex)
          ),
          0x22
        )
      }
    }
  
    // The Domain and Transaction Struct pre-images.
    
    

    /// @notice The EIP712 Fuel Domain.
    function eip712.domain() -> EIP712Domain {
      Constructor.copy(0)
      let chainId := Constructor.chainId(0)
      let nameHash := Constructor.name.hash(0)
      let versionHash := Constructor.version.hash(0)
      mstore(0, 0xbe1f30900ea0b603c03bc6ce517b4795fbdb08cc0b4b6e316e19199becde9754) mstore(add(0,32), nameHash) mstore(add(0,64), versionHash) mstore(add(0,96), chainId) mstore(add(0,128), address())
      EIP712Domain := keccak256(0, safeMul(5, 32))
    }

    /// @notice The EIP712 transaction hashing routine.
    /// @param The unsigned transaction hash.
    function eip712.transaction(unsignedHashId) -> EIP712Transaction {
      mstore(0, 0xcfa11514192b8d3d6bcda9639281831e60687a67997d39912c7eb7a7a8041ad3) mstore(add(0,32), unsignedHashId)
      EIP712Transaction := keccak256(0, 64)
    }

    /// @notice The EIP712 hash ID method.
    function eip712(unsignedHashId) -> hashId {
      let EIP712Transaction := eip712.transaction(unsignedHashId)
      let EIP712Domain := eip712.domain()
      mstore(0, 0x1901) mstore(add(0,32), EIP712Domain) mstore(add(0,64), EIP712Transaction)
      hashId := keccak256(30, 66)
    }
  
    // Size of metadata object in bytes
    

    /// @notice Metadata object. Points to an exact entry in the ledger.
    

    /// @notice Metadata for Deposit objects.
    
  
    /// @dev Describes the valid Witness types in Fuel.
    

    /// @dev This is for when you want to sign a transaction with an Ethereum private key.
    

    /// @dev This is used when a contract wants to sign a transaction.
    

    /// @dev This is used when the block producer wants to sign a transaction.
    

    /// @notice Get authorized transaction ID by owner and Ethereum block number.
    /// @param owner The owner address.
    /// @param blockNumber The Ethereum block number of this witness.
    /// @return Transaction ID as bytes32.
    function witnessAt(owner, blockNumber) -> id {
      id := sload(
        mappingKey2(
          10,
          owner,
          blockNumber
        )
      )
    }

    /// @notice Register a new Caller witness for a transaction ID.
    /// @param Commit a witness into state.
    function commitWitness(id) {
      // Witness must not already be registered.
      require(eq(witnessAt(caller(), number()), 0), 0x23)
  
      // Store the transaction hash keyed by the caller and block number.
      sstore(
        mappingKey2(
          10,
          caller(),
          number()
        ),
        id
      )

      // Build WitnessCommitted log and emit.
      mstore(0, number())
      log3(0, 32, 0x341ba990467944d1f03e07e000a6ba6e631223bd8b9b996aaec9f199bef89c62,
        caller(),
        id)
    }
  
    /// @notice This method ensures the owner cannot be zero.
    /// @param owner The 20 byte owner address.
    /// @param recoveredWitnessOwner The 20 byte recovered owner.
    /// @return Is the witness equal.
    /// @dev You can never sign as the null witness.
    function recoveredWitnessEq(owner, recoveredWitnessOwner) -> result {
      result := and(gt(owner, 0), eq(owner, recoveredWitnessOwner))
    }

    /// @notice Get size of witness object.
    /// @param witness The Witness structure in question.
    /// @return Size of witness object, in bytes as uint256.
    function witnessSize(witness) -> size {
      // Switch between the witness types.
      switch Signature.type(witness)

      // If the type is a Signature.
      case 0 {
        size := Signature.size(witness)
      }

      // If the type is a Caller.
      case 1 {
        size := Caller.size(witness)
      }

      // If the type is a Producer.
      case 2 {
        size := Producer.size(witness)
      }

      // If the type is invalid.
      default {
        size := 66 // <-- Avoid infinite loops.
      }
    }

    /// @notice ecrecover helper function.
    /// @param digestHash The 32 byte digest hash.
    /// @param witness The Signature witness structure.
    /// @return account The returned account from ECRecover.
    function ecrecover(digestHash, witness) -> account {
      // The transactionHashId digest hash.
      mstore(0, digestHash)

      // The singature V.
      mstore(32, Signature.v(witness))

      // The signature R.
      mstore(64, Signature.r(witness))

      // The signature S.
      mstore(96, Signature.s(witness))

      // Clear memory ECRecover precompile return.
      mstore(160, 0)

      // Here we call ECRecover precompile at address 0x01, we allow it to fail.
      let result := call(3000, 1, 0, 0, 128, 160, 32)

      // Return the result RCRecover address.
      account := mload(160)
    }
  
    

    /// @notice Generic input. Transfer and Root.
    

    /// @notice A Deposit input.
    

    /// @notice An HTLC input.
    

    /// @notice Get size of an input object.
    /// @return Size of input in bytes as uint256.
    function inputSize(input) -> size {
      // Switch based upon the Input's type.
      switch Input.type(input)

      // In the case of an HTLC, the size is 34 bytes.
      case 2 {
        size := 34
      }

      // In the case of a Deposit, the size is a fixed 22 bytes.
      case 1 {
        size := 22
      }

      // In the case of a normal Transfer or Root Input, the size is a fixed 2 bytes.
      default {
        size := 2
      }
    }

    /// @notice Compute hash of input.
    /// @return Keccak256 hash of input as bytes32.
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
      // Switch between the output types.
      switch Output.type(output)

      // If the output type is a Transfer.
      case 0 {
        size := Output.size(output)
      }

      // If the output type is a Withdraw.
      case 1 {
        size := Output.size(output)
      }

      // If the output type is a HTLC.
      case 2 {
        size := OutputHTLC.size(output)
      }

      // If the output type is a Retun.
      case 3 {
        size := OutputReturn.size(output)
      }

      // If the output type is invalid.
      default { // avoid infinite loops.
        size := 20
      }
    }

    /// @notice Parse out the token ID from an output object.
    function outputToken(output) -> id {
      id := Output.token.slice(output)
    }

    /// @notice Checks non-Return output owner.
    /// @return If output owner matches as bool.
    function ownerEquates(output, owner) -> result {
      let len := Output.owner.length(output)

      // Length of owner field must be <= 20 bytes (should be handled in proveInvalidTransaction).
      require(gt(len, 0), 0x24)
      require(lte(len, 20), 0x25)

      // Switch between the length of the input.
      switch len

      // If the length is 20 bytes.
      case 20 { // raw address.
        result := eq(Output.owner.slice(output), owner)
      }

      // if the length is anything else. Overflow checked above and in proveInvalidTransaction.
      default { // registered address ID.
        let id := Output.owner.slice(output)
        result := eq(id, addressId(owner))
      }
    }

    /// @notice Checks HTLC's return owner.
    /// @return If output owner matches as bool.
    function returnOwnerEquals(output, owner) -> result {
      let len := OutputHTLC.returnOwner.length(output)

      // Check for over and underflow.
      require(gt(len, 0), 0x24)
      require(lte(len, 20), 0x25)

      // Switch based upon the output returnOwner length.
      switch len

      // If the owner is 20 bytes it's an address.
      case 20 { // raw address.
        result := eq(OutputHTLC.returnOwner.slice(output), owner)
      }

      // If the owner is less than 20 bytes, it's an ID.
      default {
        let id := OutputHTLC.returnOwner.slice(output)
        result := eq(id, addressId(owner))
      }
    }
  
    // Minimum transaction size in bytes.
    

    // Maximum transaction size in bytes.
    

    // Maximum number of inputs per transaction.
    

    // Maximum number of outputs per transaction.
    

    // Empty leaf hash default value.
    

    /// @notice Merkle proof to specific input or output of a transaction in the rollup chain.
    

    /// @notice Leaf of transaction Merkle tree.
    

    /// @notice Require index less than 8.
    /// @param index The index pointer.
    function requireIndexValid(index) {
      require(
        lt(
          index,
          8
        ),
        0x26
      )
    }

    /// @notice Helper function to load a UTXO into memory for later use.
    function TransactionProof.UTXO.assign(proof, pos) {
      let output := selectOutput(proof)

      // Return-type outputs are unspendable.
      require(
        neq(
          Output.type(output),
          3
        ),
        0x27
      )

      // Owner must match.
      require(
        ownerEquates(
          output,
          TransactionProof.tokenAddress(proof)
        ),
        0x28
      )

      // For HTLC UTXOs, return owner must match.
      if eq(Output.type(output), 2) {
        require(
          returnOwnerEquals(
            output,
            TransactionProof.returnOwner(proof)
          ),
          0x29
        )
      }

      // Save the UTXO to memory.
      mstore(
        pos,
        transactionId(proof)  // return witness.
      ) mstore(
        add(pos,32),
        TransactionProof.inputOutputIndex(proof)  // return witness.
      ) mstore(
        add(pos,64),
        Output.type(output)  // return witness.
      ) mstore(
        add(pos,96),
        TransactionProof.tokenAddress(proof)  // return witness.
      ) mstore(
        add(pos,128),
        outputAmount(output)  // return witness.
      ) mstore(
        add(pos,160),
        Output.token.slice(output)  // return witness.
      ) mstore(
        add(pos,192),
        0  // return witness.
      ) mstore(
        add(pos,224), // digest.
        0  // return witness.
      ) mstore(
        add(pos,256), // expiry.
        0  // return witness.
      )

      // If the UTXO is an HTLC type, make sure to save the extra required fields.
      if eq(Output.type(output), 2) {
        mstore(safeAdd(pos, 192), OutputHTLC.digest(output))
        mstore(safeAdd(pos, 224), OutputHTLC.expiry(output))
        mstore(safeAdd(pos, 256), TransactionProof.returnOwner(proof))
      }
    }

    /// @notice Hash a UTXO.
    /// @return The UTXO's hash as a bytes32.
    function TransactionProof.UTXO.keccak256(proof) -> hash {
      // Assign UTXO to memory.
      TransactionProof.UTXO.assign(proof, 0)

      // Hash UTXO to get UTXO ID.
      hash := UTXO.keccak256(0)
    }

    /// @notice Find the position of the start of the block substructure.
    /// @return Position of block substructure as uint256.
    function TransactionProof.block(proof) -> pos {
      pos := TransactionProof.blockProducer.position(proof)
    }

    /// @notice Find the position of start of the root substructure.
    /// @return Position of root substructure as uint256.
    function TransactionProof.root(proof) -> pos {
      pos := TransactionProof.rootProducer.position(proof)
    }

    ////////////////////////////////////////////////////////////////////////////
    // ABI Encoded Structures (Non-Tight Packed/Rolled).
    ////////////////////////////////////////////////////////////////////////////

    /// @notice Calculate the fee of a root. This is feerate x length of transactions in bytes.
    /// @return Fee for root as uint256.
    function rootFee(proof, token) -> sum {
      if eq(TransactionProof.feeToken(proof), token) {
        sum := safeMul(TransactionProof.transaction.length(proof), TransactionProof.fee(proof))
      }
    }

    /// @notice Get transaction ID from proof.
    /// @return Transaction ID as bytes32.
    function transactionId(proof) -> hash {
      let leaf := TransactionProof.transaction.position(proof)
      // Transaction IDs are the EIP-712 hash of the non-witness transaction data.
      // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md.
      let start := TransactionLeaf.inputs.length.position(leaf)
      let end := TransactionProof.signatureFee.offset(proof)
      hash := eip712(keccak256(start, safeSub(end, start)))
    }

    /// @notice Find the position of the witness at a given index.
    /// @return Position of witness as uint256.
    function TransactionProof.witness(proof, index) -> pos {
      let leaf := TransactionProof.transaction.position(proof)
      pos := TransactionLeaf.witnesses.position(leaf)

      // Ensure the index is valid.
      requireIndexValid(index)

      // Iterate through list of witnesses until index is reached.
      for {} gt(index, 0) {} {
        pos := safeAdd(pos, witnessSize(pos))
        index := safeSub(index, 1)
      }

      // This can be challenged in proveInvalidTransaction.
      require(
        lt(
          pos,
          TransactionLeaf.witnesses.offset(leaf)
        ),
        0x2a
      )
    }

    /// @notice Find the position of the witness with proof-specified index.
    /// @return Position of witness as uint256.
    function TransactionProof.input.witness(proof) -> pos {
      let index := Input.witnessReference(selectInput(proof))
      pos := TransactionProof.witness(proof, index)
    }

    /// @notice Get the initial merkle depth of a tree by given leaf count.
    /// @param leafCount The number of current leafs.
    /// @return depth The depth of the merkle tree.
    function merkleTreeDepth(leafCount) -> depth {
        let numNodes := leafCount
        
        // If the number of nodes is odd, than add one.
        if gt(mod(numNodes, 2), 0) {
            numNodes := safeAdd(numNodes, 1)
        }
  
        // Go through each depth, right shift nodes by one along the way.
        for {} gt(numNodes, 1) {} {
            // If numNodes is odd, add one.
            if gt(mod(numNodes, 2), 0) {
                numNodes := safeAdd(numNodes, 1)
            }
            
            // Shift num nodes right by one.
            numNodes := shr(1, numNodes)

            // Incease return depth of merkle tree.
            depth := safeAdd(depth, 1)
        }
    }

    /// @notice Get the number of leafs for a given balanced binary merkle tree.
    /// @param leafCount The current number of leafs in the tree.
    /// @return balanceCount The number of leafs after balancing.
    function merkleTreeWidth(leafCount) -> balancedCount {
        // The number of balanced base leafs is 2 ^ depths.
        balancedCount := power(
            2,
            merkleTreeDepth(leafCount)
        )
    }

    /// @notice This will compute an inner merkle hash.
    /// @param start The start position in memory of the data.
    /// @param lenth The length of the data.
    /// @param prefix The one byte prefix for the data (usually 0x00 or 0x01).
    /// @return The resulting leaf hash.
    function computeMerkleNodeHash(start, length, prefix) -> hash {
      // Get the byte before the start position of the transaction data.
      let position := safeSub(start, 1)

      // Slice out the data of this byte.
      let bytebefore := mslice(position, 1)

      // Override the byte before with a zero.
      mstore8(position, prefix)

      // Hash the transaction leaf.
      hash := keccak256(position, safeAdd(length, 1))

      // Put back the byte before it was hashed.
      mstore8(position, bytebefore)
    }

    /// @notice Compute the transaction hash for a given leaf.
    /// @param start The start position of the leaf.
    /// @return leafHash The leaf hash.
    function computeInnerNodeHash(start) -> leafHash {
      // Here the prefix is zero for the computed transaction leaf hash.
      leafHash := computeMerkleNodeHash(start, 64, 1)
    }

    /// @notice Compute the transaction hash for a given leaf.
    /// @param start The start position of the leaf.
    /// @param length The length position of the leaf.
    /// @return leafHash The leaf hash.
    function computeLeafHash(start, length) -> leafHash {
      // Here the prefix is zero for the computed transaction leaf hash.
      leafHash := computeMerkleNodeHash(start, length, 0)
    }

    /// @notice Compute the transaction hash for a given leaf.
    /// @param start The start position of the leaf.
    /// @param length The length position of the leaf.
    /// @return leafHash The leaf hash.
    function computeEmptyTransactionLeafHash() -> leafHash {
      // Ensure memory 32 - 0 not empty, although not necessary for hash generation.
      mstore(32, 0)

      // Here the prefix is zero for the computed transaction leaf hash.
      leafHash := computeMerkleNodeHash(32, 0, 0)
    }

    /// @notice Compute the transaction hash for a given leaf.
    /// @param transactionProof The start position of the leaf.
    /// @return leafHash The leaf hash.
    function computeTransactionLeafHash(transactionProof) -> leafHash {
      // Here the prefix is zero for the computed transaction leaf hash.
      leafHash := computeLeafHash(
        TransactionProof.transaction.position(transactionProof),
        TransactionProof.transaction.length(transactionProof)
      )
    }

    /// @notice Find the position of the input with proof-specified index.
    /// @return Position of input as uint256.
    function selectInput(proof) -> pos {
      let leaf := TransactionProof.transaction.position(proof)
      let index := TransactionProof.inputOutputIndex(proof)
      pos := TransactionLeaf.inputs.position(leaf)

      // Require the index be valid.
      requireIndexValid(index)

      // Go through each input until you get to the index you want.
      for {} gt(index, 0) {} {
        pos := safeAdd(pos, inputSize(pos))
        index := safeSub(index, 1)
      }

      // Ensure the position doesn't overflow.
      require(
        lt(
          pos,
          TransactionLeaf.inputs.offset(leaf)
        ),
        0x2b
      )
    }

    /// @notice Helper function: extact the inner data of an input.
    /// @param transactionProof Position in memory of transaction proof.
    /// @return The inner data (owner or preimage) of an input.
    function inputInnerData(transactionProof) -> innerHash {
      // Get offset of input specified in the proof.
      let input := selectInput(transactionProof)

      // In the case of Deposits, return the owner as the inner data.
      if eq(Input.type(input), 1) {
        innerHash := InputDeposit.owner(input)
      }
    }

    /// @notice Extract metadata of output referenced by input from proof.
    /// @return Metadata as bytes8.
    function inputReferencedMetadata(proof) -> id {
      let leaf := TransactionProof.transaction.position(proof)
      let index := TransactionProof.inputOutputIndex(proof)

      // Return the metadata for this leaf at a specific index.
      id := TransactionLeaf.metadata(leaf, index)
    }

    /// @notice Find the position of the output with proof-specified index.
    /// @return Position of output as uint256.
    function selectOutput(proof) -> pos {
      let leaf := TransactionProof.transaction.position(proof)
      let index := TransactionProof.inputOutputIndex(proof)
      pos := TransactionLeaf.outputs.position(leaf)

      // Require the index be less than 8.
      requireIndexValid(index)

      // Go through each output till you get to the selected index.
      for {} gt(index, 0) {} {
        pos := safeAdd(pos, outputSize(pos))
        index := safeSub(index, 1)
      }

      // The position of the selected output must be less than the offset.
      require(
        lt(
          pos,
          TransactionLeaf.outputs.offset(leaf)
        ),
        0x2c
      )
    }

    /// @notice Check if HTLC output has timed out.
    /// @return If the output has timed out as bool.
    function outputExpired(input, proof) -> expired {
      // Select the output of this input.
      let output := selectOutput(input)

      // Select the block number of the transaction proof.
      let blockNumber := TransactionProof.blockNumber(proof)

      // Is the block number if this transaction make this HTLC expired.
      expired := gte(blockNumber, OutputHTLC.expiry(output))
    }

    /// @notice Get total length of witneses, in bytes.
    /// @return Length of witnesses as uint256.
    function witnessesLength(leaf) -> len {
      let pos := TransactionLeaf.witnesses.position(leaf)
      let end := TransactionLeaf.witnesses.offset(leaf)

      // Iterate over witness lengths and accumulate.
      for {} lt(pos, end) {} {
        pos := safeAdd(pos, witnessSize(pos))
        len := safeAdd(len, 1)
      }
    }

    /// @notice Get total length of inputs, in bytes.
    /// @return Length of inputs as uint256.
    function inputsLength(leaf) -> len {
      let pos := TransactionLeaf.inputs.position(leaf)
      let end := TransactionLeaf.inputs.offset(leaf)

      // Iterate over input lengths and accumulate.
      for {} lt(pos, end) {} {
        pos := safeAdd(pos, inputSize(pos))
        len := safeAdd(len, 1)
      }
    }

    /// @notice Get total length of inputs.
    /// @param proof TransactionProof position.
    /// @return Length of inputs as uint256.
    function TransactionProof.inputs.length(proof) -> len {
      let leaf := TransactionProof.transaction.position(proof)

      // Now calculate the inputs length.
      len := inputsLength(leaf)
    }

    /// @notice Get total length of metadata.
    /// @param proof TransactionProof position.
    /// @return Length of metadata as uint256.
    function TransactionProof.metadata.length(proof) -> len {
      let leaf := TransactionProof.transaction.position(proof)

      // Now calculate the inputs length.
      len := TransactionLeaf.metadata.length(leaf)
    }

    /// @notice Get total length of outputs.
    /// @param proof TransactionProof position.
    /// @return Length of outputs as uint256.
    function TransactionProof.outputs.length(proof) -> len {
      let leaf := TransactionProof.transaction.position(proof)
      let pos := TransactionLeaf.outputs.position(leaf)
      let end := TransactionLeaf.outputs.offset(leaf)

      // Iterate over output lengths and accumulate.
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
    /// @return Position of metadata as uint256.
    function selectMetadata(proof, index) -> pos {
      let leaf := TransactionProof.transaction.position(proof)
      pos := TransactionLeaf.metadata.position(leaf)

      // Ensure the selected index is less than 8.
      requireIndexValid(index)

      // Go through each metadata until your at the index you want.
      for {} gt(index, 0) {} {
        pos := safeAdd(pos, 8)
        index := safeSub(index, 1)
      }

      // Ensure no positional overflow from the metadata.
      require(
        lt(
          pos,
          TransactionLeaf.metadata.offset(leaf)
        ),
        0x2b
      )
    }

    /// @notice Recover witness address from proof.
    /// @return Recovered address as address. 0 on fail.
    function recoverFromWitness(witness, proof) -> addr {
      // Switch between different types of signature.
      switch Signature.type(witness)

      // If the signature type is a Signature (i.e. sepck256).
      case 0 {
        addr := ecrecover(transactionId(proof), witness)
      }

      // If the signature type is a Caller (i.e. noted in state).
      case 1 {
        addr := Caller.owner(witness)

        // There must be a witness available at the specified owner + blockNumber combination.
        if neq(witnessAt(addr, Caller.blockNumber(witness)), transactionId(proof)) {
          addr := 0
        }
      }

      // If the type is a Producer (i.e. the block producer).
      case 2 {
        addr := TransactionProof.blockProducer(proof)

        // The hash must be specifically this transaction hash.
        if neq(Producer.hash(witness), transactionId(proof)) {
          addr := 0
        }
      }

      // If the type is invalid revert. Handle this in proveInvalidTransaction.
      default {
        require(0, 0x2d)
      }
    }

    /// @notice ecrecover witness with proof-specified index.
    /// @return Recovered address as address.
    function TransactionProof.input.recoverWitness(proof) -> addr {
      // Select the input witness.
      let witness := TransactionProof.input.witness(proof)

      // Recover the address of the selected witness.
      addr := recoverFromWitness(witness, proof)
    }
  
    // Maximum Merkle tree height.
    

    /// @notice Verify a Merkle proof.
    /// @param transactionProof Position in memory of transaction proof.
    /// @return Boolean flag: if the leaf is *not* the rightmost.
    function verifyMerkleProof(transactionProof) -> rightmost {
      // Memory position of number of nodes in Merkle proof.
      let treeHeight := TransactionProof.merkleProof.length(transactionProof)

      // Memory position of Merkle branch.
      let branchStartPosition := TransactionProof.merkleProof.position(transactionProof)
  
      // Memory position of transaction index (which indicates left or right sibling at each depth).
      let transactionIndex := TransactionProof.transactionIndex(transactionProof)

      // Check bound on Merkle tree height, this is currently unreachable (checks here for formal verification).
      require(
        lt(
          treeHeight,
          256
        ),
        0x2e
      )

      // Temporary computed hash pointer.
      let computedHash := computeTransactionLeafHash(transactionProof)

      // Does this merkle derivation ever touch the left leaf.
      let leftish := 0x00

      // Iterate through Merkle proof depths.
      // https://crypto.stackexchange.com/questions/31871/what-is-the-canonical-way-of-creating-merkle-tree-branches.
      for { let depth := 0 } lt(depth, treeHeight) { depth := safeAdd(depth, 1) } {
        // Position of the sibling hash value
        let siblingHash := mload(
          safeAdd(
            branchStartPosition, 
            safeMul(
              depth,
              32
            )
          )
        )

        // Determine proof direction (intuitively: bit value at depth).
        switch eq(mod(transactionIndex, 2), 0)

        // Direction is left branch.
        case 1 {
            mstore(mul32(1), computedHash)
            mstore(mul32(2), siblingHash)

            // This proof touches left
            leftish := 0x01
        }

        // Direction is right branch.
        case 0 {
            mstore(mul32(1), siblingHash)
            mstore(mul32(2), computedHash)
        }

        // Direction is invalid.
        default {
          revert(0, 0)
        }

        // Compute parent node hash value.
        computedHash := computeInnerNodeHash(mul32(1))

        // Shift transaction index right by 1 so that depth is always at lowest bit.
        transactionIndex := shr(1, transactionIndex)
      }

      // If no leftish branches, we know it's a rightmost leaf.
      rightmost := eq(leftish, 0x00)

      // Computed Merkle tree root must match provided Merkle tree root.
      require(
        eq(
          computedHash,
          TransactionProof.merkleTreeRoot(transactionProof)
        ),
        0x2f
      )
    }
  
    // Produced from the Funnel.yulp contract.
    
    
    

    // The Fixed create2 32 byte salt.
    

    /// @notice This will create a Deposit funnel.
    /// @param The receipient address of this funnel.
    function createFunnel(recipient) -> addr {
      // Calculate the funnel address.
      addr := calculateFunnelAddress(recipient)

      // If the Funnel does not exist.
      if eq(extcodesize(addr), 0) {
        mstore(0,
          0x6062600d60003960626000f3fe60006020603582393381511415603357608036) mstore(add(0,32),
          0x14156030573681823780816044603c8485515af11515602f578081fd5b5b33ff) mstore(add(0,64),
          0x5b50000000000000000000000000000000000000000000000000000000000000)
        mstore(66, address())
        mstore(98, recipient)
        addr := create2(0, 0, 130, 0xa46ff7e2eb85eecf4646f2c151221bcd9c079a3dcb63cb87962413cfaae53947)
      }
    }

    /// @notice Calculate the deterministic funnel address based upon the Fuel receipient address of this Deposit.
    /// @param The receipient address of this funnel.
    /// @return The address of the funnel for the recipient.
    function calculateFunnelAddress(recipient) -> addr {
      // Build the Funnel contructor params.
      mstore(0,
        0x6062600d60003960626000f3fe60006020603582393381511415603357608036) mstore(add(0,32),
        0x14156030573681823780816044603c8485515af11515602f578081fd5b5b33ff) mstore(add(0,64),
        0x5b50000000000000000000000000000000000000000000000000000000000000)
      mstore(66, address())
      mstore(98, recipient)

      // Build the Funnel create2 prefix.
      mstore(53, keccak256(0, 130))
      mstore8(0, 0xff)
      mstore(1, shl(96, address()))
      mstore(21, 0xa46ff7e2eb85eecf4646f2c151221bcd9c079a3dcb63cb87962413cfaae53947)

      // Create the Funnel create2 deterministic address from the derived hash.
      addr := shr(96, shl(96, keccak256(0, 85)))
    }
  
    /// @dev the Deposit struct, with the owner non-tight packed, abi.encode.
    

    /// @notice Get deposit at key.
    /// @return Amount of tokens as uint256.
    function depositAt(owner, token, blockNumber) -> amount {
      amount := sload(
        mappingKey3(
          4,
          owner,
          token,
          blockNumber
        )
      )
    }

    /// @notice Handle token deposit.
    function deposit(owner, token) {
      // Get token ID (0 for ETH).
      // If token has not yet been deposited, a new token ID will be assigned.
      let _tokenId := commitToken(token)

      // Build create2 deposit funnel contract.
      let funnel := createFunnel(owner)

      // Variables.
      let amount := 0

      // Handle different tokens.
      switch token

      // If ETH.
      case 0 {
          // Check the Ether balance of the funnel.
          amount := balance(funnel)

          // Check the amount within the funnel is greater than zero.
          require(gt(amount, 0), 0x30)

          // Make the funnel transaction.
          require(call(gas(), funnel, 0, 0, 0, 0, 0), 0x31)

          // Check the balance of the funnel is zero (i.e. all funds have moved to Fuel).
          require(eq(balance(funnel), 0), 0x32)
      }

      // If ERC-20.
      default {
        // Check to ensure no Ether in funnel. 
        require(or(iszero(balance(funnel)), eq(token, 0)), 0x33)

        // Check balance of the funnel contract.
        mstore(0, 0x70a08231) mstore(add(0,32), funnel)
        require(call(gas(), token, 0, 28, 36, 0, 32), 0x34)
        amount := mload(0)
        require(gt(amount, 0), 0x35)

        // Do the transfer with the proxy funnel contract.
        mstore(0, token) mstore(add(0,32), 0xa9059cbb) mstore(add(0,64), address()) mstore(add(0,96), amount)
        require(call(gas(), funnel, 0, 0, 128, 0, 0), 0x36)

        // Check the balance of the funnel to ensure tokens have moved Fuel successfully.
        mstore(0, 0x70a08231) mstore(add(0,32), funnel)
        require(call(gas(), token, 0, 28, 36, 0, 32), 0x34)
        require(iszero(mload(0)), 0x37)
      }

      // Load current balance from storage.
      // Deposits are uniquely identified by owner, token, and Ethereum block numbers, so a second deposit in the same block will simply update a single deposit object.
      let balanceAmount := depositAt(owner, _tokenId, number())

      // Extra check.
      require(eq(balanceAmount, 0), 0x38)
  
      // Store the balance amount.
      sstore(
        mappingKey3(
          4,
          owner,
          _tokenId,
          number()
        ),
        amount
      )

      /// @dev The DepositMade event.
      mstore(0, amount)
      log3(
        0,
        mul32(1),
        0x5dee5732ff6c20f2db5d2eb497dbb3cfc9bf1126f758a758efc772793b1639bf,
        owner,
        _tokenId
      )
    }
  
    /// @notice Verify a witness proof.
    /// @param transactionProof Position in memory of transaction proof.
    function verifyWitness(transactionProof) {
      // Transaction Input Proof is gathered from the inputsProof property itself.
      let inputProofs := TransactionProof.inputProofs.position(transactionProof)

      // Here we verify that the first proof is aligned to the data provided in the transaction proof.
      verifyData(transactionProof, inputProofs, 1)

      // Select the position in memory of the first input.
      let input := TransactionLeaf.inputs.position(
        TransactionProof.transaction.position(transactionProof)
      )

      // Select the witness of the first input.
      let witness := TransactionProof.witness(
        transactionProof,
        Input.witnessReference(input)
      )

      // Switch based upon input type.
      switch Input.type(input)

      // Transfer: recovered address must match input owner.
      case 0 {
        require(
          recoveredWitnessEq(
            UTXO.owner(inputProofs),
            recoverFromWitness(witness, transactionProof)
          ),
          0x39
        )
      }

      // Deposit: recovered address must match input owner.
      case 1 {
        require(
          recoveredWitnessEq(
            Deposit.owner(inputProofs),
            recoverFromWitness(witness, transactionProof)
          ),
          0x3a
        )
      }

      // Transfer: recovered address must match input owner.
      case 2 {
        // Default to the owner.
        let _owner := UTXO.owner(inputProofs)

        // If the htlc is expired use the return owner.
        if gte(
            TransactionProof.blockNumber(transactionProof),
            UTXO.expiry(inputProofs)
          ) {
          // Use the return owner.
          _owner := UTXO.returnOwner(inputProofs)
        }

        // Ensure the HTLC witness is correct.
        require(
          recoveredWitnessEq(
            _owner,
            recoverFromWitness(witness, transactionProof)
          ),
          0x3b
        )
      }

      // Root: recovered address must match block producer of input.
      case 3 {
        // Now select the block producer from the proof.
        require(
          recoveredWitnessEq(
            TransactionProof.blockProducer(inputProofs),
            recoverFromWitness(witness, transactionProof)
          ),
          0x3c
        )
      }

      // Revert if an invalid type is presented (handle this in proveInvalidTransaction).
      default {
        require(
          0,
          0x3d
        )
      }
    }
  
    /// @notice Verify a transaction proof.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param assertFinalized Enum flag. 0: Assert finalized. 1: Assert not finalized. 2: No assert.
    function verifyTransactionProof(transactionProof, assertFinalized) {
      // Verify the block header.
      verifyHeader(
        TransactionProof.block(transactionProof),
        TransactionProof.root(transactionProof),
        TransactionProof.rootIndex(transactionProof),
        assertFinalized
      )

      // Verify the Merkle inclusion proof (will revert if invalid). We pop leftish return off.
      pop(verifyMerkleProof(transactionProof))

      // Transaction must be at least one byte long.
      require(
        gte(
          TransactionProof.transaction.length(transactionProof),
          44
        ),
        0x3e
      )

      // Require this is a valid index selection (i.e. 0 - 7)
      requireIndexValid(
        TransactionProof.inputOutputIndex(transactionProof)
      )

      // Assert fee token signed over is the fee in the root.
      require(
        eq(
          TransactionProof.signatureFeeToken(transactionProof),
          TransactionProof.feeToken(transactionProof)
        ),
        0x3f
      )

      // Assert fee signed over is the fee in the root.
      require(
        eq(
          TransactionProof.signatureFee(transactionProof),
          TransactionProof.fee(transactionProof)
        ),
        0x40
      )
    }
  
    /// @dev Fraud finalization period. Mitigates miner frontrunning of fraud proofs.
    

    /// @notice This will commit a fraud hash in storage.
    /// @param fraudHash The fraud commitment hash (i.e. the hash of the calldata used for this fraud claim).
    function commitFraudHash(fraudHash) {
      // Store the caller and fraud hash.
      sstore(
        mappingKey2(
          11,
          caller(),
          fraudHash
        ),
        number()
      )
    }

    /// @notice Ensure that the calldata provided matches the fraud commitment hash.
    function requireValidFraudCommitment() {
      // Compute the fraud hash from calldata.
      let fraudHash := keccak256(1024, calldatasize())

      // Get the fraud commitment from block storage.
      let commitmentBlockNumber := sload(
        mappingKey2(
          11,
          caller(),
          fraudHash
        )
      )

      // Check the fraud commitment exists.
      require(
        gt(
          commitmentBlockNumber,
          0
        ),
        0x41
      )

      // Require that current block number >= commitment block number + period.
      require(
        gte(
          number(),
          safeAdd(commitmentBlockNumber, 10)
        ),
        0x42
      )

      // Remove the FraudCommitment from storage for 10k gas refund.
      sstore(
        mappingKey2(
          11,
          caller(),
          fraudHash
        ),
        0
      )
    }

    /// @notice Either assertion must pass or process fraud proof.
    function assertOrFraud(assertion, fraudCode, block) {
      // Assert or begin fraud state change sequence.
      if lt(assertion, 1) {
        // Fraud block details
        let fraudBlockHeight := BlockHeader.height(block)
        let fraudBlockProducer := BlockHeader.producer(block)

        // Fraud block must not be the genesis rollup block.
        require(
          gt(
            fraudBlockHeight,
            0
          ),
          0x43
        )

        // Copy constructor args to memory.
        Constructor.copy(0)
        let bondSize := Constructor.bondSize(0)
        let penaltyDelay := Constructor.penaltyDelay(0)

        // Fraud block must not be finalizable yet.
        require(
          lt(
            number(),
            safeAdd(
              BlockHeader.blockNumber(block),
              Constructor.finalizationDelay(0)
            )
          ),
          0x1f
        )

        // Log block tips (old / new).
        log4(
          0,
          0,
          0x62a5229d18b497dceab57b82a66fb912a8139b88c6b7979ad25772dc9d28ddbd,
          blockTip(),
          safeSub(fraudBlockHeight, 1),
          fraudCode
        )

        // Roll back rollup chain: set new block tip to before fraud block.
        sstore(6, safeSub(fraudBlockHeight, 1))

        // Remove block commitment from the contract for extra 10k gas refund.
        sstore(
          mappingKey(
            1,
            fraudBlockHeight
          ),
          0
        )

        // Set the penalty as an offset from current Ethereum block number.
        // This removes mempool submission delay requirements for everyone and operator priority.
        setPenalty(penaltyDelay)

        // Transfer half the bond for this block.
        transfer(safeDiv(bondSize, 2), 0, caller())

        // Stop execution from here.
        stop()
      }
    }
  
    /// @notice Prove a double spend happened.
    /// @param transactionProofA Position in memory of proof of UTXO being spent once.
    /// @param transactionProofB Position in memory of proof of UTXO being spent again.
    function proveDoubleSpend(transactionProofA, transactionProofB) {
      // Verify both transaction proofs.
      verifyTransactionProof(transactionProofA, 2)
      verifyTransactionProof(transactionProofB, 0)

       // Inputs must be different i.e. unique, their input metadata ID's will determine this.
      require(
        neq(
          inputMetadata(transactionProofA),
          inputMetadata(transactionProofB)
        ),
        0x44
      )

      // Get hash of referenced metadata and input inner data of selected input.
      mstore(0,
        inputReferencedMetadata(transactionProofA)
      ) mstore(add(0,32),
        inputInnerData(transactionProofA)
      )
      let hashA := keccak256(0, 64)

      // Get hash of referenced metadata and input inner data of selected input.
      mstore(0,
        inputReferencedMetadata(transactionProofB)
      ) mstore(add(0,32),
        inputInnerData(transactionProofB)
      )
      let hashB := keccak256(0, 64)

      // Hashes must be different, otherwise a double spend happened.
      assertOrFraud(
        neq(
          hashA,
          hashB
        ),
        0x45,
        transactionProofB
      )
    }
  
    /// @notice Helper: compute Merkle root of list of transactions.
    /// @param transactions Position in memory to list of transactions.
    /// @param transactionsLength The length of the transactions blob.
    /// @param fraudBlock The number of the alleged fraudulant block.
    /// @return Merkle root as bytes32.
    function computeMerkleTreeRoot(transactions, transactionsLength, fraudBlock) -> merkleTreeRoot {
      // Initialize memory position to position of start of transaction list.
      let memoryPosition := transactions

      // Holds computed hashes.
      let freshMemoryPosition := safeAdd(calldata.offset(), 64)

      // Set the transaction index at zero to start.
      let transactionIndex := 0

      // Loop through each transaction (leaf in Merkle tree) and hash it.
      for {} lt(memoryPosition, safeAdd(transactions, transactionsLength)) {} {
        // Extract length of current transaction.
        let len := safeAdd(mslice(memoryPosition, 2), 2)

        // Transaction length must be above minimum.
        assertOrFraud(
          gte(
            len,
            44
          ),
          0x46,
          fraudBlock
        )

        // Transaction length must be below maximum.
        assertOrFraud(
          lte(
            len,
            896
          ),
          0x47,
          fraudBlock
        )

        // Computed length must not be greater than provided payload.
        assertOrFraud(
          lte(
            safeSub(
              memoryPosition,
              transactions
            ),
            transactionsLength
          ),
          0x48,
          fraudBlock
        )

        // Compute leaf hash and save it in memory.
        mstore(freshMemoryPosition, computeLeafHash(memoryPosition, len))

        // Increment memory position to point to next transaction.
        memoryPosition := safeAdd(memoryPosition, len)

        // Increment computed hashes memory position by 32 bytes.
        freshMemoryPosition := safeAdd(freshMemoryPosition, 32)

        // Increase the transaction index.
        transactionIndex := safeAdd(transactionIndex, 1)

        // Number of transactions in list of transactions must not exceed max allowed.
        assertOrFraud(
          lt(
            transactionIndex,
            2048
          ),
          0x49,
          fraudBlock
        )
      }

      // Compute the balanced binary merkle tree width.
      let treeWidth := merkleTreeWidth(transactionIndex)

      // Compute the empty transaciton leaf hash.
      let emtpyLeafHash := computeEmptyTransactionLeafHash()

      // Produce the zero value leafs to complete the balanced merkle tree.
      for { let i := 0 } lt(i, safeSub(treeWidth, transactionIndex)) { i := safeAdd(i, 1) } {
        // Store the empty leaf hash.
        mstore(freshMemoryPosition, emtpyLeafHash)

        // Set the new memory position.
        freshMemoryPosition := safeAdd(freshMemoryPosition, 32)
      }

      // Compute necessary zero leaf hashes.
      transactionIndex := treeWidth

      // Total transaction list length must match provided length.
      assertOrFraud(
        eq(
          memoryPosition,
          safeAdd(
            transactions,
            transactionsLength
          )
        ),
        0x48,
        fraudBlock
      )

      //////////////////////////////////
      // Now Merkleize nodes into a binary Merkle tree.
      //////////////////////////////////

      // Move to a new memory position.
      memoryPosition := safeSub(freshMemoryPosition, safeMul(transactionIndex, 32))

      // Loop through tree Heights (starting at base).
      for {} gt(transactionIndex, 0) {} {
        // Go through each of the hashes at this depth. 
        for { let i := 0 } lt(i, transactionIndex) { i := safeAdd(i, 2) } {
          // loop through child hashes at this height.
          mstore(freshMemoryPosition, computeInnerNodeHash(safeAdd(memoryPosition, safeMul(i, 32))))

          // hash two children together.
          freshMemoryPosition := safeAdd(freshMemoryPosition, 32) // increase fresh memory past new child hash.
        }

        // Set new memory position.
        memoryPosition := safeSub(freshMemoryPosition, safeMul(transactionIndex, 16))

        // Half nodes (i.e. next height).
        transactionIndex := safeDiv(transactionIndex, 2)

        // Shim 1 to zero (stop), i.e. top height end..
        if lt(transactionIndex, 2) {
          transactionIndex := 0
        }
      }

      // Merkle root has been computed.
      merkleTreeRoot := mload(memoryPosition)
    }

    /// @notice Prove a block is malformed: a root does not correctly commit to a list of transactions.
    /// @param block The block header memory position.
    /// @param root The root header memory position.
    /// @param rootIndex The root index of the fraudulant block of transactions.
    /// @param transactions  Position in memory to list of transactions committed to in root.
    /// @param transactionsLength Length of transactions list in bytes.
    function proveMalformedBlock(block, root, rootIndex, transactions, transactionsLength) {
      // Verify the header proofs.
      verifyHeader(
        block,
        root,
        rootIndex,
        0
      )

      // Require that commitment hash is the hash of transaction provided.
      require(
        eq(
          RootHeader.commitmentHash(root),
          keccak256(transactions, transactionsLength)
        ),
        0x4a
      )

      // Generate the merkle root and num transactions count.
      let merkleTreeRoot := computeMerkleTreeRoot(
        transactions,
        transactionsLength,
        block
      )

      // Computed Merkle root of transactions must match commtted Merkle root.
      assertOrFraud(
        eq(
          RootHeader.merkleTreeRoot(root),
          merkleTreeRoot
        ),
        0x4b,
        block
      )
    }
  
    /// @notice Helper: prove transaction proof index is not fraudulant.
    /// @param metadata Position in memory of metadata object (a metadata).
    /// @param transactionProof Position in memory of transaction proof.
    function proveTransactionIndex(metadata, transactionProof) {
      // If the block height and root index is the current.
      switch and(
        eq(Metadata.blockHeight(metadata), TransactionProof.blockHeight(transactionProof)),
        eq(Metadata.rootIndex(metadata), TransactionProof.rootIndex(transactionProof))
      )
      case 1 {
        // Root index overflow max now set to current Transaction index.
        assertOrFraud(
          lt(
            Metadata.transactionIndex(metadata),
            TransactionProof.transactionIndex(transactionProof)
          ),
          0x4c,
          transactionProof
        )
      }
      case 0 {
        // Overflow is the max transaction index (further overflow enforced in invalidInput).
        assertOrFraud(
          lt(
            Metadata.transactionIndex(metadata),
            2048
          ),
          0x4c,
          transactionProof
        )
      }
    }

    /// @notice Helper: prove metadata is invalid.
    /// @param leaf Position in memory of leaf object (a transaction).
    /// @param transactionProof Position in memory of transaction proof.
    function proveMetadata(leaf, transactionProof) {
      // Position in memory to inputs in leaf.
      let pos := TransactionLeaf.inputs.position(leaf)
      let end := TransactionLeaf.inputs.offset(leaf)

      // Position in memory of metadata in leaf.
      let metadata := TransactionLeaf.metadata.position(leaf)

      // Loop over inputs in leaf.
      for {} lt(pos, end) {} {
        // Switch based upon the input type.
        switch Input.type(pos)

        // For Deposit inputs.
        case 1 {
          // Ethereum block number of deposit must be positive and non-zero.
          assertOrFraud(
            gt(
              MetadataDeposit.blockNumber(metadata),
              0
            ),
            0x4d,
            transactionProof
          )

          // Transaction must spend deposit at least one block after it was made.
          assertOrFraud(
            lt(
              MetadataDeposit.blockNumber(metadata),
              TransactionProof.blockNumber(transactionProof)
            ),
            0x4e,
            transactionProof
          )

          // Token ID of deposit must be bounded by block's number of registered tokens.
          assertOrFraud(
            lt(
              MetadataDeposit.token(metadata),
              TransactionProof.numTokens(transactionProof)
            ),
            0x4f,
            transactionProof
          )
        }

        // For all other input types.
        default {
          // Block height must be past genesis block.
          assertOrFraud(
            gt(
              Metadata.blockHeight(metadata),
              0
            ),
            0x50,
            transactionProof
          )

          // Output must be created before it was spent (can be spent in the same block).
          assertOrFraud(
            lte(
              Metadata.blockHeight(metadata),
              TransactionProof.blockHeight(transactionProof)
            ),
            0x51,
            transactionProof
          )

          // If metadata is referencing current block.
          switch eq(
            Metadata.blockHeight(metadata),
            TransactionProof.blockHeight(transactionProof)
          )
          case 1 {
            // Overflow is now the current root index.
            assertOrFraud(
              lte(
                Metadata.rootIndex(metadata),
                TransactionProof.rootIndex(transactionProof)
              ),
              0x52,
              transactionProof
            )
          }
          case 0 {
            // Overflow is the max root index (further overflow enforced in invalidInput).
            assertOrFraud(
              lt(
                Metadata.rootIndex(metadata),
                128
              ),
              0x52,
              transactionProof
            )
          }

          // Prove correctness of transaction proof index.
          proveTransactionIndex(metadata, transactionProof)

          assertOrFraud(
            lt(
              Metadata.outputIndex(metadata),
              8
            ),
            0x53,
            transactionProof
          )

          // Root input must always select tx and output index 0, in an older block.
          if eq(Input.type(pos), 3) {
            assertOrFraud(
              lt(
                Metadata.blockHeight(metadata),
                TransactionProof.blockHeight(transactionProof)
              ),
              0x54,
              transactionProof
            )

            // When referenceing a root, the transaction index must be zero.
            assertOrFraud(
              eq(
                Metadata.transactionIndex(metadata),
                0
              ),
              0x55,
              transactionProof
            )

            // When referencing a root, the output index must be zero.
            assertOrFraud(
              eq(
                Metadata.outputIndex(metadata),
                0
              ),
              0x56,
              transactionProof
            )
          }
        }

        // Increase the input memory selection position.
        pos := safeAdd(pos, inputSize(pos))

        // Increase the metadata memory selection position by fixed metadata size (bytes).
        metadata := safeAdd(metadata, 8)
      }

      // Actual metadata length must match claimed length in leaf.
      assertOrFraud(
        eq(
          metadata,
          TransactionLeaf.metadata.offset(leaf)
        ),
        0x57,
        transactionProof
      )
    }

    /// @notice Helper: prove witnesses are invalid.
    /// @param leaf Position in memory of leaf object (a transaction).
    /// @param transactionProof Position in memory of transaction proof.
    function proveWitnesses(leaf, transactionProof) {
      // Starting pointers.
      let pos := TransactionLeaf.witnesses.position(leaf)
      let end := TransactionLeaf.witnesses.offset(leaf)
      let index := 0

      // Go through each witness.
      for {} lt(pos, end) {} {
        // Check the signature type is from 0 - 2 (i.e. less than 3).
        assertOrFraud(
          lt(
            Signature.type(pos),
            3
          ),
          0x2d,
          transactionProof
        )

        // Check cases per signature type.
        switch Signature.type(pos)

        // If the witness type is a signature.
        case 0 {}

        // If the witness type is a Caller.
        case 1 {
          // Ensure that the blockNumber referenced with this caller is
          // less than the blockNumber of the transaction it's referenced in.
          assertOrFraud(
            lt(
              Caller.blockNumber(pos),
              TransactionProof.blockNumber(transactionProof)
            ),
            0x58,
            transactionProof
          )

          // Get the witness at the memory position, and the blockNumber in state.
          let stateWitness := witnessAt(
            Caller.owner(pos),
            Caller.blockNumber(pos)
          )

          // Check that there is a committed witness in storage with these peices of data.
          assertOrFraud(
            gt(
              stateWitness,
              0
            ),
            0x59,
            transactionProof
          )
        }

        // Do nothing for the producer.
        case 2 {}

        // Increase the witness memory index by the correct witness size.
        pos := safeAdd(pos, witnessSize(pos))

        // Increase the witness index.
        index := safeAdd(index, 1)

        // If the witness index is greater than the INPUTS_MAX.
        assertOrFraud(
          lte(
            index,
            8
          ),
          0x5a,
          transactionProof
        )
      }

      // Check if the witness size in bytes mismatches end.
      assertOrFraud(
        eq(pos, end),
        0x5b,
        transactionProof
      )
    }

    /// @notice Helper: prove sizes are invalid.
    /// @param leaf Position in memory of leaf object (a transaction).
    /// @param transactionProof Position in memory of transaction proof.
    function proveSizes(leaf, transactionProof) {
      let metadataSize := TransactionLeaf.metadata.length(leaf)
      let inputsSize := inputsLength(leaf)

      // Ensure the length of inputs matches the provided metadata.
      assertOrFraud(
        eq(
          metadataSize,
          inputsSize
        ),
        0x5c,
        transactionProof
      )
    }

    /// @notice Helper: prove output value is invalid.
    /// @param pos Position in memory of leaf outputs object.
    /// @param transactionProof Position in memory of transaction proof.
    function proveOutputValue(pos, transactionProof) {
      let _numTokens := TransactionProof.numTokens(transactionProof)

      // Enforce outputs token length underflow.
      assertOrFraud(
        gt(
          Output.token.length(pos),
          0
        ),
        0x5d,
        transactionProof
      )

      // Enforce outputs token length overflow.
      assertOrFraud(
        lte(
          Output.token.length(pos),
          4
        ),
        0x5e,
        transactionProof
      )

      // Enforce outputs token id overflow.
      assertOrFraud(
        lt(
          Output.token.slice(pos),
          _numTokens
        ),
        0x5f,
        transactionProof
      )

      // Enforce amount shift overflow.
      assertOrFraud(
        lt(
          Output.amount.shift(pos),
          256
        ),
        0x60,
        transactionProof
      )

      // Enforce output amount underflow.
      assertOrFraud(
        gt(
          Output.amount.length(pos),
          0
        ),
        0x61,
        transactionProof
      )

      // Enforce outputs amount length overflow.
      assertOrFraud(
        lte(
          Output.amount.length(pos),
          32
        ),
        0x62,
        transactionProof
      )

      // Enforce output shift mod (i.e. multiples of 8 b/c bits).
      assertOrFraud(
        eq(
          mod(
            Output.amount.shift(pos),
            8
          ),
          0
        ),
        0x63,
        transactionProof
      )

      // Calculate amount length in bits.
      let amountLen := safeAdd(Output.amount.shift(pos),
        safeMul(Output.amount.length(pos), 8))

      // Enforce amount length overflow in bits.
      assertOrFraud(
        lte(
          amountLen,
          256
        ),
        0x62,
        transactionProof
      )
    }

    /// @notice Helper: prove output owner is invalid.
    /// @param pos Position in memory of leaf outputs object.
    /// @param transactionProof Position in memory of transaction proof.
    function proveOutputOwner(pos, transactionProof) {
      let _numAddresses := TransactionProof.numAddresses(transactionProof)

      // Enforce owner length underflow.
      assertOrFraud(
        gt(
          Output.owner.length(pos),
          0
        ),
        0x64,
        transactionProof
      )

      // Enforce output owner overflow.
      assertOrFraud(
        lte(
          Output.owner.length(pos),
          20
        ),
        0x65,
        transactionProof
      )

      // Enforce owner ID is less than num addresses.
      if lt(Output.owner.length(pos), 20) {
        assertOrFraud(
          lt(
            Output.owner.slice(pos),
            _numAddresses
          ),
          0x66,
          transactionProof
        )
      }
    }

    /// @notice Helper: prove HTLC output return owner is invalid.
    /// @param pos Position in memory of leaf outputs object.
    /// @param transactionProof Position in memory of transaction proof.
    function proveOutputReturnOwner(pos, transactionProof) {
      let _numAddresses := TransactionProof.numAddresses(transactionProof)

      // Enforce return owner underflow.
      assertOrFraud(
        gt(
          OutputHTLC.returnOwner.length(pos),
          0
        ),
        0x67,
        transactionProof
      )

      // Enforce return owner length overflow (20 or less).
      assertOrFraud(
        lte(
          OutputHTLC.returnOwner.length(pos),
          20
        ),
        0x68,
        transactionProof
      )

      // Enforce return owner length.
      if lt(OutputHTLC.returnOwner.length(pos), 20) {
        assertOrFraud(
          lt(
            OutputHTLC.returnOwner.slice(pos),
            _numAddresses
          ),
          0x69,
          transactionProof
        )
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

      // Go through each output.
      for {} lt(pos, end) {} {
        switch Output.type(pos)

        // Enforce transfer value and owner.
        case 0 {
          proveOutputValue(pos, transactionProof)
          proveOutputOwner(pos, transactionProof)
        }

        // Enforce the withraw value and owner.
        case 1 {
          proveOutputValue(pos, transactionProof)
          proveOutputOwner(pos, transactionProof)
        }

        // Enforce the HTLC structure and value.
        case 2 {
          proveOutputValue(pos, transactionProof)
          proveOutputOwner(pos, transactionProof)
          proveOutputReturnOwner(pos, transactionProof)
        }

        case 3 {
          // Ensure output return data underflow is enforced.
          assertOrFraud(
            gt(
              OutputReturn.data.length(pos),
              0
            ),
            0x6a,
            transactionProof
          )

          // Ensure output return data max is enforced.
          assertOrFraud(
            lte(
              OutputReturn.data.length(pos),
              512
            ),
            0x6b,
            transactionProof
          )
        }

        // Ensure invalid output types are caught.
        default {
          assertOrFraud(
            0,
            0x6c,
            transactionProof
          )
        }

        // Increase position by the output size.
        pos := safeAdd(pos, outputSize(pos))
        index := safeAdd(index, 1)

        // Ensure the index is less than or max.
        assertOrFraud(
          lte( // <-- this is fine, after index increase.
            index,
            8
          ),
          0x6d,
          transactionProof
        )
      }

      // Output size is correct.
      assertOrFraud(
        eq(
          pos,
          end
        ),
        0x6e,
        transactionProof
      )
    }

    /// @notice Helper: prove inputs are invalid.
    /// @param leaf Position in memory of leaf object (a transaction).
    /// @param transactionProof Position in memory of transaction proof.
    function proveInputs(leaf, transactionProof) {
      // Grab the length, position / ending memory position and starting index.
      let witnessLength := witnessesLength(leaf)
      let pos := TransactionLeaf.inputs.position(leaf)
      let end := TransactionLeaf.inputs.offset(leaf)
      let index := 0

      // Scan through the inputs.
      for {} lt(pos, end) {} {
        // Ensure the input type is less than 4.
        assertOrFraud(
          lt(
            Input.type(pos),
            4
          ),
          0x6f,
          transactionProof
        )

        // Ensure the witness is less than the witnesses length.
        assertOrFraud(
          lt(
            Input.witnessReference(pos),
            witnessLength
          ),
          0x70,
          transactionProof
        )

        // Increase the memory position.
        pos := safeAdd(pos, inputSize(pos))

        // Increase the index.
        index := safeAdd(index, 1)
      }

      // Check for index overflow.
      assertOrFraud(
        lte(
          index,
          8
        ),
        0x71,
        transactionProof
      )

      // Check for inputs memory bytes size mismatch.
      assertOrFraud(
        eq(
          pos,
          end
        ),
        0x72,
        transactionProof
      )
    }

    /// @notice Prove that a transaction was invalid.
    /// @param transactionProof Position in memory of transaction proof.
    function proveInvalidTransaction(transactionProof) {
      // Verify transaction inclusion proof.
      verifyTransactionProof(transactionProof, 0)

      // We grab the transaciton position and metadata size first.
      let leaf := TransactionProof.transaction.position(transactionProof)

      // A reused pointer for sizes.
      let size := TransactionLeaf.metadata.length(leaf)

      // Check the metadata size under/overflow.
      assertOrFraud(
        gt(
          size,
          0
        ),
        0x73,
        transactionProof
      )

      // Enforce size is less than inputs max.
      assertOrFraud(
        lte(
          size,
          8
        ),
        0x57,
        transactionProof
      )

      // Set the witness lenth (bytes).
      size := TransactionLeaf.witnesses.length(leaf)

      // Check witness size under/overflow.
      assertOrFraud(
        gt(
          size,
          0
        ),
        0x74,
        transactionProof
      )
      assertOrFraud(
        lte(
          size,
          896
        ),
        0x5b,
        transactionProof
      )

      // Point to inputs length (bytes).
      size := TransactionLeaf.inputs.length(leaf)

      // Check the inputs size under/overflow.
      assertOrFraud(
        gte(
          size,
          2
        ),
        0x75,
        transactionProof
      )
      assertOrFraud(
        lte(
          size,
          896
        ),
        0x76,
        transactionProof
      )

      // Set size pointer to outputs.
      size := TransactionLeaf.outputs.length(leaf)

      // Check the output size (bytes) over/underflow.
      assertOrFraud(
        gte(
          size,
          3
        ),
        0x77,
        transactionProof
      )
      assertOrFraud(
        lte(
          size,
          896
        ),
        0x78,
        transactionProof
      )

      // Point to the size of the tx leaf in total (bytes).
      size := TransactionLeaf.size(leaf)

      // Check the transaction size over/underflow.
      assertOrFraud(
        gte(
          size,
          44
        ),
        0x79,
        transactionProof
      )

      // Ensure the size of the transaction is less than or max.
      assertOrFraud(
        lte(
          size,
          896
        ),
        0x7a,
        transactionProof
      )

      // Ensure the size accounts for the transaction leaf size plus 2 bytes for length.
      assertOrFraud(
        eq(
          size,
          safeAdd(TransactionLeaf.length(leaf), 2)
        ),
        0x7b,
        transactionProof
      )

      // Prove data structure correctness, first witnesses, then inputs, then outputs, then general sizes then metadata.
      proveWitnesses(leaf, transactionProof)
      proveInputs(leaf, transactionProof)
      proveOutputs(leaf, transactionProof)
      proveSizes(leaf, transactionProof)
      proveMetadata(leaf, transactionProof)
    }
  
    /// @notice Prove that an input is invalid.
    /// @param inputProof Position in memory of input proof.
    /// @param transactionProof Position in memory of transaction proof.
    function proveInvalidInput(inputProof, transactionProof) {
      // Verify transaction inclusion proof.
      verifyTransactionProof(transactionProof, 0)

      // Position in memory of input from transaction proof.
      let input := selectInput(transactionProof)

      // Position in memory of metadata from transaction proof.
      let metadata := selectMetadata(
        transactionProof, 
        TransactionProof.inputOutputIndex(transactionProof)
      )

      // Special case: handle Deposit input.
      if eq(Input.type(input), 1) {
        // Retrieve amount for deposit ID in proof from storage.
        let depositAmount := depositAt(
          InputDeposit.owner(input),
          MetadataDeposit.token(metadata),
          MetadataDeposit.blockNumber(metadata)
        )

        // Amount in deposit must be positive and non-zero.
        assertOrFraud(
          gt(
            depositAmount,
            0
          ),
          0x7c,
          transactionProof
        )

        // We stop the sequence here.
        stop()
      }

      // Verify the proof.
      verifyHeader(
        TransactionProof.block(inputProof),
        TransactionProof.root(inputProof),
        TransactionProof.rootIndex(inputProof),
        2
      )

      // Check that block height in input proof matches block height in transaction proof.
      require(
        eq(
          Metadata.blockHeight(metadata),
          TransactionProof.blockHeight(inputProof)
        ),
        0x7d
      )

      // Root index in input proof must be bounded by number of roots in transaction proof.
      assertOrFraud(
        lt(
          Metadata.rootIndex(metadata),
          TransactionProof.roots.length(inputProof)
        ),
        0x7e,
        transactionProof
      )

      // Check that root index in input proof matches root index in transaction proof.
      require(
        eq(
          Metadata.rootIndex(metadata),
          TransactionProof.rootIndex(inputProof)
        ),
        0x7f
      )

      // Special case: handle Root input.
      // We stop here at the root, as we only need the block / root header for checking fraud.
      if eq(Input.type(input), 3) {
        stop()
      }

      // If rightmost proof that isn't the same index.
      if eq(verifyMerkleProof(inputProof), 0x01) {
        // Here we are checking is the transaction index lte the rightmost index.
        // if it is past the rightmost index its overflowing and is an invalid reference.
        assertOrFraud(
          lte(
            Metadata.transactionIndex(metadata),
            TransactionProof.transactionIndex(inputProof)
          ),
          0x80,
          transactionProof
        )
      }

      // Beyond this point transaction referenced is correct.
      // Check that transaction index in input proof matches transaction index in transaction proof.
      require(
        eq(
          Metadata.transactionIndex(metadata),
          TransactionProof.transactionIndex(inputProof)
        ),
        0x81
      )

      // The length of the transaction in the input proof must be positive and non-zero.
      assertOrFraud(
        gt(
          TransactionProof.transaction.length(inputProof),
          0
        ),
        0x82,
        transactionProof
      )

      // Get position of output from input proof.
      let output := selectOutput(inputProof)

      // Output index in input proof must be bounded by number of outputs in transaction proof.
      assertOrFraud(
        lt(
          Metadata.outputIndex(metadata),
          TransactionProof.outputs.length(inputProof)
        ),
        0x83,
        transactionProof
      )

      // Check that output index in input proof matches with output index in transaction proof.
      require(
        eq(
          Metadata.outputIndex(metadata),
          TransactionProof.inputOutputIndex(inputProof)
        ),
        0x84
      )

      // Output type must not be Withdraw of Return (those outputs can't be spent and are proven elsewhere).
      assertOrFraud(
        neq(
          Output.type(output),
          1
        ),
        0x85,
        transactionProof
      )

      // Input can never reference an output return type.
      assertOrFraud(
        neq(
          Output.type(output),
          3
        ),
        0x86,
        transactionProof
      )

      // Do final checks based on input type.
      switch Input.type(input)

      // No restrictions on spending Transfer outputs, so automatic fraud.
      case 0 {
        assertOrFraud(
          eq(
            Output.type(output),
            0
          ),
          0x87,
          transactionProof
        )
      }

      // Spending HTLC outputs depends on timeout expiry.
      case 2 {
        // Enforce output HTLC is correct.
        assertOrFraud(
          eq(
            Output.type(output),
            2
          ),
          0x88,
          transactionProof
        )

        // If spending transaction is before timeout then:
        // Timeout is using Ethereum block number, not rollup block height.
        if lt(
          TransactionProof.blockNumber(transactionProof),
          OutputHTLC.expiry(output)
        ) {
          // The hash of the preimage in the transaction proof must match the digest in the input proof.
          assertOrFraud(
            eq(
              OutputHTLC.digest(output),
              sha256(InputHTLC.preImage.position(input))
            ),
            0x89,
            transactionProof
          )
        }
      }
    }
  
    /// @notice Verify input proofs.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of input proofs.
    function verifyInputs(transactionProof, inputProofs) {
      // Verify transaction proof.
      verifyTransactionProof(transactionProof, 0)

      // Get positions of leaf and input.
      let leaf := TransactionProof.transaction.position(transactionProof)

      // The position of the first input in this transactions leaf.
      let pos := TransactionLeaf.inputs.position(leaf)

      // The starting input index.
      let index := 0

      // Loop over inputs and verify each input proof.
      for {} lt(pos, TransactionLeaf.inputs.offset(leaf)) {} {
        // Handle each input case.
        switch Input.type(pos)

        // In the case of an Transfer input.
        case 0 {
          // Verify that the provided transaction proof is real, no finality assertion required.
          verifyTransactionProof(inputProofs, 2)

          // Verify proof witness.
          verifyWitness(inputProofs)

          // Ensure alignment between transfer input proof and metadata leaf.
          require(
            eq(
              outputMetadata(inputProofs),
              TransactionLeaf.metadata(leaf, index)
            ),
            0x8a
          )

          // Ensure alignment between provided UTXO
          // hash of proof and provided data.
          require(
            eq(
              TransactionProof.UTXO.keccak256(inputProofs),
              TransactionProof.data(transactionProof, index)
            ),
            0x8b
          )

          // Increase the input proofs memory selector position by the transaction proof size.
          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        // In the case of an Deposit input.
        case 1 {
          // Select the metadata from the transaction proof at the specified input index.
          let metadata := selectMetadata(transactionProof, index)

          // Ensure provided token in the deposit
          // is aligned with the metadata token.
          require(
            eq(
              Deposit.token(inputProofs),
              MetadataDeposit.token(metadata)
            ),
            0x8c
          )

          // Ensure provided blockNumber is aligned
          // with the metadata deposit block number.
          require(
            eq(
              Deposit.blockNumber(inputProofs),
              MetadataDeposit.blockNumber(metadata)
            ),
            0x8d
          )

          // Additional check, ensure deposit value is gt than zero.
          require(
            gt(
              Deposit.amount(inputProofs),
              0
            ),
            0x8e
          )

          // Ensure additional alignment between value
          // and proof provided by the prover.
          require(
            eq(
              Deposit.amount(inputProofs),
              depositAt(
                Deposit.owner(inputProofs),
                Deposit.token(inputProofs),
                Deposit.blockNumber(inputProofs)
              )
            ),
            0x8f
          )

          // Ensure the Deposit hash is equal to the
          // one provided for signature verification.
          require(
            eq(
              Deposit.keccak256(inputProofs),
              TransactionProof.data(transactionProof, index)
            ),
            0x90
          )

          // Increase the input proofs memory selector position by the deposit proof size.
          inputProofs := safeAdd(inputProofs, Deposit.size(inputProofs))
        }

        // In the case of an Root input.
        case 3 {
          // Verify that the provided transaction proof, additional checks.
          verifyTransactionProof(inputProofs, 2)

          // We don't need a witness verification check here, as the BlockHeader and RootHeader are sufficient. 
          // Ensure alignment between the provided root metadata structure and the data selected by this input.
          require(
            eq(
              RootHeader.keccak256(TransactionProof.rootProducer.position(inputProofs)),
              TransactionProof.data(transactionProof, index)
            ),
            0x91
          )

          // Ensure alignment between the metadata ID of the transaction proof
          // and the metadata selected by the transaction.
          require(
            eq(
              outputMetadata(inputProofs),
              TransactionLeaf.metadata(leaf, index)
            ),
            0x92
          )

          // Increase the input proofs memory selector position by the transaction proof size.
          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        // In the case of an HTLC input.
        case 2 {
          // Verify that the provided transaction proof is real, no finality assertion required.
          verifyTransactionProof(inputProofs, 2)

          // Verify proof witness.
          verifyWitness(inputProofs)

          // Ensure alignment between the metadata ID of the transaction proof
          // and the metadata selected by the transaction.
          require(
            eq(
              outputMetadata(inputProofs),
              TransactionLeaf.metadata(leaf, index)
            ),
            0x93
          )

          // Ensure alignment between provided data and provided keccak256 UTXO proof.
          require(
            eq(
              TransactionProof.UTXO.keccak256(inputProofs),
              TransactionProof.data(transactionProof, index)
            ),
            0x94
          )

          // Increase the input proofs memory selector position by the transaction proof size.
          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        // If no valid type revert. This should be handled in proveInvalidTransaction.
        default {
          require(0, 0x3d)
        }

        // Increase the index.
        index := safeAdd(index, 1)

        // Increase the input memory selector position by the input size.
        pos := safeAdd(pos, inputSize(pos))
      }
    }
  
    /// @notice Helper: prove a witness is invalid.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of inputs proofs.
    function proveWitness(transactionProof, inputProofs) {
      // Get position in memory of start of leaf (i.e. transaction).
      let leaf := TransactionProof.transaction.position(transactionProof)

      // Get position in memory of start of transaction inputs.
      let pos := TransactionLeaf.inputs.position(leaf)

      // The position of the input.
      let index := 0

      // Recovered witness
      let recoveredWitness := TransactionProof.input.recoverWitness(transactionProof)

      // Ensure that the recovered witness is not null, null can never be a witness.
      assertOrFraud(
        neq(
          recoveredWitness,
          0
        ),
        0x95,
        transactionProof
      )

      // Loop over inputs. For each input, the recovered account address must match the owner.
      for {} lt(pos, TransactionLeaf.inputs.offset(leaf)) {} {
        // Switch between input types.
        switch Input.type(pos)

        // If the case is an Input type transfer.
        case 0 {
          // Ensue the index is equal to the proof selection index.
          if eq(index, TransactionProof.inputOutputIndex(transactionProof)) {
            // Now check that the owner of the output selected is the correct recovered witness with the transaction proof.
            assertOrFraud(
              ownerEquates(
                selectOutput(inputProofs),
                recoveredWitness
              ),
              0x96,
              transactionProof
            )
          }

          // Increase the inputProofs memory index by the size of the input proof.
          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        // In the case of a deposit input.
        case 1 {
          // Ensure the index is the one selected by the input output index.
          if eq(index, TransactionProof.inputOutputIndex(transactionProof)) {
            assertOrFraud(
              eq(
                InputDeposit.owner(pos),
                recoveredWitness
              ),
              0x97,
              transactionProof
            )
          }

          // Increase the inputProofs memory index by the size of the input proof.
          inputProofs := safeAdd(inputProofs, Deposit.size(inputProofs))
        }

        // In the case of a root input.
        case 3 {
          // Ensure the index is the one selected by the input output index.
          if eq(index, TransactionProof.inputOutputIndex(transactionProof)) {
            assertOrFraud(
              eq(
                TransactionProof.blockProducer(inputProofs),
                recoveredWitness
              ),
              0x98,
              transactionProof
            )
          }

          // Increase the inputProofs memory index by the size of the input proof.
          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        // In the case of an HTLC input.
        case 2 {
          // Ensure the index is the one selected by the input output index.
          if eq(index, TransactionProof.inputOutputIndex(transactionProof)) {
            // Output expired.
            switch outputExpired(inputProofs, transactionProof)

            // In the case the output of the HTLC is expired, we check the return owner.
            case 1 {
              assertOrFraud(
                returnOwnerEquals(
                  selectOutput(inputProofs),
                  recoveredWitness
                ),
                0x99,
                transactionProof
              )
            }

            // In the case the output is not expired, we check the HTLC owner.
            case 0 {
              assertOrFraud(
                ownerEquates(
                  selectOutput(inputProofs),
                  recoveredWitness
                ),
                0x9a,
                transactionProof
              )
            }
          }

          // Increase the inputProofs memory index by the size of the input proof.
          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        // In the case of an invalid type, handle this in proveInvalidTransaction.
        default {
          require(
            0,
            0x3d
          )
        }

        // Increase input index.
        index := safeAdd(index, 1)

        // Increase position of input.
        pos := safeAdd(pos, inputSize(pos))
      }
    }

    /// @notice Prove a witness was invalid.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of inputs proofs.
    function proveInvalidWitness(transactionProof, inputProofs) {
      // We first verify the inputs are accurate.
      verifyInputs(transactionProof, inputProofs)

      // We then prove the witness correctness, otherwise fraud is committed.
      proveWitness(transactionProof, inputProofs)
    }
  
    /// @notice Metadata of a withdrawal transcation in the rollup. Points to an entry in a block.
    

    /// @notice Check if the withdrawal has already need processed.
    /// @param blockHeight The Fuel block height.
    /// @param withdrawId The Fuel withdraw Id.
    /// @return processed If the withdrawal has already been processed as bool.
    function isWithdrawalProcessed(blockHeight, withdrawalId) -> processed {
      processed := sload(
        mappingKey2(
          5,
          blockHeight,
          withdrawalId
        )
      )
    }

    /// @notice Emit WithdrawalMade event and transfer funds.
    /// @param ownerAddress The owner of the Withdrawal.
    /// @param tokenAddress The ERC20 address of the token.
    /// @param amount The amount value of the token.
    /// @param withdrawalId The Withdrawal ID of the Withdrawal.
    /// @param transactionLeafHash The transaction leaf hash.
    /// @param transactionProof The transaction proof.
    /// @dev Execution stops after this is complete.
    function makeWithdrawal(
      ownerAddress,
      tokenAddress,
      amount,
      withdrawalId,
      transactionLeafHash,
      transactionProof,
      blockHeight
    ) {
      // Owner must not be empty.
      require(
        neq(
          ownerAddress,
          0
        ),
        0x9b
      )

      // This withdrawal must not have been processed yet.
      require(
        eq(
          isWithdrawalProcessed(
            blockHeight,
            withdrawalId
          ),
          0x00
        ),
        0x9c
      )

      // Set withdrawal as processed.
      sstore(
        mappingKey2(
          5,
          blockHeight,
          withdrawalId
        ),
        0x01
      )

      // Based upon the withdrawal id.
      switch withdrawalId

      // Block Bond withdrawal.
      case 0 {
        // Construct and emit the WithdrawalMade Log.
        mstore(
          0,
          tokenAddress
        ) mstore(
          add(0,32),
          amount
        ) mstore(
          add(0,64),
          0
        ) mstore(
          add(0,96),
          0
        ) mstore(
          add(0,128),
          0
        )
      }

      // Normal withdrawal.
      default {
        // Construct and emit the WithdrawalMade Log.
        mstore(
          0,
          tokenAddress
        ) mstore(
          add(0,32),
          amount
        ) mstore(
          add(0,64),
          TransactionProof.rootIndex(transactionProof)
        ) mstore(
          add(0,96),
          TransactionProof.inputOutputIndex(transactionProof)
        ) mstore(
          add(0,128),
          TransactionProof.transactionIndex(transactionProof)
        )
      }

      // Emit the WithdrawalMade log.
      log4(
        0,
        mul32(5),
        0x227167f13f6a5dd1ba19c2a3a0050c5b942e9834fc839346a7a5d8f6718c9341,
        ownerAddress,
        blockHeight,
        transactionLeafHash
      )

      // Transfer amount out.
      transfer(
        amount,
        tokenAddress,
        ownerAddress
      )

      // Stop execution from here.
      stop()
    }

    /// @notice Withdraw a block producer bond from a finalizable block.
    /// @param blockHeader The BlockHeader you want to withdraw the bond for.
    function bondWithdraw(blockHeader) {
      // Setup block producer withdrawal ID (i.e. zero).
      let withdrawalId := 0

      // Get the block height from BlockHeader proof.
      let blockHeight := BlockHeader.height(blockHeader)

      // Verify block header is valid and finalized (i.e. past 2 weeks).
      verifyHeader(blockHeader, 0, 0, 1)

      // Ensure caller must be block producer.
      require(
        eq(
          BlockHeader.producer(blockHeader), caller()
        ),
        0x1c
      )

      // Get bond size from the constructor data.
      Constructor.copy(0)

      // Get the bondSize data from the copied constructor data.
      let bondSize := Constructor.bondSize(0)

      // Make the withdrawal.
      makeWithdrawal(
        caller(),
        0,
        bondSize,
        withdrawalId,
        0,
        blockHeader,
        blockHeight
      )
    }

    /// @notice Do a withdrawal.
    /// @param transactionProof The TransactionProof of the transaction, and output you want to withdraw. 
    function withdraw(transactionProof) {
      // Verify transaction proof and that the transaction referenced has been finalized.
      verifyTransactionProof(transactionProof, 1)

      // Select the output from the proof.
      let output := selectOutput(transactionProof)

      // Get token address from the proof, and owner.
      let tokenAddress := TransactionProof.tokenAddress(transactionProof)

      // Get the returnOwner from proof to use for owner ID resolution.
      let owner := TransactionProof.returnOwner(transactionProof)

      // Owner must match.
      require(
        ownerEquates(
          output,
          owner
        ),
        0x9d
      )

      // Token ID must match.
      require(
        eq(
          Output.token.slice(output),
          tokenId(tokenAddress)
        ),
        0x9e
      )

      // Output type must be Withdraw.
      require(
        eq(
          Output.type(output),
          1
        ),
        0x9f
      )

      // Get transaction details.
      let transactionLeafHash := computeTransactionLeafHash(
        transactionProof
      )

      // Get the selected output Index to withdraw from.
      let outputIndex := TransactionProof.inputOutputIndex(transactionProof)

      // Get the selected block height to select from.
      let blockHeight := TransactionProof.blockHeight(transactionProof)

      // Construct the Withdrawal Id contents.
      mstore(
        0,
        TransactionProof.rootIndex(transactionProof)
      ) mstore(
        add(0,32),
        transactionLeafHash
      ) mstore(
        add(0,64),
        outputIndex
      )

      // Create the withdrawal ID hash.
      let withdrawalId := WithdrawalMetadata.keccak256(0)

      // Make the withdrawal.
      makeWithdrawal(
        owner,
        tokenAddress,
        outputAmount(output),
        withdrawalId,
        transactionLeafHash,
        transactionProof,
        blockHeight
      )
    }
  
    /// @notice Verify proof of data.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of input proofs.
    /// @param maxIndex The max index to validate to.
    function verifyData(transactionProof, inputProofs, maxIndex) {
      // Ensure the number of data elements is equal to number of metadata/inputs.
      require(
        eq(
          TransactionProof.data.length(transactionProof),
          TransactionProof.metadata.length(transactionProof)
        ),
        0xa0
      )

      // Get starting position in memory of input in transaction proof.
      let pos := TransactionLeaf.inputs.position(
        TransactionProof.transaction.position(transactionProof)
      )

      // The input index.
      let index := 0

      // Loop through each input until we've reached the end of the inputs in transaction proof.
      for {} and(
        lt(
          index,
          maxIndex
        ),
        lt(
          pos,
          TransactionLeaf.inputs.offset(
            TransactionProof.transaction.position(transactionProof)
          )
        )) {} {
        // The type of input being verified.
        switch Input.type(pos)

        // In the case of a Transfer input.
        case 0 {
          // Here we compare the provided data hash to the supplied utxo hash to enforce proper proof construction.
          require(
            eq(
              TransactionProof.data(transactionProof, index),
              UTXO.keccak256(inputProofs)
            ),
            0xa1
          )

          // Increase proof memory position of the input proofs.
          inputProofs := safeAdd(inputProofs, UTXO.size(inputProofs))
        }

        // In the case of a Deposit input.
        case 1 {
          // Gere we compare the provided data hash to the supplied deposit hash to enforce proper proof construction.
          require(
            eq(
              TransactionProof.data(transactionProof, index),
              Deposit.keccak256(inputProofs)
            ),
            0xa2
          )

          // Increase proof memory position of the input proofs.
          inputProofs := safeAdd(inputProofs, Deposit.size(inputProofs))
        }

        // In the case of an HTLC input.
        case 2 {
          // Gere we compare the provided data hash to the supplied utxo hash to enforce proper proof construction.
          require(
            eq(
              TransactionProof.data(transactionProof, index),
              UTXO.keccak256(inputProofs)
            ),
            0xa3
          )

          // Increase proof memory position of the input proofs.
          inputProofs := safeAdd(inputProofs, UTXO.size(inputProofs))
        }

        // In the case of an Root input.
        case 3 {
          // Additional header check for root proof.
          verifyTransactionProof(inputProofs, 2)

          // Here we compare the provided data hash to the supplied root header hash to enforce proper proof construction.
          require(
            eq(
              TransactionProof.data(transactionProof, index),
              RootHeader.keccak256(TransactionProof.rootProducer.position(inputProofs))
            ),
            0xa4
          )

          // Increase proof memory position of the input proofs.
          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        // If the input type is invalid, revert.
        default {
          require(
            0,
            0x3d
          )
        }

        // Increase the position of the input memory selector by the input size.
        pos := safeAdd(pos, inputSize(pos))

        // Increase the input index by 1.
        index := safeAdd(index, 1)
      }
    }
  
    /// @notice Fraudulant summing, incase of overflow, we conclude fraud.
    /// @param x The first value to sum.
    /// @param y The second value to sum.
    /// @param transactionProof The fraudulant proof incase summing overflows.
    /// @return z The sum of the two values.
    function assertAddOrFraud(x, y, transactionProof) -> z {
      z := add(x, y)
      assertOrFraud(
        or(
          eq(z, x),
          gt(z, x)
        ),
        0xa5,
        transactionProof
      )
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
        assertOrFraud(
          eq(
            div(z, y), 
            x
          ),
          0xa6,
          transactionProof
        )
      }
    }

    /// @notice Compute sum of inputs in token specified in transaction proof.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of inputs proofs.
    /// @return Sum of inputs in token.
    function ins(transactionProof, inputProofs) -> sum {
      // Get the memory position of the first input.
      let pos := TransactionLeaf.inputs.position(
        TransactionProof.transaction.position(transactionProof)
      )

      // Get the token id of the first token address.
      let token := tokenId(
        TransactionProof.tokenAddress(transactionProof)
      )

      // Go through each input (dually, both the proof and the input itself.).
      for {}
        // Go through each of the inputs for this transaction.
        lt(
          pos,
          TransactionLeaf.inputs.offset(
            TransactionProof.transaction.position(
              transactionProof
            )
          )
        ) {} {
        // Switch case based upon the type.
        switch Input.type(pos)

        // If the input is a Transfer type.
        case 0 {
          if eq(token, UTXO.token(inputProofs)) {
            sum := assertAddOrFraud(
              sum,
              UTXO.amount(inputProofs),
              transactionProof
            )
          }

          // Increase the input memory pointer by the proof size.
          inputProofs := safeAdd(inputProofs, UTXO.size(inputProofs))
        }

        // If the input is a Transfer type.
        case 1 {
          if eq(token, Deposit.token(inputProofs)) {
            sum := assertAddOrFraud(
              sum,
              Deposit.amount(inputProofs),
              transactionProof
            )
          }

          // Increase the input memory pointer by the proof size.
          inputProofs := safeAdd(inputProofs, Deposit.size(inputProofs))
        }

        // If the input is a Transfer type.
        case 2 {
          if eq(token, UTXO.token(inputProofs)) {
            sum := assertAddOrFraud(
              sum,
              UTXO.amount(inputProofs),
              transactionProof
            )
          }

          // Increase the input memory pointer by the proof size.
          inputProofs := safeAdd(inputProofs, UTXO.size(inputProofs))
        }

        // If the input is a Transfer type.
        case 3 {
          let root := TransactionProof.rootProducer.position(inputProofs)

          if eq(token, RootHeader.feeToken(root)) {
            sum := assertAddOrFraud(
              sum,
              assertMulOrFraud(
                RootHeader.fee(root),
                RootHeader.length(root),
                transactionProof
              ),
              transactionProof
            )
          }

          // Increase the input memory pointer by the proof size.
          inputProofs := safeAdd(inputProofs, TransactionProof.size(inputProofs))
        }

        default {
          // If the input type is invalid, revert. This should be handled in proveInvalidTransaction.
          require(0, 0x3d)
        }

        // increase the memory position pointer by the input size.
        pos := safeAdd(pos, inputSize(pos))
      }
    }

    /// @notice Compute sum of outputs in given token.
    /// @param token Token ID.
    /// @param transactionProof Position in memory of transaction proof.
    /// @return Sum of outputs in token.
    function outs(token, transactionProof) -> sum {
      // Get the position of the lead.
      let leaf := TransactionProof.transaction.position(transactionProof)

      // Get the start of the outputs position.
      let pos := TransactionLeaf.outputs.position(leaf)

      // Get the end of the output position.
      let end := TransactionLeaf.outputs.offset(leaf)

      // Go through each of the outputs.
      for {} lt(pos, end) {} {
        // If the output is not a return type and the token ID is correct.
        if and(
          lt(Output.type(pos), 3),
          eq(token, Output.token.slice(pos))
        ) {
          // Add this output amount to the sum of the transaction proof.
          sum := assertAddOrFraud(
            sum,
            outputAmount(pos),
            transactionProof
          )
        }

        // Increase the memory position by the output size.
        pos := safeAdd(pos, outputSize(pos))
      }
    }

    /// @notice Helper function to prove that sum of outputs violates sum of inputs, assuming proofs are verified.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of inputs proofs.
    function proveSum(transactionProof, inputProofs) {
      // Token id.
      let token := tokenId(TransactionProof.tokenAddress(transactionProof))

      // Total out sum.
      let outsum := assertAddOrFraud(
        rootFee(transactionProof, token),
        outs(token, transactionProof),
        transactionProof
      )

      // Total input sum.
      let insum := ins(transactionProof, inputProofs)

      // Assert out to input sum.
      assertOrFraud(
        eq(
          outsum,
          insum
        ),
        0xa7,
        transactionProof
      )
    }

    /// @notice Prove that the sum of outputs violates the sum of inputs.
    /// @param transactionProof Position in memory of transaction proof.
    /// @param inputProofs Position in memory of inputs proofs.
    function proveInvalidSum(transactionProof) {
      // Verify the transaction proof (where fraud is alleged.).
      verifyTransactionProof(transactionProof, 0)

      // We now get the input proofs from the TransactionProof not the ABI.
      let inputProofs := TransactionProof.inputProofs.position(transactionProof)

      // Switch to this model.
      verifyWitness(transactionProof)

      // Verify the data of the transaction.
      verifyData(transactionProof, inputProofs, 8)

      // Verify/prove fraud of the total sum of the transaction (inputs to outputs).
      proveSum(transactionProof, inputProofs)
    }
  
      // Load calldata to memory.
      calldata.copy()

      // Call a different method depending on method signature in calldata.
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
      case 0x270c6cfb {
        nonpayable()
        requireValidFraudCommitment()
    
        // Get the position of the input proofs for this transaction.
        let inputProofs := TransactionProof.inputProofs.position(abi.offset(calldata.word(0)))

        // Prove invalid witness.
        proveInvalidWitness(abi.offset(calldata.word(0)), inputProofs)
      }

      /// @notice Prove that a transation produced more than it consumed.
      /// @param transactionProof Memory offset to start of transaction proof.
      /// @param inputProofs Memory offset of start of input proofs.
      /// @dev provers::InvalidSum::proveInvalidSum
      case 0x88f3c8f3 {
        nonpayable()
        requireValidFraudCommitment()
        proveInvalidSum(abi.offset(calldata.word(0)))
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
        return.word(
          isWithdrawalProcessed(
            calldata.word(0),
            calldata.word(1)
          )
        )
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
      /*
      case sig"name() external view returns (string)" {
        Constructor.copy(0)
        Constructor.name.copy(0, 0)
        return(0, 96)
      }

      /// @notice Get contract version.
      /// @return Version.
      case sig"version() external view returns (string)" {
        Constructor.copy(0)
        Constructor.version.copy(0, 0)
        return(0, 96)
      }
      */

      /// @notice Not one of the above, invalid method signature.
      default {
        require(0, 0xa8)
      }

      // Ensure execution stops
      stop()
    }
  }
}
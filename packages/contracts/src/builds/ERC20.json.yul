object "ERC20" {
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

     // storage index numbers

    // constructor(address owner, uint256 totalSupply)
    codecopy(64, safeSub(codesize(), 64), 64)

    // constructor variable
    let _constructor := 0x00

    // stipulate initial owner and total supply
    let owner := mload(64)
    let totalSupply := mload(96)
    // set initial owner balance at totalSupply
    mstore(0, owner) mstore(add(0,32), 0)
    sstore(keccak256(0, 64), totalSupply)

    // Goto runtime
    datacopy(0, dataoffset("Runtime"), datasize("Runtime"))
    return(0, datasize("Runtime"))
  }
  object "Runtime" {
    code {
  function gte(x, y) -> result {
    if or(gt(x, y), eq(x, y)) {
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

         // leave first 4 32 byte chunks for hashing, returns etc..

         // storage index numbers

        calldatacopy(128, 0, calldatasize()) // copy all calldata to memory

        switch mslice(128, 4) // 4 byte calldata signature

        case 0xa9059cbb {

function transfer.owner(pos) -> res {
  res := mslice(transfer.owner.position(pos), 32)
}



function transfer.owner.position(_pos) -> _offset {
  
      
        function transfer.owner.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function transfer.owner.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(transfer.owner.position._chunk0(_pos), add(transfer.owner.position._chunk1(_pos), 0))
    
}



function transfer.sig.position(_pos) -> _offset {
  
      
        function transfer.sig.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function transfer.sig.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(transfer.sig.position._chunk0(_pos), add(transfer.sig.position._chunk1(_pos), 0))
    
}



function transfer.amount(pos) -> res {
  res := mslice(transfer.amount.position(pos), 32)
}



function transfer.amount.position(_pos) -> _offset {
  
      
        function transfer.amount.position._chunk0(pos) -> __r {
          __r := 0x24
        }
      
        function transfer.amount.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(transfer.amount.position._chunk0(_pos), add(transfer.amount.position._chunk1(_pos), 0))
    
}


            

            transferFrom(caller(),
                transfer.owner(128),
                transfer.amount(128))
        }

        case 0x23b872dd {

function transferFromCalldata.source(pos) -> res {
  res := mslice(transferFromCalldata.source.position(pos), 32)
}



function transferFromCalldata.source.position(_pos) -> _offset {
  
      
        function transferFromCalldata.source.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function transferFromCalldata.source.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(transferFromCalldata.source.position._chunk0(_pos), add(transferFromCalldata.source.position._chunk1(_pos), 0))
    
}



function transferFromCalldata.sig.position(_pos) -> _offset {
  
      
        function transferFromCalldata.sig.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function transferFromCalldata.sig.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(transferFromCalldata.sig.position._chunk0(_pos), add(transferFromCalldata.sig.position._chunk1(_pos), 0))
    
}



function transferFromCalldata.destination(pos) -> res {
  res := mslice(transferFromCalldata.destination.position(pos), 32)
}



function transferFromCalldata.destination.position(_pos) -> _offset {
  
      
        function transferFromCalldata.destination.position._chunk0(pos) -> __r {
          __r := 0x24
        }
      
        function transferFromCalldata.destination.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(transferFromCalldata.destination.position._chunk0(_pos), add(transferFromCalldata.destination.position._chunk1(_pos), 0))
    
}



function transferFromCalldata.amount(pos) -> res {
  res := mslice(transferFromCalldata.amount.position(pos), 32)
}



function transferFromCalldata.amount.position(_pos) -> _offset {
  
      
        function transferFromCalldata.amount.position._chunk0(pos) -> __r {
          __r := 0x44
        }
      
        function transferFromCalldata.amount.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(transferFromCalldata.amount.position._chunk0(_pos), add(transferFromCalldata.amount.position._chunk1(_pos), 0))
    
}


            

            transferFrom(transferFromCalldata.source(128),
                transferFromCalldata.destination(128),
                transferFromCalldata.amount(128))
        }

        case 0x095ea7b3 {

function approve.destination(pos) -> res {
  res := mslice(approve.destination.position(pos), 32)
}



function approve.destination.position(_pos) -> _offset {
  
      
        function approve.destination.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function approve.destination.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(approve.destination.position._chunk0(_pos), add(approve.destination.position._chunk1(_pos), 0))
    
}



function approve.sig.position(_pos) -> _offset {
  
      
        function approve.sig.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function approve.sig.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(approve.sig.position._chunk0(_pos), add(approve.sig.position._chunk1(_pos), 0))
    
}



function approve.amount(pos) -> res {
  res := mslice(approve.amount.position(pos), 32)
}



function approve.amount.position(_pos) -> _offset {
  
      
        function approve.amount.position._chunk0(pos) -> __r {
          __r := 0x24
        }
      
        function approve.amount.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(approve.amount.position._chunk0(_pos), add(approve.amount.position._chunk1(_pos), 0))
    
}


            

            sstore(mappingStorageKey2(caller(),
                approve.destination(128),
                1), approve.amount(128))

            mstore(0, approve.amount(128))
            log3(0, 32,
                0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925,
                caller(),
                approve.destination(128))

            mstore(0, 0x01)
            return(0, 32)
        }

        case 0xdd62ed3e {

function allowanceCalldata.source(pos) -> res {
  res := mslice(allowanceCalldata.source.position(pos), 32)
}



function allowanceCalldata.source.position(_pos) -> _offset {
  
      
        function allowanceCalldata.source.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function allowanceCalldata.source.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(allowanceCalldata.source.position._chunk0(_pos), add(allowanceCalldata.source.position._chunk1(_pos), 0))
    
}



function allowanceCalldata.sig.position(_pos) -> _offset {
  
      
        function allowanceCalldata.sig.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function allowanceCalldata.sig.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(allowanceCalldata.sig.position._chunk0(_pos), add(allowanceCalldata.sig.position._chunk1(_pos), 0))
    
}



function allowanceCalldata.owner(pos) -> res {
  res := mslice(allowanceCalldata.owner.position(pos), 32)
}



function allowanceCalldata.owner.position(_pos) -> _offset {
  
      
        function allowanceCalldata.owner.position._chunk0(pos) -> __r {
          __r := 0x24
        }
      
        function allowanceCalldata.owner.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(allowanceCalldata.owner.position._chunk0(_pos), add(allowanceCalldata.owner.position._chunk1(_pos), 0))
    
}


            

            mstore(0, sload(mappingStorageKey2(allowanceCalldata.source(128),
                allowanceCalldata.owner(128),
                1)))
            return (0, 32)
        }

        case 0x06fdde03 {
            // mstore(0, "Fake Dai Stablecoin") somethig like this, proper but w/ encoding.
            // return(0, 32)
        }
        case 0x95d89b41 {
            // mstore(0, "FDAI")
            // return(0, 32)
        }
        case 0x54fd4d50 {
            // mstore(0, "1")
            // return(0, 32)
        }
        case 0x313ce567 {
            mstore(0, 18)
            return(0, 32)
        }

        case 0x70a08231 {

function calldata.balanceOf.owner(pos) -> res {
  res := mslice(calldata.balanceOf.owner.position(pos), 32)
}



function calldata.balanceOf.owner.position(_pos) -> _offset {
  
      
        function calldata.balanceOf.owner.position._chunk0(pos) -> __r {
          __r := 0x04
        }
      
        function calldata.balanceOf.owner.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(calldata.balanceOf.owner.position._chunk0(_pos), add(calldata.balanceOf.owner.position._chunk1(_pos), 0))
    
}



function calldata.balanceOf.sig.position(_pos) -> _offset {
  
      
        function calldata.balanceOf.sig.position._chunk0(pos) -> __r {
          __r := 0x00
        }
      
        function calldata.balanceOf.sig.position._chunk1(pos) -> __r {
          __r := pos
        }
      

      _offset := add(calldata.balanceOf.sig.position._chunk0(_pos), add(calldata.balanceOf.sig.position._chunk1(_pos), 0))
    
}


            
            mstore(0, sload(mappingStorageKey(calldata.balanceOf.owner(128),
                0)))
            return (0, 32)
        }

        default { require(0, 0) } // invalid method signature

        stop() // stop execution here..

        function transferFrom(source, destination, amount) {
            let balanceOfSource := sload(mappingStorageKey(source, 0))
            let allowanceOfDestination := sload(mappingStorageKey2(source, destination, 0))
            let allowanceOfSourceSender := sload(mappingStorageKey2(source, caller(), 1))

            // require(balanceOf[src] >= wad, "Dai/insufficient-balance");
            require(or(gt(balanceOfSource, amount), eq(balanceOfSource, amount)), 0x01)

            // if (src != msg.sender && allowance[src][msg.sender] != uint(-1)) {
            if and(neq(source, caller()), neq(allowanceOfSourceSender, 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)) {
                // require(allowance[src][msg.sender] >= wad, "Dai/insufficient-allowance");
                require(gte(allowanceOfDestination, amount), 0x02)

                // allowance[src][msg.sender] = sub(allowance[src][msg.sender], wad);
                sstore(mappingStorageKey2(source, destination, 0),
                    safeSub(allowanceOfDestination, amount))
            }

            //  balanceOf[src] = sub(balanceOf[src], wad);
            sstore(mappingStorageKey(source, 0),
                safeSub(balanceOfSource, amount))

            // balanceOf[dst] = add(balanceOf[dst], wad);
            let balanceOfDestination := sload(mappingStorageKey(destination, 0))
            sstore(mappingStorageKey(destination, 0),
                safeAdd(balanceOfDestination, amount))

            mstore(0, amount)
            log3(0, 32, 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,
                source, destination)

            mstore(0, 0x01)
            return(0, 32)
        }

        // Solidity Style Storage Key: mapping(bytes32 => bytes32)
        function mappingStorageKey(key, storageIndex) -> storageKey {
            mstore(0, key) mstore(add(0,32), storageIndex)
            storageKey := keccak256(0, 64)
        }

        // Solidity Style Storage Key: mapping(bytes32 => mapping(bytes32 => bytes32)
        function mappingStorageKey2(key, key2, storageIndex) -> storageKey {
            mstore(0, key) mstore(add(0,32), storageIndex) mstore(add(0,64), key2)
            mstore(96, keccak256(0, 64))
            storageKey := keccak256(64, 64)
        }
    }
  }
}
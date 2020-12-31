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

      case 0x70a08231 {
        mstore(0, 5000)
        return (0, 32)
      }

      case 0xa9059cbb {
        require(0, 0x01)
      }

      default {
        require(0, 0x02)
      }
    }
  }
}
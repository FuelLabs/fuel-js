object "Funnel" {
  code {
    // 66 + 32 = 98
    datacopy(0, dataoffset("Runtime"), 98)
    return(0, 98)
  }
  object "Runtime" {
    code {
      // Copy owner set in constructor to memory.
      // 66 = 85
      codecopy(0, 53, 32)

      // Check owner is caller.
      if eq(mload(0), caller()) {

        // If calldata is correct length proceed with call.
        if eq(calldatasize(), 128) {

          // Copy calldata to memory.
          calldatacopy(0, 0, calldatasize())

          // Make outward call to destination, first word is destination, the next 68 is the call.
          if iszero(call(gas(), mload(0), 0, 60, 68, 0, 0)) {
            // If the call failed, revert tx.
            revert(0, 0)
          }
        }

        // Send ether to caller and self-destruct regardless.
        selfdestruct(caller())
      }
    }
  }
}
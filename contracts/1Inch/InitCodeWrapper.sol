pragma solidity =0.5.16;

import "./../V2/core/UniswapV2Pair.sol";

contract InitCodeWrapper {
      function initCode() external returns( bytes memory result) {
        result = type(UniswapV2Pair).creationCode;
        return result;
    }
}

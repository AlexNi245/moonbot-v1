// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;
pragma abicoder v1;

import "./../libraries/OZ/token/ERC20/IERC20.sol";


interface IWrapper {
    function wrap(IERC20 token) external view returns (IERC20 wrappedToken, uint256 rate);
}

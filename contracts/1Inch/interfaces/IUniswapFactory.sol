// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.11;
pragma abicoder v1;

import "./../libraries/OZ/token/ERC20/IERC20.sol";

interface IUniswapFactory {
    function getExchange(IERC20 token) external view returns (address exchange);

    function getPair(address tokenA, address tokenB)
        external
        view
        returns (address pair);
}

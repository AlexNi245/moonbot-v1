// SPDX-License-Identifier: MIT

pragma solidity 0.8.11;
pragma abicoder v1;

import "./OracleBase.sol";
import "../interfaces/IUniswapFactory.sol";
import "../interfaces/IUniswapV2Pair.sol";
import "hardhat/console.sol";

contract UniswapV2LikeOracle is OracleBase {
    address public immutable factory;
    bytes32 public immutable initcodeHash;

    constructor(address _factory, bytes32 _initcodeHash) {
        factory = _factory;
        initcodeHash = _initcodeHash;
    }

    // calculates the CREATE2 address for a pair without making any external calls
    function _pairFor(IERC20 tokenA, IERC20 tokenB)
        private
        view
        returns (address pair)
    {
        pair = IUniswapFactory(factory).getPair(address(tokenA), address(tokenB));
        console.log("token0 : ", address(tokenA));
        console.log("token1: ", address(tokenB));
        console.log("pairx : ", pair);
        return pair;
    }

    function _getBalances(IERC20 srcToken, IERC20 dstToken)
        internal
        view
        override
        returns (uint256 srcBalance, uint256 dstBalance)
    {
        (IERC20 token0, IERC20 token1) = srcToken < dstToken
            ? (srcToken, dstToken)
            : (dstToken, srcToken);
        console.log("get pair");

        (uint256 reserve0, uint256 reserve1, ) = IUniswapV2Pair(
            _pairFor(token0, token1)
        ).getReserves();
        console.log("finish pair");
        console.log("r0", reserve0);
        console.log("r1", reserve1);
        (srcBalance, dstBalance) = srcToken == token0
            ? (reserve0, reserve1)
            : (reserve1, reserve0);
    }
}

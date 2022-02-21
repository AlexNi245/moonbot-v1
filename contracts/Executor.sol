pragma solidity ^0.6.6;

import "hardhat/console.sol";
import "./V2/core/interfaces/IUniswapV2Callee.sol";
import "./V2/periphery/libraries/UniswapV2Library.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol";
import "@uniswap/lib/contracts/libraries/TransferHelper.sol";
import "./V2/core/interfaces/IERC20.sol";
import "./V2/periphery/libraries/SafeMath.sol";

//1. swapExactETHForTokens
//2. swapExactTokensForETH

contract Executor is IUniswapV2Callee {
    using SafeMath for uint256;
    address private WETH;

    constructor(address _WETH) public {
        WETH = _WETH;
    }

    function swap(
        uint256 amountIn,
        address token,
        address[2] memory pairs
    ) public {
        IUniswapV2Pair buyFromPair = IUniswapV2Pair(pairs[0]);
        IUniswapV2Pair sellToPair = IUniswapV2Pair(pairs[1]);

        require(buyFromPair.token0() == WETH, "token0 must be WETH!");

        bytes memory data = abi.encode(
            //Pair where to sell tokens for weth
            pairs[1],
            //The token which the eth is traded for
            buyFromPair.token1(),
            //Amount that need to be payed back
            _calcToRepay(pairs[0], amountIn),
            //Pool which needs to be paid
            pairs[0]
        );

        (uint256 amount0Out, uint256 amount1Out) = _calcTokenForEth(
            pairs[0],
            amountIn
        );

        //Get tokens  Need to payback weth later
        buyFromPair.swap(amount0Out, amount1Out, address(this), data);
    }

    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata _data
    ) external override {
        (
            address sellToPairAddress,
            address _target,
            uint256 lonedAmount,
            address poolWhichNeedsToBePayed
        ) = abi.decode(_data, (address, address, uint256, address));

        uint256 spendableBalance = IERC20(_target).balanceOf(address(this));

        console.log("Amount 0 : ", amount0);
        console.log("Amount 1 : ", amount1);

        console.log("What to spend ", _target);
        console.log("Spendable Balance  : ", spendableBalance);

        IERC20(_target).transfer(sellToPairAddress, spendableBalance);

        (uint256 amount0Out, uint256 amount1Out) = _calcEthForTokens(
            sellToPairAddress,
            spendableBalance
        );

        console.log("Sell amount0Out ", amount0Out);
        console.log("Sell amount1Out ", amount1Out);

        IUniswapV2Pair(sellToPairAddress).swap(
            amount0Out,
            amount1Out,
            address(this),
            new bytes(0)
        );

        uint256 balanceAfter = IERC20(WETH).balanceOf(address(this));

        console.log("balance after", balanceAfter);
        IERC20(WETH).transfer(poolWhichNeedsToBePayed, lonedAmount);

        uint256 finalBalance = IERC20(WETH).balanceOf(address(this));
        console.log("final balance", finalBalance);
    }

    //At the beginning we need to calc the amount of tokens we can get given the eth input
    function _calcTokenForEth(address _buyFromPair, uint256 amountIn)
        private
        returns (uint256 amount0Out, uint256 amount1Out)
    {
        IUniswapV2Pair buyFromPair = IUniswapV2Pair(_buyFromPair);
        (uint256 reserveIn, uint256 reserveOut, ) = buyFromPair.getReserves();

        amount0Out = buyFromPair.token0() == WETH
            ? 0
            : UniswapV2Library.getAmountOut(amountIn, reserveOut, reserveIn);
        amount1Out = buyFromPair.token1() == WETH
            ? 0
            : UniswapV2Library.getAmountOut(amountIn, reserveIn, reserveOut);

        console.log("Buy amount0Out ", amount0Out);
        console.log("Buy amount1Out ", amount1Out);
        return (amount0Out, amount1Out);
    }

    //We need to calc the eth amount we can receive for or tokens from step 1
    function _calcEthForTokens(address _sellToPair, uint256 spendableBalance)
        private
        returns (uint256 amount0Out, uint256 amount1Out)
    {
        IUniswapV2Pair sellToPair = IUniswapV2Pair(_sellToPair);
        (uint256 reserve0, uint256 reserve1, ) = sellToPair.getReserves();

        uint256 amount0Out = sellToPair.token0() == WETH
            ? UniswapV2Library.getAmountOut(
                spendableBalance,
                reserve1,
                reserve0
            )
            : 0;

        uint256 amount1Out = sellToPair.token1() == WETH
            ? UniswapV2Library.getAmountOut(
                spendableBalance,
                reserve0,
                reserve1
            )
            : 0;
        return (amount0Out, amount1Out);
    }

    function _calcToRepay(address _buyPoolAddress, uint256 owedAmount)
        private
        returns (uint256)
    {
        uint256 fee = ((owedAmount * 3) / 997) + 1;
        uint256 repay = owedAmount + fee;
        console.log("ETH input", owedAmount);
        console.log("Repay Loan", repay);
        return repay;
    }
}
//123000000000000000 //input
//1226294961822253 // balance after
//123370110330992979 // with fess
//1226294961822253

//123000000000000000 //spendable balance

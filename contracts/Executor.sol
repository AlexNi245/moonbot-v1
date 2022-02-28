pragma solidity ^0.6.6;

import "./V2/core/interfaces/IUniswapV2Callee.sol";
import "./V2/periphery/libraries/UniswapV2Library.sol";
import "./V2/core/interfaces/IUniswapV2Pair.sol";
import "./V2/core/interfaces/IERC20.sol";
import "./V2/periphery/libraries/SafeMath.sol";

//1. swapExactETHForTokens
//2. swapExactTokensForETH

contract Executor is IUniswapV2Callee {
    using SafeMath for uint256;
    address private immutable WETH;
    address private immutable OWNER;

    constructor(address _WETH, address _owner) public {
        WETH = _WETH;
        OWNER = _owner;
    }

    event onFinish(uint256 balanceStart, uint256 finalBalance);
    event Debug();

    modifier isProfitable() {
        //Call #1
        uint256 balanceStart = IERC20(WETH).balanceOf(address(this));
        _;
        uint256 finalBalance = IERC20(WETH).balanceOf(address(this));

        emit onFinish(balanceStart, finalBalance);
        require(finalBalance - balanceStart > 0, "Profit must be made");
        IERC20(WETH).transfer(OWNER, finalBalance);
    }

    function trade(
        uint256 amountIn,
        address[2] memory pairs,
        //For debuggin purposes -> block where the opportunity was found
        uint256 blockNumber
    ) public isProfitable {
        IUniswapV2Pair buyFromPair = IUniswapV2Pair(pairs[0]);
        address buyFromPairToken0 = buyFromPair.token0();
        address buyFromPairToken1 = buyFromPair.token1();

        bytes memory data = abi.encode(
            //Pair where to sell tokens for weth
            pairs[1],
            //The token which the eth is traded for
            //Call  #2
            buyFromPairToken0 == WETH ? buyFromPairToken1 : buyFromPairToken0,
            //Amount that need to be payed back
            _calcRepayAmount(amountIn),
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

        IERC20(_target).transfer(sellToPairAddress, spendableBalance);


        (uint256 amount0Out, uint256 amount1Out) = _calcEthForTokens(
            sellToPairAddress,
            spendableBalance
        );

        IUniswapV2Pair(sellToPairAddress).swap(
            amount0Out,
            amount1Out,
            address(this),
            new bytes(0)
        );

        IERC20(WETH).transfer(poolWhichNeedsToBePayed, lonedAmount);
    }

    //At the beginning we need to calc the amount of tokens we can get given the eth input
    function _calcTokenForEth(address _buyFromPair, uint256 amountIn)
        public
        view
        returns (uint256 amount0Out, uint256 amount1Out)
    {
        IUniswapV2Pair buyFromPair = IUniswapV2Pair(_buyFromPair);

        //Call#3
        (uint256 reserve0, uint256 reserve1, ) = buyFromPair.getReserves();

        //Call#4
        amount0Out = buyFromPair.token0() == WETH
            ? 0
            : UniswapV2Library.getAmountOut(amountIn, reserve1, reserve0);
        //Call#5
        amount1Out = buyFromPair.token1() == WETH
            ? 0
            : UniswapV2Library.getAmountOut(amountIn, reserve0, reserve1);

        return (amount0Out, amount1Out);
    }

    //We need to calc the eth amount we can receive for or tokens from step 1tr
    function _calcEthForTokens(address _sellToPair, uint256 spendableBalance)
        public
        view
        returns (uint256 amount0Out, uint256 amount1Out)
    {
        IUniswapV2Pair sellToPair = IUniswapV2Pair(_sellToPair);
        (uint256 reserve0, uint256 reserve1, ) = sellToPair.getReserves();

        amount0Out = sellToPair.token0() == WETH
            ? UniswapV2Library.getAmountOut(
                spendableBalance,
                reserve1,
                reserve0
            )
            : 0;

        amount1Out = sellToPair.token1() == WETH
            ? UniswapV2Library.getAmountOut(
                spendableBalance,
                reserve0,
                reserve1
            )
            : 0;
        return (amount0Out, amount1Out);
    }

    function _calcRepayAmount(uint256 owedAmount)
        internal
        pure
        returns (uint256)
    {
        uint256 fee = ((owedAmount * 3) / 997) + 1;
        return owedAmount + fee;
    }
}

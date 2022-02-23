import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { Executor, IERC20, UniswapV2Factory, UniswapV2Pair, UniswapV2Query, UniswapV2Router02, WETH9 } from "typechain";
import { Dai, Eth, USDT } from "./../utils/ERC20Utils";
import { findTokenSmallerThenWeth, mockToken, mockWeth } from "./utils/Erc20Utils";
import { mockExecutor, mockUniswapV2Query } from "./utils/MoonbotUtils";
import { getPair, setUpFactory, setUpRouter } from "./utils/UniswapUtils";

describe.only("Executor test", () => {
    let dai: IERC20;
    let weth: WETH9;
    let usdt: IERC20;

    let uniswapFactoryOne: UniswapV2Factory;
    let uniswapFactoryTwo: UniswapV2Factory;
    let uniswapFactoryThree: UniswapV2Factory;

    let routerOne: UniswapV2Router02;
    let routerTwo: UniswapV2Router02;
    let routerThree: UniswapV2Router02;

    let wethDaiPairOne: UniswapV2Pair;
    let wethDaiPairTwo: UniswapV2Pair;
    let wethDaiPairThree: UniswapV2Pair;


    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];

    let uniswapV2Query: UniswapV2Query;

    let executor: Executor;


    afterEach(async () => {
        await hre.network.provider.send("hardhat_reset")
    })

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        console.log("OWNER @ ", owner.address)
        console.log("ADDR1 @ ", addr1.address)
        console.log("ADDR2 @ ", addr2.address)

        weth = await mockWeth();
        dai = await mockToken("Dai")
        usdt = await findTokenSmallerThenWeth(weth, "USDC")



        uniswapV2Query = await mockUniswapV2Query();
        executor = await mockExecutor(weth, addr2);

        uniswapFactoryOne = await setUpFactory(owner);
        uniswapFactoryTwo = await setUpFactory(owner);
        uniswapFactoryThree = await setUpFactory(owner);

        routerOne = await setUpRouter(uniswapFactoryOne, weth);
        routerTwo = await setUpRouter(uniswapFactoryTwo, weth);
        routerThree = await setUpRouter(uniswapFactoryThree, weth);


        await addr1.sendTransaction({ to: weth.address, value: Eth(1000) })

        await dai.connect(owner).transfer(addr1.address, Dai(100000))
        await usdt.connect(owner).transfer(addr1.address, Dai(100000))

        //Allow addr1 to add liquidity
        await dai.connect(addr1).approve(routerOne.address, Dai(1000000))
        await dai.connect(addr1).approve(routerTwo.address, Dai(1000000))
        await dai.connect(addr1).approve(routerThree.address, Dai(1000000))

        await usdt.connect(addr1).approve(routerOne.address, Dai(1000000))
        await usdt.connect(addr1).approve(routerTwo.address, Dai(1000000))
        await usdt.connect(addr1).approve(routerThree.address, Dai(1000000))


        await weth.connect(addr1).approve(routerTwo.address, Eth(20))

        await routerOne.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(10000),
            Dai(10000),
            Eth(0.25),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(100) }
        ,)

        await routerTwo.connect(addr1).addLiquidity(
            usdt.address,
            weth.address,
            USDT(10000),
            Eth(20),
            USDT(10000),
            Eth(20),
            addr1.address,
            new Date().getTime() + 3600
        ,)




        const wethDaiPairOneAddress = await uniswapFactoryOne.getPair(weth.address, dai.address);
        const wethDaiPairTwoAddress = await uniswapFactoryTwo.getPair(weth.address, usdt.address);

        wethDaiPairOne = await getPair(wethDaiPairOneAddress);
        wethDaiPairTwo = await getPair(wethDaiPairTwoAddress);



    });


    it("Calc Token for Eth works properly if token 0 == WETH", async () => {
        const buyFromPair = wethDaiPairOne;
        const token0 = await buyFromPair.token0();

        assert(token0 === weth.address, "Token 0 must be weth");

        const amountIn = BigNumber.from("10000");
        const [actualAmount0Out, actualAmount1Out] = await executor._calcTokenForEth(buyFromPair.address, amountIn)



        const expectedAmount0 = BigNumber.from(0);
        const expectedAmount1 = BigNumber.from(996999);

        assert(expectedAmount0.eq(actualAmount0Out), `Expect amount0ToBe ${expectedAmount0} is ${actualAmount0Out}`)
        assert(expectedAmount1.eq(actualAmount1Out), `Expect amount1ToBe ${expectedAmount1} is ${actualAmount1Out}`)


    })

    it("Calc Token for Eth works properly if token 1 == WETH", async () => {
        const buyFromPair = wethDaiPairTwo;
        const token1 = await buyFromPair.token1();

        assert(token1 === weth.address, "Token 1 must be weth");

        const amountIn = BigNumber.from("10000");
        const [actualAmount0Out, actualAmount1Out] = await executor._calcTokenForEth(buyFromPair.address, amountIn)



        const expectedAmount0 = BigNumber.from(4984999);
        const expectedAmount1 = BigNumber.from(0);
        console.log("Expect amount0ToBe ", expectedAmount0.eq(actualAmount0Out))
        console.log("Expect amount1ToBe ", expectedAmount1.eq(actualAmount1Out))

        assert(expectedAmount0.eq(actualAmount0Out), `Expect amount0ToBe ${expectedAmount0} is ${actualAmount0Out}`)
        assert(expectedAmount1.eq(actualAmount1Out), `Expect amount0ToBe ${expectedAmount1} is ${actualAmount1Out}`)


    })

    it("_calcEthForTokens properly if token 0 == WETH", async () => {
        const sellToPair = wethDaiPairOne;
        const token0 = await sellToPair.token0();

        assert(token0 === weth.address, "Token 0 must be weth");

        const amountIn = BigNumber.from("1000000");
        const [actualAmount0Out, actualAmount1Out] = await executor._calcEthForTokens(sellToPair.address, amountIn)

        const expectedAmount0 = BigNumber.from(0);
        const expectedAmount1 = BigNumber.from(9969);

        assert(expectedAmount0.eq(actualAmount0Out), `Expect amount0ToBe ${expectedAmount0} is ${actualAmount0Out}`)
        assert(expectedAmount1.eq(actualAmount1Out), `Expect amount1ToBe ${expectedAmount1} is ${actualAmount1Out}`)


    })

    it("_calcEthForTokens works properly if token 1 == WETH", async () => {
        const sellToPair = wethDaiPairTwo;
        const token1 = await sellToPair.token1();

        assert(token1 === weth.address, "Token 1 must be weth");

        const amountIn = BigNumber.from("1000000");
        const [actualAmount0Out, actualAmount1Out] = await executor._calcEthForTokens(sellToPair.address, amountIn)



        const expectedAmount0 = BigNumber.from(1993);
        const expectedAmount1 = BigNumber.from(0);
        console.log("Expect amount0ToBe ", expectedAmount0.eq(actualAmount0Out))
        console.log("Expect amount1ToBe ", expectedAmount1.eq(actualAmount1Out))

        assert(expectedAmount0.eq(actualAmount0Out), `Expect amount0ToBe ${expectedAmount0} is ${actualAmount0Out}`)
        assert(expectedAmount1.eq(actualAmount1Out), `Expect amount0ToBe ${expectedAmount1} is ${actualAmount1Out}`)


    })





})
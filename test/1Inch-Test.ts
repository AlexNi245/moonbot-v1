import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { BigNumber } from "ethers";
import hre, { ethers } from "hardhat";
import { Executor, IERC20, UniswapV2Factory, UniswapV2Pair, UniswapV2Query, UniswapV2Router02, WETH9, Multicall, OffchainOracle, MultiWrapper, UniswapV2LikeOracle } from "typechain";
import { Dai, Eth, printEth, USDT } from "./../utils/ERC20Utils";
import { findTokenSmallerThenWeth, mockToken, mockWeth } from "./utils/Erc20Utils";
import { mockExecutor, mockUniswapV2Query } from "./utils/MoonbotUtils";
import { getPair, setUpFactory, setUpRouter } from "./utils/UniswapUtils";
import { calcProfitMaximizingTrade } from "./../bot/math";
import { mockMultiCall, mockMultiWrapper, mockOracle, mockUniswapOracle } from "./utils/1InchUtils";

describe("1Inch test", () => {
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
    let wethUsdtPairTwo: UniswapV2Pair;
    let wethDaiPairThree: UniswapV2Pair;


    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];

    let uniswapV2Query: UniswapV2Query;

    let executor: Executor;

    let multiCall: Multicall;
    let multiWrapper: MultiWrapper;
    let offchainOracle: OffchainOracle;

    let oracle1: UniswapV2LikeOracle;
    let oracle2: UniswapV2LikeOracle;
    let oracle3: UniswapV2LikeOracle;




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

        await dai.connect(owner).transfer(addr1.address, Dai(2 * 100000000))
        await usdt.connect(owner).transfer(addr1.address, Dai(100000))

        //Allow addr1 to add liquidity
        await dai.connect(addr1).approve(routerOne.address, Dai(1000000))
        await dai.connect(addr1).approve(routerTwo.address, Dai(2 * 100000000))
        await dai.connect(addr1).approve(routerThree.address, Dai(1000000))

        await usdt.connect(addr1).approve(routerOne.address, Dai(1000000))
        await usdt.connect(addr1).approve(routerTwo.address, Dai(1000000))
        await usdt.connect(addr1).approve(routerThree.address, Dai(1000000))


        await weth.connect(addr1).approve(routerTwo.address, Eth(20))
        await weth.connect(addr1).approve(routerTwo.address, Eth(200))
        //1Eth /100 Dai
        await routerOne.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(10000),
            Dai(10000),
            Eth(0.25),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(100) }
        ,)
        //1Eth / 100 USDT
        await routerTwo.connect(addr1).addLiquidity(
            usdt.address,
            weth.address,
            USDT(10000),
            Eth(100),
            USDT(10000),
            Eth(100),
            addr1.address,
            new Date().getTime() + 3600
        ,)
        //1Eth / 500 Dai
        await routerTwo.connect(addr1).addLiquidity(
            dai.address,
            weth.address,
            Dai(10000),
            Eth(20),
            Dai(10000),
            Eth(20),
            addr1.address,
            new Date().getTime() + 3600
        ,)


        const wethDaiPairOneAddress = await uniswapFactoryOne.getPair(weth.address, dai.address);
        const wethUSDTPairTwoAddress = await uniswapFactoryTwo.getPair(weth.address, usdt.address);
        const wethDaiPairThreeAddress = await uniswapFactoryTwo.getPair(weth.address, dai.address);

        wethDaiPairOne = await getPair(wethDaiPairOneAddress);
        wethUsdtPairTwo = await getPair(wethUSDTPairTwoAddress);
        wethDaiPairThree = await getPair(wethDaiPairThreeAddress);

        console.log("wethDaiPairOne @ ",wethDaiPairOne.address)
        console.log("wethUsdtPairTwo @ ",wethUsdtPairTwo.address)
        console.log("wethDaiPairThree @ ",wethDaiPairThree.address)

        multiCall = await mockMultiCall();
        multiWrapper = await mockMultiWrapper();

        oracle1 = await mockUniswapOracle(uniswapFactoryOne);
        oracle2 = await mockUniswapOracle(uniswapFactoryTwo);
        oracle3 = await mockUniswapOracle(uniswapFactoryThree);

        offchainOracle = await mockOracle(multiWrapper, [oracle1.address, oracle2.address, oracle3.address], [
            BigNumber.from(0),
            BigNumber.from(0),
            BigNumber.from(0)
        ],
            [weth.address,dai.address,usdt.address], weth)


    });


    it.only("1inch aggregator", async () => {

        const res = await offchainOracle.getRateToEth(
            dai.address,
            true
        )
        console.log(res)
    })


})

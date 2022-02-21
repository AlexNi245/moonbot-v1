import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ArbitrageOpportunity } from "bot/interfaces";
import { evaluteProfitInPools } from "./../bot/moonbot";
import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { IERC20, UniswapV2Factory, UniswapV2Pair, UniswapV2Query, UniswapV2Router02, WETH9, Executor } from "typechain";
import { Dai, Eth, printEth, USDT } from "./../utils/ERC20Utils";
import { mockToken, mockWeth } from "./utils/Erc20Utils";
import { mockExecutor, mockUniswapV2Query } from "./utils/MoonbotUtils";
import { getPair, setUpFactory, setUpRouter } from "./utils/UniswapUtils";

describe.only("FlashswapTest", () => {
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




    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        console.log("OWNER @ ", owner.address)
        console.log("ADDR1 @ ", addr1.address)
        console.log("ADDR2 @ ", addr2.address)

        weth = await mockWeth();
        dai = await mockToken("Dai")
        usdt = await mockToken("USDC")

        uniswapV2Query = await mockUniswapV2Query();
        executor = await mockExecutor(weth)

        uniswapFactoryOne = await setUpFactory(owner);
        uniswapFactoryTwo = await setUpFactory(owner);
        uniswapFactoryThree = await setUpFactory(owner);

        routerOne = await setUpRouter(uniswapFactoryOne, weth);
        routerTwo = await setUpRouter(uniswapFactoryTwo, weth);
        routerThree = await setUpRouter(uniswapFactoryThree, weth);


        await addr1.sendTransaction({ to: weth.address, value: 100000 })

        await dai.connect(owner).transfer(addr1.address, Dai(100000))
        await usdt.connect(owner).transfer(addr1.address, USDT(100000))

        //Allow addr1 to add liquidity
        await dai.connect(addr1).approve(routerOne.address, Dai(1000000))
        await dai.connect(addr1).approve(routerTwo.address, Dai(1000000))
        await dai.connect(addr1).approve(routerThree.address, Dai(1000000))

        await usdt.connect(addr1).approve(routerOne.address, USDT(1000000))
        await usdt.connect(addr1).approve(routerTwo.address, USDT(1000000))
        await usdt.connect(addr1).approve(routerThree.address, USDT(1000000))

        await routerOne.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(10000),
            Dai(10000),
            Eth(0.25),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(100) }
        ,)

        await routerTwo.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(10000),
            Dai(10000),
            Eth(0.25),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(20) }
        ,)

        await routerThree.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(10000),
            Dai(10000),
            Eth(0.25),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(10) }
        ,)



        const wethDaiPairOneAddress = await uniswapFactoryOne.getPair(weth.address, dai.address);
        const wethDaiPairTwoAddress = await uniswapFactoryTwo.getPair(weth.address, dai.address);
        const wethDaiPairThreeAddress = await uniswapFactoryThree.getPair(weth.address, dai.address);

        wethDaiPairOne = await getPair(wethDaiPairOneAddress);
        wethDaiPairTwo = await getPair(wethDaiPairTwoAddress);
        wethDaiPairThree = await getPair(wethDaiPairThreeAddress);


        const sender = addr1.address;
        const amount0In = BigNumber.from(1);
        const amount1In = BigNumber.from(1);
        const amount0Out = BigNumber.from(1);
        const amount1Out = BigNumber.from(1);




    });
    it("Test1", async () => {
        const ammountIn = Eth(0.123);
        await dai.connect(addr1).approve(executor.address, Dai(10000));
        const p0t0 = await wethDaiPairOne.token0()
        const p0t1 = await wethDaiPairOne.token1()
        const p1t0 = await wethDaiPairTwo.token0()
        const p1t1 = await wethDaiPairTwo.token1()

        console.log(`Pair One : ${wethDaiPairOne.address} Token 0 : ${p0t0} Token 1 : ${p0t1}`);
        console.log(`Pair Two : ${wethDaiPairTwo.address} Token 0 : ${p1t0} Token 1 : ${p1t1}`);


        const [opportunity]: ArbitrageOpportunity[] = await evaluteProfitInPools(ethers.provider, uniswapV2Query.address,
            [
                wethDaiPairOne.address,
                wethDaiPairTwo.address,

            ], weth.address);


        console.log(opportunity);

        console.log(`Buy ${printEth(opportunity.amountIn)} ETH`);

        await executor.swap(opportunity.amountIn, opportunity.token1, opportunity.pairs);
    })
})
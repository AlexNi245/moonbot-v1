import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { tryExecution } from "./../bot/uniswap/executor/onChainExecutor";
import { assert } from "console";
import hre, { ethers } from "hardhat";
import { Executor, IERC20, UniswapV2Factory, UniswapV2Pair, UniswapV2Query, UniswapV2Router02, WETH9 } from "typechain";
import { Dai, Eth, printEth, USDT } from "../utils/ERC20Utils";
import { evaluteProfitInPools } from "./../bot/moonbot";
import { mockToken, mockWeth } from "./utils/Erc20Utils";
import { mockExecutor, mockUniswapV2Query } from "./utils/MoonbotUtils";
import { getPair, setUpFactory, setUpRouter } from "./utils/UniswapUtils";
import { BigNumber, Transaction } from "ethers";

describe("Evaluation  test", () => {
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
    let wethUsdcPairTwo: UniswapV2Pair;
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
        usdt = await mockToken("USDT")



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
        await weth.connect(addr1).approve(routerThree.address, Eth(200))
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
        await routerThree.connect(addr1).addLiquidity(
            dai.address,
            weth.address,
            Dai(10000),
            Eth(40),
            Dai(10000),
            Eth(40),
            addr1.address,
            new Date().getTime() + 3600
        ,)


        const wethDaiPairOneAddress = await uniswapFactoryOne.getPair(weth.address, dai.address);
        const wethUsdcPairTwoAddress = await uniswapFactoryTwo.getPair(weth.address, usdt.address);
        const wethDaiPairTwoAddress = await uniswapFactoryTwo.getPair(weth.address, dai.address);
        const wethDaiPairThreeAddress = await uniswapFactoryThree.getPair(weth.address, dai.address);

        wethDaiPairOne = await getPair(wethDaiPairOneAddress);
        wethUsdcPairTwo = await getPair(wethUsdcPairTwoAddress);
        wethDaiPairTwo = await getPair(wethDaiPairTwoAddress);
        wethDaiPairThree = await getPair(wethDaiPairThreeAddress);


    });


    it("simple tade between two pools", async () => {
        const pools = [wethDaiPairThree, wethDaiPairOne].map(p => p.address);
        const opportuities = await evaluteProfitInPools(ethers.provider, uniswapV2Query.address, pools, weth.address);

        const ethDaiTrade = opportuities.find(o => o.direction)

        assert(ethDaiTrade?.pairs[0] === wethDaiPairThree.address);
        assert(ethDaiTrade?.pairs[1] === wethDaiPairOne.address);

        const balanceBefore = await weth.balanceOf(addr2.address);
        await tryExecution(ethers.provider, addr2, executor.address, 1, opportuities);
        const balanceAfter = await weth.balanceOf(addr2.address);

        const profit = balanceAfter.sub(balanceBefore);
        console.log(`Tader made ${printEth(profit)} Eth profit`)
        assert(profit.gt(0));
    })

    it.only("Find opportuities between multiple", async () => {
        const pools = [wethDaiPairThree, wethDaiPairTwo, wethDaiPairOne].map(p => p.address);
        const opportuities = await evaluteProfitInPools(ethers.provider, uniswapV2Query.address, pools, weth.address);

        const filtered = opportuities.filter(o => o.direction)


        const trade = filtered[filtered.length - 1];


        const balanceBefore = await weth.balanceOf(addr2.address);
        await tryExecution(ethers.provider, addr2, executor.address, 1, [trade]);
        const balanceAfter = await weth.balanceOf(addr2.address);

        const profit = balanceAfter.sub(balanceBefore);
        console.log(`Tader made ${printEth(profit)} Eth profit`)
        assert(profit.gt(0));
    })
    it.only("Test transaction", () => {
        const t: Transaction = {
            from: addr1.address,
            to: addr2.address,

            value: BigNumber.from(100),
            nonce: 0,
            gasLimit: BigNumber.from(500),
            gasPrice: BigNumber.from(1234),
            data: "0x787",
            chainId: 0
        }
        
        
    })

})

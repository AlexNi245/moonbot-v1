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
import { tryExecution } from "../bot/uniswap/executor/onChainExecutor";
import mocka from "mocha";
import { assert } from "chai";

describe("FlashswapTest", () => {
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




    // beforeEach(async function () {
    //     [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    //     console.log("OWNER @ ", owner.address)
    //     console.log("ADDR1 @ ", addr1.address)
    //     console.log("ADDR2 @ ", addr2.address)

    //     weth = await mockWeth();
    //     dai = await mockToken("Dai")
    //     usdt = await mockToken("USDC")

    //     uniswapV2Query = await mockUniswapV2Query();
    //     executor = await mockExecutor(weth, addr2);

    //     uniswapFactoryOne = await setUpFactory(owner);
    //     uniswapFactoryTwo = await setUpFactory(owner);
    //     uniswapFactoryThree = await setUpFactory(owner);

    //     routerOne = await setUpRouter(uniswapFactoryOne, weth);
    //     routerTwo = await setUpRouter(uniswapFactoryTwo, weth);
    //     routerThree = await setUpRouter(uniswapFactoryThree, weth);


    //     await addr1.sendTransaction({ to: weth.address, value: Eth(1000) })

    //     await dai.connect(owner).transfer(addr1.address, Dai(100000))

    //     //Allow addr1 to add liquidity
    //     await dai.connect(addr1).approve(routerOne.address, Dai(1000000))
    //     await dai.connect(addr1).approve(routerTwo.address, Dai(1000000))
    //     await dai.connect(addr1).approve(routerThree.address, Dai(1000000))

    //     await routerOne.connect(addr1).addLiquidityETH(
    //         dai.address,
    //         Dai(10000),
    //         Dai(10000),
    //         Eth(100),
    //         addr1.address,
    //         new Date().getTime() + 3600,
    //         { value: Eth(100) }
    //     ,)

    //     await routerTwo.connect(addr1).addLiquidityETH(
    //         dai.address,
    //         Dai(10000),
    //         Dai(10000),
    //         Eth(20),
    //         addr1.address,
    //         new Date().getTime() + 3600,
    //         { value: Eth(20) }
    //     ,)





    //     const wethDaiPairOneAddress = await uniswapFactoryOne.getPair(weth.address, dai.address);
    //     const wethDaiPairTwoAddress = await uniswapFactoryTwo.getPair(weth.address, dai.address);

    //     wethDaiPairOne = await getPair(wethDaiPairOneAddress);
    //     wethDaiPairTwo = await getPair(wethDaiPairTwoAddress);




    // });


    // it("Arbitrage Using Flashswap happy path 2 pools", async () => {
    //     const before = await weth.balanceOf(addr2.address);
    //     const oportunities: ArbitrageOpportunity[] = await evaluteProfitInPools(ethers.provider, uniswapV2Query.address,
    //         [
    //             wethDaiPairOne.address,
    //             wethDaiPairTwo.address,

    //         ], weth.address);

    //     console.log(oportunities)

    //     await tryExecution(ethers.provider, addr2, executor.address, 1, oportunities);
    //     const after = await weth.balanceOf(addr2.address);



    //     const profit = after.sub(before);
    //     console.log(`Trader made ${printEth(profit)} profit `);
    //     assert(profit.gt(BigNumber.from(0)));

    // })

    // it("Arbitrage Using Flashswap happy path 3 pools", async () => {
    //     await routerThree.connect(addr1).addLiquidityETH(
    //         dai.address,
    //         Dai(10000),
    //         Dai(10000),
    //         Eth(0.25),
    //         addr1.address,
    //         new Date().getTime() + 3600,
    //         { value: Eth(10) }
    //     ,)

    //     const wethDaiPairThreeAddress = await uniswapFactoryThree.getPair(weth.address, dai.address);

    //     wethDaiPairThree = await getPair(wethDaiPairThreeAddress);

    //     const before = await weth.balanceOf(addr2.address);
    //     const oportunities: ArbitrageOpportunity[] = await evaluteProfitInPools(ethers.provider, uniswapV2Query.address,
    //         [
    //             wethDaiPairOne.address,
    //             wethDaiPairTwo.address,
    //             wethDaiPairThree.address,

    //         ], weth.address);

    //     console.log(oportunities)

    //     await tryExecution(ethers.provider, addr2, executor.address, 1, oportunities);
    //     const after = await weth.balanceOf(addr2.address);



    //     const profit = after.sub(before);
    //     console.log(`Trader made ${printEth(profit)} profit `);
    //     assert(profit.gt(BigNumber.from(0)));


    // })

    // it("Should be working if WETH == token1", async () => {
    //     await weth.connect(addr1).approve(routerThree.address, Eth(10))

    //     await routerThree.connect(addr1).addLiquidity(
    //         dai.address,
    //         weth.address,
    //         Dai(10000),
    //         Eth(10),
    //         Dai(10000),
    //         Eth(8),
    //         addr1.address,
    //         new Date().getTime() + 3600,

    //     )

    //     const wethDaiPairThreeAddress = await uniswapFactoryThree.getPair(weth.address, dai.address);

    //     wethDaiPairThree = await getPair(wethDaiPairThreeAddress);

    //     const token1 = await wethDaiPairThree.token1();

    //     assert(token1 === weth.address, `token should be weth is ${token1}`);

    //     const before = await weth.balanceOf(addr2.address);
    //     const oportunities: ArbitrageOpportunity[] = await evaluteProfitInPools(ethers.provider, uniswapV2Query.address,
    //         [
    //             wethDaiPairOne.address,
    //             wethDaiPairThree.address,

    //         ], weth.address);

    //     console.log(oportunities)
    //     assert(oportunities[0].pairs[0] === wethDaiPairOne.address, "Buy from pool must be pool 3");

    //     await tryExecution(ethers.provider, addr2, executor.address, 1, oportunities);
    //     const after = await weth.balanceOf(addr2.address);



    //     const profit = after.sub(before);
    //     console.log(`Trader made ${printEth(profit)} profit `);
    //     assert(profit.gt(BigNumber.from(0)));

    // })

    it("Deploy Executor", async () => {
        const deployExecutor = async () => {
            const WGLMR = "0xacc15dc74880c9944775448304b263d191c6077f";
            const OWNER = "0x5e6ab24fc08d53a4ed77aa1a61d08fdb519c080f";
            const f = await ethers.getContractFactory("Executor");
            const addr = await f.deploy(WGLMR, OWNER)
            console.log("new contract deployed at : ", addr.address);
        }


      //await deployExecutor()
    })
})

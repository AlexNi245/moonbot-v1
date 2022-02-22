import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getContractFactory } from "@nomiclabs/hardhat-ethers/types";
import { BigNumber, BigNumberish, Contract } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";
import { ERC20, IERC20, UniswapV2Factory, UniswapV2Query, UniswapV2Router02, WETH9 } from "typechain";
import { mockToken, mockWeth } from "./utils/Erc20Utils";
import { getPricesOfPair, getPair, setUpFactory, setUpRouter, printPricesOfPair } from "./utils/UniswapUtils";
import { evaluteProfitInPools } from "./../bot/moonbot";
import { mockUniswapV2Query } from "./utils/MoonbotUtils";
import { ArbitrageOpportunity } from "./../bot/interfaces";
import { executeTradesViaRouter, getRouter } from "../bot/uniswap/executor/testExecutor";
import { Dai, Eth, printDai, printEth, USDT } from "./../utils/ERC20Utils"
import { assert } from "console";

describe("Uniswaptest", function () {
    let dai: IERC20;
    let weth: WETH9;
    let usdt: IERC20;

    let uniswapFactoryOne: UniswapV2Factory;
    let uniswapFactoryTwo: UniswapV2Factory;
    let uniswapFactoryThree: UniswapV2Factory;

    let routerOne: UniswapV2Router02;
    let routerTwo: UniswapV2Router02;
    let routerThree: UniswapV2Router02;

    let pool1: Contract;
    let pool2: Contract;

    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];

    let uniswapV2Query: UniswapV2Query;

    let getRouter: getRouter;



    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        console.log("OWNER @ ", owner.address)
        console.log("ADDR1 @ ", addr1.address)
        console.log("ADDR2 @ ", addr2.address)

        weth = await mockWeth();
        dai = await mockToken("Dai")
        usdt = await mockToken("USDC")

        uniswapV2Query = await mockUniswapV2Query();

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



        getRouter = (factoryAddress: string) => {
            switch (factoryAddress) {
                case uniswapFactoryOne.address: return routerOne;
                case uniswapFactoryTwo.address: return routerTwo;
                case uniswapFactoryThree.address: return routerThree;
                default: throw "Router not found!"
            }
        }



    });



    it("Trader made some profit using his own eth", async () => {
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

        const balanceBefore = await addr2.getBalance();
        console.log("Start trading at : ", printEth(balanceBefore));

        const daiWethPairOne = await getPair(await uniswapFactoryOne.getPair(dai.address, weth.address));
        const daiWethPairTwo = await getPair(await uniswapFactoryTwo.getPair(dai.address, weth.address));
        const daiWethPairThree = await getPair(await uniswapFactoryThree.getPair(dai.address, weth.address));

        const oportunities: ArbitrageOpportunity[] = await evaluteProfitInPools(ethers.provider, uniswapV2Query.address,
            [
                daiWethPairOne.address,
                daiWethPairTwo.address,
                daiWethPairThree.address,
            ], weth.address);


        await executeTradesViaRouter(ethers.provider, weth.address, getRouter, addr2, oportunities)

 
        const balanceAfter = await addr2.getBalance();
        console.log("Finished trading at : ", printEth(balanceAfter));

        const profit = balanceAfter.sub(balanceBefore);

        console.log(`Trader made ${printEth(profit)}`);


        assert(balanceAfter.gt(balanceBefore));

    })

    it("Trader made some profit using his own token", async () => {

        await routerOne.connect(addr1).addLiquidity(
            dai.address,
            usdt.address,
            Dai(9000),
            USDT(10000),
            Dai(9000),
            USDT(10000),
            addr1.address,
            new Date().getTime() + 3600,
        )

        await routerTwo.connect(addr1).addLiquidity(
            dai.address,
            usdt.address,
            Dai(10000),
            USDT(9000),
            Dai(10000),
            USDT(9000),
            addr1.address,
            new Date().getTime() + 3600,
        )

        const daiUsdtPairOne = await getPair(await uniswapFactoryOne.getPair(dai.address, usdt.address));
        const daiUsdtPairTwo = await getPair(await uniswapFactoryTwo.getPair(dai.address, usdt.address));

        const oportunities: ArbitrageOpportunity[] = await evaluteProfitInPools(ethers.provider, uniswapV2Query.address,
            [
                daiUsdtPairOne.address,
                daiUsdtPairTwo.address,
            ], weth.address);


        const usdtBalanceBefore = await usdt.balanceOf(addr2.address);
        console.log("usdt before : ", usdtBalanceBefore)

        await executeTradesViaRouter(ethers.provider, weth.address, getRouter, addr2, oportunities)

        const usdtBalanceAfter = await usdt.balanceOf(addr2.address);


        console.log("Finished trading at : ", printEth(usdtBalanceBefore));

        const profit = usdtBalanceAfter.sub(usdtBalanceBefore);

        assert(profit.gt(BigNumber.from(0)));

    })


    it("Trader makes profit with flashswap",()=>{
        
    })

    before(async () => {
        const deployNewUniswapV2Query = async () => {
            const f = await ethers.getContractFactory("UniswapV2Query");
            const addr = await f.deploy()
            console.log("new contract deployed at : ", addr.address);
        }


        //   await deployNewUniswapV2Query()
    })
});



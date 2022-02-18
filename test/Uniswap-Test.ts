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


    const Dai = (x: string | number) => ethers.utils.parseUnits(x.toString(), 18);
    const USDT = (x: string | number) => ethers.utils.parseUnits(x.toString(), 6);
    const Eth = (x: string | number) => ethers.utils.parseEther(x.toString());


    const printDai = (x: BigNumberish) => ethers.utils.formatUnits(x, 18);
    const printEth = (x: BigNumberish) => ethers.utils.formatEther(x);

    before(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        console.log("OWNER @ ", owner.address)
        console.log("ADDR1 @ ", addr1.address)
        console.log("ADDR2 @ ", addr2.address)

        weth = await mockWeth();
        dai = await mockToken("Dai", Dai(10000000))
        usdt = await mockToken("USDC", USDT(10000000))

        uniswapV2Query = await mockUniswapV2Query();

        uniswapFactoryOne = await setUpFactory(owner);
        uniswapFactoryTwo = await setUpFactory(owner);
        uniswapFactoryThree = await setUpFactory(owner);

        routerOne = await setUpRouter(uniswapFactoryOne, weth);
        routerTwo = await setUpRouter(uniswapFactoryTwo, weth);
        routerThree = await setUpRouter(uniswapFactoryThree, weth);


        await addr1.sendTransaction({ to: weth.address, value: 100000 })
        await dai.transfer(addr1.address, Dai(3 * 1000000))



        await dai.connect(addr1).approve(routerOne.address, Dai(1000000))
        await dai.connect(addr1).approve(routerTwo.address, Dai(1000000))
        await dai.connect(addr1).approve(routerThree.address, Dai(1000000))


    });

    it("Test", async () => {


        const addr2BeforeDai = await dai.connect(addr2).balanceOf(addr2.address);
        const addr2BeforeEth = await addr2.getBalance();
        console.log("Before DAI balance : ", printDai(addr2BeforeDai));
        console.log("Before ETH balance : ", printEth(addr2BeforeEth));
        await routerOne.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(10000),
            Dai(10000),
            Eth(0.25),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(400) }
        ,)

        await routerTwo.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(10000),
            Dai(10000),
            Eth(0.25),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(350) }
        ,)


        await routerThree.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(100),
            Dai(100),
            Eth(0.25),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(1) }
        ,)



        const daiWethPairOne = await getPair(await uniswapFactoryOne.getPair(dai.address, weth.address));
        const daiWethPairTwo = await getPair(await uniswapFactoryTwo.getPair(dai.address, weth.address));
        const daiWethPairThree = await getPair(await uniswapFactoryThree.getPair(dai.address, weth.address));

        printPricesOfPair(daiWethPairOne, daiWethPairTwo);

        const [first]: [BigNumber, boolean][] = await evaluteProfitInPools(ethers.provider, uniswapV2Query.address,

            [
                daiWethPairOne.address,
                daiWethPairTwo.address,
                //   daiWethPairThree.address,
            ], weth.address);


        const result = await routerTwo.connect(addr2).swapExactETHForTokens(1, [
            weth.address,
            dai.address
        ],
            addr2.address, new Date().getTime() + 3600,
            { value: first[0] }
        );

        await printPricesOfPair(daiWethPairOne, daiWethPairTwo);



        const addr2AfterDai = await dai.connect(addr2).balanceOf(addr2.address);
        const addr2AfterEth = await addr2.getBalance();

        console.log("After DAI balance : ", printDai(addr2AfterDai));
        console.log("After ETH balance : ", printEth(addr2AfterEth));

        await dai.connect(addr2).approve(routerOne.address, addr2AfterDai);

        await routerOne.connect(addr2).swapExactTokensForETH(
            addr2AfterDai,
            10000,
            [
                dai.address,
                weth.address
            ],
            addr2.address,
            new Date().getTime() + 3600
        )

        const addr2FinalDai = await dai.connect(addr2).balanceOf(addr2.address);
        const addr2FinalEth = await addr2.getBalance();

        console.log("Final DAI balance : ", printDai(addr2FinalDai));
        console.log("Final ETH balance : ", printEth(addr2FinalEth));

        console.log(`Profit : ${formatEther(addr2FinalEth.sub(addr2BeforeEth))}`)
        await printPricesOfPair(daiWethPairOne, daiWethPairTwo);
        console.log("done");
    })

});



import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getContractFactory } from "@nomiclabs/hardhat-ethers/types";
import { Contract } from "ethers";
import { formatEther, formatUnits } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";
import { UniswapV2Factory, UniswapV2Router02, WETH9 } from "typechain";
import { mockToken, mockWeth } from "./utils/Erc20Utils";
import { getPricesOfPair, getPair, setUpFactory, setUpRouter } from "./utils/UniswapUtils";


describe("Uniswaptest", function () {

    let routerOne: UniswapV2Router02;
    let routerTwo: UniswapV2Router02;
    let uniswapFactoryOne: UniswapV2Factory;
    let uniswapFactoryTwo: UniswapV2Factory;
    let pool1: Contract;
    let pool2: Contract;
    let dai: Contract;
    let weth: WETH9;
    let usdt: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];



    const Dai = (x: string | number) => ethers.utils.parseUnits(x.toString(), 18);
    const USDT = (x: string | number) => ethers.utils.parseUnits(x.toString(), 6);
    const Eth = (x: string | number) => ethers.utils.parseEther(x.toString());


    before(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        console.log("OWNER @ ", owner.address)
        console.log("ADDR1 @ ", addr1.address)
        console.log("ADDR2 @ ", addr2.address)

        weth = await mockWeth();
        dai = await mockToken("Dai", Dai(10000000))
        usdt = await mockToken("USDC", USDT(10000000))

        uniswapFactoryOne = await setUpFactory(owner);
        uniswapFactoryTwo = await setUpFactory(owner);

        routerOne = await setUpRouter(uniswapFactoryOne, weth);
        routerTwo = await setUpRouter(uniswapFactoryTwo, weth);


        await addr1.sendTransaction({ to: weth.address, value: 100000 })
        await dai.transfer(addr1.address, Dai(2*1000000))


        
        await dai.connect(addr1).approve(routerOne.address, Dai(1000000))
        await dai.connect(addr1).approve(routerTwo.address, Dai(1000000))
    });

    it("Test", async () => {
        await routerOne.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(100),
            Dai(100),
            Eth(0.25),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(4) }
        ,)

        await routerTwo.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(100),
            Dai(100),
            Eth(0.25),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(2) }
        ,)



        const daiWethPairOne = await getPair(await uniswapFactoryOne.getPair(dai.address, weth.address));
        const daiWethPairTwo = await getPair(await uniswapFactoryTwo.getPair(dai.address, weth.address));


        const pair1 = await getPricesOfPair(daiWethPairOne);
        const pair2 = await getPricesOfPair(daiWethPairTwo);

        console.log(`WETH / DAI : ${pair1.price1} DAI /WETH ${pair1.price2} `);
        console.log(`WETH / DAI : ${pair2.price1} DAI /WETH ${pair2.price2} `);

    })

});



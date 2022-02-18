import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { UniswapV2Factory, UniswapV2Router02, WETH9 } from "typechain";
import { mockToken, mockWeth } from "./utils/Erc20Utils";
import { setUpFactory, setUpRouter } from "./utils/UniswapUtils";

describe("Uniswaptest", function () {

    let router: UniswapV2Router02;
    let uniswapFactory: UniswapV2Factory;
    let pool1: Contract;
    let pool2: Contract;
    let dai: Contract;
    let weth: WETH9;
    // let usdc: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];



    const Dai = (x: string | number) => ethers.utils.parseUnits(x.toString(), 18);
    const Eth = (x: string | number) => ethers.utils.parseEther(x.toString());


    before(async function () {
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        console.log("OWNER @ ", owner.address)
        console.log("ADDR1 @ ", addr1.address)
        console.log("ADDR2 @ ", addr2.address)

        weth = await mockWeth();
        dai = await mockToken("Dai", Dai(100000))

        uniswapFactory = await setUpFactory(owner)
        router = await setUpRouter(uniswapFactory, weth);


        await addr1.sendTransaction({ to: weth.address, value: 100000 })
        await dai.transfer(addr1.address, Dai(10000))


        await dai.connect(addr1).approve(router.address, Dai(100))


        await router.connect(addr1).addLiquidityETH(
            dai.address,
            Dai(100),
            Dai(100),
            Eth(1),
            addr1.address,
            new Date().getTime() + 3600,
            { value: Eth(1) }
        ,)


    });






    it("Test", () => {

    })

});



import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { abi as UNISWAP_FACTORY_ABI, evm } from "@uniswap/v2-core/build/UniswapV2Factory.json";
import hre from "hardhat";
import { UniswapV2Factory, UniswapV2Router02, WETH9 } from "typechain";

export const setUpFactory = async (owner: SignerWithAddress): Promise<UniswapV2Factory> => {

    const f = await hre.ethers.getContractFactory(UNISWAP_FACTORY_ABI, evm.bytecode.object);
    const uniswapFactory = await f.deploy(owner.address) as UniswapV2Factory;
    console.log("Factory @ ", uniswapFactory.address);
    return uniswapFactory
}

export const setUpRouter = async (uniswapFactory: UniswapV2Factory, weth: WETH9): Promise<UniswapV2Router02> => {
    const r = await hre.ethers.getContractFactory("UniswapV2Router02");
    const router = await r.deploy(uniswapFactory.address, weth.address) as UniswapV2Router02;
    console.log("Router @ ", router.address)
    return router;
}
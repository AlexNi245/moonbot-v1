import { BigNumber } from "ethers";
import hre from "hardhat";
import { Executor, IERC20, UniswapV2Factory, UniswapV2Pair, UniswapV2Query, UniswapV2Router02, WETH9, Multicall, MultiWrapper, UniswapV2LikeOracle, OffchainOracle ,InitCodeWrapper} from "typechain";

export const mockMultiCall = async () => {
    const f = await hre.ethers.getContractFactory("Multicall");
    const deployed = await f.deploy();
    return deployed as Multicall
}

export const mockMultiWrapper = async () => {
    const f = await hre.ethers.getContractFactory("MultiWrapper");
    const deployed = await f.deploy([]);
    return deployed as MultiWrapper;
}

export const mockOracle = async (multiWrapper: MultiWrapper, oracles: string[], types: BigNumber[], tokens: string[], weth: WETH9) => {
    const f = await hre.ethers.getContractFactory("OffchainOracle");
    const deployed = await f.deploy(multiWrapper.address, oracles, types, tokens, weth.address);
    return deployed as OffchainOracle;

}

export const mockUniswapOracle = async (factory: UniswapV2Factory,) => {
    const initCodeFactory = await hre.ethers.getContractFactory("InitCodeWrapper");
    const icw = await initCodeFactory.deploy();
    const initCode = await icw.initCode();

    console.log(initCode.data)


    const f = await hre.ethers.getContractFactory("UniswapV2LikeOracle");
    const deployed = await f.deploy(factory.address, hre.ethers.utils.formatBytes32String(initCode.data));
    return deployed as UniswapV2LikeOracle;
}
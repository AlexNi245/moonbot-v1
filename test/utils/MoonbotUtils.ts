import hre from "hardhat";
import { UniswapV2Query } from "typechain";

export const mockUniswapV2Query = async (): Promise<UniswapV2Query> => {
    const f = await hre.ethers.getContractFactory("UniswapV2Query")
    return await f.deploy() as UniswapV2Query;
}
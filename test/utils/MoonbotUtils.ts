import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import hre from "hardhat";
import { UniswapV2Query, Executor, WETH9 } from "typechain";

export const mockUniswapV2Query = async (): Promise<UniswapV2Query> => {
    const f = await hre.ethers.getContractFactory("UniswapV2Query")
    return await f.deploy() as UniswapV2Query;
}

export const mockExecutor = async (weth: WETH9, owner: SignerWithAddress) => {
    const f = await hre.ethers.getContractFactory("Executor")
    return await f.deploy(weth.address, owner.address) as Executor;
}
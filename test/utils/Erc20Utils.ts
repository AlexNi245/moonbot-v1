import { IERC20, WETH9 } from "typechain";
import hre, { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { abi as ERC20_ABI, evm as ERC_EVM } from "@uniswap/v2-core/build/ERC20.json";

export const mockWeth = async (): Promise<WETH9> => {
    const w = await hre.ethers.getContractFactory("WETH9");
    const weth = await w.deploy() as WETH9;


    console.log("WETH @ ", weth.address);
    return weth;
}


export const mockToken = async (name: string, initialSupply: BigNumber): Promise<IERC20> => {
    const t = await hre.ethers.getContractFactory(ERC20_ABI, ERC_EVM.bytecode.object);
    const token = await t.deploy(initialSupply) as IERC20;
    console.log(`${name} @ ${token.address}`);
    return token;
}
import { ERC20, WETH9 } from "typechain";
import hre, { ethers } from "hardhat";
import { BigNumber } from "ethers";


export const mockWeth = async (): Promise<WETH9> => {
    const w = await hre.ethers.getContractFactory("WETH9");
    const weth = await w.deploy() as WETH9;


    console.log("WETH @ ", weth.address);
    return weth;
}


export const mockToken = async (name: string): Promise<ERC20> => {
    const t = await hre.ethers.getContractFactory("contracts/ERC20/ERC20.sol:ERC20");
    const token = await t.deploy(name,name) as ERC20;
    console.log(`${name} @ ${token.address}`);
    return token;
}
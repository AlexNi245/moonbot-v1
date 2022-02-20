import { BigNumberish, ethers } from "ethers";

export const Dai = (x: string | number) => ethers.utils.parseUnits(x.toString(), 18);
export const USDT = (x: string | number) => ethers.utils.parseUnits(x.toString(), 6);
export const Eth = (x: string | number) => ethers.utils.parseEther(x.toString());


export const printDai = (x: BigNumberish) => ethers.utils.formatUnits(x, 18);
export const printUSDT = (x: BigNumberish) => ethers.utils.formatUnits(x, 18);
export const printEth = (x: BigNumberish) => ethers.utils.formatEther(x);

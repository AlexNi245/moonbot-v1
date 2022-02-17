import { BigNumber } from "ethers";

export interface V2PoolsGroupedByTokens { [tokenAddress: string]: V2PoolWithReserve[] }


export interface V2PoolWithPrices extends V2PoolWithReserve {
    buyTokenPrice: BigNumber | undefined,
    buyTokenPriceHumanReadable: string
    sellTokenPrice: BigNumber,
    sellTokenPriceHumanReadable: string
}

export interface V2PoolWithReserve {
    token0: string,
    token1: string,
    reserve0: BigNumber;
    reserve1: BigNumber;
    k: BigNumber;
    lastBlockModified: BigNumber;
    address: string;

}

export interface V2PoolWithToken {
    token0: string;
    token1: string;
    address: string
}

export interface Batch {
    poolsAddress: string[];
    start: BigNumber;
    stop: BigNumber
}
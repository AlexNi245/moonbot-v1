import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { ArbitrageOpportunity, V2PoolWithReserve, V2PoolWithToken } from "./interfaces";
import { calcProfitMaximizingTrade } from "./math";
import { filterEmptyPools, getTokenAddresses, groupByTokens } from "./uniswap/pairs";
import { fetchBalanceFromUniswap } from "./uniswap/query";

export const evaluteProfitInPools = async (provider: StaticJsonRpcProvider, uniswapV2QueryAddress: string, pools: string[], target: string): Promise<ArbitrageOpportunity[]> => {

    const poolWithTokens: V2PoolWithToken[] = await Promise.all(pools.map(p => getTokenAddresses(provider, p)));
    const poolsWithReserve: V2PoolWithReserve[] = await fetchBalanceFromUniswap(provider, uniswapV2QueryAddress, poolWithTokens);
    const withoutEmptyPools: V2PoolWithReserve[] = poolsWithReserve.filter(filterEmptyPools);


    const grouped = groupByTokens(withoutEmptyPools, target);


    const res: ArbitrageOpportunity[] = [];

    for (const [_, poolsContainingTheSameToken] of Object.entries(grouped)) {
        if (poolsContainingTheSameToken.length <= 1) {
            continue;
        }
        poolsContainingTheSameToken.forEach(outer => {
            poolsContainingTheSameToken.forEach(inner => {

                const pool0ReserveA = outer.reserve0
                const pool0ReserveB = outer.reserve1;

                const pool1ReserveA = inner.reserve0
                const pool1ReserveB = inner.reserve1;

                const [amountIn, direction] = calcProfitMaximizingTrade(pool0ReserveA, pool0ReserveB, pool1ReserveA, pool1ReserveB);

                const path: [string, string] = direction ? [outer.token0, outer.token1] : [outer.token1, outer.token0];
                const factory: [string, string] = [inner.factory, outer.factory]
                const pairs: [string, string] = [inner.address, outer.address];

                if (amountIn.gt(0)) {
                    res.push({ token0: outer.token0, token1: outer.token1, amountIn, path, direction, factories: factory, pairs })
                }
            })
        })

    }
    return orderByProfit(res.filter(orderFilter));

}



const orderFilter = (opportunity: ArbitrageOpportunity) => {
    return opportunity.direction
}

const orderByProfit = (arbitrageOpportunity: ArbitrageOpportunity[]) => {
   arbitrageOpportunity.sort((a, b) => a.amountIn > b.amountIn ? 0 : 1);
   return arbitrageOpportunity;
}
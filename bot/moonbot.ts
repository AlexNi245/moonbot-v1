import { ethers } from "ethers";
import { V2PoolWithPrices, V2PoolWithReserve, V2PoolWithToken } from "./interfaces";
import { calcProfitMaximizingTrade } from "./math";
import { calcPoolPrices, filterEmptyPools, getTokenAddresses, groupByTokens } from "./uniswap/pairs";
import { fetchBalanceFromUniswap } from "./uniswap/query";







export const evaluteProfitInPools = async (pools: string[], target: string) => {

    const poolWithTokens: V2PoolWithToken[] = await Promise.all(pools.map(getTokenAddresses));
    const poolsWithReserve: V2PoolWithReserve[] = await fetchBalanceFromUniswap(poolWithTokens);

    const withoutEmptyPools: V2PoolWithReserve[] = poolsWithReserve.filter(filterEmptyPools);

    const grouped = groupByTokens(withoutEmptyPools, target);

    const groupedFiltered = [];
    const res = [];

    for (const [_, poolsContainingTheSameToken] of Object.entries(grouped)) {
        if (poolsContainingTheSameToken.length <= 1) {
            continue;
        }
        groupedFiltered.push(poolsContainingTheSameToken);
        const pool0ReserveA = poolsContainingTheSameToken[0].reserve0
        const pool0ReserveB = poolsContainingTheSameToken[0].reserve1;

        const pool1ReserveA = poolsContainingTheSameToken[1].reserve0
        const pool1ReserveB = poolsContainingTheSameToken[1].reserve1;

        res.push(calcProfitMaximizingTrade(pool0ReserveA, pool0ReserveB, pool1ReserveA, pool1ReserveB))
    }

    console.log(groupedFiltered)
    console.log(res)

}

// export const findProfitablePools = (poolsGroupedByTokens: V2PoolsGroupedByTokens) => {

//     const profitablePools: V2PoolWithPrices[][] = [];
//     //Out of curisosity
//     let useLessTokens = 0;
//     let count = 0;

//     for (const [_, poolsContainingTheSameToken] of Object.entries(poolsGroupedByTokens)) {
//         count++;
//         if (poolsContainingTheSameToken.length <= 1) {
//             useLessTokens++;
//             continue;
//         }
//         poolsContainingTheSameToken.forEach(outerPool => {
//             poolsContainingTheSameToken.forEach(innerPool => {
//                 if (outerPool.buyTokenPrice !== undefined && innerPool.sellTokenPrice.gt(outerPool.buyTokenPrice)) {
//                     profitablePools.push([outerPool, innerPool]);
//                 }
//             })
//         })
//     }
//     console.log(`got ${useLessTokens} useless tokens from ${count}`);
//     return profitablePools;
// }

// function getTokensIn(reserveIn: BigNumber, reserveOut: BigNumber, amountOut: BigNumber): BigNumber {
//     return getAmountIn(reserveIn, reserveOut, amountOut);
// }

// function getAmountIn(reserveDai: BigNumber, reserveWeth: BigNumber, amountOut: BigNumber): BigNumber {
//     const numerator: BigNumber = reserveDai.mul(amountOut).mul(1000);
//     const denominator: BigNumber = reserveWeth.sub(amountOut).mul(997);
//     return numerator.div(denominator).add(1);
// }
// function getTokensOut(reserveIn: BigNumber, reserveOut: BigNumber, amountIn: BigNumber): BigNumber {
//     return getAmountOut(reserveIn, reserveOut, amountIn);
// }


// function getAmountOut(reserveWeth: BigNumber, reserveDai: BigNumber, wethIn: BigNumber): BigNumber {
//     const amountInWithFee: BigNumber = wethIn.mul(997);
//     const numerator = wethIn.mul(997).mul(reserveDai);
//     const denominator = reserveWeth.mul(1000).add(wethIn.mul(997));
//     return numerator.div(denominator);
// }


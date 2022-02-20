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

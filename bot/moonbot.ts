import { BigNumber, Contract, ethers, providers, Signer, } from "ethers";
import { abi as UNISWAP_FACTORY_ABI } from "@uniswap/v2-core/build/IUniswapV2Factory.json"
import { abi as UNISWAP_POOL_ABI } from "@uniswap/v2-core/build/IUniswapV2Pair.json"
import { readFileSync, writeFileSync } from "fs";
import { StaticJsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import { formatEther, Interface } from "ethers/lib/utils";
import { UniswapV2Query } from "typechain";
import { sqrt } from "./math";
import { boolean } from "hardhat/internal/core/params/argumentTypes";


export const UNISWAP_FACTORIES = [
    //Beamswap
    "0x985BcA32293A7A496300a48081947321177a86FD",
    //Solarflaire
    "0x19B85ae92947E0725d5265fFB3389e7E4F191FDa"
]

const ETHER = BigNumber.from(10).pow(18);

const TEST_VOLUMES = [
    ETHER.div(100),
    ETHER.div(10),
    ETHER.div(6),
    ETHER.div(4),
    ETHER.div(2),
    ETHER.div(1),
    ETHER.mul(2),
    ETHER.mul(5),
    ETHER.mul(10),
]

var MOONBEAM_PROVIDER = new ethers.providers.StaticJsonRpcProvider('https://rpc.api.moonbeam.network', {
    chainId: 1284,
    name: 'moonbeam'
});

//var MOONBEAM_PROVIDER =  ethers.getDefaultProvider();
export const fetchUniswapPools = async (address: string, provider: providers.Provider) => {

    console.log("fetch pool of : ", address);
    const c = new ethers.Contract(address, UNISWAP_FACTORY_ABI, provider);

    const length = await c.allPairsLength()
    console.log(length)


    let promises = [];

    for (const i of Array(length.toNumber()).keys()) {
        promises.push(c.allPairs(i));
    }



    const pools = (await Promise.allSettled(promises))
        //@ts-ignore
        //  .filter((p): p is PromiseFulfilledResult<string> => p.status !== "rejected")
        .map(p => p.value);

    console.log("Got pools : ", pools.length);
    return pools;

}



export const getUniswapPairs = async (provider: providers.Provider): Promise<string[]> => {
    return (await Promise.all(UNISWAP_FACTORIES
        .map(f => fetchUniswapPools(f, provider))))
        .reduce((agg, current) => { return [...agg, ...current] })
}

export const getTokenAddresses = async (address: string): Promise<V2PoolWithToken> => {
    const c: Contract = new Contract(address, UNISWAP_POOL_ABI, MOONBEAM_PROVIDER);
    const t0 = c.token0();
    const t1 = c.token1();

    const [token0, token1] = await Promise.all([t0, t1]);

    return { token0, token1, address }
}



const getTransactions = async (provider: StaticJsonRpcProvider, address: string) => {
    const iface = new Interface(UNISWAP_POOL_ABI);

    const fromBlock = 388991
    const toBlock = await provider.getBlockNumber();

    const topics = [
        ethers.utils.id("Swap(address,uint256,uint256,uint256,uint256,address)")
    ]


    const logs = (await provider.getLogs({
        fromBlock,
        toBlock,
        address: address,
        topics
    }))

    console.log(logs);

    return logs;

}

export const fetchBalanceFromUniswap = async (pools: V2PoolWithToken[], uniswapV2Query: UniswapV2Query, signer: Signer): Promise<V2PoolWithReserve[]> => {

    const BATCH_SIZE = 100;

    const batches: Batch[] = [];

    pools.forEach((e, idx) => {

        const b = Math.floor(idx / BATCH_SIZE);
        if (batches[b] === undefined) {
            batches[b] = { poolsAddress: [], start: BigNumber.from(0), stop: BigNumber.from(0) }
        }
        const currentBatch = batches[b];

        currentBatch.poolsAddress.push(e.address);
        currentBatch.start = BigNumber.from(0);
        currentBatch.stop = BigNumber.from(idx % BATCH_SIZE);
    });

    const promises = batches.map(({ start, stop, poolsAddress }) => uniswapV2Query.queryReserves(start, stop, poolsAddress));

    const r = await Promise.all(promises);
    return r
        .reduce((agg, cur) => ([...agg, ...cur]), [])
        .map((pool, idx) => ({
            token0: pools[idx].token0.toLowerCase(),
            token1: pools[idx].token1.toLowerCase(),
            reserve0: pool[0],
            reserve1: pool[1],
            k: pool[3],
            lastBlockModified: pool[2],
            address: pools[idx].address
        }))
}

export const filterEmptyPools = (pool: V2PoolWithReserve): boolean => {
    return pool.reserve0.gt(0) && pool.reserve1.gt(0);
}



export const calcPoolPrices = (pool: V2PoolWithReserve, target: string): V2PoolWithPrices => {

    //Rtoken is the resreve of the single token which is a single pool
    //Rtarget is the reserve of the commen token which is included in every pool
    interface BuyPriceArgs { Rtoken: BigNumber, Rtarget: BigNumber, deltaWeth: BigNumber }


    const getBuyPrice = ({ Rtoken, Rtarget, deltaWeth }: BuyPriceArgs) => {
        const numerator = Rtoken.mul(deltaWeth).mul(1000);
        const denominator = Rtarget.sub(deltaWeth).mul(997)


        if (denominator.lte(0)) {
            //Return undefined to filtern them out later on !
            return undefined;
        }
        return numerator.div(denominator)
    }

    const getSellPrice = ({ Rtoken, Rtarget, deltaWeth }: BuyPriceArgs) => {
        const numerator = Rtoken.mul(deltaWeth).mul(997);
        const demoniantor = Rtarget.mul(1000).add(deltaWeth.mul(997))

        return numerator.div(demoniantor)

    }
    //Fiure out why
    const deltaWeth = ETHER.div(1000);
    const { token0, token1, reserve0, reserve1 } = pool;

    if ((token0 !== target && token1 !== target)) {
        throw "Pool must include target "
    }

    const buyTokenPrice = pool.token0 === target ? getBuyPrice({ Rtoken: reserve1, Rtarget: reserve0, deltaWeth }) : getBuyPrice({ Rtoken: reserve0, Rtarget: reserve1, deltaWeth })
    const sellTokenPrice = pool.token0 === target ? getSellPrice({ Rtoken: reserve1, Rtarget: reserve0, deltaWeth }) : getSellPrice({ Rtoken: reserve0, Rtarget: reserve1, deltaWeth })


    const buyTokenPriceHumanReadable = buyTokenPrice === undefined ? "NONE" : formatEther(buyTokenPrice);
    const sellTokenPriceHumanReadable = formatEther(sellTokenPrice);


    return {
        ...pool,
        buyTokenPrice,
        buyTokenPriceHumanReadable,
        sellTokenPrice,
        sellTokenPriceHumanReadable
    }
}

export const groupByTokens = (pools: V2PoolWithPrices[], target: string): V2PoolsGroupedByTokens => {

    const result: V2PoolsGroupedByTokens = {};

    //First group by token

    pools.forEach(p => {
        const { token0, token1 } = p;
        const tokenAddress = token0.toLowerCase() === target.toLowerCase() ? token1.toLowerCase() : token0.toLowerCase();

        if (result[tokenAddress] === undefined) {
            console.log("adding new unique address : ", tokenAddress);
            result[tokenAddress] = []
        }
        result[tokenAddress].push(p);

    })

    return result;
}


export const calcProfitMaximizingTrade = (
    pool0ReserveA: BigNumber,
    pool0ReserveB: BigNumber,
    pool1ReserveA: BigNumber,
    pool1ReserveB: BigNumber): [BigNumber, boolean] => {
    const U = pool1ReserveA.mul(pool0ReserveB).div(pool1ReserveB);
    const direction: boolean = U.lt(pool0ReserveA);

    const k = pool1ReserveA.mul(pool1ReserveB);


    const inputTokenOne = direction ? pool0ReserveA : pool0ReserveB;
    const inputTokenTwo = direction ? pool0ReserveB : pool0ReserveA;

    const thausand = BigNumber.from(1000);
    const nineNineSeven = BigNumber.from(997);
    const zero = BigNumber.from(0);

    const nominator = k.mul(thausand).mul(inputTokenOne);
    const denominator = inputTokenTwo.mul(nineNineSeven);

    const leftSide = sqrt(nominator.div(denominator));

    let rightSide = zero;

    if (direction) {
        const nominator = pool1ReserveA.mul(thausand)
        const denominator = nineNineSeven
        rightSide = nominator.div(denominator);
    } else {
        const nominator = pool1ReserveB.mul(thausand)
        const denominator = nineNineSeven
        rightSide = nominator.div(denominator);
    }

    if (leftSide.lt(rightSide)) {
        return [zero, direction]
    }

    const amountIn = leftSide.sub(rightSide);

    return [amountIn, direction];

}

export interface V2PoolsGroupedByTokens { [tokenAddress: string]: V2PoolWithPrices[] }


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

interface Batch {
    poolsAddress: string[];
    start: BigNumber;
    stop: BigNumber
}

const main = () => {











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

main();
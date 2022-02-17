import { MOONBEAM_PROVIDER } from "../moonbot";
import { BigNumber, Contract, Signer } from "ethers";
import { Batch, V2PoolWithReserve, V2PoolWithToken } from "../interfaces";

import QUERY_ABI from "./queryabi.json"


export const fetchBalanceFromUniswap = async (pools: V2PoolWithToken[],): Promise<V2PoolWithReserve[]> => {

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


    const uniswapV2Query = new Contract("0xA56a54854F1C99A66A4C786CcbA36143B6C33df8", QUERY_ABI,MOONBEAM_PROVIDER)
    const promises = batches.map(({ start, stop, poolsAddress }) => uniswapV2Query.queryReserves(start, stop, poolsAddress));

    const r = await Promise.all(promises);
    return r
        .reduce((agg, cur) => ([...agg, ...cur]), [])
        .map((pool: any, idx: number) => ({
            token0: pools[idx].token0.toLowerCase(),
            token1: pools[idx].token1.toLowerCase(),
            reserve0: pool[0],
            reserve1: pool[1],
            k: pool[3],
            lastBlockModified: pool[2],
            address: pools[idx].address
        }))
}
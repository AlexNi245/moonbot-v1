import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { BigNumber, Contract } from "ethers";
import { Batch, V2PoolWithReserve, V2PoolWithToken } from "../interfaces";
import QUERY_ABI from "./queryabi.json";



export const fetchBalanceFromUniswap = async (provider: StaticJsonRpcProvider, uniswapV2QueryAddress: string, pools: V2PoolWithToken[],): Promise<V2PoolWithReserve[]> => {

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
        currentBatch.stop = BigNumber.from((idx % BATCH_SIZE) + 1);
    });



    const uniswapV2Query = new Contract(uniswapV2QueryAddress, QUERY_ABI, provider)

    const promises = batches.map(({ start, stop, poolsAddress }) => uniswapV2Query.queryReserves(start, stop, poolsAddress));

    const resolvedBatches = await Promise.all(promises);

    const [pairs, factories]: [BigNumber[][], string[]] = resolvedBatches.reduce((agg, cur) => ([...agg, ...cur]), []);

    return pairs
        .map(([reserve0, reserve1, lastBlockModified], idx: number) => ({
            token0: pools[idx].token0.toLowerCase(),
            token1: pools[idx].token1.toLowerCase(),
            reserve0,
            reserve1,
            factory: factories[idx],
            lastBlockModified,
            address: pools[idx].address
        }))
}
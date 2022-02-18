import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { abi as UNISWAP_POOL_ABI } from "@uniswap/v2-core/build/IUniswapV2Pair.json";
import { BigNumber, Contract, ethers } from "ethers";
import { formatEther, Interface } from "ethers/lib/utils";
import { V2PoolsGroupedByTokens, V2PoolWithPrices, V2PoolWithReserve, V2PoolWithToken } from "../interfaces";
import { ETHER } from "./../math";


export const getTokenAddresses = async (provider: StaticJsonRpcProvider, address: string): Promise<V2PoolWithToken> => {
    const c: Contract = new Contract(address, UNISWAP_POOL_ABI, provider);
    const t0 = c.token0();
    const t1 = c.token1();

    const [token0, token1] = await Promise.all([t0, t1]);

    return { token0, token1, address }
}

export const filterEmptyPools = (pool: V2PoolWithReserve): boolean => {
    return pool.reserve0.gt(0) && pool.reserve1.gt(0);
}







//DEPRECATED
//FROM FLASHBOTS EXAMPLE BOT
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


export const groupByTokens = (pools: V2PoolWithReserve[], target: string): V2PoolsGroupedByTokens => {

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
import { ethers, providers } from "ethers";
import { UniswapV2Factory__factory, UniswapV2Pair__factory } from "typechain";

var MOONBEAM_PROVIDER = new ethers.providers.StaticJsonRpcProvider('https://rpc.api.moonbeam.network', {
    chainId: 1284,
    name: 'moonbeam'
});

export const UNISWAP_FACTORIES = [
    //Beamswap
    "0x985BcA32293A7A496300a48081947321177a86FD",
    //Solarflaire
    "0x19B85ae92947E0725d5265fFB3389e7E4F191FDa",
    //StellaSwap
    "0x68A384D826D3678f78BB9FB1533c7E9577dACc0E"
]

export const getUniswapPairs = async (provider: providers.Provider): Promise<string[]> => {
    return (await Promise.all(UNISWAP_FACTORIES
        .map(f => fetchUniswapPairs(f, provider))))
        .reduce((agg, current) => { return [...agg, ...current] })
}

export const getPairFromFactory = (token0: String, token1: string): Promise<any>[] => {
    return UNISWAP_FACTORIES.map(f => {
        const c = new ethers.Contract(f, UniswapV2Factory__factory.abi, MOONBEAM_PROVIDER);
        return c.getPair(token0, token1);
    })
}

export const fetchUniswapPairs = async (address: string, provider: providers.Provider) => {

    console.log("fetch pool of : ", address);
    const c = new ethers.Contract(address, UniswapV2Factory__factory.abi, provider);

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
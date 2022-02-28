import { BigNumber, ethers } from "ethers";
import { getTokenAddresses, UNISWAP_FACTORIES, V2PoolWithToken } from "../moonbot";
import { abi as UNISWAP_FACTORY_ABI } from "@uniswap/v2-core/build/IUniswapV2Factory.json"

const USD_STABLECOIN_POOLS = [
    //USDC
    "0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98", //ceUSDC
    "0x818ec0a7fe18ff94269904fced6ae3dae6d6dc0b", //anyUSDC
    "0x8f552a71efe5eefc207bf75485b356a0b3f01ec9", //madUSDC

    //USDT
    "0x81ecac0d6be0550a00ff064a4f9dd2400585fe9c", //ceUSDT
    "0xefaeee334f0fd1712f9a8cc375f427d9cdd40d73", //anyUSDT
    "0x8e70cd5b4ff3f62659049e74b6649c6603a0e594", //madUSDT

    //BUSD
    "0xa649325aa7c5093d12d6f98eb4378deae68ce23f", //anyBUSD

    //DAI
    "0x765277eebeca2e31912c9946eae1021199b39c61", //anyDai
    "0xc234a67a4f840e61ade794be47de455361b52413", //madDai

    //FRAX
    "0x322e86852e492a7ee17f28a78c663da38fb33bfb" //Frax

];

var MOONBEAM_PROVIDER = new ethers.providers.StaticJsonRpcProvider('https://rpc.api.moonbeam.network', {
    chainId: 1284,
    name: 'moonbeam'
});

export const getStableCoinPools = async (): Promise<V2PoolWithToken[]> => {

    const getPairPromises: Promise<any>[] = [];
    USD_STABLECOIN_POOLS.forEach(outerToken => {
        USD_STABLECOIN_POOLS.forEach(innerToken => {
            const [promise1, promise2] = getPoolsOfGivenTokens(outerToken, innerToken);
            getPairPromises.push(promise1);
            getPairPromises.push(promise2);
        })

    })
    const getPairResults = await Promise.all(getPairPromises)

    const pools = new Set(getPairResults.filter(p => p !== "0x0000000000000000000000000000000000000000"));

    return await Promise.all(Array.from(pools).map(getTokenAddresses))
}

const getPoolsOfGivenTokens = (token0: string, token1: string): Promise<any>[] => {

    return UNISWAP_FACTORIES.map(f => {
        const c = new ethers.Contract(f, UNISWAP_FACTORY_ABI, MOONBEAM_PROVIDER);
        return c.getPair(token0, token1)
    })

}

export const calcDeltas = (deltaA: BigNumber, k: BigNumber, reserveA: BigNumber, reserveB: BigNumber) => {

    const mp = BigNumber.from(1000000); //1 USD
    const phi = BigNumber.from(1); //TODO calc fee propery
    const ONE = BigNumber.from(1);

    const leftPart = mp.mul(deltaA).sub(ONE.div(phi));
    const rightPart = k.div(reserveA.sub(deltaA)).sub(reserveB);
    return leftPart.mul(rightPart)
}

const tenSteps = (reserve0: BigNumber): number[] => [...Array(10).keys()].map(n => reserve0.div(10).mul(BigNumber.from(n + 1))).map(n => n.toNumber())

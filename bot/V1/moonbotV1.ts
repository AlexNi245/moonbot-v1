import { BigNumber, ethers } from "ethers";
import { createWriteStream, readFileSync, writeFile, writeFileSync } from "fs";
import { V2PoolWithToken } from "../interfaces";
import { getUniswapPairs, UNISWAP_FACTORIES } from "../uniswap/factory";
import { fetchBalanceFromUniswap } from "../uniswap/query";
import { filterEmptyPools, getTokenAddresses } from "../uniswap/pairs";
import { buildPathRec, IMark } from "./buildPaths";
import { BEST_POOLS } from "./bestpool"
import GRAPH from "./graph/GRAPH.json"

export const moonbotV1 = () => {
    //INITIAL 

    // fetch all pools 
    // filter pools with low liquidity
    // Compile Graph (currently only start and end with weth)

    // AFTER EACH TRANSACTION 

    // fetch balances
    // find best routes 



}

class MoonbotV1 {
    private provider: ethers.providers.StaticJsonRpcProvider
    private uniswapV2QueryAddress: string
    private target: string;
    private factories: string[];
    private poolWithTokens: V2PoolWithToken[] = [];

    constructor(provider: ethers.providers.StaticJsonRpcProvider, uniswapV2QueryAddress: string, target: string, factories: string[]) {
        this.provider = provider;
        this.uniswapV2QueryAddress = uniswapV2QueryAddress;
        this.target = target;
        this.factories = factories;

    }
    public async init() {
        const graph = GRAPH;
        const allPools: string[] = [];

        graph.forEach(s => s.forEach(ss => allPools.push(ss.address)));

        const uniquePools = Array.from(new Set(allPools))


        console.log(allPools.length, uniquePools.length);

        const poolWithTokensPromises: PromiseSettledResult<V2PoolWithToken>[] = await Promise.allSettled(uniquePools.map(p => getTokenAddresses(this.provider, p)));


        const poolsWithTokens: V2PoolWithToken[] = poolWithTokensPromises.map((p) => {
            if (p.status === "fulfilled") {
                return p.value
            }
        }).filter(p => p !== undefined) as V2PoolWithToken[]

        this.poolWithTokens = this.poolWithTokens;


    }


    // private async fetchPrices() {
    //     const prices = await fetchBalanceFromUniswap(this.provider, this.uniswapV2QueryAddress, this.poolWithTokens)

    //     prices.forEach(p => {
    //         p[p.address] = p
    //     })

    // }

    public async assembleGraph() {
        //const allPairs = await getUniswapPairs(this.provider, this.factories);
        const allPairs = BEST_POOLS;
        const poolWithTokensPromises: PromiseSettledResult<V2PoolWithToken>[] = await Promise.allSettled(allPairs.map(p => getTokenAddresses(this.provider, p)));


        const poolsWithTokens: V2PoolWithToken[] = poolWithTokensPromises.map((p) => {

            if (p.status === "fulfilled") {
                return p.value
            }
        }).filter(p => p !== undefined) as V2PoolWithToken[]


        console.log("pools length : ", poolsWithTokens.length);
        const g = buildPathRec(poolsWithTokens, 0, [], [], this.target)
            .filter(s => s.length < 10)
            .filter(s => {
                const first = s[0];
                const last = s[s.length - 1];

                return (
                    (last.token1.toLowerCase() === this.target.toLowerCase() ||
                        last.token0.toLowerCase() === this.target.toLowerCase())
                        
                        &&
                        (
                        first.token1.toLowerCase() === this.target.toLowerCase() ||
                        first.token0.toLowerCase() === this.target.toLowerCase())

                )
            })
            .filter(s => { return s.find(ss => ss.direction === 2) === undefined })
        console.log(g.length)


        writeFileSync("bestPools1.json", JSON.stringify(g))


        console.log(g.length);
    }
}

const main = async () => {


    const MOONBEAM_PROVIDER = new ethers.providers.StaticJsonRpcProvider('https://rpc.api.moonbeam.network', {
        chainId: 1284,
        name: 'moonbeam'
    });
    const QUERY_ADDRESS = "0xF66face6D10eEF9a9624F255D3931e9a1715F933";

    const TARGET = "0xacc15dc74880c9944775448304b263d191c6077f";



    const moonbot = new MoonbotV1(MOONBEAM_PROVIDER, QUERY_ADDRESS, TARGET, UNISWAP_FACTORIES);
    await moonbot.assembleGraph()

}

main();



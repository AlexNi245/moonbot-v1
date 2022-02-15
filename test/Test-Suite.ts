import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { readFileSync } from "fs";
import { ethers } from "hardhat";
import { UniswapV2Query } from "typechain";
import { calcPoolPrices, fetchBalanceFromUniswap, filterEmptyPools, findProfitablePools, groupByTokens, V2PoolWithToken } from "./../bot/moonbot";


describe("Token contract", function () {

    const GLMR = "0xa649325aa7c5093d12d6f98eb4378deae68ce23f";

    let UniswapV2Factory;
    let uniswapV2Query: UniswapV2Query;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];


    before(async function () {
        //UniswapV2Factory = await ethers.getContractFactory("UniswapV2Query");
        uniswapV2Query = await ethers.getContractAt("contracts/UniswapV2Query.sol:UniswapV2Query", "0x8C49887B69ED1e0709BE718c81EA7bf552fd4797") as UniswapV2Query;
    });

    it("Start moonbot", async () => {
        const poolsWithTokens: V2PoolWithToken[] = JSON.parse(readFileSync("./pools.json", { "encoding": "utf-8" }))
        const poolsIncludingUSDC = poolsWithTokens.filter(b => {
            return b.token0.toLowerCase() === GLMR || b.token1.toLowerCase() === GLMR
        })

        const poolsWithBalances = await fetchBalanceFromUniswap(poolsIncludingUSDC, uniswapV2Query, owner);

        const withoutEmptyPools = poolsWithBalances.filter(filterEmptyPools);

        const poolsWithPrices = withoutEmptyPools.map(p => calcPoolPrices(p, GLMR))

        const test = poolsWithPrices.find((p) => { return p.address.toLowerCase() === "0xab89ed43d10c7ce0f4d6f21616556aecb71b9c5f" })



        const grouped = groupByTokens(poolsWithPrices, GLMR);

        const profitablePools = findProfitablePools(grouped);

        console.log(profitablePools);
        console.log(profitablePools.length);

    })
});

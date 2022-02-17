import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { readFileSync } from "fs";
import { ethers } from "hardhat";
import { UniswapV2Query } from "typechain";
import { calcPoolPrices, calcProfitMaximizingTrade, fetchBalanceFromUniswap, filterEmptyPools, groupByTokens, V2PoolWithPrices, V2PoolWithToken } from "../bot/uniswap/pairs";
import { calcDeltas, getStableCoinPools } from "./../bot/stable";



describe("Token contract", function () {

    const GLMR = "0xacc15dc74880c9944775448304b263d191c6077f"
    const TARGET = GLMR;

    let UniswapV2Factory;
    let uniswapV2Query: UniswapV2Query;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];


    before(async function () {


        const deployNewUniswapV2Query = async () => {
            UniswapV2Factory = await ethers.getContractFactory("UniswapV2Query");
            console.log(UniswapV2Factory)
            const f = await UniswapV2Factory.deploy()
            console.log("new contract deployed at : ", f.address);
        }



        uniswapV2Query = await ethers.getContractAt("contracts/UniswapV2Query.sol:UniswapV2Query", "0xA56a54854F1C99A66A4C786CcbA36143B6C33df8") as UniswapV2Query;
    });

    it("Start moonbot", async () => {
        const poolsWithTokens: V2PoolWithToken[] = JSON.parse(readFileSync("./pools.json", { "encoding": "utf-8" }))
        const poolsIncludingUSDC = poolsWithTokens.filter(b => {
            return b.token0.toLowerCase() === TARGET || b.token1.toLowerCase() === TARGET
        })

        const poolsWithBalances = await fetchBalanceFromUniswap(poolsIncludingUSDC, uniswapV2Query, owner);

        const withoutEmptyPools = poolsWithBalances.filter(filterEmptyPools);

        const poolsWithPrices = withoutEmptyPools.map(p => calcPoolPrices(p, TARGET))



        const grouped = groupByTokens(poolsWithPrices, TARGET);

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



    })

    it.skip("moonbot stables", async () => {
        const pools = await getStableCoinPools()
        const poolsWithBalances = await fetchBalanceFromUniswap(pools, uniswapV2Query, owner);

        const poolsWithPrices: V2PoolWithPrices[] = [];

        poolsWithBalances.forEach(p => {
            poolsWithPrices.push(calcPoolPrices(p, p.token0))
            poolsWithPrices.push(calcPoolPrices(p, p.token1))

        })

        const legitPools = poolsWithPrices.filter(({ buyTokenPrice }) => buyTokenPrice !== undefined)

        const testPool = legitPools.find(p => p.address === "0xa0799832FB2b9F18Acf44B92FbbEDCfD6442DD5e");

        const collectedDeltas = [

        ]


    })


});

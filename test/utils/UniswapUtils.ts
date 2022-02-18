import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { abi as UNISWAP_FACTORY_ABI, evm } from "@uniswap/v2-core/build/UniswapV2Factory.json";
import { BigNumber } from "ethers";
import hre from "hardhat";
import { ERC20, UniswapV2Factory, UniswapV2Pair, UniswapV2Router02, WETH9 } from "typechain";
import BigInteger from "big-integer";

export const setUpFactory = async (owner: SignerWithAddress): Promise<UniswapV2Factory> => {

    const f = await hre.ethers.getContractFactory(UNISWAP_FACTORY_ABI, evm.bytecode.object);
    const uniswapFactory = await f.deploy(owner.address) as UniswapV2Factory;
    console.log("Factory @ ", uniswapFactory.address);
    return uniswapFactory
}

export const setUpRouter = async (uniswapFactory: UniswapV2Factory, weth: WETH9): Promise<UniswapV2Router02> => {
    const r = await hre.ethers.getContractFactory("UniswapV2Router02");
    const router = await r.deploy(uniswapFactory.address, weth.address) as UniswapV2Router02;
    console.log("Router @ ", router.address)
    return router;
}

export const getPair = async (address: string): Promise<UniswapV2Pair> => {
    const f = await hre.ethers.getContractFactory("UniswapV2Pair")
    const pair = f.attach(address) as UniswapV2Pair;
    return pair;
}

export const getPricesOfPair = async (pool: UniswapV2Pair,): Promise<{ priceA: string; priceB: string; }> => {
    const [reserveA, reserveB] = await pool.getReserves();

    const reserveAHex = reserveA._hex.substring(2);
    const reserveBHex = reserveB._hex.substring(2);



    const calc1 = BigInteger(reserveAHex, 16).divmod(BigInteger(reserveBHex, 16))
    const calc2 = BigInteger(reserveBHex, 16).divmod(BigInteger(reserveAHex, 16))

    const priceA = calc1.quotient.toString() + "," + calc1.remainder.toJSNumber(); //Is 0.1 expect 0.25
    const priceB = calc2.quotient.toString() + "," + calc2.remainder.toJSNumber(); //Is 4.0 expect 4.0

    return { priceA, priceB }

}

export const printPricesOfPair = async (...pair: UniswapV2Pair[]) => {
    await Promise.all(pair.map(async p => {
        const { priceA, priceB } = await getPricesOfPair(p);
        console.log(`WETH / DAI : ${priceA} DAI /WETH ${priceB} @ ${p.address}`);
    }))
}
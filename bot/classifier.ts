import { ethers, Transaction } from "ethers";
import { getPairFromFactory } from "./uniswap/factory";
import { evaluteProfitInPools } from "./moonbot";

import { printEth } from ".././utils/ERC20Utils"
import { printArbitrageOpportunities } from "../utils/PrintUtils";
//Wglmr
const TARGET = "0xacc15dc74880c9944775448304b263d191c6077f";
//
const QUERY_ADDRESS = "0xF66face6D10eEF9a9624F255D3931e9a1715F933";


const ROUTER = [
    //Flaire Router
    "0xd3b02ff30c218c7f7756ba14bca075bf7c2c951e",
    //BeamSwapRouter
    "0x96b244391D98B62D19aE89b1A4dCcf0fc56970C7"
]

const MOONBEAM_PROVIDER = new ethers.providers.StaticJsonRpcProvider('https://rpc.api.moonbeam.network', {
    chainId: 1284,
    name: 'moonbeam'
});

export const classifier = () => {

    const provider = new ethers.providers.StaticJsonRpcProvider('https://rpc.api.moonbeam.network', {
        chainId: 1284,
        name: 'moonbeam'
    });

    provider.on("block", async (blocknumber) => {
        const { transactions } = await provider.getBlockWithTransactions(blocknumber);

        console.log("New Block ", blocknumber)
        transactions.forEach(({ to, data, blockNumber }) => {
            if (ROUTER.includes(to!)) {
                evaluateTransaction(data)
            }
        })
    })

}

classifier()

const evaluateTransaction = async (data: string) => {
    const start = new Date();
    console.log("Got Tranaction from router");

    const decodedPoolAddresses = decodeRouterFunctions(data);

    const affectedPools = await getAllAllAffectedPairs(decodedPoolAddresses);

    console.log("the following pools are affected : ", affectedPools);
    if (affectedPools.length > 0) {
        const profit = await evaluteProfitInPools(MOONBEAM_PROVIDER, QUERY_ADDRESS, affectedPools, TARGET);
        console.log(profit.map(printArbitrageOpportunities));
    }
    console.log("Evaluation took : ", new Date().getTime() - start.getTime())
}








const getAllAllAffectedPairs = async (tokenAddresses: string[]) => {
    const promises: Promise<any>[] = [];

    tokenAddresses.forEach(outer => {
        tokenAddresses.forEach(inner => {
            promises.push(...getPairFromFactory(outer, inner));
        })
    })
    const allpools = await Promise.all(promises);

    return Array.from(new Set(allpools)).filter(a => a !== "0x0000000000000000000000000000000000000000")
}

const decodeRouterFunctions = (data: string): string[] => {

    const methodSignature = data.substring(0, 10);


    if (methodSignature === "38ed1739") {
        const iface = new ethers.utils.Interface(['function swapExactTokensForTokens(uint256,uint256,address[],address,uint256)	'])
        const decoded = iface.decodeFunctionData('swapExactTokensForTokens', data);

        return decoded[2];
    }

    if (methodSignature === "8803dbee") {
        const iface = new ethers.utils.Interface(['function swapTokensForExactTokens(uint256,uint256,address[],address,uint256)'])
        const decoded = iface.decodeFunctionData('swapTokensForExactTokens', data);

        return decoded[2];
    }

    if (methodSignature === "0x7ff36ab5") {
        const iface = new ethers.utils.Interface(['function swapExactETHForTokens(uint256,address[],address,uint256)'])
        const decoded = iface.decodeFunctionData('swapExactETHForTokens', data);

        return decoded[1];
    }

    if (methodSignature === "0x7ff36ab5") {
        const iface = new ethers.utils.Interface(['function swapExactETHForTokens(uint256,address[],address,uint256)'])
        const decoded = iface.decodeFunctionData('swapExactETHForTokens', data);

        return decoded[1];
    }

    if (methodSignature === "0x4a25d94a") {
        const iface = new ethers.utils.Interface(['function swapTokensForExactETH(uint256,uint256,address[],address,uint256)'])
        const decoded = iface.decodeFunctionData('swapTokensForExactETH', data);

        return decoded[2];
    }

    if (methodSignature === "0x18cbafe5") {
        const iface = new ethers.utils.Interface(['function swapExactTokensForETH(uint256,uint256,address[],address,uint256)'])
        const decoded = iface.decodeFunctionData('swapExactTokensForETH', data);

        return decoded[2];
    }

    if (methodSignature === "0xfb3bdb41") {
        const iface = new ethers.utils.Interface(['function swapETHForExactTokens(uint256,address[],address,uint256)'])
        const decoded = iface.decodeFunctionData('swapETHForExactTokens', data);

        return decoded[1];

    }



    return [];
}
import { ethers, Wallet } from "ethers";
import { printArbitrageOpportunities } from "../utils/PrintUtils";
import { tryExecution } from "./../bot/uniswap/executor/onChainExecutor";
import { evaluteProfitInPools } from "./moonbot";
import { getPairFromFactory } from "./uniswap/factory";

//Wglmr
const TARGET = "0xacc15dc74880c9944775448304b263d191c6077f";
//
const QUERY_ADDRESS = "0xF66face6D10eEF9a9624F255D3931e9a1715F933";

const EXECUTOR_ADDRESS = "0x79731200Cf650502c67d3a023b1890aE876239A8";

const ROUTER = [
    //Flaire Router
    "0xd3b02ff30c218c7f7756ba14bca075bf7c2c951e",
    //BeamSwapRouter
    "0x96b244391D98B62D19aE89b1A4dCcf0fc56970C7",
    //StellaSwap
    "0xd0A01ec574D1fC6652eDF79cb2F880fd47D34Ab1"
]

const MOONBEAM_PROVIDER = new ethers.providers.StaticJsonRpcProvider('https://rpc.api.moonbeam.network', {
    chainId: 1284,
    name: 'moonbeam'
});




const SIGNER = new Wallet("0xbf919b7161676e72f22662fc352ae667f9fc418bd0ccc14f75386fb23904f739", MOONBEAM_PROVIDER);

export const classifier = async () => {

    // throw"";

    const provider = new ethers.providers.StaticJsonRpcProvider('https://rpc.api.moonbeam.network', {
        chainId: 1284,
        name: 'moonbeam'
    });

    provider.on("block", async (blocknumber) => {
        const { transactions } = await provider.getBlockWithTransactions(blocknumber);

        console.log("New Block ", blocknumber)
        transactions.forEach(({ to, data, blockNumber }) => {
            if (ROUTER.includes(to!)) {
                evaluateTransaction(data, blockNumber!)
            }
        })
    })

}

classifier()

const evaluateTransaction = async (data: string, blockNumber: number) => {
    const start = new Date();
    console.log("Got Tranaction from router");

    const decodedPoolAddresses = decodeRouterFunctions(data);

    const affectedPools = await getAllAllAffectedPairs(decodedPoolAddresses);



    console.log("the following pools are affected : ", affectedPools);
    if (affectedPools.length > 0) {
        const allOpportunities = await evaluteProfitInPools(MOONBEAM_PROVIDER, QUERY_ADDRESS, affectedPools, TARGET);
        const trade = allOpportunities[allOpportunities.length - 1];


        tryExecution(MOONBEAM_PROVIDER, SIGNER, EXECUTOR_ADDRESS, blockNumber, [trade])
        console.log(allOpportunities.map(printArbitrageOpportunities));
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
import { ethers, Transaction } from "ethers";
import { getPairFromFactory } from "./uniswap/factory";
import { evaluteProfitInPools } from "./moonbot";


//Wglmr
const TARGET = "0xacc15dc74880c9944775448304b263d191c6077f";
//
const QUERY_ADDRESS = "0xA56a54854F1C99A66A4C786CcbA36143B6C33df8";


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


            if (ROUTER.includes(to!) && data.substring(0, 10) === "0x38ed1739") {
                handleSwapExactTokensForTokens(data);
            }

            if (ROUTER.includes(to!) && data.substring(0, 10) === "0x7ff36ab5") {
                handleSwapExactETHForTokens(data);
            }

            if ((ROUTER.includes(to!) && data.substring(0, 10) === "0xfb3bdb41")) {
                handleSwapETHForExactTokens(data);
            }

        })
    })

}

classifier()

const handleSwapExactTokensForTokens = async (data: string) => {
    const start = new Date();
    console.log("Got Tranaction swapExactTokensForTokens to router");
    console.log(data);


    const iface = new ethers.utils.Interface(['function swapExactTokensForTokens(uint256,uint256,address[],address,uint256)'])
    const decoded = iface.decodeFunctionData('swapExactTokensForTokens', data);


    const affectedPools = await getAllAllAffectedPairs(decoded[2]);

    console.log(decoded);

    console.log("the following pools are affected : ", affectedPools);

    await evaluteProfitInPools(MOONBEAM_PROVIDER, QUERY_ADDRESS, affectedPools, TARGET);
    console.log("Evaluation took : ", new Date().getTime() - start.getTime())
}

const handleSwapExactETHForTokens = async (data: string) => {
    console.log("Got Tranaction swapExactETHForTokens to router");


    const iface = new ethers.utils.Interface(['function swapExactETHForTokens(uint256,address[],address,uint256)'])
    const decoded = iface.decodeFunctionData('swapExactETHForTokens', data);

    // const affectedPools = await getAllAllAffectedPairs(decoded[2]);

    console.log(decoded);

    // console.log("the following pools are affected : ", affectedPools);
}

const handleSwapETHForExactTokens = async (data: string) => {
    console.log("Got Tranaction swapETHForExactTokens to router");


    const iface = new ethers.utils.Interface(['function swapETHForExactTokens(uint256,address[],address,uint256)'])
    const decoded = iface.decodeFunctionData('swapETHForExactTokens', data);

    //  const affectedPools = await getAllAllAffectedPairs(decoded[2]);

    console.log(decoded);

    //  console.log("the following pools are affected : ", affectedPools);
}


const handleSwapExactTokensForETH = () => { }





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
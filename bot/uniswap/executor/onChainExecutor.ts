import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { BigNumber, Contract, ethers, Transaction } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ArbitrageOpportunity } from "../../interfaces";
import { ETHER } from "../../math";
import { abi as EXECUTOR_ABI } from "./../../../artifacts/contracts/Executor.sol/Executor.json";
import { Executor } from "typechain";
import { Eth, printEth } from "./../../../utils/ERC20Utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const tryExecution = async (provider: StaticJsonRpcProvider, signer: ethers.Signer, executorAdress: string, blockNumber: number, arbitrageOpportunity: ArbitrageOpportunity[]) => {
    const t = arbitrageOpportunity.filter(transactionFilter).map(o => executeOnChain(provider, signer, executorAdress, o, blockNumber));
    const res = await Promise.allSettled(t);

    console.log(res);
}


const transactionFilter = (arbitrageOpportunity: ArbitrageOpportunity) => {
    if (arbitrageOpportunity.amountIn.lt(Eth(1))) {
        console.log(printEth(arbitrageOpportunity.amountIn));
        console.log("Profit is to low");
        return false;
    }
    return true;

}

const executeOnChain = async (provider: StaticJsonRpcProvider, signer: ethers.Signer, executorAdress: string, arbitrageOpportunity: ArbitrageOpportunity, blockNumber: number) => {
    const executor = new Contract(executorAdress, EXECUTOR_ABI, signer) as Executor
    console.log(arbitrageOpportunity);
    await executor.trade(arbitrageOpportunity.amountIn, arbitrageOpportunity.pairs, blockNumber, {

        gasLimit: 300000,
        gasPrice: 100000000000

    });
    provider.on("pending", async (tx: Transaction) => {
        const transactions = await provider.send("txpool_content", []);
        const pending = transactions.pending as Tx[];
        const flatten: Transaction[] = [];
        for (const [_, transactions] of Object.entries(pending)) {
            flatten.push(...Object.values(transactions));
        }
        flatten.sort((a: Transaction, b: Transaction) => {
            const aBN = BigNumber.from(a.gasPrice)
            const bBN = BigNumber.from(b.gasPrice)
            return aBN?.gt(bBN) ? -1 : 1
        })
        const highestBid = flatten[0];
        const signerAddress = await signer.getAddress();
        if (highestBid.from !== signerAddress) {
            console.log("highest bit is not my transaction");
            const newGasPrice = BigNumber.from(highestBid.gasPrice).add(1000);
            await executor.trade(arbitrageOpportunity.amountIn, arbitrageOpportunity.pairs, blockNumber, {
                gasLimit: 300000,
                gasPrice: newGasPrice

            });
        }

    });


}

const nonce: unique symbol = Symbol();
export interface Tx { address: string, [nonce]: Transaction[] }

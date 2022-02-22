import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { BigNumber, Contract, ethers } from "ethers";
import { parseUnits } from "ethers/lib/utils";
import { ArbitrageOpportunity } from "../../interfaces";
import { ETHER } from "../../math";
import { abi as EXECUTOR_ABI } from "./../../../artifacts/contracts/Executor.sol/Executor.json";
import { Executor } from "typechain";
import { Eth, printEth } from "./../../../utils/ERC20Utils";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const tryExecution = async (provider: StaticJsonRpcProvider, signer: ethers.Signer, executorAdress: string, arbitrageOpportunity: ArbitrageOpportunity[]) => {
    const t = arbitrageOpportunity.filter(transactionFilter).map(o => executeOnChain(provider, signer, executorAdress, o));
    const res = await Promise.allSettled(t);

    console.log(res);
}


const transactionFilter = (arbitrageOpportunity: ArbitrageOpportunity) => {
    if (!arbitrageOpportunity.direction) {
        console.log("Wrong direction");
        return false;
    }

    if (arbitrageOpportunity.amountIn.lt(Eth(1))) {
        console.log(printEth(arbitrageOpportunity.amountIn));
        console.log("Profit is to low");
        return false;
    }
    return true;

}

const executeOnChain = async (provider: StaticJsonRpcProvider, signer: ethers.Signer, executorAdress: string, arbitrageOpportunity: ArbitrageOpportunity) => {
    const executor = new Contract(executorAdress, EXECUTOR_ABI, signer) as Executor
    return await executor.trade(arbitrageOpportunity.amountIn, arbitrageOpportunity.pairs, {
        gasLimit: 300000
    });

}


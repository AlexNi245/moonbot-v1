import { StaticJsonRpcProvider, WebSocketProvider } from "@ethersproject/providers";
import { BigNumber, Transaction, ethers } from "ethers"


export const TransactionGuard = (provider: StaticJsonRpcProvider,) => {
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
        return [0]
    });
}

const nonce: unique symbol = Symbol();
export interface Tx { address: string, [nonce]: Transaction[] }

const MOONBEAM_PROVIDER = new ethers.providers.WebSocketProvider('ws://192.168.0.172:9944', {
    chainId: 1284,
    name: 'moonbeam'
});

TransactionGuard(MOONBEAM_PROVIDER);

//0x8a2065a9d6825ab0f1739d5c2185ff187635961b
//0xA6bAa075fB5CF4721B43fE068eE81B56f34fA06d (swap)
import { ethers } from "ethers";

const MOONBEAM_PROVIDER = new ethers.providers.StaticJsonRpcProvider('https://rpc.api.moonbeam.network', {
    chainId: 1284,
    name: 'moonbeam'
});

const analyzeTransaction = async () => {
    const tx = "0xfb0c9b1cd98bcbf1447a313f98a45794f49995bcf44d6977089c3a7cb49c8ab1"
    const r = await MOONBEAM_PROVIDER.getTransactionReceipt(tx);
    console.log(r);
}

analyzeTransaction();
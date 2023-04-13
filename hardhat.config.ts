/**
 * @type import('hardhat/config').HardhatUserConfig
 */

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-solhint";
import "@typechain/hardhat";
import "dotenv/config";
import "hardhat-deploy";
import "solidity-coverage";

import "./tasks/accounts";
import "./tasks/balance";
import "./tasks/block-number";
import "./tasks/create-collectibles";

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const accounts = {
    // use default accounts
    mnemonic: `test test test test test test test test test test test junk`,
};
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            // accounts,
            // chainId: 1284,
            // name: 'moonbeam',
            // loggingEnabled: false,
            // forking: {
            //     url: "https://moonbeam-api.bwarelabs.com/2ef54577-655b-418e-b168-3ad0695dd7fa",
            //     blockNumber: 180643,
            // },
            allowUnlimitedContractSize: true,
        },
        moonbeam: {
            url: "https://moonbeam-api.bwarelabs.com/2ef54577-655b-418e-b168-3ad0695dd7fa",
            chainId: 1284, //(hex: 0x504),
            accounts: [PRIVATE_KEY], // Insert your private key here
        },
        localhost: {},
    },
    solidity: {
        compilers: [
            {
                version: "0.5.1",
            },
            {
                version: "0.5.16",
            },
            {
                version: "0.6.6",
            },
        ],
    },
    mocha: {
        timeout: 100000,
    },
    typechain: {
        outDir: "typechain",
        target: "ethers-v5",
    },
};

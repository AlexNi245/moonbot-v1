import { Signer } from "ethers";
import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { UniswapV2Query, UniswapV2Query__factory } from "../typechain";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    let accounts: Signer[];
    let uniswapV2QueryContract: UniswapV2Query;

    accounts = await hre.ethers.getSigners();

    console.log(await accounts[0].getAddress());

    const uniswapV2QueryContractFactory = (await hre.ethers.getContractFactory(
        "UniswapV2Query",
        accounts[0]
    )) as UniswapV2Query__factory;

    uniswapV2QueryContract = await uniswapV2QueryContractFactory.deploy();

    console.log(
        `The address the Contract WILL have once mined: ${uniswapV2QueryContract.address}`
    );

    console.log(
        `The transaction that was sent to the network to deploy the Contract: ${uniswapV2QueryContract.deployTransaction.hash}`
    );

    console.log(
        "The contract is NOT deployed yet; we must wait until it is mined..."
    );

    await uniswapV2QueryContract.deployed();

};
//func.id = "uniswap_query_deploy";
//func.tags = ["local"];
export default func;

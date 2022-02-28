// import { StaticJsonRpcProvider } from "@ethersproject/providers";
// import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import { BigNumber, Contract } from "ethers";
// import { ERC20, UniswapV2Router02 } from "typechain";
// import { ArbitrageOpportunity, Path } from "../../interfaces";
// import { printDai, printEth } from "../../../utils/ERC20Utils";

// export const executeTradesViaRouter = async (provider: StaticJsonRpcProvider, weth: string, getRouter: getRouter, trader: SignerWithAddress, opportunities: ArbitrageOpportunity[]) => {

//     const profits: BigNumber[] = [];

//     const buyOportunities = opportunities.filter(o => o.direction)

//     for (const order of buyOportunities) {
//         const curretnB = await trader.getBalance();


//         const tradeDirection: TradeDirection = getTradeDirection(weth, order.path);


//         if (tradeDirection === TradeDirection.WETH_FOR_TOKEN) {
//             const { amountIn, path, factories } = order;
//             const [buyFactory, sellFactory] = factories;
//             const tokenReceived = await swapWethForToken(provider, getRouter, trader, amountIn, path, buyFactory)

//             const sellPath: Path = path.reverse() as Path;
//             const profit = await swapTokenForWeth(provider, getRouter, trader, tokenReceived, sellPath, sellFactory);
//             profits.push(profit);
//         }
//         if (tradeDirection === TradeDirection.TOKEN_FOR_TOKEN) {
//             const { amountIn, path, factories } = order;
//             const [buyFactory, sellFactory] = factories;
//         }
//     }
// }

// const swapWethForToken = async (provider: StaticJsonRpcProvider, getRouter: getRouter, trader: SignerWithAddress, amountIn: BigNumber, path: Path, factory: string) => {
//     const router = getRouter(factory);
//     const token = new Contract(path[1], ERC20_ABI, provider) as ERC20;
//     const before = await token.balanceOf(trader.address);

//     await router.connect(trader).swapExactETHForTokens(
//         amountIn,
//         path,
//         trader.address, new Date().getTime() + 3600,
//         { value: amountIn }
//     );

//     const after = await token.balanceOf(trader.address);
//     return after.sub(before);
// }

// const swapTokenForWeth = async (provider: StaticJsonRpcProvider, getRouter: getRouter, trader: SignerWithAddress, amountIn: BigNumber, path: Path, factory: string,) => {

//     const router = getRouter(factory);
//     const token = new Contract(path[0], ERC20_ABI, provider)
//     await token.connect(trader).approve(router.address, amountIn);
  
//     const before = await trader.getBalance();

//     await router.connect(trader).swapExactTokensForETH(
//         amountIn,
//         1,
//         path,
//         trader.address,
//         new Date().getTime() + 3600
//     )

//     const after = await trader.getBalance();

//     return after.sub(before);
// }

// //TODO build token for token later on 
// const swapTokenForToken = () => {

// }

// const getTradeDirection = (weth: string, path: Path) => {
//     const wethToLower = weth.toLowerCase();
//     if (path[0] === wethToLower) return TradeDirection.WETH_FOR_TOKEN;
//     if (path[1] === wethToLower) return TradeDirection.TOKEN_FOR_WETH;
//     return TradeDirection.TOKEN_FOR_TOKEN;
// }

// enum TradeDirection {
//     "WETH_FOR_TOKEN",
//     "TOKEN_FOR_WETH",
//     "TOKEN_FOR_TOKEN"
// }

// export type getRouter = (factoryAddress: string) => UniswapV2Router02;
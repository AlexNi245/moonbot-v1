import { ArbitrageOpportunity } from "../bot/interfaces";
import { printEth } from "./ERC20Utils";

export const printArbitrageOpportunities = (arbitrageOpportunity: ArbitrageOpportunity) => {
    if(arbitrageOpportunity.direction){
        console.log(`Buy Token ${arbitrageOpportunity.token0} worth of ${printEth(arbitrageOpportunity.amountIn)}`)
    console.log("Path : ", arbitrageOpportunity.path)
    console.log("Direction : ", arbitrageOpportunity.direction)
    }
}
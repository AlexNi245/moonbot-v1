import { V2PoolWithToken } from "bot/interfaces";
import { UniswapV2Pair } from "typechain";


export const buildPathRec = (pairs: V2PoolWithToken[], depth = 0, subset: IMark[], result: IMark[][], target: string) => {
    //We dont need subsets only containing one pair
    if (depth === pairs.length) {
        if (subset.length >= 2) {
            result.push(subset)
        }
    }
    else {
        buildPathRec(pairs, depth + 1, subset, result, target);

        const token0 = pairs[depth].token0.toLowerCase();
        const token1 = pairs[depth].token1.toLowerCase();
        let direction;
        //Direction of empty set allways should be ether
        //Maybe it could make sense to inverse direction so any value could be flashloaned and ether is the
        if (subset.length === 0) {
            direction = token0 === target ? 0 : 1
        } else {
            const connector = subset[subset.length - 1];
            const connToken = connector.token1.toLowerCase();
            direction = connToken === token0 ? 0 : connToken === token1 ? 1 : 2
        }
        const curretnMark = mark(pairs[depth], direction)
        //recursion should stop once an invalid path was detected;
        // if (direction !== 2) {
        buildPathRec(pairs, depth + 1, [...subset, curretnMark], result, target);
        //  }
    }
    return result;
}

const mark = ({ address, token0, token1 }: V2PoolWithToken, direction: number): IMark => {
    return {
        direction,
        token0: direction === 0 ? token0 : token1,
        token1: direction === 0 ? token1 : token0,
        address
    } as IMark;
}

export interface IMark {
    //0==aTOb
    //1==bTOa
    direction: number;
    token0: string;
    token1: string;
    address: string;
}
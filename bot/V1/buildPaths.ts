import { V2PoolWithToken } from "bot/interfaces";
import { UniswapV2Pair } from "typechain";

export const buildPaths = (allPairs: V2PoolWithToken[], target: string) => {
    const result: IMark[][] = [];
    //Maybe the soulution could be allPairs.length/2 
    outer:
    for (let n: number = 0; n < allPairs.length; n++) {


        const beginning = allPairs[n];
        const direction = beginning.token0 === target ? 0 : 1;
        const subpath: IMark[] = [mark(beginning, direction)]


        //Skip if trade starts not with weth
        if (subpath[0].token0 !== target) {
            continue;
        }

        inner:
        for (let k: number = 0; k < allPairs.length; k++) {
            const current = allPairs[k];
            const connector = subpath[subpath.length - 1];

            //Dont need to compare the same pools;
            if (connector.address === current.address) {
                console.log("Pairs are the same");
                continue;
            }
            //Connector token one which is always the end of the path must be included in one of the current pools. Else skip
            if (!(connector.token1 === current.token0 || connector.token1 === current.token1)) {
                console.log("Pairs have nothing in common");
                continue;
            }
            const direction = connector.token1 === current.token0 ? 0 : 1;
            subpath.push(mark(current, direction));


            const first = subpath[0];
            const last = subpath[subpath.length - 1];

            if (first.token0 == last.token1) {
                result.push(subpath);
                continue;
            }
        }
    }
    return result;
}

export const buildPathRec = (pairs: V2PoolWithToken[], depth = 0, subset: IMark[], result: IMark[][], target: string) => {
    //We dont need subsets only containing one pair
    if (depth === pairs.length) {
        if (subset.length >= 2) {
            result.push(subset)
        }
    }
    else {
        buildPathRec(pairs, depth + 1, subset, result, target);

        const { token0, token1 } = pairs[depth];
        let direction;
        //Direction of empty set allways should be ether
        //Maybe it could make sense to inverse direction so any value could be flashloaned and ether is the result
        if (subset.length === 0) {
            direction = token0 === target ? 0 : token1 === target ? 1 : 2
        } else {
            const connector = subset[subset.length - 1];
            direction = connector.token1 === token0 ? 0 : connector.token1 === token1 ? 1 : 2
        }
        const curretnMark = mark(pairs[depth], direction)
        //recursion should stop once an invalid path was detected;
        if (direction !== 2) {
            buildPathRec(pairs, depth + 1, [...subset, curretnMark], result, target);
        }
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

interface IMark {
    //0==aTOb
    //1==bTOa
    direction: number;
    token0: string;
    token1: string;
    address: string;
}
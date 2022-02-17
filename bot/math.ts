import { BigNumber, ethers } from "ethers";

export function sqrt(x: BigNumber) {
    const ONE = ethers.BigNumber.from(1);
    const TWO = ethers.BigNumber.from(2);

    let z = x.add(ONE).div(TWO);
    let y = x;
    while (z.sub(y).isNegative()) {
        y = z;
        z = x.div(z).add(z).div(TWO);
    }
    return y;
}

export const ETHER = BigNumber.from(10).pow(18);

export const calcProfitMaximizingTrade = (
    pool0ReserveA: BigNumber,
    pool0ReserveB: BigNumber,
    pool1ReserveA: BigNumber,
    pool1ReserveB: BigNumber): [BigNumber, boolean] => {
    const U = pool1ReserveA.mul(pool0ReserveB).div(pool1ReserveB);
    const direction: boolean = U.lt(pool0ReserveA);

    const k = pool1ReserveA.mul(pool1ReserveB);


    const inputTokenOne = direction ? pool0ReserveA : pool0ReserveB;
    const inputTokenTwo = direction ? pool0ReserveB : pool0ReserveA;

    const thausand = BigNumber.from(1000);
    const nineNineSeven = BigNumber.from(997);
    const zero = BigNumber.from(0);

    const nominator = k.mul(thausand).mul(inputTokenOne);
    const denominator = inputTokenTwo.mul(nineNineSeven);

    const leftSide = sqrt(nominator.div(denominator));

    let rightSide = zero;

    if (direction) {
        const nominator = pool1ReserveA.mul(thausand)
        const denominator = nineNineSeven
        rightSide = nominator.div(denominator);
    } else {
        const nominator = pool1ReserveB.mul(thausand)
        const denominator = nineNineSeven
        rightSide = nominator.div(denominator);
    }

    if (leftSide.lt(rightSide)) {
        return [zero, direction]
    }

    const amountIn = leftSide.sub(rightSide);

    return [amountIn, direction];

}
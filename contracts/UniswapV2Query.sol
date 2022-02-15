pragma solidity >=0.8.0;

//import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";

contract UniswapV2Query {
    // using SafeMath for uint256;

    function queryReserves(
        uint256 start,
        uint256 stop,
        address[] calldata _pools
    ) public view returns (uint256[3][] memory) {
        uint256 i = start;
        uint256[3][] memory result = new uint256[3][](_pools.length);

        for (i; i < stop; i++) {
            IUniswapV2Pair pool = IUniswapV2Pair(_pools[i]);
            (result[i][0], result[i][1], result[i][2]) = pool.getReserves();
        }

        return result;
    }
}

interface IUniswapV2Pair {
    function token0() external view returns (address);

    function token1() external view returns (address);

    function getReserves()
        external
        view
        returns (
            uint112 reserve0,
            uint112 reserve1,
            uint32 blockTimestampLast
        );
}

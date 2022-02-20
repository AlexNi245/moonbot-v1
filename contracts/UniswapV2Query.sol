pragma solidity >=0.6.6;

//import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract UniswapV2Query {
    // using SafeMath for uint256;

    function queryReserves(
        uint256 start,
        uint256 stop,
        address[] memory _pools
    ) public view returns (uint256[3][] memory, address[] memory) {
        uint256 i = start;
        uint256[3][] memory result = new uint256[3][](_pools.length);
        address[] memory factories = new address[](_pools.length);

        for (i; i < stop; i++) {
            IUniswapV2Pair pool = IUniswapV2Pair(_pools[i]);
            (result[i][0], result[i][1], result[i][2]) = pool.getReserves();
            factories[i] = pool.factory();
        }

        return (result, factories);
    }
}

interface IUniswapV2Pair {
    function token0() external view returns (address);

    function token1() external view returns (address);

    function factory() external view returns (address);

    function kLast() external view returns (uint256);

    function getReserves()
        external
        view
        returns (
            uint112 reserve0,
            uint112 reserve1,
            uint32 blockTimestampLast
        );
}

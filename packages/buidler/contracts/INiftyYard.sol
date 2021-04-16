pragma solidity >=0.6.0 <0.7.0;

interface INiftyYard {
    function creatorTake() external view returns (uint256);

    function nftInfoById(uint256)
        external
        view
        returns (
            uint256,
            address payable,
            string memory,
            bytes memory,
            uint256,
            uint256,
            string memory
        );

    function nftInfoByNftUrl(string calldata)
        external
        view
        returns (
            uint256,
            address payable,
            string memory,
            bytes memory,
            uint256,
            uint256,
            string memory
        );

    function nftIdByNftUrl(string calldata) external view returns (uint256);
}

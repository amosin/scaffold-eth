pragma solidity >=0.6.0 <0.7.0;

interface INiftyYardToken {
    function nftTokenCount(string calldata) external view returns (uint256);

    function firstMint(
        address,
        string calldata,
        string calldata
    ) external returns (uint256);

    function mint(address, string calldata) external returns (uint256);

    function buyNft(string calldata) external payable returns (uint256);

    function buyToken(uint256) external payable;

    function transferOwnership(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function lock(uint256) external;

    function unlock(uint256, address) external;

    function ownerOf(uint256) external view returns (address);

    function tokenNft(uint256) external view returns (string memory);
}

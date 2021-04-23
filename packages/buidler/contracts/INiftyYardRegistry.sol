pragma solidity ^0.6.6;

interface INiftyYardRegistry {
    function nftAddress() external view returns (address);

    function tokenAddress() external view returns (address);

    function bridgeMediatorAddress() external view returns (address);

    function trustedForwarder() external view returns (address);
}

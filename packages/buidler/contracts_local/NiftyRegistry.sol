pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract NiftyRegistry is Ownable {
    address public nftAddress;
    address public tokenAddress;
    address public bridgeMediatorAddress;
    address public trustedForwarder;

    function setNftAddress(address _address) public onlyOwner {
        nftAddress = _address;
    }

    function setTokenAddress(address _address) public onlyOwner {
        tokenAddress = _address;
    }

    function setBridgeMediatorAddress(address _address) public onlyOwner {
        bridgeMediatorAddress = _address;
    }

    function setTrustedForwarder(address _trustedForwarder) public onlyOwner {
        trustedForwarder = _trustedForwarder;
    }
}
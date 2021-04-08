pragma solidity >=0.6.0 <0.7.0;

interface IChildToken {
    function deposit(address user, bytes calldata depositData) external;
}

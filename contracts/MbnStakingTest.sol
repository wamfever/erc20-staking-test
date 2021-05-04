pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MbnStakingTest is Initializable {
    struct YieldType {
        uint256 daysBlocked;
        uint256 daysLocked;
        uint256 packageInterest;
    }

    IERC20 public tokenContract;
    bytes32[] public packageNames;

    mapping(bytes32 => YieldType) public packages;

    function initialize(uint _tokenAddress) public initializer {}
}
pragma solidity ^0.8.4;


import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

contract MbnStaking is Initializable {
    struct YieldType {
        uint256 daysBlocked;
        uint256 daysLocked;
        uint256 packageInterest;
    }

    IERC20 public tokenContract;
    bytes32[] public packageNames;

    mapping(bytes32 => YieldType) public packages;


    // pseudo-constructor
    function initialize(address _tokenAddress) public initializer 
    {
        tokenContract = IERC20(_tokenAddress);

        createPackage("Silver Package", 30, 15, 8);
        createPackage("Gold Package", 60, 30, 18); 
        createPackage("Platinum Package", 90, 45, 30); 
    }



    // receive function (if exists)
    // fallback function (if exists)
    // external
    function packageLength() external view returns (uint256) {
        return packageNames.length;
    }
    // public
    // internal
    // private
    function createPackage(
        bytes32 _name,
        uint256 _days,
        uint256 _daysBlocked,
        uint256 _packageInterest
    ) private {
        YieldType memory package;
        package.daysLocked = _days;
        package.packageInterest = _packageInterest;        
        package.daysBlocked = _daysBlocked;

        packages[_name] = package;
        packageNames.push(_name);

    }
}
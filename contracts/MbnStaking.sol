pragma solidity ^0.8.4;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

contract MbnStaking is Initializable {
    using SafeMath for uint256;

    struct YieldType {
        uint256 daysBlocked;
        uint256 daysLocked;
        uint256 packageInterest;
    }

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        bytes32 packageName;
        uint256 withdrawnTimestamp;
    }

    struct Staker {
        Stake[] stakes;
        uint256 totalStakedBalance;
    }

    IERC20 public tokenContract;
    bytes32[] public packageNames;
    address[] public stakerAddresses;

    mapping(bytes32 => YieldType) public packages;
    mapping(address => Staker) public stakers;


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

    function stakesLength(address _address) external view returns (uint256) {
        return stakers[_address].stakes.length;
    }

    // public
    function stakeTokens(uint256 _amount, bytes32 _packageName) public {
        if (stakers[msg.sender].stakes.length > 0) {
            stakerAddresses.push(msg.sender);
        }

        stakers[msg.sender].totalStakedBalance = stakers[msg.sender].totalStakedBalance.add(_amount);

        Stake memory newStake;
        newStake.amount = _amount;
        newStake.packageName = _packageName;
        newStake.timestamp = block.timestamp;
        newStake.withdrawnTimestamp = 0;

        stakers[msg.sender].stakes.push(newStake);

        // tokenContract.transferFrom(msg.sender, address(this), _amount);
    }
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
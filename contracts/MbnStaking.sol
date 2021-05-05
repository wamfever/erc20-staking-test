pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

contract MbnStaking is Initializable, OwnableUpgradeable {
    using SafeMath for uint;

    uint private constant TIME_UNIT = 86400; //one day in seconds

    struct Package {
        uint daysLocked;
        uint daysBlocked;
        uint interest;
    }

    struct Stake {
        uint amount;
        uint timestamp;
        bytes32 packageName;
        uint withdrawnTimestamp;
    }

    struct Staker {
        Stake[] stakes;
        uint totalStakedBalance;
    }

    uint public totalStakedFunds;
    IERC20 public tokenContract;
    bytes32[] public packageNames;
    address[] public stakerAddresses;

    mapping(bytes32 => Package) public packages;
    mapping(address => Staker) public stakers;

    uint private rewardPool;

    event RewardAdded(address indexed _from, uint256 _amount);
    event RewardRemoved(address indexed _to, uint256 _val);
    event Unstaked(address indexed _staker, uint _stakeIndex);
    event ForcedUnstake(address indexed _staker, uint _stakeIndex);
    event StakeAdded(
        address indexed _staker, 
        bytes32 _packageName, 
        uint _amount, 
        uint _stakeIndex
    );

    // pseudo-constructor
    function initialize(address _tokenAddress) public initializer 
    {
        tokenContract = IERC20(_tokenAddress);

        createPackage("Silver Package", 30, 15, 8);
        createPackage("Gold Package", 60, 30, 18); 
        createPackage("Platinum Package", 90, 45, 30); 
    }

    function packageLength() external view returns (uint) {
        return packageNames.length;
    }

    function stakesLength(address _address) external view returns (uint) {
        return stakers[_address].stakes.length;
    }

    function renounceOwnership() public override onlyOwner {}

    function addTokensToRewardPool(uint256 _amount) public
    {
        rewardPool = rewardPool.add(_amount);
        tokenContract.transferFrom(msg.sender, address(this), _amount);

        emit RewardAdded(msg.sender, _amount);
    }

    function removeTokensToRewardPool(uint256 _amount) public onlyOwner
    {
        require(_amount <= rewardPool, "You cannot withdraw more than reward pool size");

        rewardPool = rewardPool.sub(_amount);
        tokenContract.transfer(msg.sender, _amount);

        emit RewardRemoved(msg.sender, _amount);
    }

    // public
    function stakeTokens(uint _amount, bytes32 _packageName) public {
        require(
            packages[_packageName].daysBlocked > 0,
            "there is no active staking package with that name"
        );

        if (stakers[msg.sender].stakes.length > 0) {
            stakerAddresses.push(msg.sender);
        }

        stakers[msg.sender].totalStakedBalance = stakers[msg.sender].totalStakedBalance.add(_amount);

        Stake memory _newStake;
        _newStake.amount = _amount;
        _newStake.packageName = _packageName;
        _newStake.timestamp = block.timestamp;
        _newStake.withdrawnTimestamp = 0;

        stakers[msg.sender].stakes.push(_newStake);

        totalStakedFunds = totalStakedFunds.add(_amount);

        tokenContract.transferFrom(msg.sender, address(this), _amount);

        emit StakeAdded(
            msg.sender, 
            _packageName, 
            _amount, 
            stakers[msg.sender].stakes.length - 1
        );
    }

    function unstake(uint _stakeIndex) public {
        Stake storage _stake = getSatakeForWithdrawal(_stakeIndex);

        uint _reward = checkReward(msg.sender, _stakeIndex);

        require(
            rewardPool >= _reward,
            "Token creators did not place enough liquidity in the contract for your reward to be paid"
        );

        totalStakedFunds = totalStakedFunds.sub(_stake.amount);

        stakers[msg.sender].totalStakedBalance = 
            stakers[msg.sender].totalStakedBalance.sub(_stake.amount);

        _stake.withdrawnTimestamp = block.timestamp;


        rewardPool = rewardPool.sub(_reward);

        uint _totalStake = _stake.amount.add(_reward);

        tokenContract.transfer(msg.sender, _totalStake);
        
        emit Unstaked(msg.sender, _stakeIndex);
    }

    function forceUnstake(uint _stakeIndex) public {
        Stake storage _stake = getSatakeForWithdrawal(_stakeIndex);

        _stake.withdrawnTimestamp = block.timestamp;
        totalStakedFunds = totalStakedFunds.sub(_stake.amount);
        stakers[msg.sender].totalStakedBalance = 
            stakers[msg.sender].totalStakedBalance.sub(_stake.amount);

        tokenContract.transfer(msg.sender, _stake.amount);

        emit ForcedUnstake(msg.sender, _stakeIndex);
    }

    function checkReward(address _address, uint _stakeIndex)
        public
        view
        returns (uint _reward)
    {
        uint _currentTime = block.timestamp;
        Stake storage _stake = stakers[_address].stakes[_stakeIndex];
        Package storage _package = packages[_stake.packageName];

        if (_stake.withdrawnTimestamp != 0) {
            _currentTime = _stake.withdrawnTimestamp;
        }

        uint _stakingPeriod = _currentTime.sub(_stake.timestamp).div(TIME_UNIT);
        uint _packagePeriods = _stakingPeriod.div(_package.daysLocked);

        _reward = 0;
        uint _totalStake = _stake.amount;
        uint _currentReward;

        while (_packagePeriods > 0) {
            _currentReward = _totalStake.mul(_package.interest).div(100);
            _totalStake = _totalStake.add(_currentReward);
            _reward= _reward.add(_currentReward);
            _packagePeriods--;
        }
    }
    function createPackage(
        bytes32 _name,
        uint _days,
        uint _daysBlocked,
        uint _interest
    ) private {
        Package memory package;
        package.daysLocked = _days;
        package.interest = _interest;        
        package.daysBlocked = _daysBlocked;

        packages[_name] = package;
        packageNames.push(_name);
    }

    function getSatakeForWithdrawal(uint _stakeIndex) private view
    returns (Stake storage  _stake) {
        require(
            _stakeIndex < stakers[msg.sender].stakes.length,
            "Undifened stake index"
        );

        _stake = stakers[msg.sender].stakes[_stakeIndex];

        require(_stake.withdrawnTimestamp == 0, "Stake already withdrawn");

        require(
            block.timestamp.sub(_stake.timestamp).div(TIME_UNIT) >
                packages[_stake.packageName].daysBlocked,
            "Cannot unstake sooner than the blocked time"
        );
    }
}
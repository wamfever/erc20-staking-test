var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
const { time } = require('@openzeppelin/test-helpers');
 
chai.use(chaiAsPromised);
 
var expect = chai.expect;

describe("MbnStakingToken", function() {
  before(async function () {
    this.MbnToken = await ethers.getContractFactory("MbnToken");
    this.MbnStaking = await ethers.getContractFactory("MbnStaking");

    [
      this.owner, 
      this.alice,
      this.bob,
      this.carol,
      ...accounts
    ] = await ethers.getSigners();  
  });

  beforeEach(async function () {
    this.mbnToken = await this.MbnToken.deploy("Mbn token", "MBN", 1000000);
    this.mbnToken.deployed();
    this.mbnStaking = await upgrades.deployProxy(this.MbnStaking, [this.mbnToken.address], {from: this.owner});

    await this.mbnToken.transfer(this.alice.address, 1000);
    await this.mbnToken.transfer(this.bob.address, 1000);
    await this.mbnToken.transfer(this.carol.address, 1000);
  });
  
  it("Should be upgratable at the same address", async function() {
    const mbnStaking2 = await upgrades.upgradeProxy(this.mbnStaking.address, this.MbnStaking);

    expect(mbnStaking2.address).to.be.equal(this.mbnStaking.address);
  });

  it("should have correct number of packeges", async function() {
    const length = await this.mbnStaking.packageLength();
    for(let i = 0; i < length; i++) {
      await expect(this.mbnStaking.packageNames(i)).to.be.fulfilled;
    }

    await expect(this.mbnStaking.packageNames(length + 1)).to.be.reverted;
  });

  it("should have all packeges defined", async function() {
    const length = await this.mbnStaking.packageLength();
    for(let i = 0; i < length; i++) {
      let packageName = await this.mbnStaking.packageNames(i);
      await expect(this.mbnStaking.packages(packageName)).to.be.fulfilled;
    }
    await expect(this.mbnStaking.packages("Wrong package name")).to.be.reverted;
  });

  it("should be able to stake token", async function() {
    await this.mbnToken.connect(this.alice)
      .increaseAllowance(this.mbnStaking.address, 50);
    await this.mbnStaking.connect(this.alice)
      .stakeTokens(50, ethers.utils.formatBytes32String("Silver Package"));
  });

  it("should not be able to stake negative amount token", async function() {
    await expect(this.mbnStaking.connect(this.alice)
      .stakeTokens(-50, ethers.utils.formatBytes32String("Silver Package"))).to.be.reverted;
  });

  it("should not be able to stake in an undefined package", async function() {
    await expect(this.mbnStaking.connect(this.alice)
      .stakeTokens(50, ethers.utils.formatBytes32String("Wrong package name"))).to.be.reverted;
  });

  it("should emit StakeEvent when staking", async function() {
    await this.mbnToken.connect(this.alice).increaseAllowance(this.mbnStaking.address, 50);
    await expect(this.mbnStaking.connect(this.alice)
      .stakeTokens(50, ethers.utils.formatBytes32String("Silver Package")))
      .to.emit(this.mbnStaking, "StakeAdded")
      .withArgs(this.alice.address, ethers.utils.formatBytes32String("Silver Package"), 50, 0);
  });

  it("should be able to check reward", async function() {
    await this.mbnToken.connect(this.alice).increaseAllowance(this.mbnStaking.address, 100);
    await this.mbnStaking.connect(this.alice)
      .stakeTokens(100, ethers.utils.formatBytes32String("Silver Package"));

    await expect(this.mbnStaking.checkReward(this.alice.address, 0)).to.be.not.reverted;
  });

  it("should have reward only after minimum staking period", async function() {
    await this.mbnToken.connect(this.alice)
      .increaseAllowance(this.mbnStaking.address, 100);
    await this.mbnStaking.connect(this.alice)
      .stakeTokens(100, ethers.utils.formatBytes32String("Silver Package"));

    await network.provider.send("evm_increaseTime", [3600 * 24 * 16])
    await time.advanceBlockTo(parseInt(await time.latestBlock()) + 1);
    expect(await this.mbnStaking.checkReward(this.alice.address, 0)).to.be.equal(0);

    await network.provider.send("evm_increaseTime", [3600 * 24 * 15])
    await time.advanceBlockTo(parseInt(await time.latestBlock()) + 1);
    expect(await this.mbnStaking.checkReward(this.alice.address, 0)).to.be.equal(8);
  });

  it("Anyone can add tokens to reward pool", async function() {
    await this.mbnToken.connect(this.alice).increaseAllowance(this.mbnStaking.address, 100);
    await expect(this.mbnStaking.connect(this.alice)
      .addTokensToRewardPool(100))
      .to.be.fulfilled;
  });

  it("should emit event after add to pool reward", async function() {
    await this.mbnToken.connect(this.alice).increaseAllowance(this.mbnStaking.address, 100);
    await expect(this.mbnStaking.connect(this.alice)
      .addTokensToRewardPool(100))
      .to.emit(this.mbnStaking, "RewardAdded")
      .withArgs(this.alice.address, 100);
  });

  it("Only owner can remove tokens from reward pool", async function() {
  });

  it("should emit event after remove from pool reward", async function() {
    // await this.mbnToken.increaseAllowance(this.mbnStaking.address, 100);
    // await this.mbnStaking.addTokensToRewardPool(100);

    // console.log(this.owner.address);
    // console.log(await this.mbnStaking.owner());

    // await expect(this.mbnStaking.connect(this.owner).removeTokensToRewardPool(100))
    //   .to.emit(this.mbnStaking, "RewardRemoved")
    //   .withArgs(this.owner.address, 100);
  });

  it("should not be able to unstake before blocking time", async function() {
    await this.mbnToken.connect(this.alice)
      .increaseAllowance(this.mbnStaking.address, 100);
    await this.mbnStaking.connect(this.alice)
      .stakeTokens(100, ethers.utils.formatBytes32String("Silver Package"));

    await expect(this.mbnStaking.connect(this.alice).unstake(0))
    .to.be.revertedWith("cannot unstake sooner than the blocked time");
  });

  it("should not be able to unstake undefined stake index", async function() {
    await this.mbnToken.connect(this.alice)
      .increaseAllowance(this.mbnStaking.address, 100);
    await this.mbnStaking.connect(this.alice)
      .stakeTokens(100, ethers.utils.formatBytes32String("Silver Package"));

    await expect(this.mbnStaking.connect(this.alice)
      .unstake(1)).to.be.revertedWith("Undifened stake index");
  });

  it("should be able to unstake after bloking time", async function() {
    await this.mbnToken.connect(this.alice)
      .increaseAllowance(this.mbnStaking.address, 100);
    await this.mbnStaking.connect(this.alice)
      .stakeTokens(100, ethers.utils.formatBytes32String("Silver Package"));

    await network.provider.send("evm_increaseTime", [3600 * 24 * 16])

    await expect(this.mbnStaking.connect(this.alice).unstake(0)).to.be.fulfilled;
  });

  it("should revert if reward pool is too small", async function() {
    await this.mbnToken.connect(this.alice)
      .increaseAllowance(this.mbnStaking.address, 100);
    await this.mbnStaking.connect(this.alice)
      .stakeTokens(100, ethers.utils.formatBytes32String("Silver Package"));

    await network.provider.send("evm_increaseTime", [3600 * 24 * 30])

    await expect(this.mbnStaking.connect(this.alice).unstake(0))
      .to.be.revertedWith("Token creators did not place enough liquidity in the contract for your reward to be paid");
  });

  it("should unstake if reward pool is bigger than stake reward", async function() {
    const aliceInitialBalance = parseInt(await this.mbnToken.balanceOf(this.alice.address));
    await this.mbnToken.connect(this.alice)
      .increaseAllowance(this.mbnStaking.address, 100);
    await this.mbnStaking.connect(this.alice)
      .stakeTokens(100, ethers.utils.formatBytes32String("Silver Package"));

    await this.mbnToken.connect(this.bob).increaseAllowance(this.mbnStaking.address, 10);
    await this.mbnStaking.connect(this.bob).addTokensToRewardPool(10)

    await network.provider.send("evm_increaseTime", [3600 * 24 * 30])

    await expect(this.mbnStaking.connect(this.alice).unstake(0)).to.be.fulfilled;
  });

  it("should have more tokens after rewarded unstake", async function() {
    const aliceInitialBalance = parseInt(await this.mbnToken.balanceOf(this.alice.address));
    await this.mbnToken.connect(this.alice)
      .increaseAllowance(this.mbnStaking.address, 100);
    await this.mbnStaking.connect(this.alice)
      .stakeTokens(100, ethers.utils.formatBytes32String("Silver Package"));

    await this.mbnToken.connect(this.bob).increaseAllowance(this.mbnStaking.address, 10);
    await this.mbnStaking.connect(this.bob).addTokensToRewardPool(10)

    await network.provider.send("evm_increaseTime", [3600 * 24 * 30])

    await this.mbnStaking.connect(this.alice).unstake(0);
    expect(await this.mbnToken.balanceOf(this.alice.address)).to.be.equal(aliceInitialBalance + 8);
  });
});

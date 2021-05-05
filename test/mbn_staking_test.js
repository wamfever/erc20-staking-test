var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
 
chai.use(chaiAsPromised);
 
// Then either:
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
    this.mbnStaking = await upgrades.deployProxy(this.MbnStaking, [this.mbnToken.address]);

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
      await expect(this.mbnStaking.packageNames(i)).to.not.be.reverted;
    }

    await expect(this.mbnStaking.packageNames(length + 1)).to.be.reverted;
  });

  it("should have all packeges defined", async function() {
    const length = await this.mbnStaking.packageLength();
    for(let i = 0; i < length; i++) {
      let packageName = await this.mbnStaking.packageNames(i);
      await expect(this.mbnStaking.packages(packageName)).to.not.be.reverted;
    }
    await expect(this.mbnStaking.packages("Wrong package name")).to.be.reverted;
  });

  it("should be able to stake token", async function() {
    await this.mbnToken.connect(this.alice).increaseAllowance(this.mbnStaking.address, 50);
    await this.mbnStaking.connect(this.alice).stakeTokens(50, ethers.utils.formatBytes32String("Silver Package"));
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
    await expect(this.mbnStaking.connect(this.alice).stakeTokens(50, ethers.utils.formatBytes32String("Silver Package")))
      .to.emit(this.mbnStaking, "StakeAdded").withArgs(this.alice.address, ethers.utils.formatBytes32String("Silver Package"), 50, 0);
  });
});

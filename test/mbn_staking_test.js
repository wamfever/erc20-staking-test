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
    this.mbnToken = await this.MbnToken.deploy("Mbn token", "MBN");
    this.mbnToken.deployed();
    this.mbnStaking = await upgrades.deployProxy(this.MbnStaking, [this.mbnToken.address]);

    // console.log('mint');
    // console.log(await this.mbnToken.balanceOf(this.owner.address));
    // await this.mbnToken._mint(this.owner.address, '100000000000000000000');
    // console.log(await this.mbnToken.balanceOf(this.owner.address));

    // await this.mbnToken.transferFrom(this.owner.address, this.alice.address, '100000000000000000000', []);
  });
  
  // it("Should be upgratable at the same address", async function() {
  //   const MbnStakingTest = await ethers.getContractFactory("MbnStakingTest");
  //   const mbnStakingTest = await upgrades.upgradeProxy(this.mbnStaking.address, MbnStakingTest);

  
  //   expect(mbnStakingTest.address).to.be.equal(this.mbnStaking.address);
  // });

  it("should have correct number of packeges", async function() {
    const length = await this.mbnStaking.packageLength();
    for(let i = 0; i < length; i++) {
      expect(this.mbnStaking.packageNames(i)).to.not.be.reverted;
    }

    expect(this.mbnStaking.packageNames(length + 1)).to.be.reverted;
  });

  it("should have all packeges defined", async function() {
    const length = await this.mbnStaking.packageLength();
    for(let i = 0; i < length; i++) {
      let packageName = await this.mbnStaking.packageNames(i);
      expect(this.mbnStaking.packages(packageName)).to.not.be.reverted;
    }
    expect(this.mbnStaking.packages("test test test")).to.be.reverted;
  });

  it("should have all packeges defined", async function() {
    console.log(await this.mbnToken.balanceOf(this.owner.address));


    // console.log(this.alice.address);
    // await this.mbnStaking.connect(this.alice).stakeTokens(50, ethers.utils.formatBytes32String("Silver Package"));

    // console.log(await this.mbnStaking.stakers(this.alice.address));
    // console.log(await this.mbnStaking.stakesLength(this.alice.address));
  });

});

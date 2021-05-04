var chai = require("chai");
var chaiAsPromised = require("chai-as-promised");
 
chai.use(chaiAsPromised);
 
// Then either:
var expect = chai.expect;

describe("MbnStakingToken", function() {
  it("Should be upgratable at the same address", async function() {
    const MbnToken = await ethers.getContractFactory("MbnToken");
    const mbnToken = await MbnToken.deploy("Mbn token", "MBN");

    await mbnToken.deployed();

    const MbnStaking = await ethers.getContractFactory("MbnStaking");
    const mbnStaking = await upgrades.deployProxy(MbnStaking, [mbnToken.address]);

    const MbnStakingTest = await ethers.getContractFactory("MbnStakingTest");
    const mbnStakingTest = await upgrades.upgradeProxy(mbnStaking.address, MbnStakingTest);
  
    expect(mbnStakingTest.address).to.be.equal(mbnStaking.address);
  });

  it("should have correct number of packeges", async function() {
    const MbnToken = await ethers.getContractFactory("MbnToken");
    const mbnToken = await MbnToken.deploy("Mbn token", "MBN");

    await mbnToken.deployed();

    const MbnStaking = await ethers.getContractFactory("MbnStaking");
    const mbnStaking = await upgrades.deployProxy(MbnStaking, [mbnToken.address]);

    await mbnStaking.deployed(); 

    const length = await mbnStaking.packageLength();
    for(let i = 0; i < length; i++) {
      expect(mbnStaking.packageNames(i)).to.not.be.reverted;
    }

    expect(mbnStaking.packageNames(length + 1)).to.be.reverted;
  });

  it("should have all packeges defined", async function() {
    const MbnToken = await ethers.getContractFactory("MbnToken");
    const mbnToken = await MbnToken.deploy("Mbn token", "MBN");

    await mbnToken.deployed();

    const MbnStaking = await ethers.getContractFactory("MbnStaking");
    const mbnStaking = await upgrades.deployProxy(MbnStaking, [mbnToken.address]);

    await mbnStaking.deployed(); 

    const length = await mbnStaking.packageLength();
    for(let i = 0; i < length; i++) {
      let packageName = await mbnStaking.packageNames(i);
      expect(mbnStaking.packages(packageName)).to.not.be.reverted;
    }
  });
});

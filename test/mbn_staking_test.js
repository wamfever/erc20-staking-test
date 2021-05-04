const { expect } = require("chai");

describe("MbnStakingToken", function() {
  it("Should be upgratable at the same address", async function() {
    const MbnStaking = await ethers.getContractFactory("MbnStaking");
    const mbnStaking = await upgrades.deployProxy(MbnStaking);
  
    const MbnStakingTest = await ethers.getContractFactory("MbnStakingTest");
    const mbnStakingTest = await upgrades.upgradeProxy(mbnStaking.address, MbnStakingTest);
  
    expect(mbnStakingTest.address).to.be.equal(mbnStaking.address);
  });
});

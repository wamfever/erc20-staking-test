const { expect } = require("chai");

describe("MbnToken", function() {
  it("Should be deployed correctly", async function() {
    const MbnToken = await ethers.getContractFactory("MbnToken");
    const mbnToken = await MbnToken.deploy("Mbn token", "MBN");

    await mbnToken.deployed();
    expect(await mbnToken.name()).to.equal("Mbn token");
    expect(await mbnToken.symbol()).to.equal("MBN");
  });
});

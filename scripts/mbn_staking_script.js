const hardhat = require("hardhat");

async function main() {
  const MbnToken = await hardhat.ethers.getContractFactory("MbnToken");
  const mbnToken = await MbnToken.deploy("Mbn token", "MBN", 1000000);

  await mbnToken.deployed();

  const MbnStaking = await hardhat.ethers.getContractFactory("MbnStaking");
  const mbnStaking = await hardhat.upgrades.deployProxy(MbnStaking, [mbnToken.address]);

  await mbnStaking.deployed();

  console.log("Mbn Staking deployed to:", mbnStaking.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
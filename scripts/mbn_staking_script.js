const hardhat = require("hardhat");

async function main() {
  const MbnStaking = await hardhat.ethers.getContractFactory("MbnStaking");
  const mbnStaking = await hardhat.upgrades.deployProxy(MbnStaking);

  await mbnStaking.deployed();

  console.log("Mbn Staking deployed to:", mbnStaking.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
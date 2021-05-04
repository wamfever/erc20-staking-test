const hardhat = require("hardhat");

async function main() {
  const MbnToken = await hardhat.ethers.getContractFactory("MbnToken");
  const mbnToken = await MbnToken.deploy("Mbn token", "MBN", 1000000);

  await mbnToken.deployed();

  console.log("Mbn token deployed to:", mbnToken.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
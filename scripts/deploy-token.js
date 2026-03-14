const hre = require('hardhat');

const MINT_AMOUNT = '1000000000000000000000';
const MINT_TO = process.env.MINT_TO || '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deployer:', deployer.address);

  const ConsortiumToken = await hre.ethers.getContractFactory('ConsortiumToken');
  const token = await ConsortiumToken.deploy(deployer.address);
  await token.waitForDeployment();
  const addr = await token.getAddress();
  console.log('ConsortiumToken deployed:', addr);

  const tx = await token.mint(MINT_TO, MINT_AMOUNT);
  await tx.wait();
  console.log('Minted 1000 CONS to', MINT_TO);

  const fs = require('fs');
  const outPath = 'deployed.json';
  fs.writeFileSync(outPath, JSON.stringify({
    ConsortiumToken: addr,
    minter: deployer.address,
    chainId: 2026,
    rpcUrl: hre.network.config.url
  }, null, 2));
  console.log('Wrote', outPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

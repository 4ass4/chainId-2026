const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const deployedPath = path.join(__dirname, '..', 'deployed.json');
  if (!fs.existsSync(deployedPath)) {
    throw new Error('Run deploy-token.js first');
  }
  const deployed = JSON.parse(fs.readFileSync(deployedPath, 'utf8'));

  const [deployer] = await hre.ethers.getSigners();
  const BridgeMock = await hre.ethers.getContractFactory('BridgeMock');
  const bridge = await BridgeMock.deploy(deployed.ConsortiumToken, deployer.address);
  await bridge.waitForDeployment();
  const addr = await bridge.getAddress();
  console.log('BridgeMock deployed:', addr);

  deployed.BridgeMock = addr;
  deployed.bridgeOperator = deployer.address;
  fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 2));
  console.log('Updated', deployedPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

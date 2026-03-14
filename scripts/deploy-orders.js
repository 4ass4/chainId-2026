const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const deployedPath = path.join(__dirname, '..', 'deployed.json');
  const deployed = fs.existsSync(deployedPath) ? JSON.parse(fs.readFileSync(deployedPath, 'utf8')) : {};

  const [deployer] = await hre.ethers.getSigners();
  const OrdersContract = await hre.ethers.getContractFactory('OrdersContract');
  const orders = await OrdersContract.deploy(deployer.address);
  await orders.waitForDeployment();
  const addr = await orders.getAddress();
  console.log('OrdersContract deployed:', addr);

  deployed.OrdersContract = addr;
  deployed.ordersExecutor = deployer.address;
  fs.writeFileSync(deployedPath, JSON.stringify(deployed, null, 2));
  console.log('Updated deployed.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

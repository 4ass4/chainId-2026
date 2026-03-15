import express from 'express';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const BRIDGE_PRIVATE_KEY = process.env.BRIDGE_PRIVATE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const DEPLOYED_PATH = path.join(__dirname, '..', 'deployed.json');
const SIMPLETOKEN_ARTIFACT_PATH = path.join(__dirname, '..', 'artifacts', 'contracts', 'SimpleToken.sol', 'SimpleToken.json');

const MINT_AMOUNT = ethers.parseEther('100');

let tokenContract = null;
let ordersContract = null;

function loadDeployed() {
  if (!fs.existsSync(DEPLOYED_PATH)) return null;
  return JSON.parse(fs.readFileSync(DEPLOYED_PATH, 'utf8'));
}

function initBridge() {
  const deployed = loadDeployed();
  if (!deployed?.ConsortiumToken || !BRIDGE_PRIVATE_KEY) return false;
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(BRIDGE_PRIVATE_KEY, provider);
  tokenContract = new ethers.Contract(deployed.ConsortiumToken, ['function mint(address to, uint256 amount) external'], signer);
  if (deployed.OrdersContract) {
    ordersContract = new ethers.Contract(deployed.OrdersContract, ['function executeOrder(string exchangeSell, string exchangeBuy, uint256 amount) external'], signer);
  }
  return true;
}

function feeFromReceipt(receipt, tx) {
  const gasPrice = receipt.gasPrice ?? tx.gasPrice ?? 0n;
  const feeWei = receipt.gasUsed * gasPrice;
  return {
    gasUsed: receipt.gasUsed.toString(),
    gasPrice: gasPrice.toString(),
    feeWei: feeWei.toString(),
    feeEth: ethers.formatEther(feeWei)
  };
}

function txSuccessPayload(receipt, tx) {
  const explorerBase = process.env.EXPLORER_URL || 'http://localhost:4000';
  return {
    success: true,
    txHash: receipt.hash,
    explorerUrl: `${explorerBase}/tx/${receipt.hash}`,
    fee: feeFromReceipt(receipt, tx)
  };
}

app.post('/orders/execute', async (req, res) => {
  const { exchangeSell, exchangeBuy, amount } = req.body;
  if (!exchangeSell || !exchangeBuy || amount == null) {
    return res.status(400).json({ error: 'exchangeSell, exchangeBuy, amount required' });
  }
  if (!ordersContract) {
    return res.status(503).json({ error: 'Orders contract not configured' });
  }
  try {
    const amt = BigInt(amount);
    const tx = await ordersContract.executeOrder(exchangeSell, exchangeBuy, amt);
    const receipt = await tx.wait();
    return res.json(txSuccessPayload(receipt, tx));
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Execute failed' });
  }
});

app.post('/bridge/ton-to-cons', async (req, res) => {
  const { address } = req.body;
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: 'Invalid address' });
  }
  if (!tokenContract) {
    return res.status(503).json({ error: 'Bridge not configured' });
  }
  try {
    const tx = await tokenContract.mint(address, MINT_AMOUNT);
    const receipt = await tx.wait();
    return res.json(txSuccessPayload(receipt, tx));
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Bridge failed' });
  }
});

app.post('/rpc', async (req, res) => {
  try {
    const r = await fetch(RPC_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req.body) });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ ok: true, bridge: !!tokenContract, orders: !!ordersContract });
});

function requireAdmin(req, res) {
  if (!ADMIN_SECRET) return true;
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_SECRET) {
    res.status(401).json({ error: 'Invalid or missing X-Admin-Key' });
    return false;
  }
  return true;
}

app.post('/admin/deploy-token', async (req, res) => {
  if (!requireAdmin(req, res)) return;
  if (!BRIDGE_PRIVATE_KEY) {
    return res.status(503).json({ error: 'Deployer key not configured' });
  }
  const { name, symbol, decimals, initialSupply } = req.body;
  if (!name || !symbol || decimals == null) {
    return res.status(400).json({ error: 'name, symbol, decimals required' });
  }
  const dec = Number(decimals);
  if (dec < 0 || dec > 18) {
    return res.status(400).json({ error: 'decimals must be 0–18' });
  }
  if (!fs.existsSync(SIMPLETOKEN_ARTIFACT_PATH)) {
    return res.status(503).json({ error: 'SimpleToken not compiled. Run: npx hardhat compile' });
  }
  try {
    const artifact = JSON.parse(fs.readFileSync(SIMPLETOKEN_ARTIFACT_PATH, 'utf8'));
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(BRIDGE_PRIVATE_KEY, provider);
    const supply = initialSupply != null && String(initialSupply).trim() !== ''
      ? ethers.parseUnits(String(initialSupply).trim(), dec)
      : 0n;
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    const token = await factory.deploy(name, symbol, dec, signer.address, supply);
    const receipt = await token.deploymentTransaction().wait();
    const contractAddress = await token.getAddress();
    const deployed = loadDeployed() || {};
    deployed.tokens = deployed.tokens || [];
    deployed.tokens.push({ name, symbol, decimals: dec, address: contractAddress });
    fs.writeFileSync(DEPLOYED_PATH, JSON.stringify(deployed, null, 2));
    return res.json({
      success: true,
      address: contractAddress,
      txHash: receipt.hash,
      explorerUrl: `${process.env.EXPLORER_URL || 'http://localhost:4000'}/tx/${receipt.hash}`,
      fee: feeFromReceipt(receipt, token.deploymentTransaction())
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Deploy failed' });
  }
});

const port = process.env.PORT || 3013;
app.listen(port, () => {
  initBridge();
});

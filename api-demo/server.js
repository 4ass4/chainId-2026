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
const DEPLOYED_PATH = path.join(__dirname, '..', 'deployed.json');

const MINT_AMOUNT = ethers.parseEther('100');

let bridgeContract = null;
let ordersContract = null;

function loadDeployed() {
  if (!fs.existsSync(DEPLOYED_PATH)) return null;
  return JSON.parse(fs.readFileSync(DEPLOYED_PATH, 'utf8'));
}

function initBridge() {
  const deployed = loadDeployed();
  if (!deployed?.BridgeMock || !BRIDGE_PRIVATE_KEY) return false;
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(BRIDGE_PRIVATE_KEY, provider);
  const abi = ['function mintFromBridge(address to, uint256 amount) external'];
  bridgeContract = new ethers.Contract(deployed.BridgeMock, abi, signer);
  if (deployed.OrdersContract) {
    const ordersAbi = ['function executeOrder(string exchangeSell, string exchangeBuy, uint256 amount) external'];
    ordersContract = new ethers.Contract(deployed.OrdersContract, ordersAbi, signer);
  }
  return true;
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
    return res.json({
      success: true,
      txHash: receipt.hash,
      explorerUrl: `${process.env.EXPLORER_URL || 'http://localhost:4000'}/tx/${receipt.hash}`
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Execute failed' });
  }
});

app.post('/bridge/ton-to-cons', async (req, res) => {
  const { address } = req.body;
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: 'Invalid address' });
  }
  if (!bridgeContract) {
    return res.status(503).json({ error: 'Bridge not configured' });
  }
  try {
    const tx = await bridgeContract.mintFromBridge(address, MINT_AMOUNT);
    const receipt = await tx.wait();
    return res.json({
      success: true,
      txHash: receipt.hash,
      explorerUrl: `${process.env.EXPLORER_URL || 'http://localhost:4000'}/tx/${receipt.hash}`
    });
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
  res.json({ ok: true, bridge: !!bridgeContract, orders: !!ordersContract });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  initBridge();
  console.log(`API demo on :${port}, bridge=${!!bridgeContract}`);
});

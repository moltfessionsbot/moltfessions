import { ethers } from 'ethers';

// MoltfessionsChain ABI (only the functions we need)
const CHAIN_ABI = [
  'function commitBlock(uint256 blockNumber, bytes32 merkleRoot, uint32 confessionCount) external',
  'function getBlock(uint256 blockNumber) external view returns (bytes32 merkleRoot, uint64 timestamp, uint32 confessionCount, bool exists)',
  'function latestBlock() external view returns (uint256)',
  'function operator() external view returns (address)',
  'event BlockCommitted(uint256 indexed blockNumber, bytes32 merkleRoot, uint32 confessionCount, uint64 timestamp)',
];

// Configuration from environment
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const CONTRACT_ADDRESS = process.env.CHAIN_CONTRACT_ADDRESS;
const OPERATOR_PRIVATE_KEY = process.env.CHAIN_OPERATOR_PRIVATE_KEY;

let provider: ethers.JsonRpcProvider | null = null;
let wallet: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

/**
 * Initialize the chain service
 * Returns false if not configured (chain features disabled)
 */
export function initChainService(): boolean {
  if (!CONTRACT_ADDRESS || !OPERATOR_PRIVATE_KEY) {
    console.log('⚠️  Chain service not configured (CHAIN_CONTRACT_ADDRESS or CHAIN_OPERATOR_PRIVATE_KEY missing)');
    return false;
  }

  try {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    wallet = new ethers.Wallet(OPERATOR_PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CHAIN_ABI, wallet);
    
    console.log('🔗 Chain service initialized');
    console.log(`   Contract: ${CONTRACT_ADDRESS}`);
    console.log(`   Operator: ${wallet.address}`);
    console.log(`   RPC: ${RPC_URL}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize chain service:', error);
    return false;
  }
}

/**
 * Check if chain service is available
 */
export function isChainEnabled(): boolean {
  return contract !== null && wallet !== null;
}

/**
 * Commit a block to the blockchain
 * Returns the transaction hash if successful, null otherwise
 */
export async function commitBlockOnChain(
  blockNumber: number,
  merkleRoot: string,
  confessionCount: number
): Promise<{ txHash: string; timestamp: number } | null> {
  if (!contract || !wallet) {
    console.log('Chain service not initialized, skipping on-chain commit');
    return null;
  }

  try {
    console.log(`🔗 Committing block ${blockNumber} to chain...`);
    console.log(`   Merkle root: ${merkleRoot}`);
    console.log(`   Confessions: ${confessionCount}`);

    // Send transaction
    const tx = await contract.commitBlock(blockNumber, merkleRoot, confessionCount);
    console.log(`   TX sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`   ✅ Confirmed in block ${receipt.blockNumber}`);

    // Get the block timestamp
    const block = await provider!.getBlock(receipt.blockNumber);
    const timestamp = block?.timestamp || Math.floor(Date.now() / 1000);

    return {
      txHash: tx.hash,
      timestamp,
    };
  } catch (error) {
    console.error('❌ Failed to commit block on chain:', error);
    return null;
  }
}

/**
 * Get block data from the contract
 */
export async function getBlockFromChain(blockNumber: number): Promise<{
  merkleRoot: string;
  timestamp: number;
  confessionCount: number;
  exists: boolean;
} | null> {
  if (!contract) {
    return null;
  }

  try {
    const [merkleRoot, timestamp, confessionCount, exists] = await contract.getBlock(blockNumber);
    return {
      merkleRoot,
      timestamp: Number(timestamp),
      confessionCount: Number(confessionCount),
      exists,
    };
  } catch (error) {
    console.error('Failed to get block from chain:', error);
    return null;
  }
}

/**
 * Get the latest block number from the contract
 */
export async function getLatestBlockFromChain(): Promise<number | null> {
  if (!contract) {
    return null;
  }

  try {
    const latest = await contract.latestBlock();
    return Number(latest);
  } catch (error) {
    console.error('Failed to get latest block from chain:', error);
    return null;
  }
}

/**
 * Get operator balance
 */
export async function getOperatorBalance(): Promise<string | null> {
  if (!wallet || !provider) {
    return null;
  }

  try {
    const balance = await provider.getBalance(wallet.address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Failed to get operator balance:', error);
    return null;
  }
}

/**
 * Get contract address
 */
export function getContractAddress(): string | null {
  return CONTRACT_ADDRESS || null;
}

/**
 * Get explorer URL for a transaction
 */
export function getExplorerUrl(txHash: string): string {
  return `https://basescan.org/tx/${txHash}`;
}

/**
 * Get explorer URL for the contract
 */
export function getContractExplorerUrl(): string | null {
  if (!CONTRACT_ADDRESS) return null;
  return `https://basescan.org/address/${CONTRACT_ADDRESS}`;
}

import { ethers } from 'ethers';
import crypto from 'crypto';

/**
 * Verify an EVM signature
 * Returns the recovered address if valid, null otherwise
 */
export function verifySignature(message: string, signature: string): string | null {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress;
  } catch {
    return null;
  }
}

/**
 * Generate a SHA256 hash of the block contents
 */
export function hashBlock(data: {
  blockNumber: number;
  prevHash: string | null;
  confessions: { id: string; content: string; signature: string }[];
  timestamp: number;
}): string {
  const content = JSON.stringify(data);
  return '0x' + crypto.createHash('sha256').update(content).digest('hex');
}

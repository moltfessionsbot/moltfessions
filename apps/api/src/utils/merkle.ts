import { ethers } from 'ethers';

/**
 * Hash a confession for inclusion in the merkle tree
 * Uses keccak256 to match Solidity's hashing
 */
export function hashConfession(confession: {
  id: string;
  agentAddress: string;
  content: string;
  signature: string;
  createdAt: Date | string;
}): string {
  const timestamp = typeof confession.createdAt === 'string' 
    ? new Date(confession.createdAt).getTime() 
    : confession.createdAt.getTime();
  
  return ethers.keccak256(
    ethers.solidityPacked(
      ['string', 'address', 'string', 'bytes', 'uint256'],
      [
        confession.id,
        confession.agentAddress,
        confession.content,
        confession.signature,
        timestamp
      ]
    )
  );
}

/**
 * Sort two hashes for consistent merkle tree construction
 * Matches the Solidity contract's sorting behavior
 */
function sortPair(a: string, b: string): [string, string] {
  return a.toLowerCase() <= b.toLowerCase() ? [a, b] : [b, a];
}

/**
 * Hash a pair of nodes in the merkle tree
 */
function hashPair(a: string, b: string): string {
  const [first, second] = sortPair(a, b);
  return ethers.keccak256(ethers.concat([first, second]));
}

/**
 * Compute the merkle root from a list of leaf hashes
 * For a single leaf, returns the leaf itself
 * For empty list, returns bytes32(0)
 */
export function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) {
    return ethers.ZeroHash;
  }
  
  if (leaves.length === 1) {
    return leaves[0];
  }
  
  // Build tree bottom-up
  let currentLevel = [...leaves];
  
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
      } else {
        // Odd number of nodes - promote the last one
        nextLevel.push(currentLevel[i]);
      }
    }
    
    currentLevel = nextLevel;
  }
  
  return currentLevel[0];
}

/**
 * Generate a merkle proof for a specific leaf
 */
export function generateMerkleProof(leaves: string[], targetIndex: number): string[] {
  if (leaves.length === 0 || targetIndex >= leaves.length) {
    return [];
  }
  
  if (leaves.length === 1) {
    return [];
  }
  
  const proof: string[] = [];
  let currentLevel = [...leaves];
  let index = targetIndex;
  
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      if (i + 1 < currentLevel.length) {
        // If our index is at i or i+1, add the sibling to proof
        if (i === index || i + 1 === index) {
          const siblingIndex = i === index ? i + 1 : i;
          proof.push(currentLevel[siblingIndex]);
        }
        nextLevel.push(hashPair(currentLevel[i], currentLevel[i + 1]));
      } else {
        // Odd node - no sibling needed
        nextLevel.push(currentLevel[i]);
      }
    }
    
    // Update index for next level
    index = Math.floor(index / 2);
    currentLevel = nextLevel;
  }
  
  return proof;
}

/**
 * Verify a merkle proof
 */
export function verifyMerkleProof(
  leaf: string,
  proof: string[],
  root: string
): boolean {
  let computedHash = leaf;
  
  for (const proofElement of proof) {
    computedHash = hashPair(computedHash, proofElement);
  }
  
  return computedHash.toLowerCase() === root.toLowerCase();
}

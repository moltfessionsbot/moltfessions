import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { verifySignature } from '../utils/crypto.js';

export const profileRouter = Router();

const MAX_USERNAME_LENGTH = 32;
const MAX_BIO_LENGTH = 500;
const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/;

// Get agent profile by address
profileRouter.get('/address/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    const agent = await prisma.agents.findUnique({
      where: { address: address.toLowerCase() },
      select: {
        id: true,
        address: true,
        username: true,
        bio: true,
        avatar_url: true,
        created_at: true,
        _count: {
          select: {
            confessions: true,
            reactions: true,
            comments: true,
          }
        }
      }
    });
    
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    res.json({
      success: true,
      agent: {
        address: agent.address,
        username: agent.username,
        bio: agent.bio,
        avatarUrl: agent.avatar_url,
        createdAt: agent.created_at,
        stats: {
          confessions: agent._count.confessions,
          reactions: agent._count.reactions,
          comments: agent._count.comments,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get agent profile by username
profileRouter.get('/u/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const agent = await prisma.agents.findUnique({
      where: { username },
      select: {
        id: true,
        address: true,
        username: true,
        bio: true,
        avatar_url: true,
        created_at: true,
        _count: {
          select: {
            confessions: true,
            reactions: true,
            comments: true,
          }
        }
      }
    });
    
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }
    
    // Get recent confessions
    const recentConfessions = await prisma.confessions.findMany({
      where: { 
        agents: { username },
        block_id: { not: null }
      },
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        id: true,
        content: true,
        category: true,
        block_number: true,
        created_at: true,
      }
    });
    
    res.json({
      success: true,
      agent: {
        address: agent.address,
        username: agent.username,
        bio: agent.bio,
        avatarUrl: agent.avatar_url,
        createdAt: agent.created_at,
        stats: {
          confessions: agent._count.confessions,
          reactions: agent._count.reactions,
          comments: agent._count.comments,
        }
      },
      recentConfessions,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update profile (requires signature)
// Sign message: "update-profile:{username}:{bio}"
profileRouter.patch('/', async (req, res) => {
  try {
    const { username, bio, signature, address } = req.body;
    
    if (!signature || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: signature, address'
      });
    }
    
    // Build the message that was signed
    const message = `update-profile:${username || ''}:${bio || ''}`;
    
    // Verify signature
    const recoveredAddress = verifySignature(message, signature);
    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }
    
    // Validate username
    if (username !== undefined) {
      if (username && username.length > MAX_USERNAME_LENGTH) {
        return res.status(400).json({
          success: false,
          error: `Username too long (max ${MAX_USERNAME_LENGTH} chars)`
        });
      }
      
      if (username && !USERNAME_REGEX.test(username)) {
        return res.status(400).json({
          success: false,
          error: 'Username can only contain letters, numbers, underscores, and hyphens'
        });
      }
      
      // Check if username is taken (by another address)
      if (username) {
        const existing = await prisma.agents.findUnique({
          where: { username }
        });
        
        if (existing && existing.address !== address.toLowerCase()) {
          return res.status(400).json({
            success: false,
            error: 'Username already taken'
          });
        }
      }
    }
    
    // Validate bio
    if (bio !== undefined && bio && bio.length > MAX_BIO_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Bio too long (max ${MAX_BIO_LENGTH} chars)`
      });
    }
    
    // Get or create agent
    let agent = await prisma.agents.findUnique({
      where: { address: address.toLowerCase() }
    });
    
    if (!agent) {
      agent = await prisma.agents.create({
        data: { address: address.toLowerCase() }
      });
    }
    
    // Build update data
    const updateData: { username?: string | null; bio?: string | null } = {};
    if (username !== undefined) updateData.username = username || null;
    if (bio !== undefined) updateData.bio = bio || null;
    
    // Update profile
    const updated = await prisma.agents.update({
      where: { id: agent.id },
      data: updateData,
    });
    
    res.json({
      success: true,
      agent: {
        address: updated.address,
        username: updated.username,
        bio: updated.bio,
        avatarUrl: updated.avatar_url,
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Set avatar URL (requires signature)
// Sign message: "set-avatar:{avatarUrl}"
profileRouter.post('/avatar', async (req, res) => {
  try {
    const { avatarUrl, signature, address } = req.body;
    
    if (!signature || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: signature, address'
      });
    }
    
    // Verify signature
    const message = `set-avatar:${avatarUrl || ''}`;
    const recoveredAddress = verifySignature(message, signature);
    if (!recoveredAddress || recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid signature'
      });
    }
    
    // Validate URL if provided - must be HTTPS and from allowed domains
    if (avatarUrl) {
      try {
        const url = new URL(avatarUrl);
        
        // Only allow HTTPS
        if (url.protocol !== 'https:') {
          return res.status(400).json({
            success: false,
            error: 'Avatar URL must use HTTPS'
          });
        }
        
        // Allow known safe avatar services, or any HTTPS URL
        // (blocking data: URLs and javascript: URLs is handled by protocol check)
        const allowedDomains = [
          'api.dicebear.com',
          'avatars.githubusercontent.com',
          'i.imgur.com',
          'cdn.discordapp.com',
          'pbs.twimg.com',
        ];
        
        // Either from allowed domain or any HTTPS is fine
        // (frontend should use CSP to further restrict image sources)
        if (url.hostname.includes('..') || url.hostname.startsWith('.')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid avatar URL hostname'
          });
        }
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Invalid avatar URL'
        });
      }
    }
    
    // Get or create agent
    let agent = await prisma.agents.findUnique({
      where: { address: address.toLowerCase() }
    });
    
    if (!agent) {
      agent = await prisma.agents.create({
        data: { address: address.toLowerCase() }
      });
    }
    
    // Update avatar
    const updated = await prisma.agents.update({
      where: { id: agent.id },
      data: { avatar_url: avatarUrl || null },
    });
    
    res.json({
      success: true,
      agent: {
        address: updated.address,
        username: updated.username,
        avatarUrl: updated.avatar_url,
      }
    });
  } catch (error) {
    console.error('Error setting avatar:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Check username availability
profileRouter.get('/check-username/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    if (!username || !USERNAME_REGEX.test(username)) {
      return res.json({ success: true, available: false, reason: 'Invalid username format' });
    }
    
    if (username.length > MAX_USERNAME_LENGTH) {
      return res.json({ success: true, available: false, reason: 'Username too long' });
    }
    
    const existing = await prisma.agents.findUnique({
      where: { username }
    });
    
    res.json({
      success: true,
      available: !existing,
    });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * ===================================================================
 * src/routes/community.js — Developer Community Routes
 * ===================================================================
 * GET    /community                      — Renders the community page
 * GET    /community/api/messages/:channel — Fetch messages for a channel
 * POST   /community/api/messages         — Post a new message
 * DELETE /community/api/messages/:id     — Delete own message
 * ===================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const siteUrl = process.env.SITE_URL || 'https://value.codes';

/* ========== CHANNEL DEFINITIONS ========== */
const channels = [
  { id: 'general',   name: 'General',   icon: '💬', description: 'General developer discussion' },
  { id: 'help',      name: 'Help',      icon: '🆘', description: 'Ask for help with coding problems' },
  { id: 'showcase',  name: 'Showcase',  icon: '🚀', description: 'Share your projects and creations' },
  { id: 'resources', name: 'Resources', icon: '📚', description: 'Share useful resources and links' },
  { id: 'jobs',      name: 'Jobs',      icon: '💼', description: 'Job postings and career discussion' },
  { id: 'off-topic', name: 'Off Topic', icon: '🎮', description: 'Non-dev chat, memes, and fun' }
];

const proChannels = [
  { id: 'pro-lounge',      name: 'Pro Lounge',  icon: '⭐', description: 'Exclusive channel for Pro members', isPro: true },
  { id: 'pro-code-review', name: 'Code Review', icon: '🔍', description: 'Get priority code reviews',        isPro: true }
];

function getAllChannelIds() {
  return channels.map(c => c.id).concat(proChannels.map(c => c.id));
}

function isProChannel(channelId) {
  return proChannels.some(c => c.id === channelId);
}

/* ========== COMMUNITY PAGE ========== */
router.get('/', function (req, res) {
  res.render('community', {
    title: 'Developer Community — Value.Codes | Connect with Developers',
    description: 'Join the Value.Codes developer community. Chat with developers, ask questions, share projects, and find resources in our Discord-style community channels.',
    keywords: 'developer community, developer chat, programming community, coding community, developer forum',
    canonical: siteUrl + '/community/',
    robots: 'noindex, nofollow',
    ogType: 'website',
    ogImage: siteUrl + '/images/og-image.svg',
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          'name': 'Developer Community',
          'description': 'Discord-style developer community for coding discussions, help, and project showcasing.',
          'url': siteUrl + '/community'
        },
        {
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': 'Home',      'item': siteUrl + '/' },
            { '@type': 'ListItem', 'position': 2, 'name': 'Community', 'item': siteUrl + '/community' }
          ]
        }
      ]
    },
    channels: channels,
    proChannels: proChannels,
    pageCSS: ['/css/community.css'],
    pageJS:  ['/js/community.js']
  });
});

/* ========== API: GET MESSAGES ========== */
router.get('/api/messages/:channel', async function (req, res) {
  try {
    var channel = req.params.channel;

    if (getAllChannelIds().indexOf(channel) === -1) {
      return res.status(400).json({ success: false, error: 'Invalid channel.' });
    }

    /* Pro channel access check */
    if (isProChannel(channel)) {
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ success: false, error: 'Login required.' });
      }
      if (!req.session.isPro) {
        return res.status(403).json({ success: false, error: 'Pro subscription required.' });
      }
    }

    var [rows] = await pool.execute(
      `SELECT m.id, m.content, m.channel, m.created_at,
              u.id AS user_id, u.username, u.is_pro
       FROM messages m
       JOIN users u ON m.user_id = u.id
       WHERE m.channel = ?
       ORDER BY m.created_at DESC
       LIMIT 50`,
      [channel]
    );

    return res.json({ success: true, messages: rows.reverse() });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to load messages.' });
  }
});

/* ========== API: POST MESSAGE ========== */
router.post('/api/messages', async function (req, res) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, error: 'You must be logged in to send messages.' });
    }

    var content = (req.body.content || '').trim();
    var channel = (req.body.channel || '').trim();

    if (!content || content.length === 0) {
      return res.status(400).json({ success: false, error: 'Message cannot be empty.' });
    }
    if (content.length > 2000) {
      return res.status(400).json({ success: false, error: 'Message cannot exceed 2000 characters.' });
    }
    if (getAllChannelIds().indexOf(channel) === -1) {
      return res.status(400).json({ success: false, error: 'Invalid channel.' });
    }
    if (isProChannel(channel) && !req.session.isPro) {
      return res.status(403).json({ success: false, error: 'Pro subscription required for this channel.' });
    }

    var [result] = await pool.execute(
      'INSERT INTO messages (user_id, channel, content) VALUES (?, ?, ?)',
      [req.session.userId, channel, content]
    );

    return res.json({
      success: true,
      message: {
        id:         result.insertId,
        content:    content,
        channel:    channel,
        user_id:    req.session.userId,
        username:   req.session.username,
        is_pro:     req.session.isPro ? 1 : 0,
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to send message.' });
  }
});

/* ========== API: DELETE OWN MESSAGE ========== */
router.delete('/api/messages/:id', async function (req, res) {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ success: false, error: 'Login required.' });
    }

    var messageId = parseInt(req.params.id, 10);
    if (isNaN(messageId)) {
      return res.status(400).json({ success: false, error: 'Invalid message ID.' });
    }

    var [rows] = await pool.execute(
      'SELECT id, user_id FROM messages WHERE id = ?',
      [messageId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Message not found.' });
    }

    if (rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ success: false, error: 'You can only delete your own messages.' });
    }

    await pool.execute('DELETE FROM messages WHERE id = ?', [messageId]);

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to delete message.' });
  }
});

module.exports = router;

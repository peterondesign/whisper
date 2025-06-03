#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Real-time Conversation Monitor
 * 
 * This script monitors the conversation_sessions table for new entries
 * and displays them in real-time. Useful for debugging and testing.
 * 
 * Run with: node database/monitor-conversations.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function formatConversation(conversation) {
  if (!conversation || conversation.length === 0) {
    return '   No messages yet';
  }
  
  return conversation.map((msg, index) => {
    const time = new Date(msg.timestamp).toLocaleTimeString();
    return `   ${index + 1}. [${time}]
      👤 User: ${msg.userMessage}
      🤖 AI: ${msg.aiResponse}`;
  }).join('\n\n');
}

async function displayRecentSessions() {
  try {
    console.clear();
    console.log('🎯 Voice Companion - Live Conversation Monitor');
    console.log('='.repeat(60));
    console.log(`Last updated: ${new Date().toLocaleString()}`);
    console.log('Press Ctrl+C to stop monitoring\n');

    // Get all sessions from the last 24 hours
    const { data: sessions, error } = await supabase
      .from('conversation_sessions')
      .select('*')
      .gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (sessions.length === 0) {
      console.log('📭 No recent conversations found.');
      console.log('Start the voice companion app and begin a conversation to see data here.');
      return;
    }

    sessions.forEach((session, index) => {
      const startTime = new Date(session.started_at).toLocaleString();
      const endTime = session.ended_at ? new Date(session.ended_at).toLocaleString() : 'Ongoing';
      const status = session.ended_at ? '🔴 Ended' : '🟢 Active';
      const messageCount = session.conversation.length;
      
      console.log(`📱 Session ${index + 1}: ${session.session_id.substring(0, 8)}...`);
      console.log(`   Device: ${session.device_id}`);
      console.log(`   Status: ${status}`);
      console.log(`   Started: ${startTime}`);
      console.log(`   Ended: ${endTime}`);
      console.log(`   Messages: ${messageCount}`);
      console.log(`   Conversation:`);
      console.log(formatConversation(session.conversation));
      console.log('\n' + '-'.repeat(60) + '\n');
    });

  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
  }
}

// Set up real-time monitoring
function startMonitoring() {
  // Display initial data
  displayRecentSessions();
  
  // Refresh every 5 seconds
  const interval = setInterval(displayRecentSessions, 5000);
  
  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n👋 Monitoring stopped. Goodbye!');
    process.exit(0);
  });
  
  console.log('🔄 Auto-refreshing every 5 seconds...');
}

// Command line options
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Voice Companion Conversation Monitor

Usage:
  node database/monitor-conversations.js [options]

Options:
  --once, -o    Display conversations once and exit
  --help, -h    Show this help message

Examples:
  node database/monitor-conversations.js        # Start real-time monitoring
  node database/monitor-conversations.js --once # Show current data and exit
`);
  process.exit(0);
}

if (args.includes('--once') || args.includes('-o')) {
  displayRecentSessions().then(() => process.exit(0));
} else {
  startMonitoring();
}

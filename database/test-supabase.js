#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Supabase Integration Test Script
 * 
 * This script tests the Supabase integration for the voice companion app.
 * Run with: node database/test-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Test data
const TEST_DEVICE_ID = 'test-device-' + Date.now();
const TEST_CONVERSATION = [
  {
    timestamp: new Date().toISOString(),
    userMessage: "Yesterday I had a really meaningful conversation with an old friend.",
    aiResponse: "That sounds wonderful. What made this conversation particularly meaningful to you?"
  },
  {
    timestamp: new Date(Date.now() + 60000).toISOString(),
    userMessage: "We talked about how much we've both grown over the years, and it felt like we really understood each other.",
    aiResponse: "It's beautiful when we can connect with someone on that deeper level of mutual understanding. What specific moment in that conversation made you feel most understood?"
  }
];

async function testSupabaseIntegration() {
  console.log('🧪 Testing Supabase Integration for Voice Companion App');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check connection
    console.log('1️⃣  Testing connection to Supabase...');
    const { error } = await supabase.from('conversation_sessions').select('count').limit(1);
    if (error) throw error;
    console.log('✅ Successfully connected to Supabase');
    
    // Test 2: Create session
    console.log('\n2️⃣  Testing session creation...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('conversation_sessions')
      .insert([{
        device_id: TEST_DEVICE_ID,
        conversation: []
      }])
      .select('session_id')
      .single();
    
    if (sessionError) throw sessionError;
    const sessionId = sessionData.session_id;
    console.log(`✅ Created session: ${sessionId}`);
    
    // Test 3: Update session with conversation
    console.log('\n3️⃣  Testing conversation update...');
    const { error: updateError } = await supabase
      .from('conversation_sessions')
      .update({
        conversation: TEST_CONVERSATION,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    if (updateError) throw updateError;
    console.log('✅ Successfully updated conversation data');
    
    // Test 4: Retrieve session data
    console.log('\n4️⃣  Testing data retrieval...');
    const { data: retrievedData, error: retrieveError } = await supabase
      .from('conversation_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (retrieveError) throw retrieveError;
    console.log('✅ Successfully retrieved session data');
    console.log(`   - Device ID: ${retrievedData.device_id}`);
    console.log(`   - Messages: ${retrievedData.conversation.length}`);
    console.log(`   - Started: ${new Date(retrievedData.started_at).toLocaleString()}`);
    
    // Test 5: End session
    console.log('\n5️⃣  Testing session termination...');
    const { error: endError } = await supabase
      .from('conversation_sessions')
      .update({
        ended_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    if (endError) throw endError;
    console.log('✅ Successfully ended session');
    
    // Test 6: Query by device
    console.log('\n6️⃣  Testing device-based queries...');
    const { data: deviceSessions, error: deviceError } = await supabase
      .from('conversation_sessions')
      .select('session_id, started_at, ended_at, conversation')
      .eq('device_id', TEST_DEVICE_ID)
      .order('started_at', { ascending: false });
    
    if (deviceError) throw deviceError;
    console.log(`✅ Found ${deviceSessions.length} sessions for device`);
    
    // Test 7: Cleanup test data
    console.log('\n7️⃣  Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('conversation_sessions')
      .delete()
      .eq('device_id', TEST_DEVICE_ID);
    
    if (deleteError) throw deleteError;
    console.log('✅ Successfully cleaned up test data');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 All tests passed! Supabase integration is working correctly.');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Database connection established');
    console.log('   ✅ Session creation working');
    console.log('   ✅ Conversation updates working');
    console.log('   ✅ Data retrieval working');
    console.log('   ✅ Session termination working');
    console.log('   ✅ Device-based queries working');
    console.log('   ✅ Data cleanup working');
    
    console.log('\n🚀 Your voice companion app is ready to store conversations!');
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('   1. Check your Supabase URL and API key in .env.local');
    console.log('   2. Ensure you\'ve run the database schema (database/schema.sql)');
    console.log('   3. Verify the conversation_sessions table exists');
    console.log('   4. Check Row Level Security policies');
    process.exit(1);
  }
}

// Run the test
testSupabaseIntegration();

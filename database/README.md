# Supabase Database Setup Guide

This guide walks you through setting up the database for the Voice Companion application in Supabase.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Project Created**: Create a new Supabase project
3. **Environment Variables**: Your Supabase URL and API key (already configured in `.env.local`)

## Setup Steps

### 1. Access Supabase SQL Editor

1. Go to your Supabase dashboard
2. Navigate to your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

### 2. Run the Database Schema

1. Copy the entire contents of `database/schema.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the script

This will create:
- `conversation_sessions` table with proper structure
- Indexes for optimal performance
- Row Level Security policies
- Utility functions for common operations
- Automatic timestamp updates

### 3. Verify the Setup

After running the schema, verify everything is working:

```sql
-- Check if the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'conversation_sessions'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'conversation_sessions';

-- Test a simple insert
INSERT INTO conversation_sessions (device_id, conversation) 
VALUES ('test-device', '[]'::jsonb);

-- Verify the insert worked
SELECT * FROM conversation_sessions WHERE device_id = 'test-device';
```

### 4. Configure Row Level Security (Optional)

The current setup allows all operations. For production, you might want to restrict access:

```sql
-- Example: Only allow operations for specific device IDs
DROP POLICY IF EXISTS "Allow all operations on conversation_sessions" ON conversation_sessions;

CREATE POLICY "Device-specific access" ON conversation_sessions
FOR ALL USING (
  device_id = current_setting('app.current_device_id', true)
);
```

## Database Schema Overview

### Table: `conversation_sessions`

| Column | Type | Description |
|--------|------|-------------|
| `session_id` | UUID | Primary key (auto-generated) |
| `device_id` | VARCHAR(255) | Device identifier |
| `started_at` | TIMESTAMP | When session started |
| `ended_at` | TIMESTAMP | When session ended (nullable) |
| `created_at` | TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `conversation` | JSONB | Array of conversation messages |
| `metadata` | JSONB | Additional metadata (future use) |

### Conversation Message Structure

```typescript
interface ConversationMessage {
  timestamp: string;     // ISO timestamp
  userMessage: string;   // User's voice input
  aiResponse: string;    // AI's response
}
```

### Utility Functions

- `get_active_sessions(device_id)`: Get ongoing sessions for a device
- `get_recent_sessions(device_id)`: Get last 30 days of sessions
- `cleanup_old_sessions()`: Remove sessions older than 90 days

## Testing the Integration

1. **Start the Development Server**:
   ```bash
   npm run dev
   ```

2. **Test Voice Interaction**:
   - Open the application
   - Grant microphone permissions
   - Start a conversation
   - Check Supabase dashboard for new session data

3. **Monitor Database**:
   - Go to Supabase → Table Editor
   - View `conversation_sessions` table
   - Watch sessions being created and updated in real-time

## Common Issues & Solutions

### Issue: Environment Variables Not Found
**Solution**: Ensure `.env.local` has the correct variable names:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

### Issue: RLS Blocking Inserts
**Solution**: Check RLS policies or temporarily disable:
```sql
ALTER TABLE conversation_sessions DISABLE ROW LEVEL SECURITY;
```

### Issue: JSONB Validation Errors
**Solution**: Ensure conversation data matches the expected structure:
```javascript
const validMessage = {
  timestamp: new Date().toISOString(),
  userMessage: "Hello",
  aiResponse: "Hi there!"
};
```

## Production Considerations

1. **Data Retention**: Set up automated cleanup of old sessions
2. **Indexing**: Monitor query performance and add indexes as needed
3. **Security**: Implement proper RLS policies based on your auth system
4. **Backup**: Configure automated backups in Supabase
5. **Monitoring**: Set up alerts for database errors or performance issues

## Next Steps

After setting up the database:

1. Test the complete conversation flow
2. Verify data persistence across browser sessions
3. Monitor performance with real usage
4. Consider implementing user authentication
5. Add analytics and conversation insights

The voice companion is now ready to store and retrieve conversation sessions from Supabase!

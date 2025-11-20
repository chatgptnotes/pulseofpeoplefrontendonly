/**
 * Call Polling Service
 * Runs every 10 minutes to fetch completed calls from ElevenLabs
 * Stores transcripts (in Tamil) to Supabase
 */

import { elevenLabsService } from './elevenLabsService';
import { voterCallsService } from './voterCallsService';
import { voterSentimentService } from './voterSentimentService';
import { mapElevenLabsStatusToDb } from '../utils/callStatusMapper';

class CallPollingService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastPollTime: Date = new Date();
  private processedCallIds: Set<string> = new Set(); // Track processed calls
  private pollingIntervalMs: number = 2 * 60 * 1000; // 2 minutes (reduced from 10)

  /**
   * Start polling service (runs every 10 minutes)
   */
  startPolling() {
    if (this.isRunning) {
      console.log('[CallPolling] Already running');
      return;
    }

    console.log(`[CallPolling] Starting polling service (interval: ${this.pollingIntervalMs / 1000}s)...`);
    this.isRunning = true;

    // Run immediately on start
    this.pollCompletedCalls();

    // Then run every 2 minutes (configurable via pollingIntervalMs)
    this.pollingInterval = setInterval(() => {
      this.pollCompletedCalls();
    }, this.pollingIntervalMs);
  }

  /**
   * Stop polling service
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
    console.log('[CallPolling] Stopped polling service');
  }

  /**
   * Retry helper with exponential backoff
   * @param fn Function to retry
   * @param maxRetries Maximum number of retries
   * @param initialDelay Initial delay in ms
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt); // Exponential backoff
          console.log(`[CallPolling] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Main polling function - fetches completed calls from last polling interval
   */
  async pollCompletedCalls() {
    try {
      console.log('[CallPolling] Checking for completed calls...');
      const now = new Date();
      const lookbackTime = new Date(now.getTime() - this.pollingIntervalMs - (60 * 1000)); // Add 1 min buffer

      // Get all recent conversations from ElevenLabs
      const conversations = await elevenLabsService.getConversations(100, 0);

      if (!conversations || conversations.length === 0) {
        console.log('[CallPolling] No conversations found');
        return;
      }

      console.log(`[CallPolling] Found ${conversations.length} conversations`);

      // Debug: Log ALL fields from first conversation to see what ElevenLabs actually returns
      if (conversations.length > 0) {
        console.log('[CallPolling] === FULL OBJECT DUMP: First Conversation ===');
        console.log('All fields:', Object.keys(conversations[0]));
        console.log('Full object:', JSON.stringify(conversations[0], null, 2));
        console.log('[CallPolling] === END DUMP ===');

        console.log('[CallPolling] === DETAILED DEBUG: First 3 Conversations ===');
        conversations.slice(0, 3).forEach((c: any, idx: number) => {
          const endTime = c.end_time || c.ended_at || c.completed_at || c.end_timestamp;
          console.log(`  Conversation ${idx + 1}:`);
          console.log(`    ID: ${(c.conversation_id || c.id || c.call_id || '').substring(0, 30)}`);
          console.log(`    status: "${c.status}" (type: ${typeof c.status})`);
          console.log(`    call_successful: ${c.call_successful} (type: ${typeof c.call_successful})`);
          console.log(`    end_time: ${endTime ? new Date(endTime).toISOString() : 'NULL'}`);
          console.log(`    All time fields:`, {
            end_time: c.end_time,
            ended_at: c.ended_at,
            completed_at: c.completed_at,
            end_timestamp: c.end_timestamp,
            start_time: c.start_time,
            created_at: c.created_at,
            updated_at: c.updated_at
          });
          console.log(`    lookbackTime: ${lookbackTime.toISOString()}`);
          console.log(`    now: ${now.toISOString()}`);
          if (endTime) {
            const callEndTime = new Date(endTime);
            console.log(`    Time check: ${callEndTime >= lookbackTime && callEndTime <= now ? 'PASS' : 'FAIL'}`);
          }
          console.log('');
        });
        console.log('[CallPolling] === END DEBUG ===');
      }

      // Filter for ALL finished calls (completed, failed, no_answer, busy, cancelled)
      const completedCalls = conversations.filter((conv: any) => {
        const callId = conv.conversation_id || conv.id || conv.call_id;

        // Skip if already processed
        if (this.processedCallIds.has(callId)) {
          console.log(`[CallPolling] Skipping ${callId?.substring(0, 20)}: already processed`);
          return false;
        }

        const status = conv.status?.toLowerCase() || '';

        // Accept calls with explicit call_successful status (both success and failed)
        const hasCallSuccessful = conv.call_successful === 'success' || conv.call_successful === 'failed';

        // Check status string for completion/termination indicators
        const hasFinishedStatus =
          status === 'completed' ||
          status === 'successful' ||
          status === 'ended' ||
          status === 'finished' ||
          status === 'done' ||
          status === 'failed' ||
          status === 'no-answer' ||
          status === 'no_answer' ||
          status === 'busy' ||
          status === 'cancelled';

        // Accept any call that has finished (either successfully or with failure)
        if (!hasCallSuccessful && !hasFinishedStatus) {
          console.log(`[CallPolling] Skipping ${callId?.substring(0, 20)}: status="${conv.status}", call_successful=${conv.call_successful} (not finished)`);
          return false;
        }

        console.log(`[CallPolling] ✓ ACCEPTING ${callId?.substring(0, 20)}: status="${conv.status}", call_successful=${conv.call_successful}`);
        return true;
      });

      console.log(`[CallPolling] Found ${completedCalls.length} new completed calls`);

      if (completedCalls.length === 0) {
        return;
      }

      // Process completed calls in batches to prevent database timeouts
      const BATCH_SIZE = 3; // Process 3 calls at a time
      console.log(`[CallPolling] Processing ${completedCalls.length} calls in batches of ${BATCH_SIZE}...`);

      for (let i = 0; i < completedCalls.length; i += BATCH_SIZE) {
        const batch = completedCalls.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(completedCalls.length / BATCH_SIZE);

        console.log(`[CallPolling] Processing batch ${batchNum}/${totalBatches} (${batch.length} calls)...`);

        // Process batch in parallel
        await Promise.all(
          batch.map(call => this.processCompletedCall(call))
        );

        // Small delay between batches to prevent overwhelming the database
        if (i + BATCH_SIZE < completedCalls.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      this.lastPollTime = now;
      console.log('[CallPolling] Polling completed successfully');
    } catch (error) {
      console.error('[CallPolling] Error during polling:', error);
    }
  }

  /**
   * Process a single completed call
   * - Check if already fetched
   * - Fetch transcript from ElevenLabs
   * - Save to Supabase
   * - Analyze sentiment
   */
  private async processCompletedCall(call: any) {
    try {
      const callId = call.conversation_id || call.id || call.call_id;

      if (!callId) {
        console.warn('[CallPolling] Call missing ID, skipping:', call);
        return;
      }

      console.log(`[CallPolling] Processing call: ${callId}`, {
        status: call.status,
        call_successful: call.call_successful,
        duration: call.duration_seconds || call.duration
      });

      // Check if we've already fetched this call's transcript
      const existingCall = await voterCallsService.getCallByElevenLabsId(callId);

      if (existingCall && existingCall.transcript_fetched_at) {
        console.log(`[CallPolling] Call ${callId} already fetched, skipping`);
        return;
      }

      // Fetch transcript from ElevenLabs (in Tamil) with retry logic
      console.log(`[CallPolling] Fetching transcript for call: ${callId}`);
      let transcriptData;
      try {
        transcriptData = await this.retryWithBackoff(
          () => elevenLabsService.getTranscript(callId),
          3, // max 3 retries
          2000 // start with 2s delay
        );
      } catch (error) {
        console.warn(`[CallPolling] Failed to fetch transcript for call: ${callId}`, error);
        transcriptData = { transcript: '', duration_seconds: 0 };
      }

      const hasTranscript = !!transcriptData.transcript;
      if (hasTranscript) {
        console.log(`[CallPolling] Transcript fetched successfully (${transcriptData.transcript.length} chars)`);
      } else {
        console.log(`[CallPolling] No transcript available for call: ${callId} - will save as failed/no_answer`);
      }

      // Determine organization ID from call metadata or conversation initiation data
      const metadata = call.conversation_initiation_client_data || call.metadata || {};
      // Use a valid UUID for development mode
      const DEV_ORG_ID = '00000000-0000-0000-0000-000000000001';
      const organizationId = metadata.organization_id || DEV_ORG_ID;

      // Extract phone number - ElevenLabs uses 'to_number' or 'customer_phone_number'
      const phoneNumber = call.to_number || call.customer_phone_number || call.phone_number || 'unknown';

      // Extract timestamps
      const startTime = call.start_time || call.started_at || call.start_timestamp;
      const endTime = call.end_time || call.ended_at || call.completed_at || call.end_timestamp;

      // Map ElevenLabs call status to database status
      const callStatusData = {
        status: call.status,
        call_successful: call.call_successful,
        error_message: call.error_message,
        metadata: call.metadata || call.conversation_initiation_client_data,
      };
      const { dbStatus, errorMessage } = mapElevenLabsStatusToDb(
        callStatusData,
        !!transcriptData.transcript // If we have a transcript, call was answered
      );

      console.log(`[CallPolling] Mapped status: ${dbStatus}${errorMessage ? ` (${errorMessage})` : ''}`);

      // Save to Supabase using service-role client (bypasses RLS)
      const savedCall = await voterCallsService.createCallFromPolling({
        organization_id: organizationId,
        call_id: callId,
        phone_number: phoneNumber,
        voter_name: metadata.voter_name || undefined,
        status: dbStatus, // Use mapped status instead of hard-coded 'completed'
        duration_seconds: transcriptData.duration_seconds || call.duration_seconds || call.duration || 0,
        call_started_at: startTime ? new Date(startTime) : new Date(),
        call_ended_at: endTime ? new Date(endTime) : new Date(),
        transcript: transcriptData.transcript, // Tamil transcript
        transcript_fetched_at: new Date(),
        elevenlabs_agent_id: call.agent_id || undefined,
        elevenlabs_metadata: call,
        error_message: errorMessage, // Include error message if present
        created_by: metadata.created_by || metadata.user_id || undefined,
      });

      if (!savedCall) {
        console.error(`[CallPolling] Failed to save call to database: ${callId}`);
        return;
      }

      console.log(`[CallPolling] Call saved to database: ${savedCall.id}`);

      // Only analyze sentiment if we have a transcript
      if (hasTranscript && transcriptData.transcript) {
        // Analyze sentiment using AI4Bharat (handles Tamil text)
        console.log(`[CallPolling] Analyzing sentiment with AI4Bharat for call: ${callId}`);
        const analysis = await voterSentimentService.analyzeTranscriptWithAI(
          transcriptData.transcript,
          callId
        );

        // Save sentiment analysis using service-role client (bypasses RLS)
        const savedAnalysis = await voterSentimentService.saveSentimentAnalysisFromPolling(
          savedCall.id,
          organizationId,
          analysis,
          'ai4bharat-indicbert'
        );

        if (savedAnalysis) {
          console.log(`[CallPolling] Sentiment analysis saved for call: ${callId}`);
        }
      } else {
        console.log(`[CallPolling] Skipping sentiment analysis for call ${callId} (no transcript)`);
      }

      // Mark call as processed to prevent duplicate processing
      this.processedCallIds.add(callId);
      console.log(`[CallPolling] Successfully processed call: ${callId}`);

      // Cleanup: Limit processedCallIds size to prevent memory leaks
      // Keep only last 1000 processed IDs
      if (this.processedCallIds.size > 1000) {
        const idsArray = Array.from(this.processedCallIds);
        this.processedCallIds = new Set(idsArray.slice(-500)); // Keep last 500
        console.log('[CallPolling] Cleaned up processed call IDs cache');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[CallPolling] Error processing call ${callId}:`, errorMessage);

      // Don't mark as processed if it failed - allow retry next time
      // Only mark as processed if transcript was successfully saved
    }
  }

  /**
   * Manually trigger a poll (for testing)
   */
  async triggerPoll() {
    console.log('[CallPolling] Manual poll triggered');
    await this.pollCompletedCalls();
  }

  /**
   * Get polling status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastPollTime: this.lastPollTime,
      pollingIntervalSeconds: this.pollingIntervalMs / 1000,
      processedCallsCount: this.processedCallIds.size,
    };
  }

  /**
   * Set custom polling interval (for testing or configuration)
   * @param intervalMs Interval in milliseconds
   */
  setPollingInterval(intervalMs: number) {
    if (intervalMs < 30000) {
      console.warn('[CallPolling] Interval too short, minimum is 30 seconds');
      return;
    }

    this.pollingIntervalMs = intervalMs;
    console.log(`[CallPolling] Polling interval set to ${intervalMs / 1000}s`);

    // Restart if currently running
    if (this.isRunning) {
      this.stopPolling();
      this.startPolling();
    }
  }

  /**
   * Clear processed call IDs cache (useful for testing)
   */
  clearProcessedCache() {
    this.processedCallIds.clear();
    console.log('[CallPolling] Cleared processed calls cache');
  }
}

// Export singleton instance
export const callPollingService = new CallPollingService();

// Export class for testing
export default CallPollingService;

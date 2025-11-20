/**
 * Utility to map ElevenLabs call status to database status
 * Handles: completed, no_answer, busy, failed, cancelled
 */

export type DbCallStatus = 'completed' | 'no_answer' | 'busy' | 'failed' | 'cancelled';

export interface ElevenLabsCallStatus {
  status?: string;
  call_successful?: 'success' | 'failed' | boolean;
  error_message?: string;
  metadata?: {
    twilio_status?: string;
    [key: string]: any;
  };
}

export interface MappedCallStatus {
  dbStatus: DbCallStatus;
  errorMessage?: string;
}

/**
 * Maps ElevenLabs call status to database status
 *
 * @param callStatusData - The response from ElevenLabs getCallStatus()
 * @param hasTranscript - Whether a transcript was fetched (indicates call was answered)
 * @returns Mapped database status and optional error message
 */
export function mapElevenLabsStatusToDb(
  callStatusData: ElevenLabsCallStatus,
  hasTranscript: boolean = false
): MappedCallStatus {
  let dbStatus: DbCallStatus = 'completed';
  let errorMessage: string | undefined;

  const statusLower = callStatusData.status?.toLowerCase() || '';
  const twilioStatus = callStatusData.metadata?.twilio_status?.toLowerCase() || '';

  // KEY INSIGHT: If we successfully fetched a transcript, the call was completed!
  // Check known completion statuses first
  const completionStatuses = ['done', 'completed', 'ended', 'finished', 'successful'];

  if (completionStatuses.some(s => statusLower.includes(s)) ||
      callStatusData.call_successful === 'success' ||
      callStatusData.call_successful === true ||
      hasTranscript) {
    // Call was answered and completed successfully
    dbStatus = 'completed';
  } else if (callStatusData.call_successful === 'failed' ||
             callStatusData.call_successful === false ||
             statusLower.includes('fail')) {
    // Call explicitly failed - determine why
    if (statusLower.includes('no-answer') || statusLower.includes('no_answer') ||
        twilioStatus.includes('no-answer') || twilioStatus === 'no_answer') {
      dbStatus = 'no_answer';
    } else if (statusLower.includes('busy') || twilioStatus.includes('busy')) {
      dbStatus = 'busy';
    } else if (statusLower.includes('cancel')) {
      dbStatus = 'cancelled';
    } else {
      dbStatus = 'failed';
    }
    errorMessage = callStatusData.error_message || `Call ${dbStatus.replace('_', ' ')}`;
  } else {
    // call_successful is undefined or unknown - default to completed if we have a transcript
    dbStatus = hasTranscript ? 'completed' : 'failed';
  }

  return { dbStatus, errorMessage };
}

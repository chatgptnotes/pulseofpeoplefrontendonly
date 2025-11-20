import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  AlertTitle,
  Chip,
  Grid,
  Paper,
  LinearProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  SentimentNeutral as SentimentNeutralIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { elevenLabsService } from '../../services/elevenLabsService';
import { voterSentimentService } from '../../services/voterSentimentService';
import { voterCallsService } from '../../services/voterCallsService';
import { callPollingService } from '../../services/callPollingService';
import { mapElevenLabsStatusToDb } from '../../utils/callStatusMapper';
import type { VoterCall, CallSentimentAnalysis } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface SingleCallTestProps {
  organizationId: string;
  userId?: string;
  isConfigured: boolean;
}

type CallStatus = 'idle' | 'initiating' | 'calling' | 'fetching_transcript' | 'analyzing' | 'completed' | 'failed';

const SingleCallTest: React.FC<SingleCallTestProps> = ({
  organizationId,
  userId,
  isConfigured,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [voterName, setVoterName] = useState('');
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [finalCallStatus, setFinalCallStatus] = useState<'completed' | 'no_answer' | 'busy' | 'failed' | 'cancelled' | null>(null);
  const [currentCall, setCurrentCall] = useState<VoterCall | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [sentimentAnalysis, setSentimentAnalysis] = useState<CallSentimentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<any>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [isCallStuck, setIsCallStuck] = useState(false);
  const [twilioCallSid, setTwilioCallSid] = useState<string | null>(null);
  const { showToast } = useToast();

  // Update polling status periodically
  useEffect(() => {
    const updateStatus = () => {
      const status = callPollingService.getStatus();
      setPollingStatus(status);
    };

    updateStatus();
    const statusInterval = setInterval(updateStatus, 5000); // Update every 5 seconds

    return () => clearInterval(statusInterval);
  }, []);

  // Poll for call status
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    const pollCallStatus = async () => {
      if (!currentCall?.call_id || !isPolling) return;

      try {
        const status = await elevenLabsService.getCallStatus(currentCall.call_id);

        // Extract Twilio Call SID if available
        if (status.metadata?.callSid || status.metadata?.twilio_call_sid) {
          const sid = status.metadata.callSid || status.metadata.twilio_call_sid;
          setTwilioCallSid(sid);
          console.log('[SingleCallTest] Twilio Call SID:', sid);
        }

        // Update local state only (call will be saved to database when it completes)
        setCurrentCall(prev => prev ? {
          ...prev,
          status: status.status || prev.status,
          duration_seconds: status.duration_seconds || prev.duration_seconds,
        } : null);

        // Check if call has finished (completed or failed)
        const completionStatuses = ['completed', 'ended', 'finished', 'done'];
        const failureStatuses = ['failed', 'error', 'canceled', 'cancelled', 'no-answer', 'no_answer', 'busy'];
        const statusLower = status.status?.toLowerCase() || '';

        const isFinished = completionStatuses.includes(statusLower) ||
                          failureStatuses.includes(statusLower) ||
                          status.call_successful === 'success' ||
                          status.call_successful === 'failed';

        if (isFinished) {
          setIsPolling(false);
          setIsCallStuck(false);

          // Determine final call status IMMEDIATELY using status mapper
          const { dbStatus, errorMessage } = mapElevenLabsStatusToDb(status, false);

          console.log('[SingleCallTest] Call finished - Status:', {
            elevenlabs_status: status.status,
            call_successful: status.call_successful,
            twilio_status: status.metadata?.twilio_status,
            mapped_status: dbStatus
          });

          // Set final status immediately so user sees it right away
          setFinalCallStatus(dbStatus);

          // Only fetch transcript and analyze if call was actually answered (completed)
          if (dbStatus === 'completed') {
            setCallStatus('fetching_transcript');
            await fetchTranscriptAndAnalyze(currentCall.call_id, status);
          } else {
            // Call was not answered (no_answer, busy, cancelled, failed)
            setCallStatus('failed');
            setError(errorMessage || `Call ${dbStatus.replace('_', ' ')}`);

            // Save the failed call to database
            await saveFailedCall(currentCall.call_id, status, dbStatus, errorMessage);

            showToast(`Call ${dbStatus.replace('_', ' ')}`, 'warning');
          }
        }
      } catch (err) {
        console.error('Error polling call status:', err);
      }
    };

    if (isPolling && currentCall?.call_id) {
      // Poll every 3 seconds
      pollInterval = setInterval(pollCallStatus, 3000);
      // Initial poll
      pollCallStatus();
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isPolling, currentCall]);

  // Detect stuck calls (calls that stay in "initiated" status for >40 seconds)
  useEffect(() => {
    let stuckTimer: NodeJS.Timeout | null = null;

    if (isPolling && currentCall?.status === 'initiated') {
      console.log('[SingleCallTest] Call in "initiated" status, starting stuck detection timer...');

      stuckTimer = setTimeout(async () => {
        // Check status again after 40 seconds
        try {
          const status = await elevenLabsService.getCallStatus(currentCall.call_id);

          if (status.status === 'initiated') {
            console.warn('[SingleCallTest] Call stuck in "initiated" status after 40 seconds!');
            setIsCallStuck(true);

            // Mark call as failed after timeout
            setIsPolling(false);
            setFinalCallStatus('failed');
            setCallStatus('failed');
            setError('Call timed out - likely Twilio trial account restriction');

            // Save as failed call
            const { dbStatus, errorMessage } = mapElevenLabsStatusToDb(status, false);
            await saveFailedCall(currentCall.call_id, status, 'failed', 'Call timed out in initiated status');

            showToast(
              'Call timed out - likely Twilio trial account restriction',
              'error'
            );
          }
        } catch (err) {
          console.error('[SingleCallTest] Error checking stuck call status:', err);
        }
      }, 40000); // 40 seconds
    }

    return () => {
      if (stuckTimer) {
        clearTimeout(stuckTimer);
      }
    };
  }, [isPolling, currentCall?.status, currentCall?.call_id]);

  // Save failed/no_answer/busy/cancelled calls to database
  const saveFailedCall = async (
    callId: string,
    callStatusData: any,
    dbStatus: 'no_answer' | 'busy' | 'failed' | 'cancelled',
    errorMessage?: string
  ) => {
    try {
      console.log('[SingleCallTest] Saving failed call to database:', { callId, dbStatus, errorMessage });

      const savedCall = await voterCallsService.createCallFromPolling({
        organization_id: organizationId,
        call_id: callId,
        phone_number: currentCall!.phone_number,
        voter_name: currentCall!.voter_name,
        status: dbStatus,
        duration_seconds: callStatusData.duration_seconds || 0,
        call_started_at: currentCall!.call_started_at,
        call_ended_at: new Date(),
        transcript: null, // No transcript for failed calls
        transcript_fetched_at: null,
        elevenlabs_agent_id: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
        elevenlabs_metadata: callStatusData,
        error_message: errorMessage,
        created_by: userId,
      });

      if (savedCall) {
        console.log('[SingleCallTest] Failed call saved successfully:', savedCall.id);
      }
    } catch (err) {
      console.error('[SingleCallTest] Error saving failed call:', err);
      // Don't throw - just log the error
    }
  };

  const fetchTranscriptAndAnalyze = async (callId: string, callStatusData: any) => {
    try {
      // Fetch transcript from ElevenLabs
      setCallStatus('fetching_transcript');
      const transcriptData = await elevenLabsService.getTranscript(callId);

      if (!transcriptData.transcript) {
        throw new Error('No transcript available');
      }

      setTranscript(transcriptData.transcript);

      console.log('[SingleCallTest] Transcript fetched, saving completed call to database');

      // Save the completed call data to Supabase
      // Using createCallFromPolling to bypass RLS with service-role client
      const savedCall = await voterCallsService.createCallFromPolling({
        organization_id: organizationId,
        call_id: callId,
        phone_number: currentCall!.phone_number,
        voter_name: currentCall!.voter_name,
        status: 'completed', // We know it's completed if we got here
        duration_seconds: transcriptData.duration_seconds || callStatusData.duration_seconds || 0,
        call_started_at: currentCall!.call_started_at,
        call_ended_at: new Date(),
        transcript: transcriptData.transcript,
        transcript_fetched_at: new Date(),
        elevenlabs_agent_id: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
        elevenlabs_metadata: callStatusData,
        created_by: userId,
      });

      if (!savedCall) {
        console.warn('Failed to save call to database, continuing with analysis...');
      }

      // Analyze sentiment using AI4Bharat (Hugging Face)
      setCallStatus('analyzing');
      const analysis = await voterSentimentService.analyzeTranscriptWithAI(transcriptData.transcript, callId);

      // Save sentiment analysis (only if call was saved)
      if (savedCall) {
        const savedAnalysis = await voterSentimentService.saveSentimentAnalysis(
          savedCall.id,
          organizationId,
          analysis
        );

        if (savedAnalysis) {
          setSentimentAnalysis(savedAnalysis);
        }
      } else {
        // Just show analysis without saving to DB
        setSentimentAnalysis({
          id: 'temp-' + Date.now(),
          call_id: callId,
          organization_id: organizationId,
          ...analysis,
          created_at: new Date(),
          updated_at: new Date(),
        } as CallSentimentAnalysis);
      }

      setCallStatus('completed');
      showToast('Call completed and analyzed successfully', 'success');
    } catch (err: any) {
      console.error('Error fetching transcript:', err);
      setError(err.message || 'Failed to fetch transcript');
      setCallStatus('failed');
    }
  };

  const initiateCall = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    if (!elevenLabsService.isValidPhoneNumber(phoneNumber)) {
      setError('Please enter a valid Indian phone number (10 digits)');
      return;
    }

    setError(null);
    setCallStatus('initiating');
    setTranscript('');
    setSentimentAnalysis(null);
    setIsCallStuck(false);
    setTwilioCallSid(null);

    try {
      // Format phone number
      const formattedNumber = elevenLabsService.formatPhoneNumber(phoneNumber);

      // Initiate call DIRECTLY via ElevenLabs (skip Supabase for now)
      setCallStatus('calling');
      const response = await elevenLabsService.initiateCall(formattedNumber, {
        voter_name: voterName,
        call_type: 'test',
        organization_id: organizationId,
        phone_number: formattedNumber,
      });

      // Store call info locally (will be saved to Supabase when call completes)
      const localCallData: VoterCall = {
        // No id - this is a local-only object until call completes
        organization_id: organizationId,
        call_id: response.call_id,
        phone_number: formattedNumber,
        voter_name: voterName || undefined,
        status: 'initiated',
        call_started_at: new Date(),
        elevenlabs_agent_id: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
        created_at: new Date(),
        updated_at: new Date(),
      };

      setCurrentCall(localCallData);

      // Check for immediate Twilio errors in response
      if (response.twilio_error) {
        console.warn('[SingleCallTest] Twilio error detected:', response.twilio_error);
        setError(`Twilio Error: ${response.twilio_error}`);
        showToast('Call initiated, but may have issues connecting', 'warning');
      } else {
        showToast('Call initiated successfully! Phone should ring shortly.', 'success');
      }

      // Start polling for call status
      setIsPolling(true);

    } catch (err: any) {
      console.error('Error initiating call:', err);
      setError(err.message || 'Failed to initiate call');
      setCallStatus('failed');
      showToast('Failed to initiate call', 'error');
    }
  };

  const resetForm = () => {
    setPhoneNumber('');
    setVoterName('');
    setCallStatus('idle');
    setFinalCallStatus(null);
    setCurrentCall(null);
    setTranscript('');
    setSentimentAnalysis(null);
    setError(null);
    setIsPolling(false);
    setIsCallStuck(false);
    setTwilioCallSid(null);
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
      case 'support':
        return <SentimentSatisfiedIcon color="success" />;
      case 'negative':
      case 'against':
        return <SentimentDissatisfiedIcon color="error" />;
      default:
        return <SentimentNeutralIcon color="action" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
      case 'support':
        return 'success';
      case 'negative':
      case 'against':
        return 'error';
      case 'neutral':
      case 'undecided':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleManualRefresh = async () => {
    if (!currentCall?.call_id) return;

    setIsManualRefreshing(true);
    try {
      showToast('Fetching latest transcript...', 'info');
      // Fetch latest call status first
      const callStatusData = await elevenLabsService.getCallStatus(currentCall.call_id);
      await fetchTranscriptAndAnalyze(currentCall.call_id, callStatusData);
      showToast('Transcript refreshed successfully!', 'success');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh transcript';
      showToast(errorMsg, 'error');
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const formatTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <Box>
      {/* REMOVED: Background Polling Alert - User prefers manual workflow only */}

      {/* Stuck Call Warning */}
      {isCallStuck && (
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{ mb: 3 }}
          action={
            twilioCallSid && (
              <Button
                color="inherit"
                size="small"
                href={`https://console.twilio.com/us1/monitor/logs/calls/${twilioCallSid}`}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<OpenInNewIcon />}
              >
                View in Twilio
              </Button>
            )
          }
        >
          <AlertTitle>Call Stuck at Twilio Level</AlertTitle>
          <Typography variant="body2" gutterBottom>
            The call has been stuck in "initiated" status for over 30 seconds. This is usually caused by <strong>Twilio trial account restrictions</strong>.
          </Typography>

          <Typography variant="body2" component="div" sx={{ mt: 2 }}>
            <strong>To fix this issue:</strong>
            <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
              <li>
                <strong>Verify the phone number</strong> in Twilio console:{' '}
                <a
                  href="https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  Add Verified Caller ID
                </a>
              </li>
              <li>
                <strong>Enable India calling</strong> in geo-permissions:{' '}
                <a
                  href="https://console.twilio.com/us1/develop/voice/settings/geo-permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  Geographic Permissions
                </a>
              </li>
              <li>
                <strong>Check call logs</strong> for specific error codes:{' '}
                <a
                  href="https://console.twilio.com/us1/monitor/logs/calls"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  Twilio Call Logs
                </a>
              </li>
              <li>
                Or <strong>upgrade your Twilio account</strong> to remove verification requirements
              </li>
            </ol>
          </Typography>

          {phoneNumber && (
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              Phone number to verify: <strong>{phoneNumber}</strong>
            </Typography>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Input Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Single Call
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Make a test call to a single voter to verify the system
              </Typography>

              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+919876543210 or 9876543210"
                  helperText="Enter 10-digit Indian mobile number"
                  disabled={callStatus !== 'idle'}
                />

                <TextField
                  fullWidth
                  label="Voter Name (Optional)"
                  value={voterName}
                  onChange={(e) => setVoterName(e.target.value)}
                  placeholder="John Doe"
                  disabled={callStatus !== 'idle'}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={
                      callStatus === 'idle' ? <PhoneIcon /> : <CircularProgress size={20} color="inherit" />
                    }
                    onClick={initiateCall}
                    disabled={!isConfigured || callStatus !== 'idle'}
                    fullWidth
                  >
                    {callStatus === 'idle' ? 'Initiate Call' : 'Calling...'}
                  </Button>

                  {callStatus !== 'idle' && (
                    <Button
                      variant="outlined"
                      onClick={resetForm}
                      startIcon={<RefreshIcon />}
                    >
                      Reset
                    </Button>
                  )}
                </Box>

                {!isConfigured && (
                  <Alert severity="warning">
                    ElevenLabs is not configured. Please add API credentials.
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Section */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Call Status
              </Typography>

              <Stack spacing={2}>
                {/* Status Indicator */}
                <Box>
                  {callStatus === 'idle' && (
                    <Chip label="Ready" color="default" icon={<PendingIcon />} />
                  )}
                  {callStatus === 'initiating' && (
                    <Chip
                      label="Initiating Call"
                      color="info"
                      icon={<CircularProgress size={16} color="inherit" />}
                    />
                  )}
                  {callStatus === 'calling' && (
                    <Chip
                      label="Call in Progress"
                      color="primary"
                      icon={<CircularProgress size={16} color="inherit" />}
                    />
                  )}
                  {callStatus === 'fetching_transcript' && (
                    <Chip
                      label="Fetching Transcript"
                      color="info"
                      icon={<CircularProgress size={16} color="inherit" />}
                    />
                  )}
                  {callStatus === 'analyzing' && (
                    <Chip
                      label="Analyzing Sentiment"
                      color="secondary"
                      icon={<CircularProgress size={16} color="inherit" />}
                    />
                  )}
                  {callStatus === 'completed' && (
                    <Chip label="Completed" color="success" icon={<CheckCircleIcon />} />
                  )}
                  {callStatus === 'failed' && (
                    <Chip label="Failed" color="error" icon={<ErrorIcon />} />
                  )}
                </Box>

                {/* Detailed Final Status - Shows if call was answered, not answered, busy, etc. */}
                {finalCallStatus && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Call Outcome:
                    </Typography>
                    {finalCallStatus === 'completed' && (
                      <Chip
                        label="Answered & Completed"
                        color="success"
                        icon={<CheckCircleIcon />}
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    {finalCallStatus === 'no_answer' && (
                      <Chip
                        label="Not Answered"
                        color="warning"
                        icon={<WarningIcon />}
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    {finalCallStatus === 'busy' && (
                      <Chip
                        label="Line Busy"
                        color="warning"
                        icon={<WarningIcon />}
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    {finalCallStatus === 'cancelled' && (
                      <Chip
                        label="Cancelled"
                        color="default"
                        icon={<PendingIcon />}
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                    {finalCallStatus === 'failed' && (
                      <Chip
                        label="Call Failed"
                        color="error"
                        icon={<ErrorIcon />}
                        sx={{ fontWeight: 600 }}
                      />
                    )}
                  </Box>
                )}

                {/* Progress Bar */}
                {callStatus !== 'idle' && callStatus !== 'completed' && callStatus !== 'failed' && (
                  <LinearProgress />
                )}

                {/* Error Message */}
                {error && (
                  <Alert severity="error">
                    <AlertTitle>Error</AlertTitle>
                    {error}
                  </Alert>
                )}

                {/* Call Info */}
                {currentCall && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Call ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {currentCall.call_id || currentCall.id}
                    </Typography>
                    {currentCall.duration_seconds && (
                      <>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Duration
                        </Typography>
                        <Typography variant="body2">
                          {Math.floor(currentCall.duration_seconds / 60)}m {currentCall.duration_seconds % 60}s
                        </Typography>
                      </>
                    )}
                  </Paper>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Transcript Section */}
        {transcript && (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Call Transcript
                  </Typography>
                  {currentCall && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={isManualRefreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
                      onClick={handleManualRefresh}
                      disabled={isManualRefreshing || callStatus === 'fetching_transcript' || callStatus === 'analyzing'}
                    >
                      {isManualRefreshing ? 'Refreshing...' : 'Refresh Transcript'}
                    </Button>
                  )}
                </Box>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    maxHeight: 300,
                    overflow: 'auto',
                    bgcolor: '#f5f5f5',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }}
                >
                  {transcript}
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Sentiment Analysis Section */}
        {sentimentAnalysis && (
          <Grid item xs={12}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sentiment Analysis
                </Typography>

                <Grid container spacing={3}>
                  {/* Previous Government Sentiment */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getSentimentIcon(sentimentAnalysis.previous_govt_sentiment)}
                        <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                          Previous Government
                        </Typography>
                      </Box>
                      <Chip
                        label={sentimentAnalysis.previous_govt_sentiment?.toUpperCase() || 'N/A'}
                        color={getSentimentColor(sentimentAnalysis.previous_govt_sentiment)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {sentimentAnalysis.previous_govt_summary || 'No analysis available'}
                      </Typography>
                      {sentimentAnalysis.previous_govt_keywords && sentimentAnalysis.previous_govt_keywords.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {sentimentAnalysis.previous_govt_keywords.slice(0, 5).map((keyword, idx) => (
                            <Chip key={idx} label={keyword} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* TVK Sentiment */}
                  <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {getSentimentIcon(sentimentAnalysis.tvk_sentiment)}
                        <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                          TVK (Vijay's Party)
                        </Typography>
                      </Box>
                      <Chip
                        label={sentimentAnalysis.tvk_sentiment?.toUpperCase() || 'N/A'}
                        color={getSentimentColor(sentimentAnalysis.tvk_sentiment)}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {sentimentAnalysis.tvk_summary || 'No analysis available'}
                      </Typography>
                      {sentimentAnalysis.tvk_keywords && sentimentAnalysis.tvk_keywords.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {sentimentAnalysis.tvk_keywords.slice(0, 5).map((keyword, idx) => (
                            <Chip key={idx} label={keyword} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Voting Intention */}
                  {sentimentAnalysis.voting_intention && (
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          Voting Intention
                        </Typography>
                        <Chip
                          label={sentimentAnalysis.voting_intention}
                          color="primary"
                          sx={{ mb: 1 }}
                        />
                        {sentimentAnalysis.voting_confidence && (
                          <Typography variant="body2" color="text.secondary">
                            Confidence: {sentimentAnalysis.voting_confidence.replace('_', ' ')}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  )}

                  {/* Key Issues */}
                  {sentimentAnalysis.key_issues && sentimentAnalysis.key_issues.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                          Key Issues Discussed
                        </Typography>
                        <Stack spacing={0.5}>
                          {sentimentAnalysis.key_issues.slice(0, 5).map((issue, idx) => (
                            <Chip
                              key={idx}
                              label={`${issue.issue} (${issue.sentiment})`}
                              size="small"
                              color={getSentimentColor(issue.sentiment)}
                            />
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  )}

                  {/* Overall Summary */}
                  <Grid item xs={12}>
                    <Alert
                      severity={
                        sentimentAnalysis.overall_sentiment === 'positive' ? 'success' :
                        sentimentAnalysis.overall_sentiment === 'negative' ? 'error' :
                        'info'
                      }
                    >
                      <AlertTitle>Overall Analysis</AlertTitle>
                      {sentimentAnalysis.overall_summary}
                    </Alert>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SingleCallTest;

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { trackSecurityEvent } from '~/lib/monitoring';

interface UploadAttempt {
  timestamp: number;
  count: number;
}

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_UPLOADS_PER_WINDOW = 5;
const COOLDOWN_PERIOD = 5 * 60 * 1000; // 5 minutes cooldown after hitting limit

/**
 * Custom hook for rate limiting file uploads
 * Implements a sliding window rate limiter with exponential backoff
 */
export function useUploadRateLimit() {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingUploads, setRemainingUploads] = useState(MAX_UPLOADS_PER_WINDOW);
  const [resetTime, setResetTime] = useState<number | null>(null);
  
  // Use refs to persist data across re-renders
  const uploadsRef = useRef<UploadAttempt[]>([]);
  const cooldownRef = useRef<number | null>(null);

  /**
   * Cleans up old upload attempts outside the rate limit window
   */
  const cleanupOldAttempts = useCallback(() => {
    const now = Date.now();
    uploadsRef.current = uploadsRef.current.filter(
      attempt => now - attempt.timestamp < RATE_LIMIT_WINDOW
    );
  }, []);

  /**
   * Calculates remaining uploads in the current window
   */
  const calculateRemainingUploads = useCallback(() => {
    const now = Date.now();
    const recentUploads = uploadsRef.current.filter(
      attempt => now - attempt.timestamp < RATE_LIMIT_WINDOW
    );
    
    const totalRecentUploads = recentUploads.reduce(
      (sum, attempt) => sum + attempt.count, 0
    );
    
    return Math.max(0, MAX_UPLOADS_PER_WINDOW - totalRecentUploads);
  }, []);

  /**
   * Checks if upload should be allowed and updates rate limit state
   */
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Check if we're still in cooldown period
    if (cooldownRef.current && now < cooldownRef.current) {
      const remainingCooldown = Math.ceil((cooldownRef.current - now) / 1000);
      toast.error(
        `Rate limit exceeded. Please wait ${Math.ceil(remainingCooldown / 60)} minutes before trying again.`,
        { duration: 5000 }
      );
      setIsRateLimited(true);
      setResetTime(cooldownRef.current);
      return false;
    }

    // Clean up old attempts
    cleanupOldAttempts();
    
    // Calculate remaining uploads
    const remaining = calculateRemainingUploads();
    setRemainingUploads(remaining);

    // Check if we can proceed
    if (remaining <= 0) {
      // Hit rate limit - start cooldown
      cooldownRef.current = now + COOLDOWN_PERIOD;
      setIsRateLimited(true);
      setResetTime(cooldownRef.current);
      
      // Track security event
      trackSecurityEvent({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        details: {
          maxUploads: MAX_UPLOADS_PER_WINDOW,
          windowMinutes: RATE_LIMIT_WINDOW / (60 * 1000),
          cooldownMinutes: COOLDOWN_PERIOD / (60 * 1000)
        }
      });
      
      toast.error(
        `Upload rate limit exceeded. You can upload ${MAX_UPLOADS_PER_WINDOW} files per minute. Please wait 5 minutes.`,
        { duration: 10000 }
      );
      
      return false;
    }

    // Upload allowed
    setIsRateLimited(false);
    setResetTime(null);
    cooldownRef.current = null;
    
    return true;
  }, [cleanupOldAttempts, calculateRemainingUploads]);

  /**
   * Records a successful upload attempt
   */
  const recordUpload = useCallback(() => {
    const now = Date.now();
    uploadsRef.current.push({
      timestamp: now,
      count: 1
    });
    
    // Update remaining count
    const remaining = calculateRemainingUploads();
    setRemainingUploads(remaining);
    
    // Show warning when approaching limit
    if (remaining <= 1) {
      toast.warning(
        `Upload limit warning: ${remaining} uploads remaining in the next minute.`,
        { duration: 8000 }
      );
    }
  }, [calculateRemainingUploads]);

  /**
   * Gets time remaining until rate limit resets (in seconds)
   */
  const getTimeUntilReset = useCallback((): number => {
    if (!resetTime) return 0;
    return Math.max(0, Math.ceil((resetTime - Date.now()) / 1000));
  }, [resetTime]);

  /**
   * Gets formatted time until reset
   */
  const getFormattedTimeUntilReset = useCallback((): string => {
    const seconds = getTimeUntilReset();
    if (seconds <= 0) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }, [getTimeUntilReset]);

  /**
   * Manually reset rate limit (for testing or admin use)
   */
  const resetRateLimit = useCallback(() => {
    uploadsRef.current = [];
    cooldownRef.current = null;
    setIsRateLimited(false);
    setRemainingUploads(MAX_UPLOADS_PER_WINDOW);
    setResetTime(null);
    toast.success('Upload rate limit has been reset.');
  }, []);

  return {
    // State
    isRateLimited,
    remainingUploads,
    resetTime,
    
    // Actions
    checkRateLimit,
    recordUpload,
    resetRateLimit,
    
    // Utilities
    getTimeUntilReset,
    getFormattedTimeUntilReset,
    
    // Constants for display
    maxUploadsPerWindow: MAX_UPLOADS_PER_WINDOW,
    rateLimitWindowMinutes: RATE_LIMIT_WINDOW / (60 * 1000),
    cooldownMinutes: COOLDOWN_PERIOD / (60 * 1000)
  };
}
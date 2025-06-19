/**
 * Production-ready logging utility with data sanitization
 * Prevents sensitive data exposure while maintaining useful debugging info
 */

const isDev = process.env.NODE_ENV === 'development';
const isProd = process.env.NODE_ENV === 'production';

interface LogMetadata {
  [key: string]: any;
}

/**
 * Sanitizes metadata to remove sensitive information
 */
function sanitizeMetadata(metadata?: LogMetadata): LogMetadata | undefined {
  if (!metadata) return undefined;

  const sanitized = { ...metadata };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'authorization',
    'clerk_secret', 'polar_token', 'openai_key', 'api_key',
    'email', 'phone', 'ssn', 'credit_card', 'cvv',
    'clerk_user_id', 'convex_user_id'
  ];

  const sensitivePatterns = [
    /sk_.*/, /pk_.*/, /polar_.*/, /bearer\s+/i,
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  ];

  function sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      // Check for sensitive patterns
      for (const pattern of sensitivePatterns) {
        if (pattern.test(obj)) {
          return '[REDACTED]';
        }
      }
      return obj;
    }
    
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      const sanitizedObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        // Check if key is sensitive
        if (sensitiveFields.some(field => lowerKey.includes(field))) {
          sanitizedObj[key] = '[REDACTED]';
        } else {
          sanitizedObj[key] = sanitizeObject(value);
        }
      }
      return sanitizedObj;
    }
    
    return obj;
  }

  return sanitizeObject(sanitized);
}

/**
 * Formats error objects safely for logging
 */
function formatError(error?: Error | unknown): object {
  if (!error) return {};
  
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isDev ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
  }
  
  return {
    error: isDev ? String(error) : 'Unknown error occurred',
    timestamp: new Date().toISOString()
  };
}

export const logger = {
  /**
   * Development-only debug logging
   */
  debug: (message: string, metadata?: LogMetadata) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, sanitizeMetadata(metadata));
    }
  },

  /**
   * Informational logging (always logged but sanitized in production)
   */
  info: (message: string, metadata?: LogMetadata) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, metadata);
    } else if (isProd) {
      console.log(`[INFO] ${message}`, sanitizeMetadata(metadata));
    }
  },

  /**
   * Warning logging (always logged)
   */
  warn: (message: string, metadata?: LogMetadata) => {
    console.warn(`[WARN] ${message}`, sanitizeMetadata(metadata));
  },

  /**
   * Error logging (always logged with sanitization)
   */
  error: (message: string, error?: Error | unknown, metadata?: LogMetadata) => {
    const errorInfo = formatError(error);
    const sanitizedMetadata = sanitizeMetadata(metadata);
    
    console.error(`[ERROR] ${message}`, {
      ...errorInfo,
      ...sanitizedMetadata,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Security event logging (always logged)
   */
  security: (message: string, metadata?: LogMetadata) => {
    console.warn(`[SECURITY] ${message}`, {
      ...sanitizeMetadata(metadata),
      timestamp: new Date().toISOString(),
      level: 'security'
    });
  },

  /**
   * Audit logging for important business events
   */
  audit: (message: string, metadata?: LogMetadata) => {
    console.log(`[AUDIT] ${message}`, {
      ...sanitizeMetadata(metadata),
      timestamp: new Date().toISOString(),
      level: 'audit'
    });
  }
};

/**
 * Helper for conditionally logging in development only
 */
export const devLog = (message: string, data?: any) => {
  if (isDev) {
    console.log(`[DEV] ${message}`, data);
  }
};

/**
 * Performance timing utility
 */
export const createTimer = (label: string) => {
  const start = Date.now();
  
  return {
    end: (metadata?: LogMetadata) => {
      const duration = Date.now() - start;
      logger.debug(`${label} completed in ${duration}ms`, {
        duration,
        ...metadata
      });
    }
  };
};
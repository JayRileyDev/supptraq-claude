/**
 * Application monitoring and error tracking utilities
 * Provides centralized error reporting and performance monitoring
 */

import { logger } from './logger';

interface ErrorContext {
  userId?: string;
  route?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  metadata?: Record<string, any>;
}

interface SecurityEvent {
  type: 'auth_failure' | 'access_denied' | 'rate_limit_exceeded' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Track application errors with context
   */
  trackError(error: Error, context?: ErrorContext): void {
    const errorData = {
      name: error.name,
      message: error.message,
      stack: this.isProduction ? undefined : error.stack,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      }
    };

    // Log error using secure logger
    logger.error('Application error tracked', error, errorData);

    // In production, integrate with error tracking service
    if (this.isProduction) {
      this.sendToErrorService(errorData);
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metric: PerformanceMetric): void {
    const performanceData = {
      ...metric,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    logger.info('Performance metric tracked', performanceData);

    // In production, send to analytics service
    if (this.isProduction) {
      this.sendToAnalyticsService(performanceData);
    }
  }

  /**
   * Track security events
   */
  trackSecurityEvent(event: SecurityEvent): void {
    const securityData = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    logger.security('Security event tracked', securityData);

    // Always send security events to monitoring service
    this.sendToSecurityService(securityData);

    // For critical events, immediate alerting
    if (event.severity === 'critical') {
      this.sendCriticalAlert(securityData);
    }
  }

  /**
   * Track user actions for audit trail
   */
  trackUserAction(action: string, userId: string, metadata?: Record<string, any>): void {
    const actionData = {
      action,
      userId,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        sessionId: this.getSessionId()
      }
    };

    logger.audit('User action tracked', actionData);

    // Send to audit service
    if (this.isProduction) {
      this.sendToAuditService(actionData);
    }
  }

  /**
   * Track file upload events
   */
  trackFileUpload(userId: string, fileType: string, fileSize: number, success: boolean, error?: string): void {
    const uploadData = {
      userId,
      fileType,
      fileSize,
      success,
      error,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId()
    };

    if (success) {
      logger.audit('File upload successful', uploadData);
    } else {
      logger.error('File upload failed', new Error(error || 'Upload failed'), uploadData);
    }

    // Track upload patterns for security monitoring
    this.sendToSecurityService({
      type: 'suspicious_activity',
      severity: 'low',
      userId,
      details: uploadData
    });
  }

  /**
   * Create performance timer
   */
  createPerformanceTimer(name: string): { end: (metadata?: Record<string, any>) => void } {
    const startTime = Date.now();
    
    return {
      end: (metadata?: Record<string, any>) => {
        const duration = Date.now() - startTime;
        this.trackPerformance({
          name,
          duration,
          metadata
        });
      }
    };
  }

  /**
   * Track API response times
   */
  trackApiCall(endpoint: string, method: string, statusCode: number, duration: number, userId?: string): void {
    const apiData = {
      endpoint,
      method,
      statusCode,
      duration,
      userId,
      timestamp: new Date().toISOString()
    };

    if (statusCode >= 400) {
      logger.warn('API error tracked', apiData);
    } else {
      logger.debug('API call tracked', apiData);
    }

    this.trackPerformance({
      name: `api_call_${endpoint.replace('/', '_')}`,
      duration,
      metadata: apiData
    });
  }

  /**
   * Health check monitoring
   */
  trackHealthCheck(service: string, status: 'healthy' | 'degraded' | 'unhealthy', details?: Record<string, any>): void {
    const healthData = {
      service,
      status,
      details,
      timestamp: new Date().toISOString()
    };

    if (status === 'unhealthy') {
      logger.error('Service unhealthy', new Error(`${service} is unhealthy`), healthData);
    } else if (status === 'degraded') {
      logger.warn('Service degraded', healthData);
    } else {
      logger.debug('Service healthy', healthData);
    }
  }

  /**
   * Private helper methods
   */
  private getSessionId(): string {
    if (typeof window !== 'undefined') {
      let sessionId = sessionStorage.getItem('supptraq_session_id');
      if (!sessionId) {
        sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        sessionStorage.setItem('supptraq_session_id', sessionId);
      }
      return sessionId;
    }
    return 'server_session';
  }

  private sendToErrorService(errorData: any): void {
    // Integrate with services like Sentry, Bugsnag, etc.
    if (this.isProduction && typeof window !== 'undefined') {
      // Client-side error reporting
      // TODO: Integrate with actual error service
    }
  }

  private sendToAnalyticsService(performanceData: any): void {
    // Integrate with services like Google Analytics, Mixpanel, etc.
    if (this.isProduction) {
      // TODO: Integrate with actual analytics service
    }
  }

  private sendToSecurityService(securityData: any): void {
    // Integrate with security monitoring services
    if (this.isProduction) {
      // TODO: Integrate with actual security service
    }
  }

  private sendToAuditService(actionData: any): void {
    // Integrate with audit logging services
    if (this.isProduction) {
      // TODO: Integrate with actual audit service
    }
  }

  private sendCriticalAlert(securityData: any): void {
    // Send immediate alerts for critical security events
    if (this.isProduction) {
      // TODO: Integrate with:
      // - PagerDuty for immediate alerts
      // - Slack/Discord webhooks
      // - Email notifications
      // - SMS alerts for critical issues
    }
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Convenience functions for common use cases
export const trackError = (error: Error, context?: ErrorContext) => monitoring.trackError(error, context);
export const trackPerformance = (metric: PerformanceMetric) => monitoring.trackPerformance(metric);
export const trackSecurityEvent = (event: SecurityEvent) => monitoring.trackSecurityEvent(event);
export const trackUserAction = (action: string, userId: string, metadata?: Record<string, any>) => 
  monitoring.trackUserAction(action, userId, metadata);
export const createTimer = (name: string) => monitoring.createPerformanceTimer(name);

// React Error Boundary helper
export class ErrorBoundary extends Error {
  constructor(message: string, public context?: ErrorContext) {
    super(message);
    this.name = 'ErrorBoundary';
  }
}

// Global error handler setup
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    monitoring.trackError(new Error(event.message), {
      component: 'GlobalErrorHandler',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    monitoring.trackError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        component: 'UnhandledPromiseRejection'
      }
    );
  });
}
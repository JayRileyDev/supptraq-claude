# Supptraq Security Documentation

## Overview

This document outlines the security measures, procedures, and guidelines for the Supptraq SaaS application. It serves as a reference for developers, administrators, and security personnel.

## Security Architecture

### Authentication & Authorization
- **Primary Authentication**: Clerk.dev integration with JWT tokens
- **Database Verification**: User existence validated in Convex database
- **Role-Based Access Control**: Owner/Member roles with page-level permissions
- **Organization Scoping**: All data access scoped to user's organization/franchise

### Route Protection
- **Server-Side Protection**: React Router loaders validate authentication
- **Client-Side Guards**: `PageAccessGuard` component for granular access control
- **Automatic Redirects**: Unauthenticated users redirected to sign-in
- **Error Handling**: Graceful handling of auth failures and token expiration

## Security Features Implemented

### 🔒 File Upload Security
- **File Type Restriction**: CSV files only, validated at dropzone level
- **File Size Limits**: 50MB maximum per upload (configurable)
- **Rate Limiting**: 5 uploads per minute per user with 5-minute cooldown
- **Content Validation**: Server-side CSV structure and data validation
- **Memory Safety**: In-memory processing, no file persistence
- **Chunked Processing**: Large files processed in chunks to prevent memory exhaustion

### 🛡️ Data Protection
- **Input Sanitization**: All user inputs validated and sanitized
- **SQL Injection Prevention**: Convex ORM prevents direct SQL access
- **XSS Prevention**: Proper data encoding in React components
- **CORS Configuration**: Restricted origins for API access
- **Environment Variables**: Sensitive data stored securely outside codebase

### 📊 Monitoring & Logging
- **Secure Logging**: Production logging with data sanitization
- **Error Tracking**: Centralized error monitoring with context
- **Security Events**: Rate limit violations and access attempts logged
- **Audit Trail**: User actions tracked for compliance
- **Performance Monitoring**: API response times and system health tracked

### 🚨 Security Events Detection
- **Rate Limit Violations**: Upload and API rate limiting with alerts
- **Authentication Failures**: Failed login attempts monitored
- **Access Violations**: Unauthorized page access attempts logged
- **Suspicious Activity**: Pattern detection for potential threats

## Environment Configuration

### Required Environment Variables
```bash
# Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# Database
CONVEX_DEPLOYMENT=prod:your-deployment
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Billing
POLAR_ACCESS_TOKEN=polar_live_...
POLAR_ORGANIZATION_ID=...
POLAR_WEBHOOK_SECRET=...

# AI Services
OPENAI_API_KEY=sk_...

# Application
FRONTEND_URL=https://app.supptraq.com
NODE_ENV=production
```

### Security Headers (Deployment)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

## Security Procedures

### Incident Response

#### 1. Security Incident Classification
- **Critical**: Data breach, system compromise, exposed credentials
- **High**: Authentication bypass, privilege escalation, DoS attacks
- **Medium**: Rate limit violations, suspicious access patterns
- **Low**: Failed login attempts, minor configuration issues

#### 2. Response Steps
1. **Immediate**: Assess severity and contain the threat
2. **Investigation**: Analyze logs and determine scope of impact
3. **Mitigation**: Apply fixes and security patches
4. **Communication**: Notify affected users and stakeholders
5. **Documentation**: Record incident details and lessons learned
6. **Review**: Update security measures to prevent recurrence

### Regular Security Tasks

#### Daily
- [ ] Monitor error logs for security events
- [ ] Review failed authentication attempts
- [ ] Check system health and performance metrics

#### Weekly
- [ ] Review user access permissions
- [ ] Analyze upload patterns for anomalies
- [ ] Update security monitoring dashboards
- [ ] Review and rotate any temporary access credentials

#### Monthly
- [ ] Security dependency updates
- [ ] Review and update access control policies
- [ ] Conduct security training for team members
- [ ] Test backup and recovery procedures

#### Quarterly
- [ ] Full security audit and penetration testing
- [ ] Review and update incident response procedures
- [ ] Update security documentation
- [ ] Conduct disaster recovery drills

### Secure Development Guidelines

#### Code Security
1. **Never commit secrets**: Use environment variables for all sensitive data
2. **Input validation**: Validate all inputs on both client and server
3. **Error handling**: Don't expose sensitive information in error messages
4. **Logging**: Use secure logging utilities, never log passwords or tokens
5. **Dependencies**: Keep dependencies updated and scan for vulnerabilities

#### Deployment Security
1. **Environment separation**: Separate development, staging, and production
2. **Access controls**: Limit production access to authorized personnel only
3. **Monitoring**: Enable comprehensive logging and monitoring
4. **Backups**: Regular encrypted backups with tested recovery procedures
5. **Updates**: Regular security updates and patch management

## File Upload Security Details

### Validation Pipeline
1. **Client-Side**: File type and size validation at dropzone
2. **Rate Limiting**: Upload frequency restrictions per user
3. **Server-Side**: Content structure validation and sanitization
4. **Processing**: Chunked processing with memory limits
5. **Storage**: No file persistence, direct database insertion

### Rate Limiting Configuration
```typescript
// Current settings
MAX_UPLOADS_PER_WINDOW = 5
RATE_LIMIT_WINDOW = 60 seconds
COOLDOWN_PERIOD = 5 minutes
MAX_FILE_SIZE = 50MB
```

### Upload Monitoring
- Upload success/failure rates tracked
- File size distribution monitored
- User upload patterns analyzed
- Rate limit violations logged with user context

## API Security

### Authentication Flow
1. User authenticates with Clerk
2. JWT token validated on each request
3. User existence verified in Convex database
4. Organization/franchise access validated
5. Page-level permissions checked

### Rate Limiting
- API endpoints protected with rate limiting
- Different limits for different endpoint types
- User-specific rate limiting with exponential backoff
- Bypass mechanisms for system operations

## Data Security

### Encryption
- **In Transit**: HTTPS/TLS for all communications
- **At Rest**: Database-level encryption via Convex
- **Credentials**: Environment variable encryption
- **Sessions**: Secure JWT token handling

### Data Access Controls
- **Organization Scoping**: All queries scoped to user's organization
- **Franchise Isolation**: Data isolated by franchise ID
- **Role-Based Access**: Owner/member role differentiation
- **Page Permissions**: Granular access control per application section

## Compliance & Audit

### Audit Logging
- User authentication events
- Data access and modification
- File upload activities
- Administrative actions
- Security events and violations

### Data Retention
- Audit logs retained for 90 days minimum
- User data retained per business requirements
- Security logs retained for 1 year
- Backup data encrypted and retained for 30 days

### Compliance Considerations
- GDPR compliance for data handling
- SOC 2 Type II readiness
- Regular security assessments
- Data processing agreement requirements

## Emergency Contacts

### Security Team
- **Security Lead**: [Contact Information]
- **System Administrator**: [Contact Information]
- **Development Lead**: [Contact Information]

### External Services
- **Clerk Support**: Authentication issues
- **Convex Support**: Database and infrastructure
- **Polar Support**: Billing and subscription issues

## Security Tools & Resources

### Development Tools
- ESLint security rules
- Dependency vulnerability scanning
- Code quality analysis
- Security-focused code reviews

### Monitoring Tools
- Error tracking and logging
- Performance monitoring
- Security event alerting
- System health dashboards

### Documentation
- Security architecture diagrams
- Incident response playbooks
- Recovery procedures
- Training materials

---

**Last Updated**: [Current Date]  
**Next Review**: [Quarterly Review Date]  
**Document Version**: 1.0

This document should be reviewed and updated regularly to reflect changes in the application, security landscape, and organizational requirements.
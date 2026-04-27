# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Fanki seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Please Do NOT:

- Open a public GitHub issue
- Disclose the vulnerability publicly before it has been addressed
- Exploit the vulnerability beyond the minimum necessary to demonstrate it

### Please DO:

1. **Email us directly** at security@fanki.app (or create a private security advisory on GitHub)
2. **Include detailed information:**
   - Type of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Allow reasonable time** for us to address the issue before public disclosure

## What to Expect

1. **Acknowledgment**: We'll acknowledge your report within 48 hours
2. **Updates**: We'll keep you informed of our progress
3. **Fix Timeline**: We aim to patch critical vulnerabilities within 7 days
4. **Credit**: We'll credit you in our security advisories (unless you prefer to remain anonymous)

## Security Measures in Place

### Authentication & Authorization

- ✅ Supabase Auth with secure session management
- ✅ Row-Level Security (RLS) policies on all tables
- ✅ JWT token-based authentication
- ✅ Secure password hashing (bcrypt)
- ✅ OAuth redirect validation

### Data Protection

- ✅ HTTPS enforced in production
- ✅ Environment variables for sensitive data
- ✅ API keys stored as Supabase secrets
- ✅ No sensitive data in client-side code
- ✅ Secure cookie settings

### Input Validation

- ✅ Server-side input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (React's built-in escaping)
- ✅ CSRF protection

### API Security

- ✅ Rate limiting on edge functions
- ✅ Authentication required for sensitive endpoints
- ✅ Proper CORS configuration
- ✅ Request size limits

### Database Security

- ✅ Row-Level Security enabled
- ✅ Prepared statements (no raw SQL from user input)
- ✅ Minimal privilege principle
- ✅ Regular backups

### Dependency Security

- ✅ Regular dependency updates
- ✅ Automated security audits (npm audit)
- ✅ No known vulnerabilities in dependencies
- ✅ Lockfile committed to repository

## Known Security Considerations

### Client-Side Data

Some data is stored in the browser:
- Session tokens (secure, httpOnly cookies)
- Study progress (localStorage)
- User preferences (localStorage)

**Mitigation**: Sensitive data is never stored client-side. All critical operations require server authentication.

### Third-Party Services

We use the following third-party services:
- **Supabase**: Database and authentication
- **Vercel**: Hosting and CDN
- **Google Gemini**: AI content generation
- **ElevenLabs**: Audio generation
- **Unsplash**: Image search

All API keys are stored securely and never exposed to clients.

## Best Practices for Users

### Account Security

- ✅ Use a strong, unique password
- ✅ Enable two-factor authentication (if available)
- ✅ Don't share your account credentials
- ✅ Log out from shared devices
- ✅ Review active sessions regularly

### Data Privacy

- ✅ Don't include sensitive personal information in flashcards
- ✅ Be aware that AI-generated content is processed by third-party APIs
- ✅ Regularly export your data as backup
- ✅ Review our Privacy Policy

## Vulnerability Disclosure Policy

### Timeline

1. **T+0**: Vulnerability reported
2. **T+48h**: Acknowledgment sent
3. **T+7d**: Fix developed and tested (critical issues)
4. **T+14d**: Fix deployed to production
5. **T+30d**: Public disclosure (coordinated)

### Severity Levels

**Critical** (Fix within 7 days)
- RCE (Remote Code Execution)
- Authentication bypass
- SQL injection
- Data breach potential

**High** (Fix within 14 days)
- XSS with significant impact
- Authorization bypass
- Sensitive data exposure

**Medium** (Fix within 30 days)
- CSRF
- Information disclosure
- Denial of service

**Low** (Fix within 90 days)
- Minor information leaks
- Non-exploitable issues
- Recommendations

## Security Audits

- **Last audit**: TBD
- **Next audit**: TBD
- **Auditor**: TBD

## Compliance

We strive to comply with:
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- COPPA (Children's Online Privacy Protection Act) - minimum age: 13

## Security Updates

Subscribe to security updates:
- GitHub Security Advisories
- Release notes
- Email notifications (if enabled in settings)

## Bug Bounty Program

We currently do not have a formal bug bounty program, but we greatly appreciate security researchers who responsibly disclose vulnerabilities.

**Recognition:**
- Public acknowledgment in security advisories
- Hall of fame on our website
- Swag and merchandise (for significant findings)

## Contact

- **Security Email**: security@fanki.app
- **GitHub Security Advisories**: [Create advisory](https://github.com/your-org/fanki/security/advisories/new)
- **PGP Key**: Available on request

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/platform/going-into-prod#security)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

---

**Thank you for helping keep Fanki and our users safe!** 🔒

---

*Last Updated: 2025-01-17*  
*Version: 1.0*

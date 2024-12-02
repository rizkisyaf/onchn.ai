# onchn.ai Deployment Guide

## Prerequisites

- Node.js 18+
- Vercel CLI
- Access to production environment variables
- Access to GitHub repository
- Access to Vercel project

## Environment Setup

1. Install required dependencies:
```bash
npm install
```

2. Set up environment variables:
- Copy `.env.production` to `.env.local`
- Fill in all required values
- Add variables to Vercel project settings

## Deployment Process

### Automatic Deployment (Recommended)

1. Push changes to main branch
2. GitHub Actions will:
   - Run tests
   - Run security checks
   - Build the project
   - Deploy to Vercel
   - Send notifications

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

## Post-Deployment Checks

1. Verify health endpoint: `https://onchn.ai/api/health`
2. Check Sentry for any new errors
3. Verify PostHog is receiving analytics
4. Check all critical paths:
   - Wallet analysis
   - Trading functionality
   - Real-time monitoring

## Rollback Process

1. In Vercel dashboard:
   - Go to Deployments
   - Find last working deployment
   - Click "..." -> "Promote to Production"

2. Verify rollback:
   - Check health endpoint
   - Check critical functionality
   - Monitor error rates

## Security Considerations

- Never commit `.env` files
- Rotate API keys after deployment
- Monitor rate limits
- Check security headers
- Review access logs

## Monitoring

- Sentry: Error tracking
- PostHog: Analytics
- Vercel: Performance metrics
- Custom health checks

## Support

For deployment issues:
- Contact: devops@onchn.ai
- Slack: #deployment-alerts 
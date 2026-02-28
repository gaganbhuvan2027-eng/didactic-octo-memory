# API Rate Limits

## Interview Endpoints

All rate limits are per user per minute (60 seconds).

### Current Configuration (Relaxed for Early Stage)

| Endpoint | Rate Limit | Purpose |
|----------|-----------|---------|
| `/api/interview/analyze` | 100/min | Final interview analysis |
| `/api/interview/question` | 200/min | Generate interview questions |
| `/api/interview/conversation` | 100/min | Fetch conversation history |
| `/api/interview/turn-detection` | 300/min | Real-time turn detection during interview |
| `/api/interview/analyze-code` | 100/min | Code submission analysis |
| `/api/interview/trigger-analysis` | 100/min | Trigger AI analysis |

### Previous Configuration (Too Strict)

| Endpoint | Old Limit |
|----------|-----------|
| `/api/interview/analyze` | 10/min |
| `/api/interview/question` | 20/min |
| `/api/interview/conversation` | 10/min |
| `/api/interview/turn-detection` | 30/min |
| `/api/interview/analyze-code` | 10/min |
| `/api/interview/trigger-analysis` | 10/min |

## Notes

- **Current limits are 10x more relaxed** to support early-stage testing and demos
- Rate limiting is currently **in-memory** (per process)
- In serverless environments (Vercel), each request may hit a different instance, making rate limiting less effective
- **For production with high traffic**: Migrate to Redis/Upstash for distributed rate limiting

## When to Tighten Rate Limits

Consider reducing limits when:
1. User base grows significantly (>1000 active users)
2. Abuse patterns are detected
3. API costs become a concern
4. Moving to production with paid plans

## Recommended Production Limits (Future)

When scaling to production:
- Implement tiered rate limits based on user subscription
- Free tier: 20-50 requests/min
- Paid tier: 100-200 requests/min
- Enterprise: Custom limits
- Use Redis/Upstash for distributed rate limiting across serverless instances


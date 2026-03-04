# Security Policy

## Reporting Security Issues

If you discover a security vulnerability, please email: s.sayed@lmn.to

**Do not** open public issues for security vulnerabilities.

## Security Best Practices

### For Users Deploying This Bot

1. **Never commit sensitive files:**
   - `.env` - Contains API keys and tokens
   - `config.js` - Contains wallet addresses
   - These files are gitignored by default - keep them that way!

2. **Use environment variables on deployment platforms:**
   - Store all sensitive data as environment variables
   - Never hardcode secrets in code
   - Render, Railway, and other platforms support this

3. **Keep your repository private if:**
   - You plan to fork and modify with custom logic
   - You want extra privacy layer
   - You're uncomfortable with public code

4. **This bot is read-only:**
   - It only reads public blockchain data
   - No private keys are used or stored
   - Cannot sign transactions or move funds

## What's Safe to Share

✅ **Safe to make public:**
- Source code (index.js, test-bot.js)
- Configuration templates (.env.example, config.example.js)
- Documentation

❌ **Never make public:**
- Your Telegram bot token
- Your Telegram chat ID
- Your TronGrid API key
- Your wallet addresses (if you want privacy)
- Your `.env` file
- Your `config.js` file

## Additional Security Measures

### Enable 2FA on Services

- Enable 2FA on your GitHub account
- Enable 2FA on deployment platform (Render, Railway, etc.)
- Use strong, unique passwords

### Rotate Credentials Regularly

- Telegram bot token: Can regenerate via @BotFather if compromised
- TronGrid API key: Can regenerate via TronGrid dashboard
- RPC endpoints: Use authenticated endpoints for production

### Monitor Your Deployments

- Check deployment logs regularly
- Set up alerts for deployment failures
- Monitor for unexpected API usage

## Compliance

This bot:
- Does not store any user data
- Does not process payments
- Only reads public blockchain data
- Complies with read-only blockchain access patterns

## License

MIT License - Use at your own risk. No warranties provided.

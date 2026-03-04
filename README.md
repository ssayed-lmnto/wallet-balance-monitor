# Crypto Wallet Balance Monitor

Automated Telegram bot for monitoring cryptocurrency wallet balances across multiple blockchain networks. Sends scheduled balance reports twice daily to a designated Telegram channel.

## Features

- **Multi-Chain Support**: Monitors wallets on Polygon, Arbitrum, and TRON networks
- **Automated Reporting**: Scheduled reports at 09:00 UTC and 21:00 UTC daily
- **Comprehensive Coverage**: Tracks native tokens (POL, ETH, TRX) and stablecoins (USDT, USDC)
- **Mobile-Optimized**: Clean, professional formatting for both desktop and mobile
- **Secure & Read-Only**: No private keys required, uses public blockchain data only
- **Production-Ready**: Built with error handling, retry logic, and rate limit protection

## Supported Networks & Tokens

| Network | Native Token | Stablecoins |
|---------|--------------|-------------|
| **Polygon** | POL | USDT, USDC |
| **Arbitrum** | ETH | USDT, USDC |
| **TRON** | TRX | USDT |

## Prerequisites

- Node.js v16 or higher
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Telegram Channel/Group ID
- TronGrid API Key (free, recommended for production)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/wallet-balance-monitor.git
cd wallet-balance-monitor
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_channel_id_here
TRONGRID_API_KEY=your_trongrid_api_key
```

### 4. Configure Wallet Addresses

```bash
cp config.example.js config.js
```

Edit `config.js` with your wallet addresses.

### 5. Test the Bot

```bash
npm test
```

You should receive a balance report in your Telegram channel immediately.

### 6. Start the Scheduler

```bash
npm start
```

The bot will now send automated reports twice daily.

## Deployment to Render.com

### Step 1: Prepare Repository

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/wallet-balance-monitor.git
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) and sign up/login
2. Click **New +** → **Background Worker**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `wallet-balance-bot`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### Step 3: Add Environment Variables

In Render dashboard, add these environment variables:

```
TELEGRAM_BOT_TOKEN=your_actual_token
TELEGRAM_CHAT_ID=your_actual_chat_id
TRONGRID_API_KEY=your_actual_api_key
POLYGON_RPC_URL=https://polygon.drpc.org
ARBITRUM_RPC_URL=https://arbitrum.drpc.org
TRON_FULL_NODE=https://api.trongrid.io
```

### Step 4: Add config.js via Render Shell

After deployment, you need to add your `config.js` file:

1. In Render dashboard, go to your service
2. Click **Shell** tab
3. Run:
   ```bash
   cat > config.js << 'EOF'
   module.exports = {
     withdraw: {
       polygon: 'YOUR_POLYGON_WALLET',
       arbitrum: 'YOUR_ARBITRUM_WALLET',
       tron: 'YOUR_TRON_WALLET'
     },
     depositGas: {
       polygon: 'YOUR_POLYGON_GAS_WALLET',
       arbitrum: 'YOUR_ARBITRUM_GAS_WALLET',
       tron: 'YOUR_TRON_GAS_WALLET'
     }
   };
   EOF
   ```
4. Manually deploy again from Render dashboard

### Step 5: Verify

Check the logs in Render dashboard. You should see:

```
✅ Loaded wallet configuration from config.js
✅ Scheduler initialized successfully
⏳ Waiting for scheduled times...
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `TELEGRAM_CHAT_ID` | Yes | Channel/group ID for reports |
| `TRONGRID_API_KEY` | Recommended | Free API key from trongrid.io |
| `POLYGON_RPC_URL` | No | Custom Polygon RPC (defaults provided) |
| `ARBITRUM_RPC_URL` | No | Custom Arbitrum RPC (defaults provided) |
| `SCHEDULE_1` | No | First report time (default: 0 9 * * *) |
| `SCHEDULE_2` | No | Second report time (default: 0 21 * * *) |

## Security

- ✅ **Read-Only Access**: Bot only reads public blockchain data
- ✅ **No Private Keys**: Cannot sign transactions or move funds
- ✅ **Environment Variables**: Sensitive data stored securely
- ✅ **Git Exclusions**: `.env` and `config.js` never committed
- ✅ **Rate Limiting**: Built-in protection against API throttling

## Troubleshooting

### Bot doesn't send messages

1. Verify `TELEGRAM_BOT_TOKEN` is correct
2. Check `TELEGRAM_CHAT_ID` (use `/start` with your bot)
3. Ensure bot is admin in the channel/group
4. Run `npm test` to see detailed errors

### TRON balance errors

1. Sign up at [trongrid.io](https://www.trongrid.io)
2. Generate a free API key
3. Add to `.env`: `TRONGRID_API_KEY=your_key`
4. Restart the bot

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Author

**Sohel Sayed**

Product Manager with expertise in blockchain platforms and automated monitoring solutions.

---

**Version**: 1.0.0  
**Last Updated**: March 2026  
**Status**: Production Ready

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { ethers } = require('ethers');
const TronWeb = require('tronweb');
const fs = require('fs');
const path = require('path');

// ==================== CONFIGURATION ====================

// Telegram Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Load wallet configuration
let WALLETS;
const configPath = path.join(__dirname, 'config.js');
const configExamplePath = path.join(__dirname, 'config.example.js');

if (fs.existsSync(configPath)) {
  WALLETS = require('./config.js');
  console.log('✅ Loaded wallet configuration from config.js');
} else {
  console.error('❌ ERROR: config.js not found!');
  console.error('📝 Please copy config.example.js to config.js and add your wallet addresses');
  process.exit(1);
}

// Token Contract Addresses
const TOKEN_CONTRACTS = {
  polygon: {
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
  },
  arbitrum: {
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
  },
  tron: {
    USDT: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
  }
};

// RPC Providers with VERIFIED working endpoints from official docs
const polygonProvider = new ethers.JsonRpcProvider(
  process.env.POLYGON_RPC_URL || 'https://polygon.drpc.org'
);

const arbitrumProvider = new ethers.JsonRpcProvider(
  process.env.ARBITRUM_RPC_URL || 'https://arbitrum.drpc.org'
);

// TronWeb configuration with optional API key
const tronWebConfig = {
  fullHost: process.env.TRON_FULL_NODE || 'https://api.trongrid.io'
};

// Add API key headers if provided
if (process.env.TRONGRID_API_KEY) {
  tronWebConfig.headers = { 'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY };
}

const tronWeb = new TronWeb(tronWebConfig);

// Initialize Telegram Bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });

// ==================== UTILITY FUNCTIONS ====================

/**
 * Delay helper for rate limiting
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== BALANCE FETCHING FUNCTIONS ====================

// ERC20 ABI (minimal - only balanceOf)
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

/**
 * Get native token balance for EVM chains
 */
async function getNativeBalance(provider, address, decimals = 18) {
  try {
    const balance = await provider.getBalance(address);
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error(`Error fetching native balance for ${address}:`, error.message);
    return 'ERROR FETCHING BALANCE';
  }
}

/**
 * Get ERC20 token balance
 */
async function getERC20Balance(provider, tokenAddress, walletAddress) {
  try {
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const [balance, decimals] = await Promise.all([
      contract.balanceOf(walletAddress),
      contract.decimals()
    ]);
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error(`Error fetching ERC20 balance for ${walletAddress}:`, error.message);
    return 'ERROR FETCHING BALANCE';
  }
}

/**
 * Get TRX balance with retry logic
 */
async function getTRXBalance(address) {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add small delay between attempts to avoid rate limiting
      if (attempt > 1) {
        const delayMs = 2000 * attempt; // 2s, 4s, 6s
        console.log(`Retrying TRX balance (attempt ${attempt}/${maxRetries}) after ${delayMs}ms delay...`);
        await delay(delayMs);
      }
      
      const balance = await tronWeb.trx.getBalance(address);
      return (balance / 1e6).toString(); // TRX has 6 decimals
    } catch (error) {
      console.error(`Error fetching TRX balance (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt === maxRetries) {
        return 'ERROR FETCHING BALANCE';
      }
    }
  }
  
  return 'ERROR FETCHING BALANCE';
}

/**
 * Get TRC20 token balance using direct TronGrid API call
 */
async function getTRC20Balance(tokenAddress, walletAddress) {
  const maxRetries = 3;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Add small delay between attempts
      if (attempt > 1) {
        const delayMs = 2000 * attempt;
        console.log(`Retrying TRC20 balance (attempt ${attempt}/${maxRetries}) after ${delayMs}ms delay...`);
        await delay(delayMs);
      }
      
      // Use TronGrid API to call the balanceOf function
      const url = 'https://api.trongrid.io/wallet/triggerconstantcontract';
      
      // Prepare the contract call
      const ownerAddressHex = tronWeb.address.toHex(walletAddress);
      const contractAddressHex = tronWeb.address.toHex(tokenAddress);
      const parameter = ownerAddressHex.replace(/^41/, '').padStart(64, '0');
      
      const requestBody = {
        owner_address: ownerAddressHex,
        contract_address: contractAddressHex,
        function_selector: 'balanceOf(address)',
        parameter: parameter,
        visible: false
      };
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (process.env.TRONGRID_API_KEY) {
        headers['TRON-PRO-API-KEY'] = process.env.TRONGRID_API_KEY;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`TronGrid API error: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Check if the call was successful
      if (result.result && result.result.result === true && result.constant_result && result.constant_result[0]) {
        const balanceHex = result.constant_result[0];
        const balanceValue = parseInt(balanceHex, 16);
        
        // USDT on TRON has 6 decimals
        const decimals = 6;
        const balance = (balanceValue / Math.pow(10, decimals)).toString();
        
        return balance;
      } else {
        throw new Error('Invalid response from contract call');
      }
      
    } catch (error) {
      console.error(`Error fetching TRC20 balance (attempt ${attempt}/${maxRetries}):`, error.message);
      
      if (attempt === maxRetries) {
        return 'ERROR FETCHING BALANCE';
      }
    }
  }
  
  return 'ERROR FETCHING BALANCE';
}

/**
 * Format balance with proper decimal places
 */
function formatBalance(balance, maxDecimals = 6) {
  if (balance === 'ERROR FETCHING BALANCE') return balance;
  
  const num = parseFloat(balance);
  if (isNaN(num)) return balance;
  
  // Format with up to maxDecimals, removing trailing zeros
  return num.toFixed(maxDecimals).replace(/\.?0+$/, '');
}

// ==================== MESSAGE GENERATION ====================

/**
 * Fetch all balances and generate the report message
 */
async function generateBalanceReport() {
  console.log('Starting balance report generation...');
  
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short'
  });
  
  let message = `*WALLET BALANCE REPORT*\n`;
  message += `${escapeMarkdown(dateStr + ' • ' + timeStr)}\n`;
  message += `${escapeMarkdown('─'.repeat(29))}\n\n`;
  
  // ===== WITHDRAW WALLETS =====
  message += `*WITHDRAWAL WALLETS*\n\n`;
  
  // Polygon Withdraw Wallets
  const polNative = await getNativeBalance(polygonProvider, WALLETS.withdraw.polygon);
  const polUSDT = await getERC20Balance(polygonProvider, TOKEN_CONTRACTS.polygon.USDT, WALLETS.withdraw.polygon);
  const polUSDC = await getERC20Balance(polygonProvider, TOKEN_CONTRACTS.polygon.USDC, WALLETS.withdraw.polygon);
  
  message += `*Polygon Network*\n`;
  message += `\`${escapeMarkdown(WALLETS.withdraw.polygon)}\`\n`;
  message += `POL: *${escapeMarkdown(formatBalance(polNative, 6))}*\n`;
  message += `USDT: *${escapeMarkdown(formatBalance(polUSDT, 2))}*\n`;
  message += `USDC: *${escapeMarkdown(formatBalance(polUSDC, 2))}*\n\n`;
  
  // Arbitrum Withdraw Wallets
  const arbETH = await getNativeBalance(arbitrumProvider, WALLETS.withdraw.arbitrum);
  const arbUSDT = await getERC20Balance(arbitrumProvider, TOKEN_CONTRACTS.arbitrum.USDT, WALLETS.withdraw.arbitrum);
  const arbUSDC = await getERC20Balance(arbitrumProvider, TOKEN_CONTRACTS.arbitrum.USDC, WALLETS.withdraw.arbitrum);
  
  message += `*Arbitrum Network*\n`;
  message += `\`${escapeMarkdown(WALLETS.withdraw.arbitrum)}\`\n`;
  message += `ETH: *${escapeMarkdown(formatBalance(arbETH, 6))}*\n`;
  message += `USDT: *${escapeMarkdown(formatBalance(arbUSDT, 2))}*\n`;
  message += `USDC: *${escapeMarkdown(formatBalance(arbUSDC, 2))}*\n\n`;
  
  // TRON Withdraw Wallets
  // Add delay before TRON API calls to avoid rate limiting
  await delay(1000);
  const trxBalance = await getTRXBalance(WALLETS.withdraw.tron);
  await delay(1000);
  const tronUSDT = await getTRC20Balance(TOKEN_CONTRACTS.tron.USDT, WALLETS.withdraw.tron);
  
  message += `*TRON Network*\n`;
  message += `\`${escapeMarkdown(WALLETS.withdraw.tron)}\`\n`;
  message += `TRX: *${escapeMarkdown(formatBalance(trxBalance, 6))}*\n`;
  message += `USDT: *${escapeMarkdown(formatBalance(tronUSDT, 2))}*\n\n`;
  
  // ===== DEPOSIT GAS WALLETS =====
  message += `${escapeMarkdown('─'.repeat(29))}\n\n`;
  message += `*GAS DEPOSIT WALLETS*\n\n`;
  
  // Arbitrum Gas Wallet
  const arbGasETH = await getNativeBalance(arbitrumProvider, WALLETS.depositGas.arbitrum);
  message += `*Arbitrum Network*\n`;
  message += `\`${escapeMarkdown(WALLETS.depositGas.arbitrum)}\`\n`;
  message += `ETH: *${escapeMarkdown(formatBalance(arbGasETH, 6))}*\n\n`;
  
  // TRON Gas Wallet
  await delay(1000);
  const tronGasTRX = await getTRXBalance(WALLETS.depositGas.tron);
  message += `*TRON Network*\n`;
  message += `\`${escapeMarkdown(WALLETS.depositGas.tron)}\`\n`;
  message += `TRX: *${escapeMarkdown(formatBalance(tronGasTRX, 6))}*\n\n`;
  
  // Polygon Gas Wallet
  const polGasPOL = await getNativeBalance(polygonProvider, WALLETS.depositGas.polygon);
  message += `*Polygon Network*\n`;
  message += `\`${escapeMarkdown(WALLETS.depositGas.polygon)}\`\n`;
  message += `POL: *${escapeMarkdown(formatBalance(polGasPOL, 6))}*\n\n`;
  
  message += `${escapeMarkdown('─'.repeat(29))}\n`;
  message += `_Automated report_\n`;
  
  console.log('Balance report generated successfully');
  return message;
}

// ==================== TELEGRAM SENDING ====================

/**
 * Escape Markdown special characters for Telegram
 */
function escapeMarkdown(text) {
  // Escape special characters: _ * [ ] ( ) ~ ` > # + - = | { } . !
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

/**
 * Send message to Telegram
 */
async function sendTelegramMessage(message) {
  try {
    await bot.sendMessage(TELEGRAM_CHAT_ID, message, { parse_mode: 'MarkdownV2' });
    console.log('✅ Message sent to Telegram successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending message to Telegram:', error.message);
    return false;
  }
}

/**
 * Main function to generate and send the report
 */
async function sendBalanceReport() {
  console.log('\n' + '='.repeat(50));
  console.log('EXECUTING BALANCE REPORT');
  console.log('Time:', new Date().toISOString());
  console.log('='.repeat(50) + '\n');
  
  try {
    const message = await generateBalanceReport();
    await sendTelegramMessage(message);
  } catch (error) {
    console.error('❌ Error in sendBalanceReport:', error);
  }
}

// ==================== SCHEDULER ====================

/**
 * Initialize the scheduler
 */
function initializeScheduler() {
  // Support unlimited schedules via comma-separated SCHEDULES variable
  // Falls back to SCHEDULE_1 and SCHEDULE_2 for backward compatibility
  let schedules;
  
  if (process.env.SCHEDULES) {
    schedules = process.env.SCHEDULES.split(',').map(s => s.trim());
  } else {
    const schedule1 = process.env.SCHEDULE_1 || '0 9 * * *';
    const schedule2 = process.env.SCHEDULE_2 || '0 21 * * *';
    schedules = [schedule1, schedule2];
  }
  
  console.log('🤖 Telegram Wallet Balance Bot Starting...');
  console.log(`📅 Configured ${schedules.length} schedule(s):`);
  schedules.forEach((schedule, index) => {
    console.log(`   ${index + 1}. ${schedule}`);
  });
  console.log('💬 Telegram Chat ID:', TELEGRAM_CHAT_ID);
  console.log('🌐 Polygon RPC:', process.env.POLYGON_RPC_URL || 'https://polygon.drpc.org');
  console.log('🌐 Arbitrum RPC:', process.env.ARBITRUM_RPC_URL || 'https://arbitrum.drpc.org');
  console.log('🌐 TRON Node:', process.env.TRON_FULL_NODE || 'https://api.trongrid.io');
  console.log('🔑 TronGrid API Key:', process.env.TRONGRID_API_KEY ? 'Configured ✅' : 'Not set');
  console.log('\n');
  
  schedules.forEach((schedule, index) => {
    cron.schedule(schedule, () => {
      console.log(`⏰ Triggered: Report ${index + 1} (${schedule})`);
      sendBalanceReport();
    });
  });
  
  console.log('✅ Scheduler initialized successfully');
  console.log('⏳ Waiting for scheduled times...\n');
}

// ==================== STARTUP ====================

// Validate configuration
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ ERROR: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must be set in .env file');
  console.error('📝 Please copy .env.example to .env and add your credentials');
  process.exit(1);
}

// Initialize the scheduler
initializeScheduler();

// Export for testing
module.exports = {
  sendBalanceReport,
  generateBalanceReport
};

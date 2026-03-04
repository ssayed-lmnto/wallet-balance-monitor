// ==================== WALLET CONFIGURATION ====================
// Copy this file to config.js and update with your wallet addresses
// DO NOT commit config.js to Git - it's in .gitignore

// Option 1: Hardcoded addresses (for local/private deployments)
module.exports = {
  withdraw: {
    polygon: process.env.WITHDRAW_POLYGON || 'YOUR_POLYGON_WALLET_ADDRESS',
    arbitrum: process.env.WITHDRAW_ARBITRUM || 'YOUR_ARBITRUM_WALLET_ADDRESS',
    tron: process.env.WITHDRAW_TRON || 'YOUR_TRON_WALLET_ADDRESS'
  },
  
  depositGas: {
    polygon: process.env.DEPOSIT_GAS_POLYGON || 'YOUR_POLYGON_GAS_WALLET_ADDRESS',
    arbitrum: process.env.DEPOSIT_GAS_ARBITRUM || 'YOUR_ARBITRUM_GAS_WALLET_ADDRESS',
    tron: process.env.DEPOSIT_GAS_TRON || 'YOUR_TRON_GAS_WALLET_ADDRESS'
  }
};

// Option 2: For public repositories - use ONLY environment variables
// Set these in your deployment platform (Render, Railway, etc.)
// WITHDRAW_POLYGON=0xYourAddress
// WITHDRAW_ARBITRUM=0xYourAddress
// WITHDRAW_TRON=TYourAddress
// DEPOSIT_GAS_POLYGON=0xYourAddress
// DEPOSIT_GAS_ARBITRUM=0xYourAddress
// DEPOSIT_GAS_TRON=TYourAddress

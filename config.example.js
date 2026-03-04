// ==================== WALLET CONFIGURATION ====================
// Copy this file to config.js and update with your wallet addresses
// DO NOT commit config.js to Git - it's in .gitignore

module.exports = {
  // Withdrawal Wallets - Main operational wallets
  withdraw: {
    polygon: '0x465FAD253E403740C2F45810d9636Bf2Cf25e568',
    arbitrum: '0x465FAD253E403740C2F45810d9636Bf2Cf25e568',
    tron: 'TTeGkuWwPyoPv1FW5yddE2jvrXXzVxgrDX'
  },
  
  // Deposit Gas Wallets - Gas fee management wallets
  depositGas: {
    polygon: '0x63D5de0e8Fc170b11860468Ed4B2C6F55f178Ec7',
    arbitrum: '0x63D5de0e8Fc170b11860468Ed4B2C6F55f178Ec7',
    tron: 'TGFX7imMXwUXnD9osBDkMxwvn9gn9auqTq'
  }
};

require('dotenv').config();
const { sendBalanceReport } = require('./index');

console.log('🧪 MANUAL TEST - Sending Balance Report\n');
console.log('This will send a report to your Telegram chat immediately.\n');

// Run the report
sendBalanceReport()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

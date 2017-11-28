const request = require("request-promise")
var _ = require("lodash");
const keys = require('./keys.js');

const etherscanApiUrl = 'https://api.etherscan.io/api'
const contractAddress = '0x13f11c9905a08ca76e3e853be63d4f0944326c72';
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

const transferTransactionsUrl = {
    uri: etherscanApiUrl,
    qs: {
      apikey: keys.etherscanKey,
      module: 'logs',
      action: 'getLogs',
      fromBlock: 0,
      toBlock: 'latest',
      address: contractAddress,
      topic0: transferTopic
    },
    headers: {
      'User-Agent': 'Request-Promise'
    }
  }
Promise.all(
      [
       request(transferTransactionsUrl)
      ]
  )
    .then(res => {
      const transferTransactions = JSON.parse(res[0]).result;
      if (transferTransactions.length >= 999) {
        console.error('etherscan api only returns first 1000 transactions and there have been more than that. Logic needs to be rewritten to handle it')
      } else {
        const tokenAddresses = _.map(transferTransactions, (transaction) => {
          // return transaction.topics[2];
          const topic = transaction.topics[2];
          return '0x' + (topic).slice(26, 500) // have to slice out all the extra zeros to extract the address, which looks like this: 0x0000000000000000000000008b2f96cec0849c6226cf5cfaf32044c12b16eed9
        })
        const uniqTokenAddresses = _.uniq(tokenAddresses)
        console.log('_.first(uniqTokenAddresses)', _.first(uniqTokenAddresses));
      }
    })


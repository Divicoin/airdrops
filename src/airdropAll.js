const request = require("request-promise")
const _ = require("lodash");
const keys = require('./keys.js');
const Web3 = require('Web3');

const etherscanApiUrl = 'https://api.etherscan.io/api'
const contractAddress = '0x13f11c9905a08ca76e3e853be63d4f0944326c72';
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const createTokenTopic = '0x39c7a3761d246197818c5f6f70be88d6f756947e153ba4fbcc65d86cb099f1d7';

if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider)
} else {
    // eth network to send on (currently ropsten testnet)
    web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/${keys.infuraKey}`))
};

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
const createTokensUrl = {
  uri: etherscanApiUrl,
  qs: {
    apikey: keys.etherscanKey,
    module: 'logs',
    action: 'getLogs',
    fromBlock: 0,
    toBlock: 'latest',
    address: contractAddress,
    topic0: createTokenTopic
  },
  headers: {
    'User-Agent': 'Request-Promise'
  }
}
// //https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0x57d90b64a1a57749b0f932f1a3395792e12e7055&address=0xe04f27eb70e025b78871a2ad7eabe85e61212761&tag=latest&apikey=YourApiKeyToken
// const getTokenBalance = {// https://etherscan.io/apis#tokens
//   uri = etherscanApiUrl,
//   qs: {
//     apikey: keys.etherscanKey,
//     module: 'account',
//     action: 'tokenBalance',
//     contractAddress: contractAddress,
//     // address:
//   },
//   headers: {
//     'User-Agent': 'Request-Promise'
//   }
// }
Promise.all(
      [
          request(transferTransactionsUrl),
          request(createTokensUrl)
      ]
  )
    .then(res => {
      const transferTransactions = JSON.parse(res[0]).result;
      const createTokenTransactions = JSON.parse(res[1]).result;
      if (transferTransactions.length >= 999) {
        console.error('create transferTransactions fetch error: etherscan api only returns first 1000 transactions and there have been more than that. Logic needs to be rewritten to handle it')
      } else if (createTokenTransactions >= 999) {
        console.error('createTokenTransactions fetch error: etherscan api only returns first 1000 transactions and there have been more than that. Logic needs to be rewritten to handle it')
      } else {
        console.log('transferTransactions.length',transferTransactions.length);
        console.log('createTokenTransactions.length',createTokenTransactions.length);
        const allAddressesThatHaveHadDivi = _.concat(transferTransactions, createTokenTransactions);
        const tokenAddresses = _.map(allAddressesThatHaveHadDivi, (transaction) => {
            const topic0 = transaction.topics[0];
            const topic1 = transaction.topics[1];
            const topic2 = transaction.topics[2]; // the 'from' addresses if topic 0 is a transfer
            let tokenAddress;
          if (topic0 === createTokenTopic) {
            tokenAddress = '0x' + (topic1).slice(26, 500) // have to slice out all the extra zeros to extract the address, which looks like this: 0x0000000000000000000000008b2f96cec0849c6226cf5cfaf32044c12b16eed9
          } else if (topic0 === transferTopic) {
            tokenAddress = '0x' + (topic2).slice(26, 500) // have to slice out all the extra zeros to extract the address, which looks like this: 0x0000000000000000000000008b2f96cec0849c6226cf5cfaf32044c12b16eed9
          } else {
            console.log('topic0 is neither a transfer or a create topic');
          }
          return tokenAddress;
        })
        const uniqTokenAddresses = _.uniq(tokenAddresses)
        console.log('_.first(uniqTokenAddresses)', _.first(uniqTokenAddresses));
        console.log('uniqTokenAddresses.length',uniqTokenAddresses.length);
      }
    })


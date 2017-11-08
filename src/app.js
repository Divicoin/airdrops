var _ = require("lodash");
var request = require("request-promise");
var fs = require('fs');
const etherscanToken = require('./keys.js');
const contractAddress = '0x13f11c9905a08ca76e3e853be63d4f0944326c72';
const etherscanApiUrl = 'https://api.etherscan.io/api'
const ethereumDivider = 1000000000000000000;
const thisAirdropTotal = 1000; // amount of tokens allocated for airdrop distribution
const intervalTime = 1; // milliseconds to test
let targetTime = 10080; // minutes per week

// randomly generate airdrop time
const airDropCall = () => {
    const randomTime = _.round(Math.random() * targetTime + 1);
    targetTime--;
    if (randomTime === 1) {
        getEtherPrice(thisAirdropTotal);
        clearInterval(refreshInterval);
    }
};
// function to stop and refresh interval
const refreshInterval = setInterval(airDropCall, intervalTime);


const getEtherPrice = function (airDropTotal) {
  // api call for finding contract transactions (contributions)
  const normalTransactions = {
    uri: etherscanApiUrl,
    qs: {
      apikey: etherscanToken,
      module: 'account',
      action: 'txlist',
      startblock: 0,
      endblock: 999999999,
      sort: 'asc',
      address: contractAddress
    },
    headers: {
      'User-Agent': 'Request-Promise'
    }
  }

  Promise.all(
      [
       request(normalTransactions)
      ]
  )
  .then( res => {
      const normalTransactions = JSON.parse(res[0]).result;
      // find bonus based on blocktime
      const bonusFind = (blockNum) => {
        if (blockNum < 4438800) {
            return 100;
        } else if (blockNum < 4496400 ) {
            return 30;
        } else if (blockNum < 4554000) {
            return 15;
        } else if (blockNum < 4611600) {
            return 0;
        }
      }
      // filter transaction array to find incoming transactions only
      const inTransactions = _.filter(normalTransactions, {'to': contractAddress});
      // loop through transactions to find bonus multiplier based on contribution amount
      let txArr = _.map(inTransactions, function(inTransaction) {
        const bonusMultiplier = bonusFind(inTransaction.blockNumber) / 100 + 1;
        const purchased = bonusMultiplier * inTransaction.value / ethereumDivider * 500;
            return {
                from: inTransaction.from,
                purchased
            };
      });
      // filter only qualified transactions (over 1000 DIVX)
      const totalQualified = _.filter(txArr, function(inTransaction) {
          return inTransaction.purchased >= 1000;
      });
      // add together total supply of qualified transactions
      const sumQualified = _.sumBy(totalQualified, 'purchased');
      // figure out how much each address receives
      txArr = totalQualified.map(filtInTx => {
        filtInTx['airDrop'] = (airDropTotal * filtInTx.purchased) / sumQualified;
        return filtInTx;
      })
      console.log(txArr);
    }
  )
  .catch(err => {console.log(`error:${err}`)})
}



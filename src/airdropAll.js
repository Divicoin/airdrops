const request = require("request-promise")
const _ = require("lodash");
const keys = require('./keys.js');
const Web3 = require('Web3');
const utils = require('web3-utils');

const etherscanApiUrl = 'https://api.etherscan.io/api'
// const accountAddress ='0x458f79a8a71d02c333d0f097887f59285ff4a2c7' // address to get token balance from
const contractAddress = '0x13f11c9905a08ca76e3e853be63d4f0944326c72';
// const simpleContractAddress = accountAddress.substring(2);
// const balanceOfTopic = ('0x70a08231000000000000000000000000' + simpleContractAddress);
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const createTokenTopic = '0x39c7a3761d246197818c5f6f70be88d6f756947e153ba4fbcc65d86cb099f1d7';
const excludedAddresses = [ // such as known exchange addresses and DIVI account
    '0x2984581ece53a4390d1f568673cf693139c97049',
]
// const erc20Abi = [{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"type":"function"}];
const erc20Abi = require('./divx.js');

// let web3 = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/${keys.infuraKey}`))
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
web3.utils = utils;


// web3.eth.call({
//   to: contractAddress,
//   data: balanceOfTopic,
// }, function (err, result) {
//   if (result) {
//     console.log('contractAddress',contractAddress);
//     console.log('balanceOfTopic',balanceOfTopic);
//     console.log('result',result);
//     const tokens = web3.utils.toBN(result).toString();
//     console.log('web3.utils.fromWei(tokens, ether);',web3.utils.fromWei(tokens, 'ether'));
//   } else {
//     console.log('err',err);
//   }
// })

const getBalance = (contractAddress, accountAddress, callback) => {
  const simpleAccountAddress = accountAddress.substring(2);

  const balanceOfTopic = ('0x70a08231000000000000000000000000' + simpleAccountAddress);
  web3.eth.call({
    to: contractAddress,
    data: balanceOfTopic,
  }, function (err, result) {
    if (result) {
      // console.log('contractAddress',contractAddress);
      // console.log('balanceOfTopic',balanceOfTopic);
      // console.log('result',result);
      const tokens = web3.utils.toBN(result).toString();
      // console.log('web3.utils.fromWei(tokens, ether);',web3.utils.fromWei(tokens, 'ether'));
      callback(web3.utils.fromWei(tokens, 'ether'));
    } else {
      console.log('err',err);
    }
  })
}

// getBalance(contractAddress, '0x458f79a8a71d02c333d0f097887f59285ff4a2c7', thing => console.log('thing', thing));

const getBalances = (contractAddress, accountAddressesArray) => {
  let counter = -1;
  const addressesAndBalancesArray = [];
  const filteredAccountAddressesArray = _.pull(accountAddressesArray, ...excludedAddresses);
  const recursiveCaller = (result) => {
    if (counter < filteredAccountAddressesArray.length - 1) {
      counter++;
    } else {
      console.log('counter',counter);
      // console.log(addressesAndBalancesArray);
      console.log('addressesAndBalancesArray.length',addressesAndBalancesArray.length);
      console.log('_.sumBy(addressesAndBalancesArray, balance);',_.sumBy(addressesAndBalancesArray, 'balance'));
      console.log('_.first(addressesAndBalancesArray)',_.first(addressesAndBalancesArray));
      return addressesAndBalancesArray;
    }
    if (result) {
      if (Number(result) > 0) {
        // if (excludedAddresses.indexOf(accountAddressesArray[counter]) === -1) {
          addressesAndBalancesArray.push({
            address: filteredAccountAddressesArray[counter],
            balance: Number(result)
          });
        // } else {
        //   console.log('addressesAndBalancesArray[counter]',addressesAndBalancesArray[counter]);
        // }
      }
    } else if (counter > 0) {
      console.log("error: no result was returned");
    }
    getBalance(contractAddress, filteredAccountAddressesArray[counter], recursiveCaller)
  }
  return recursiveCaller();
}


const transferTransactionsUrl0 = {
    uri: etherscanApiUrl,
    qs: {
      apikey: keys.etherscanKey,
      module: 'logs',
      action: 'getLogs',
      fromBlock: 0,
      toBlock: 4611394,
      address: contractAddress,
      topic0: transferTopic
    },
    headers: {
      'User-Agent': 'Request-Promise'
    }
  }
const transferTransactionsUrl1 = {
    uri: etherscanApiUrl,
    qs: {
      apikey: keys.etherscanKey,
      module: 'logs',
      action: 'getLogs',
      fromBlock: 4611395,
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

Promise.all(
      [
          request(transferTransactionsUrl0),
          request(transferTransactionsUrl1),
          request(createTokensUrl)
      ]
  )
    .then(res => {
      const transferTransactions0 = JSON.parse(res[0]).result;
      const transferTransactions1 = JSON.parse(res[1]).result;
      const transferTransactions = _.concat(transferTransactions0, transferTransactions1);
      const createTokenTransactions = JSON.parse(res[2]).result;
      if (transferTransactions.length >= 1998) {
        console.error('create transferTransactions fetch error: etherscan api only returns first 1000 transactions and there have been more than that. Logic needs to be rewritten to handle it')
        console.log('_.first(createTokenTransactions)',_.first(createTokenTransactions));
        console.log('_.last(createTokenTransactions)',_.last(createTokenTransactions));
      } else if (createTokenTransactions >= 999) {
        console.error('createTokenTransactions fetch error: etherscan api only returns first 1000 transactions and there have been more than that. Logic needs to be rewritten to handle it')
      } else {
        console.log('transferTransactions.length',transferTransactions.length);
        console.log('createTokenTransactions.length',createTokenTransactions.length);
        const allAddressesThatHaveHadDivi = _.concat(transferTransactions, createTokenTransactions);
        const tokenAddresses = [];
        _.each(allAddressesThatHaveHadDivi, (transaction) => {
            const topic0 = transaction.topics[0];
            const topic1 = transaction.topics[1];
            const topic2 = transaction.topics[2]; // the 'from' addresses if topic 0 is a transfer
            let tokenAddress;
            let toAddress;
          if (topic0 === createTokenTopic) {
            tokenAddress = '0x' + (topic1).slice(26, 500) // have to slice out all the extra zeros to extract the address, which looks like this: 0x0000000000000000000000008b2f96cec0849c6226cf5cfaf32044c12b16eed9
            tokenAddresses.push(tokenAddress)
          } else if (topic0 === transferTopic) {
            tokenAddress = '0x' + (topic2).slice(26, 500) // have to slice out all the extra zeros to extract the address, which looks like this: 0x0000000000000000000000008b2f96cec0849c6226cf5cfaf32044c12b16eed9
            toAddress = '0x' + (topic1).slice(26, 500) // have to slice out all the extra zeros to extract the address, which looks like this: 0x0000000000000000000000008b2f96cec0849c6226cf5cfaf32044c12b16eed9
            tokenAddresses.push(tokenAddress);
            tokenAddresses.push(toAddress);
          } else {
            console.log('topic0 is neither a transfer or a create topic');
          }
          // return tokenAddress;
        })
        const uniqTokenAddresses = _.uniq(tokenAddresses)
        console.log('_.first(uniqTokenAddresses)', _.first(uniqTokenAddresses));
        console.log('_.last(uniqTokenAddresses)', _.last(uniqTokenAddresses));
        console.log('uniqTokenAddresses.length', uniqTokenAddresses.length);
        console.log('getBalances(contractAddress, uniqTokenAddresses)',getBalances(contractAddress, uniqTokenAddresses));
        // getBalances(contractAddress, uniqTokenAddresses)
      }
    })


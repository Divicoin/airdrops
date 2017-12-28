// const request = require("request-promise")
const _ = require("lodash");
const keys = require('./keys.js');
const Web3 = require('Web3');
const utils = require('web3-utils');
const runAirDrop = require('./app.js');
const fs = require('fs');

const readFromFile = process.argv[2] === 'true';
const testRpc = process.argv[3] === 'true';

console.log('readFromFile',readFromFile);

const etherscanApiUrl = 'https://api.etherscan.io/api'
const contractAddress = '0x13f11c9905a08ca76e3e853be63d4f0944326c72';
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const createTokenTopic = '0x39c7a3761d246197818c5f6f70be88d6f756947e153ba4fbcc65d86cb099f1d7';
const excludedAddresses = [ 
  // cryptopia
  '0x2984581ece53a4390d1f568673cf693139c97049',
  // treasury
  '0x5bc79fbbce4e5d6c3de7bd1a252ef3f58a66b09c'
]
const airdropTotal = 3000000000000000000000;

const erc20Abi = require('./divx.js');

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider)
} else {
  // eth network to send on (currently ropsten testnet)
  web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:${testRpc ? 8546 : 8545}`))
};
web3.utils = utils;

const transferFilterOptions = {
  fromBlock: 0,
  toBlock: 'latest',
  address: contractAddress,
  topics: [
      transferTopic,
  ]
}
const createTokenFilterOptions = {
  fromBlock: 0,
  toBlock: 'latest',
  address: contractAddress,
  topics: [
     createTokenTopic
  ]
}

const transferFilter = web3.eth.filter(transferFilterOptions);
const createTokenFilter= web3.eth.filter(createTokenFilterOptions)
let addressesAndBalancesArray;

// gets all the erc20 token holders for any token balance
transferFilter.get((err, transferLogs) => {
  if (!err) {
    if (readFromFile) {
      addressesAndBalancesArray = JSON.parse(fs.readFileSync('./addressesAndBalancesArray'));
      if (addressesAndBalancesArray) {
        runAirDrop(airdropTotal, addressesAndBalancesArray);
        return;
      }
    }
    console.log('transferLogs.length',transferLogs.length);

    const transferAddresses = [];
    _.each(transferLogs, (transferLog) => {
      const address1 = '0x' + (transferLog.topics[1]).slice(26, 500) // have to slice out all the extra zeros to extract the address, which looks like this: 0x0000000000000000000000008b2f96cec0849c6226cf5cfaf32044c12b16eed9//
      const address2 = '0x' + (transferLog.topics[2]).slice(26, 500) // have to slice out all the extra zeros to extract the address, which looks like this: 0x0000000000000000000000008b2f96cec0849c6226cf5cfaf32044c12b16eed9//
      transferAddresses.push(address1);
      transferAddresses.push(address2);
    });

    const uniqueTransferAddresses = _.uniq(transferAddresses);
    console.log('uniqueTransferAddresses.length',uniqueTransferAddresses.length);
    createTokenFilter.get((err, createTokenLogs) => {
      if (!err) {
        createTokenAddresses = _.map(createTokenLogs, createTokenLog => {
          const address = '0x' + (createTokenLog.topics[1]).slice(26, 500) // have to slice out all the extra zeros to extract the address, which looks like this: 0x0000000000000000000000008b2f96cec0849c6226cf5cfaf32044c12b16eed9//
          return address;
        })
        console.log('createTokenAddresses.length',createTokenAddresses.length);
        const uniqueCreateTokenAddresses = _.uniq(createTokenAddresses);
        console.log('uniqueCreateTokenAddresses.length',uniqueCreateTokenAddresses.length);
        const allAddresses = _.concat(uniqueCreateTokenAddresses, uniqueTransferAddresses);
        console.log('allAddresses.length',allAddresses.length);
        const uniqueAllAddresses = _.uniq(allAddresses);
        console.log('uniqueAllAddresses.length',uniqueAllAddresses.length);
        getBalances(contractAddress, uniqueAllAddresses);
      } else {
        console.log('get createTokenLogs err',err);
      }
    })
  } else {
    console.log('get transfer logs err',err);
  }
})

const getBalance = (contractAddress, accountAddress, callback) => {
  const simpleAccountAddress = accountAddress.substring(2);

  const balanceOfTopic = ('0x70a08231000000000000000000000000' + simpleAccountAddress);
  web3.eth.call({
    to: contractAddress,
    data: balanceOfTopic,
  }, function (err, result) {
    if (result) {
      const tokens = web3.utils.toBN(result).toString();
      addressesAndBalancesArray.push({
        address: accountAddress,
        balance: Number(web3.utils.fromWei(tokens, 'ether'))
      });
      callback(web3.utils.fromWei(tokens, 'ether'));
    } else {
      console.log('err',err);
    }
  })
}

// gets the balance of all token holders ... answers the question of ... how to find all erc20 token holder balances using web3 and geth
const getBalances = (contractAddress, accountAddressesArray) => {
  let counter = -1;
  addressesAndBalancesArray = [];
  console.log('accountAddressesArray.length',accountAddressesArray.length);
  const filteredAccountAddressesArray = _.pull(accountAddressesArray, ...excludedAddresses);
  // const filteredAccountAddressesArray = accountAddressesArray; // use this to check that all tranasactions add up
  console.log('filteredAccountAddressesArray.length (excludedAddresses array removed)',filteredAccountAddressesArray.length);
  const recursiveCaller = (result) => {
    if (counter < filteredAccountAddressesArray.length - 1) {
      counter++;
    } else {
      console.log('addressesAndBalancesArray.length',addressesAndBalancesArray.length);
      console.log('_.sumBy(addressesAndBalancesArray, balance);',_.sumBy(addressesAndBalancesArray, 'balance'));
      fs.writeFileSync('./addressesAndBalancesArray', JSON.stringify(addressesAndBalancesArray,null, 2));
      runAirDrop(airdropTotal, addressesAndBalancesArray);
      return addressesAndBalancesArray;
    }
    // if (result) {
    //   // if (Number(result) > 0) {
    //   //   addressesAndBalancesArray.push({
    //   //     address: filteredAccountAddressesArray[counter],
    //   //     balance: Number(result)
    //   //   });
    //   // }
    // } else if (counter > 0) {
    //   console.log("error: no result was returned");
    // }
    getBalance(contractAddress, filteredAccountAddressesArray[counter], recursiveCaller)
  }
  return recursiveCaller();
}
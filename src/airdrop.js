const _ = require("lodash");
const keys = require('./keys.js');
const Web3 = require('web3');
const utils = require('web3-utils');
const runAirDrop = require('./app.js');
const fs = require('fs');

const readFromFile = process.argv[2] === 'true';

if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider)
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:8545`))
};
web3.utils = utils;


console.log('readFromFile and drop:',readFromFile);
console.log('current eth balance:', web3.utils.fromWei(web3.eth.getBalance(web3.eth.accounts[keys.web3EthAccount]).toString(),"ether"));
console.log('current gas price set to:', keys.gasPrice/1000000000, 'gwei');

const contractAddress = keys.contractAddress;
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const createTokenTopic = '0x39c7a3761d246197818c5f6f70be88d6f756947e153ba4fbcc65d86cb099f1d7';
const excludedAddresses = keys.excludedAddresses;
const airdropTotal = keys.airdropTotal;

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

const getBalance = (contractAddress, accountAddress, callback, dontAddToAddressesAndBalances) => {
  const simpleAccountAddress = accountAddress.substring(2);
  if (!dontAddToAddressesAndBalances) {
    dontAddToAddressesAndBalances = false;
  } else {
    dontAddToAddressesAndBalances = true;
  }

  const balanceOfTopic = ('0x70a08231000000000000000000000000' + simpleAccountAddress);
  web3.eth.call({
    to: contractAddress,
    data: balanceOfTopic,
  }, function (err, result) {
    if (result) {
      const tokens = web3.utils.toBN(result).toString();
      if (!dontAddToAddressesAndBalances){
        addressesAndBalancesArray.push({
          address: accountAddress,
          balance: Number(web3.utils.fromWei(tokens, 'ether'))
        });
      }
      callback(web3.utils.fromWei(tokens, 'ether'));
    } else {
      console.log('err',err);
    }
  })
}

// log the current token balance
getBalance(keys.contractAddress,web3.eth.accounts[keys.web3EthAccount],(tokenAmount) => console.log('tokens in account:',tokenAmount),true );

// gets the balance of all token holders ... answers the question of ... how to find all erc20 token holder balances using web3 and geth
const getBalances = (contractAddress, accountAddressesArray) => {
  let counter = -1;
  addressesAndBalancesArray = [];
  console.log('accountAddressesArray.length',accountAddressesArray.length);
  const filteredAccountAddressesArray = _.pull(accountAddressesArray, ...excludedAddresses);
  // const filteredAccountAddressesArray = accountAddressesArray; // use this to check that all tranasactions add up
  console.log('filteredAccountAddressesArray.length (excludedAddresses array removed)',filteredAccountAddressesArray.length);
  const recursiveCaller = () => {
    if (counter < filteredAccountAddressesArray.length - 1) {
      counter++;
    } else {
      console.log('addressesAndBalancesArray.length',addressesAndBalancesArray.length);
      console.log('_.sumBy(addressesAndBalancesArray, balance);',_.sumBy(addressesAndBalancesArray, 'balance'));
      fs.writeFileSync('./addressesAndBalancesArray', JSON.stringify(addressesAndBalancesArray,null, 2));
      runAirDrop(airdropTotal, addressesAndBalancesArray);
      return addressesAndBalancesArray;
    }
    getBalance(contractAddress, filteredAccountAddressesArray[counter], recursiveCaller)
  }
  return recursiveCaller();
}

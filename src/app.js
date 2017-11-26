var _ = require("lodash");
var request = require("request-promise");
var fs = require('fs');

// Web3 Js
var Tx = require('ethereumjs-tx');
var Web3 = require('Web3');
// var TestRPC = require("ethereumjs-testrpc");
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider)
} else {
    // eth network to send on (currently ropsten testnet)
    web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'))
};
const defaultAccount = web3.eth.defaultAccount = web3.eth.accounts[0];
console.log(defaultAccount);
let count = web3.eth.getTransactionCount(defaultAccount);
const abiArray = require('./divx.js')
// const contractAddress = '0x82c903ebe31c3e74DA3518CA95AB94d66Acc97A0'; // rinkeby test contract
const contractAddress = '0x13f11C9905A08ca76e3e853bE63D4f0944326C72'; // official contract
const contract = web3.eth.contract(abiArray).at(contractAddress);

// keys
const keys = require('./keys.js');
const privateKey = new Buffer(keys.privateKey, 'hex');
// Airdrop
const etherscanApiUrl = 'https://api.etherscan.io/api'
const ethereumDivider = 1000000000000000000;
const thisAirdropTotal = 1000000000000000000000 / ethereumDivider; // amount of tokens allocated for airdrop distribution
let gasLimit = 200000;
const intervalTime = 1; // milliseconds to test
let targetTime = 1; // minutes per week

// randomly generate airdrop time
const airDropCall = () => {
    const randomTime = _.round(Math.random() * targetTime + 1);
    targetTime--;
    if (randomTime === 1) {
        console.log('AIRDROP TIME');
        setInterval(function() {
            getEtherPrice(thisAirdropTotal);
        }, 20000);
        clearInterval(refreshInterval);
    } else {
        console.log(randomTime);
    }
};
// function to stop and refresh interval
const refreshInterval = setInterval(airDropCall, intervalTime);

const getEtherPrice = (airDropTotal) =>  {
  // api call for finding contract transactions (contributions)
  const normalTransactions = {
    url: etherscanApiUrl,
    method: 'GET',
    qs: {
      apikey: keys.etherscanKey,
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
      const inTransactions = _.filter(normalTransactions, {input: '0xb4427263'});
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
      });
      console.log(_.sumBy(txArr, 'airDrop'));
      console.log(txArr.length);
      let i = 0;
        const drop = () => {
          airDropAmt = txArr[i].airDrop * ethereumDivider;
          toAddress = txArr[i].from;
    
        // create transaction parameters
        const contractTx = {
            // nonce = transaction id (compare to SQL auto_increment id)
            nonce: count,
            // where the funds will go (currently a test address)
            to: contractAddress,
            // value of tx
            value: web3.toHex(0),
            // gas price
            gasPrice: web3.toHex(20000000000),
            // gas limit
            gasLimit: web3.toHex(gasLimit),
            // optional data - later will be used for function call from contract to transfer DIVX
            data: contract.transfer.getData(toAddress, airDropAmt)
        }
        console.log(contractTx.data);
        count++;
        const tx = new Tx(contractTx);
        tx.sign(privateKey);
        const serializedTx = tx.serialize();
    
        web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
            if(!err) {
                console.log('Successful tx, here\'s the hash ' + hash);
                if (i < txArr.length - 1) {
                    i++;
                    drop();
                }
            } else {
                console.log(err);
            }
        })
    }
    drop();
    })
  .catch(err => {console.log(`error:${err}`)})
}





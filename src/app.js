const _ = require("lodash");
const request = require("request-promise");
const fs = require('fs');
const droppings = require('./drop.js');
// keys
const keys = require('./keys.js');
const privateKey = new Buffer(keys.privateKey, 'hex');

const readFromFile = process.argv[2] === 'true'; // if false, it'll create the file and stop. if true, it'll run using the existing file
const testRPC = process.argv[3] === 'true';

// Web3 Js
const Tx = require('ethereumjs-tx');
const Web3 = require('web3');
// const TestRPC = require("ethereumjs-testrpc");
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider)
} else {
    // eth network to send on (currently ropsten testnet)
    web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:${testRPC ? 8546 : 8545}`))
};
const defaultAccount = web3.eth.defaultAccount = web3.eth.accounts[keys.web3EthAccount];
console.log('defaultAccount',defaultAccount);
// let count = web3.eth.getTransactionCount(defaultAccount);
const abiArray = require('./divx.js')
const contractAddress = keys.contractAddress; // official contract
const contract = web3.eth.contract(abiArray).at(contractAddress);
const thisAirdropTotal = keys.airdropTotal; // amount of tokens allocated for airdrop distribution
console.log('thisAirdropTotal',thisAirdropTotal/1000000000000000000);

// Airdrop
const etherscanApiUrl = 'https://api.etherscan.io/api'
const ethereumDivider = 1000000000000000000;
const intervalTime = 1; // milliseconds to test
let targetTime = 1; // minutes per week

// randomly generate airdrop time
const airDropCall = () => {
    const randomTime = _.round(Math.random() * targetTime + 1);
    targetTime--;
    if (randomTime === 1) {
        console.log('AIRDROP TIME');
        getEtherPrice(thisAirdropTotal);
        clearInterval(refreshInterval);
    } else {
        // console.log(randomTime);
    }
};
// function to stop and refresh interval
// const refreshInterval = setInterval(airDropCall, intervalTime);

const runAirDrop = (airDropTotal, tokenAddressesAndQuantities) => {
    // let count = web3.eth.getTransactionCount(defaultAccount);
    // filter only qualified transactions (over 1000 DIVX)
    const totalQualified = _.filter(tokenAddressesAndQuantities, function (tokenAddressAndQuantity) {
        return tokenAddressAndQuantity.balance >= 1000;
    });
    console.log(`Number of total qualified addresses: ${totalQualified.length}`);
    // add together total supply of qualified transactions
    const sumQualified = _.sumBy(totalQualified, 'balance');
    console.log(`The qualified sum is equal to: ${sumQualified}`);
    // figure out how much each address receives
    tokenAddressesAndQuantities = totalQualified.map(tokenAddressAndQuantity => {
        tokenAddressAndQuantity['airDrop'] = (airDropTotal * tokenAddressAndQuantity.balance) / sumQualified;
        tokenAddressAndQuantity['airDropReadable'] = (airDropTotal * tokenAddressAndQuantity.balance) / sumQualified / 1000000000000000000;
        return tokenAddressAndQuantity;
    });
    console.log('Airdrop total is equivalent to the following numeric value: ' + _.sumBy(tokenAddressesAndQuantities, 'airDrop')/1000000000000000000);
    let i = 0;
    const drop = () => {
        const airDropAmt = tokenAddressesAndQuantities[i].airDrop;
        const toAddress = tokenAddressesAndQuantities[i].address;

        // create transaction parameters
        const contractTx = {
            // nonce = transaction id (compare to SQL auto_increment id)
            nonce: count,
            // where the funds will go (currently a test address)
            to: contractAddress,
            // value of tx
            value: web3.toHex(0),
            // gas price
            gasPrice: web3.toHex(keys.gasPrice),
            // gas limit
            gasLimit: web3.toHex(keys.gasLimit),
            // optional data - later will be used for function call from contract to transfer DIVX
            data: contract.transfer.getData(toAddress, airDropAmt)
        }
        count++;
        const tx = new Tx(contractTx);
        tx.sign(privateKey);
        const serializedTx = tx.serialize();

        web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function (err, hash) {
            if (!err) {
                console.log('Successful tx, here\'s the hash ' + hash);
                if (i < tokenAddressesAndQuantities.length - 1) {
                    i++;
                    drop();
                }
            } else {
                console.log(err);
            }
        })
    }

  fs.writeFileSync('./tokenAddressesAndQuantities', JSON.stringify(tokenAddressesAndQuantities,null, 2));
  //   const testArr = [  {
  //     "address": "0x4b830b03753c636a45c489a78fa853e9ef659ecd",
  //     "balance": 82454.83652599723,
  //     "airDrop": 38.975190265679956
  //   },
  //     {
  //       "address": "0xbbf934dd3b78a4d31278e3ace4f141cd60b88aa5",
  //       "balance": 7600.818834730124,
  //       "airDrop": 3.592795434930826
  //     },
  //     {
  //       "address": "0x5b3e3cc385237564b102b4a7505876bfeb2752a2",
  //       "balance": 100,
  //       "airDrop": 32.62157053148836
  //     }]
  // const newarr = _.filter(tokenAddressesAndQuantities, (obj) => {
  //   return obj.balance <= 1000;
  // })
  // console.log('newarr',newarr);
  // console.log('testArr',testArr);
    // drop();
  if (readFromFile) {
    droppings(tokenAddressesAndQuantities);
  }
}

module.exports = runAirDrop;

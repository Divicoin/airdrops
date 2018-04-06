const _ = require("lodash");
const fs = require('fs');
const droppings = require('./drop.js');
// keys
const keys = require('./keys.js');
const privateKey = new Buffer(keys.privateKey, 'hex');
const airdropThreshold = keys.airdropThreshold;
const readFromFile = process.argv[2] === 'true'; // if false, it'll create the file and stop. if true, it'll run using the existing file

// Web3 Js
const Tx = require('ethereumjs-tx');
const Web3 = require('web3');
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider)
} else {
  web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:8545`))
};
const defaultAccount = web3.eth.defaultAccount = web3.eth.accounts[keys.web3EthAccount];
console.log('defaultAccount',defaultAccount);
const abiArray = require('./abiArray.js')
const contractAddress = keys.contractAddress; // official contract
const contract = web3.eth.contract(abiArray).at(contractAddress);
const thisAirdropTotal = keys.airdropTotal; // amount of tokens allocated for airdrop distribution
console.log('thisAirdropTotal',thisAirdropTotal/1000000000000000000);

const runAirDrop = (airDropTotal, tokenAddressesAndQuantities) => {
  // filter only qualified transactions (over airdropThreshold)
  const totalQualified = _.filter(tokenAddressesAndQuantities, function (tokenAddressAndQuantity) {
    return tokenAddressAndQuantity.balance >= airdropThreshold;
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
      // optional data - later will be used for function call from contract to transfer tokens
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

  if (readFromFile) {
    droppings(tokenAddressesAndQuantities);
  }
}

module.exports = runAirDrop;

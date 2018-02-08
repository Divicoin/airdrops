// example array for tokenAddressesAndQuantities
// tokenAddressesAndQuantities = [
//   {
//     "address": "0x4b830b03753c636a45c489a78fa853e9ef659ecd",
//     "balance": 82454.83652599723,
//     "airDrop": 38.97081461591267
//   }, {
//     "address": "0xbbf934dd3b78a4d31278e3ace4f141cd60b88aa5",
//     "balance": 7600.818834730124,
//     "airDrop": 3.5923920805302036
//   }
// ]
// const
//     web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:${testRPC ? 8546 : 8545}`))

const Web3 = require('web3');
const Tx = require('ethereumjs-tx');
const testRPC = process.argv[3] === 'true';
const web3 = new Web3(new Web3.providers.HttpProvider(`http://localhost:${testRPC ? 8546 : 8545}`))
const defaultAccount = web3.eth.defaultAccount = web3.eth.accounts[1];
console.log('defaultAccount',defaultAccount);

const abiArray = require('./divx.js')
const contractAddress = '0x13f11C9905A08ca76e3e853bE63D4f0944326C72'; // official contract
const contract = web3.eth.contract(abiArray).at(contractAddress);

const keys = require('./keys.js');
const privateKey = new Buffer(keys.privateKey, 'hex');

const droppings = (tokenAddressesAndQuantities) => {
  let nonceCount = web3.eth.getTransactionCount(defaultAccount);
  let i = 0;
  console.log('i',i);
  const drop = () => {
    const airDropAmt = tokenAddressesAndQuantities[i].airDrop;
    const toAddress = tokenAddressesAndQuantities[i].address;

    // create transaction parameters
    const contractTx = {
      // nonce = transaction id (compare to SQL auto_increment id)
      nonce: nonceCount,
      // where the funds will go (currently a test address)
      to: contractAddress,
      // value of tx
      value: web3.toHex(0),
      // gas price
      gasPrice: web3.toHex(21000000000),
      // gas limit
      gasLimit: web3.toHex(100000),
      // optional data - later will be used for function call from contract to transfer DIVX
      data: contract.transfer.getData(toAddress, airDropAmt)
    }
    nonceCount++;
    console.log('contractTx',contractTx);
    const tx = new Tx(contractTx);
    tx.sign(privateKey);
    const serializedTx = tx.serialize();
    console.log("beginning sendRawTransaction");
    web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function (err, hash) {
      if (!err) {
        console.log('Successful tx, here\'s the hash ' + hash);
        if (i < tokenAddressesAndQuantities.length - 1) {
          i++;
          drop();
        }
      } else {
        console.log("there is an error");
        console.log(err);
      }
    })
  }
  drop();
}

module.exports = droppings;

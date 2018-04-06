# Token Airdrops
This code was originally used for the DIVX airdrop campaign, but we hope that it will assist others in their quest to drop coins.

## How it works
We first find every single wallet who holds DIVX, either as a result of contributing to the contract directly or via a transfer event. 

Once the wallets have been discovered, we filter out any wallets that are holding less than 1,000 DIVX. The remaining wallets are considered "qualified."

To determine the amount of DIVX one wallet will receive, we take the total amount that we're airdropping (in our case 3000 DIVX), multiply it by the wallet's balance, and then divide by the total sum of DIVX in the qualified wallets.

We write the qualified addresses, quantities, and balances to individual files, both as a means of retrieving the information required to send the transaction, but also as a reference should we need to provide support.

We then use a recursive function to send out all the transactions programmatically.

## Smart contract
[DIVX ERC20 Smart Contract](https://github.com/Divicoin/Smart-Contract),

# How to use

### Getting started
1. Fork this repository and clone it to your local machine.
2. [Install geth](https://github.com/ethereum/go-ethereum/wiki/Installing-Geth)
3. If you'd like to test your code first (highly recommended), [Install TestRPC / Ganache](http://truffleframework.com/blog/testrpc-is-now-ganache)

### Install dependencies
In the root directory of your local repository
```npm i```

### Setup development environment
Start geth with rpc functionality and sync the blockchain.
```geth --fast --rpc```

In another terminal window open Ethereum's Javascript Console with
```geth attach```

### Customize code
First change `keys.example.js` to `keys.js`

#### Find / create your address
In your Ethereum Javascript Console, type `eth.accounts` to find the addresses you have access to. If you don't have an address yet, in a separate terminal run `geth account new` to get one.

#### Find your private key
One (easy) way to find your private key:
Navigate to `~/Library/Ethereum/keystore` to find your JSON/UTC file.

**Note: the location of your keystore directory may be different depending on your operating system**

Go to https://myetherwallet.com (type this into your browser manually and verify that the SSL certificate is valid).

Input your Private Key into the `private key` value in the newly created `keys.js` file.

#### Eth account
Add the [index] of your eth address to the `web3EthAccount` value in the `keys.js` file. 

#### Contract address
Add the address of your smart contract to the `contractAddress` value in the `keys.js` file.

#### Exclude addresses
Enter any addresses you want to specifically exclude from the airdrop. This might be your treasury, an exchange where your token is being traded, or the wallet from which the airdrop is being called.

#### Add contract abi
Change `abiArray.example.js` to `abiArray.js` and add your smart contract's ABI array.

To find the ABI, navigate to your smart contract address on `https://etherscan.io/address/{your_contract_address}#code`

### Run the script

##### First run
```node airdrops.js false```

The `false` flag tells the script to simply log and write the qualified addresses, quantities, and balances to their respective files. This gives you an opportunity to audit the numbers and make sure that everything is in order before you initiate the actual transactions.

**Remember: Fund the address from which the transactions will be sent with both ETH  (to cover the transaction fees) and your tokens (enough to cover the amount you want to airdrop).**

##### Second run
```node airdrops.js true```

This `true` flag tells the script to read from the files created during the first run and executes the transactions. You should see a log of every transaction.



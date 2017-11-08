# DIVX Airdrops

## How it works
- Uses the etherscan API to find "normal transactions" for a specified address.
- Parses the addresses 
- Uses block number to find relevant sale bonus at the time of contribution
- Filters parsed addresses to find donors who contributed for 1000 DIVX or more
- Finds total amount of all qualified transactions
- Finds the amount each address should receive proportionate to the amount of DIVX in their wallet
- Defines a target minute for airdrop to occur
- Randomly generates a random number between 1 and 10,080 once a minute for 10,080 minutes (one week) until random target is equal to the target minute
- Once target minute and random target align - airdrop occurs and funds are distributed from a funded web3 ERC20 enabled wallet

## Technologies used
- Node JS
- Web3 JS
- NPM

### Dependencies
- lodash
- request-promise

## Install
``` npm i ```


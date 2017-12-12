const _ = require('lodash');
const masternodeCalculator = (addressesAndBalancesArray) => {
  console.log('addressesAndBalancesArray.length',addressesAndBalancesArray.length);
  const copperAmount = 1000;
  const copperBonus = 0;
  let copper = 0;
  const silverAmount = 3000;
  const silverBonus = 5; // percent
  let silver = 0;
  const goldAmount = 10000;
  const goldBonus = 10; // percent
  let gold = 0;
  const platinumAmount = 30000;
  const platinumBonus = 15; // percent
  let platinum = 0;
  const diamondAmount = 100000;
  const diamondBonus = 20; // percent
  let diamond = 0;
  _.each(addressesAndBalancesArray, (addressAndBalance) => {
    const b = addressAndBalance.balance;
    if (b >= diamondAmount) {
      diamond++;
    } else if (b >= platinumAmount) {
      platinum++;
    } else if (b >= goldAmount) {
      gold++;
    } else if (b >= silverAmount) {
      silver++;
    } else if (b >= copperAmount) {
      copper++;
    }
  })
  console.log('copper',copper);
  console.log('silver',silver);
  console.log('gold',gold);
  console.log('platinum',platinum);
  console.log('diamond',diamond);
  const totalNodes = _.sum([copper, silver, gold, platinum, diamond]);
  console.log('copper/totalNodes',copper/totalNodes);
  console.log('silver/totalNodes',silver/totalNodes);
  console.log('gold/totalNodes',gold/totalNodes);
  console.log('platinum/totalNodes',platinum/totalNodes);
  console.log('diamond/totalNodes',diamond/totalNodes);

}

module.exports = masternodeCalculator;
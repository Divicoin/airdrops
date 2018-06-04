const _ = require('lodash');
const GoogleSpreadsheet = require('google-spreadsheet');
const async = require('async');
const dateFormat = require('dateformat');
let doc = new GoogleSpreadsheet('1wc8EGVzLGqeePqZkfjkFTz6Rewk8F5cOVxN8888gXtY');
let sheet;
const creds = require('./Divi masternode calculator-c5f643437699.json');
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
  let borken = 0;
    if (addressesAndBalancesArray.length > 0) {
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
    } else {
        // the node is down and calculator is not working so these are defaults
        borken = 1;
        copper = 428;
        silver = 183;
        gold = 80;
        platinum = 28;
        diamond = 8;
    }
  console.log(Date());
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
    async.series([
        function setAuth(step) {
            doc.useServiceAccountAuth(creds, step)
        },
        function getInfoAndWorksheets(step) {
          doc.getInfo(function(err, info) {
          console.log('Loaded doc: '+info.title+' by '+info.author.email);
          sheet = info.worksheets[0];
          console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
          step();
            });
        },
        function workingWithCells(step) {
    sheet.getCells({
      'min-row': 2,
      'max-row': 2,
      'return-empty': true
    }, function(err, cells) {
      var cell = cells[0];
      console.log('Cell R'+cell.row+'C'+cell.col+' = '+cell.value);
_.each(cells, function(cell, count){
  // cells have a value, numericValue, and formula
   //   cell.value == '1'
  //    cell.numericValue == 1;
 //     cell.formula == '=ROW()';

      // updating `value` is "smart" and generally handles things for you
    if (count === 1) {
      cell.value = copper;
        console.log('logging a copper to sheet')
    }else if(count ===2) {
        cell.value = silver;
    }else if(count ===3) {
        cell.value = gold;
    }else if(count ===4) {
        cell.value = platinum;
    }else if(count ===5) {
        cell.value = diamond;
    }else if (count ===6) {
        cell.value = dateFormat(new Date(), "dddd, mmmm dS, yyyy, h:MM:ss TT");
    }else if (count ===8) {
        if (borken) {
            cell.value = 'calculator seems to be borken. values shown are just defaults'
        }
    }
//      cell.value = '=A1+B2'
      cell.save(); //async

})

      // bulk updates make it easy to update many cells at once
    //  cells[0].value = 1;
     // cells[1].value = 2;
      //cells[2].formula = '=A1+B1';
      sheet.bulkUpdateCells(cells); //async

      step();
                    })
        }
    ])
}

module.exports = masternodeCalculator;

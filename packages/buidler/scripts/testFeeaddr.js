const fs = require('fs');
const chalk = require('chalk');
const NiftyToken = artifacts.require("NiftyToken");
const Liker = artifacts.require("Liker");
const AtivoToken = artifacts.require("AtivoToken");
const bre = require("@nomiclabs/buidler");
const { exit } = require('process');

console.log("🪐 WORKING ON NETWORK: ",bre.network.name)

//console.log(niftytoken.checkBalance())

async function main() {
    if(bre.network.name.indexOf("sidechain")>=0 || bre.network.name.indexOf("kovan")>=0|| bre.network.name.indexOf("xdai")>=0){
        const niftytoken = await NiftyToken.at('0x009a8a0aBAb77841Fb4297F9FcA61F1deF3ed642')
        const liker = await Liker.at('0xF681C4462b1126088fb402212b9c956579387Df1')
        const ativoToken = await AtivoToken.at('0xD320C26a63629cd47f9b813cE035a4A3Aae7bD80')
        
        //const accounts = await web3.eth.getAccounts()

        const feereserveaddress = await niftytoken.feereserveaddress();
        const marketFee = await niftytoken.marketFee();
        console.log('\nmarketFee is: ' + marketFee + '\nfeereserveaddress is: ' + feereserveaddress);
        //console.log(accounts)

        // First Init

        // const transaction = await niftytoken.updateFeeaddr('0xd3be66b3BD84426E129654E558082Dc2eae3e866')
        // console.log(transaction)
        // console.log('ok')
        // console.log('ok')
        // console.log('ok')
        // const transaction2 = await liker.setWeightToken(ativoToken.address)
        // console.log(transaction2)
        // console.log('ok')
        // console.log('ok')
        // await ativoToken.manualMint('0xd3be66b3BD84426E129654E558082Dc2eae3e866', '10000000000000000000')
        // console.log('ok')
        // console.log('ok')
        // const weighterc20 = await liker.weighterc20()
        // console.log(weighterc20)


        // const transaction3 = await liker.getLikesByTarget('0xdb07ED19bB915444A81ca03401286F340bCbff10', '1')
        // console.log(transaction3.toString(10))

        
        // const balanceTest = await ativoToken.balanceOf('0xA8866Bfbeb005056CA3dCd559110B5AE8E2B28C9');
        // console.log(balanceTest.toString(10))

        // const weightid1 = await liker.targetWeightLikes('1');
        // console.log('Weight ID1: ' + weightid1)

        // const result = await liker.getPastEvents(
        //   'likedWeightBalance',
        //   {fromBlock: 0}
        // );

        const result = await niftytoken.getPastEvents(
          'burnedToken',
          {fromBlock: 0}
        );
        console.log('\n Number of Events: ' + result.length)
        result.forEach(element => {
          if (element.returnValues.inkUrl == "QmQ3TMhN1P8Ybuddzo1Uo5sEPXweWGDuMXGACxjYkHFghk") {
            console.log('NFT GONE')
          }
        });
        
        // Burn
        // const resultT = await niftytoken.burnToken("4", "QmQ3TMhN1P8Ybuddzo1Uo5sEPXweWGDuMXGACxjYkHFghk");
        // console.log(resultT);

        // const resultT = await niftytoken.filesOfThisAddress("0xc783df8a850f42e7F7e57013759C285caa701eB6");
        // console.log(resultT);

        exit()
    }
  }
  
main();

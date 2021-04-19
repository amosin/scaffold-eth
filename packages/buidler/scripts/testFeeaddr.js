const fs = require('fs');
const chalk = require('chalk');
const NiftyYardToken = artifacts.require("NiftyYardToken");
const Liker = artifacts.require("Liker");
const AtivoToken = artifacts.require("AtivoToken");
const bre = require("@nomiclabs/buidler");
const { exit } = require('process');

console.log("🪐 WORKING ON NETWORK: ",bre.network.name)

//console.log(niftytoken.checkBalance())

async function main() {
    if(bre.network.name.indexOf("sidechain")>=0 || bre.network.name.indexOf("mumbai")>=0 || bre.network.name.indexOf("kovan")>=0|| bre.network.name.indexOf("xdai")>=0){
        const niftytoken = await NiftyYardToken.at('0x186C4C038e04b56aD63BFfF71b8149Dc49E9b88b')
        const liker = await Liker.at('0xaE7f2014ca5ECCb017D3D6147Cfe477643DbbaE0')
        const ativoToken = await AtivoToken.at('0x44a2D88e864b559Eaf433C79b961f92F4b68B65c')
        
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
        // await ativoToken.manualMint('0xc783df8a850f42e7F7e57013759C285caa701eB6', '10000000000000000000')
        // console.log('ok')
        // console.log('ok')
        const weighterc20 = await liker.weighterc20()
        console.log(weighterc20)


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
          'TransferWithMetadata',
          {fromBlock: 12805118}
        );
        console.log('\n Number of Events: ' + result.length)
        result.forEach(element => {
          console.log(element.returnValues);
          // if (element.returnValues.nftUrl == "QmQ3TMhN1P8Ybuddzo1Uo5sEPXweWGDuMXGACxjYkHFghk") {
          //   console.log('NFT GONE')
          // }
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

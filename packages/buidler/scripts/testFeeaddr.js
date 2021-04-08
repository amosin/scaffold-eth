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
        const niftytoken = await NiftyToken.at('0xa57A27220A64ec7a824a800f76540490eBD42C9a')
        const liker = await Liker.at('0x2AA14E211a2D1910A8Ed200Da0Cd7cC691780283')
        const ativoToken = await AtivoToken.at('0xa45a93259d2D1f7BE1D5CbDF1f37E51135012ae5')
        
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
        //   'checkWeight',
        //   {fromBlock: 0}
        // );
        // console.log('\n Number of Events: ' + result.length)
        // result.forEach(element => {
        //   console.log(element.returnValues);
        // });
        

        const totalSupply = await niftytoken.burn(9);
        console.log(totalSupply);

        exit()
    }
  }
  
main();

const fs = require('fs');
const chalk = require('chalk');
const NiftyToken = artifacts.require("NiftyToken")
const Liker = artifacts.require("Liker")
const bre = require("@nomiclabs/buidler");
const { exit } = require('process');

console.log("🪐 WORKING ON NETWORK: ",bre.network.name)

//console.log(niftytoken.checkBalance())

async function main() {
    if(bre.network.name.indexOf("sidechain")>=0 || bre.network.name.indexOf("kovan")>=0|| bre.network.name.indexOf("xdai")>=0){
        const niftytoken = await NiftyToken.at('0xa8Fa8fFac0904aa020415807eE6516E887D69770')
        const liker = await Liker.at('0x0FAf8a8DCFB769EDE2b5797087E624956693F0CA')
        
        //const accounts = await web3.eth.getAccounts()

        const feereserveaddress = await niftytoken.feereserveaddress();
        const marketFee = await niftytoken.marketFee();
        console.log('\nmarketFee is: ' + marketFee + '\nfeereserveaddress is: ' + feereserveaddress);
        //console.log(accounts)
        // const transaction = await niftytoken.updateFeeaddr('0xd3be66b3BD84426E129654E558082Dc2eae3e866')
        // console.log(transaction)
        // console.log('ok')
        // console.log('ok')
        // console.log('ok')

        const transaction2 = await liker.setWeightToken('0xAf6fDB5573Ac4A7E83E6761A738A7E0bE2c527F4')
        console.log(transaction2)
        console.log('ok')
        console.log('ok')
        exit()
    }
  }
  
main();

const fs = require('fs');
const chalk = require('chalk');
const bre = require("@nomiclabs/buidler");
/*
 redeploy NiftyMediator, update NiftyRegistry and reset the mediatorContractOnOtherSide on NiftyMain
 */
async function main() {
  console.log("📡 Deploy \n")
  // auto deploy to read contract directory and deploy them all (add ".args" files for arguments)
  //await autoDeploy();
  // OR
  // custom deploy (to use deployed addresses dynamically for example:)

  console.log("🪐 DEPLOYING ON NETWORK: ",bre.network.name)


  if(bre.network.name.indexOf("sidechain")>=0 || bre.network.name.indexOf("mumbai")>=0|| bre.network.name.indexOf("kovan")>=0|| bre.network.name.indexOf("xdai")>=0){
    const Liker = await deploy("Liker")
    const NiftyRegistry = await deploy("NiftyRegistry")
    const NiftyYard = await deploy("NiftyYard")
    const AtivoToken = await deploy("AtivoToken")
    // parameters _feeaddr + childChainManager
    const NiftyYardToken = await deploy("NiftyYardToken",["0xF1B471055629E172a59C488a50F38BFc668B1A76", "0xb5505a6d998549090530911180f38aC5130101c6"])
  

    // USE ChildChainManagerProxy
    //https://static.matic.network/network/testnet/mumbai/index.json
    //https://static.matic.network/network/mainnet/v1/index.json

    //console.log("💽Loading local contract that are already deployed...")
    // const Liker = await ethers.getContractAt("Liker","0x0FAf8a8DCFB769EDE2b5797087E624956693F0CA")
    // const NiftyRegistry = await ethers.getContractAt("NiftyRegistry","0x78639e04Fe88c6e9Fea99399132A57EfE88EDb87")
    // const NiftyYard = await ethers.getContractAt("NiftyYard","0x7EAD8282158Dd6312906a77eb6C3d59606cBEB98")
    // const AtivoToken = await ethers.getContractAt("NiftyYard","0xAf6fDB5573Ac4A7E83E6761A738A7E0bE2c527F4")
    // const NiftyYardToken = await ethers.getContractAt("NiftyYardToken","0xa8Fa8fFac0904aa020415807eE6516E887D69770")
    // const NiftyMediator = await ethers.getContractAt("NiftyMediator","0x9E272CEf956F50b8af46c41160505259b892a5B2")


    await NiftyRegistry.setNftAddress(NiftyYard.address)
    await NiftyRegistry.setTokenAddress(NiftyYardToken.address)
    await NiftyYard.setNiftyRegistry(NiftyRegistry.address)
    await NiftyYardToken.setNiftyRegistry(NiftyRegistry.address)
    await Liker.addContract(NiftyYard.address)
    await Liker.setWeightToken(AtivoToken.address)

    
    if(bre.network.name.indexOf("kovan")>=0){
      /*await NiftyMediator.setBridgeContract("0xFe446bEF1DbF7AFE24E81e05BC8B271C1BA9a560")
      await NiftyYard.setTrustedForwarder("0x77777e800704Fb61b0c10aa7b93985F835EC23fA")
      await NiftyYardToken.setTrustedForwarder("0x77777e800704Fb61b0c10aa7b93985F835EC23fA")
      await NiftyMediator.setTrustedForwarder("0x77777e800704Fb61b0c10aa7b93985F835EC23fA")
      await NiftyMediator.setRequestGasLimit("1500000")
      await Liker.setTrustedForwarder("0x77777e800704Fb61b0c10aa7b93985F835EC23fA")*/
    }else if(bre.network.name.indexOf("xdai")>=0){
      //console.log("setBridgeContract")
      //await NiftyMediator.setBridgeContract("0x75Df5AF045d91108662D8080fD1FEFAd6aA0bb59")
      //await NiftyYard.setTrustedForwarder("0xB851B09eFe4A5021E9a4EcDDbc5D9c9cE2640CCb")
      //await NiftyYardToken.setTrustedForwarder("0xB851B09eFe4A5021E9a4EcDDbc5D9c9cE2640CCb")
      //console.log("setTrustedForwarder...")
      //await NiftyMediator.setTrustedForwarder("0xB851B09eFe4A5021E9a4EcDDbc5D9c9cE2640CCb")
      //console.log("setRequestGasLimit...")
      //await NiftyMediator.setRequestGasLimit("1500000")
      //await Liker.setTrustedForwarder("0xB851B09eFe4A5021E9a4EcDDbc5D9c9cE2640CCb")
      //const NiftyMediator = await ethers.getContractAt("NiftyMediator","0xdFDE4746486086D00F82b81bB84360B72a233a07")
      //console.log("📡 setMediatorContractOnOtherSide...")
      console.log("set mediator contract on other side....")
      let result = await NiftyMediator.setMediatorContractOnOtherSide("0xc02697c417DdAcfbe5EdbF23eDad956BC883F4fb")
      //console.log("result",result)
    }
    //await Liker.addContract(NiftyYard.address)

    /*if(bre.network.name.indexOf("sidechain")>=0) {
      let trustedForwarder
      try{
        let trustedForwarderObj = JSON.parse(fs.readFileSync("../react-app/src/gsn/Forwarder.json"))
        console.log("⛽️ Setting GSN Trusted Forwarder on NiftyRegistry to ",trustedForwarderObj.address)
        await NiftyYard.setTrustedForwarder(trustedForwarderObj.address)
        await NiftyYardToken.setTrustedForwarder(trustedForwarderObj.address)
        await NiftyMediator.setTrustedForwarder(trustedForwarderObj.address)
        console.log("⛽️ Setting GSN Trusted Forwarder on Liker to ",trustedForwarderObj.address)
        await Liker.setTrustedForwarder(trustedForwarderObj.address)

      }catch(e){
        console.log(e)
      }
    }*/

  }



  if(bre.network.name.indexOf("localhost")>=0 || bre.network.name.indexOf("sokol")>=0 || bre.network.name.indexOf("mainnet")>=0){
    console.log("🚀 Main Deploy ! ")
    const NiftyMain = await deploy("NiftyMain")
    if(bre.network.name.indexOf("sokol")>=0) {
      //await NiftyMain.setBridgeContract("0xFe446bEF1DbF7AFE24E81e05BC8B271C1BA9a560")
    //  await NiftyMain.setRequestGasLimit("1500000")
    } else if(bre.network.name.indexOf("mainnet")>=0) {
      //await NiftyMain.setBridgeContract("0x4C36d2919e407f0Cc2Ee3c993ccF8ac26d9CE64e")
      //await NiftyMain.setRequestGasLimit("1500000")
    }
    //const NiftyMain = await ethers.getContractAt("NiftyMain","0xc02697c417DdAcfbe5EdbF23eDad956BC883F4fb")
    //console.log("setMediatorContractOnOtherSide...")
    await NiftyMain.setMediatorContractOnOtherSide("0x73cA9C4e72fF109259cf7374F038faf950949C51")
  }
}
main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});


async function deploy(name,_args){
  let args = []
  if(_args){
    args = _args
  }
  console.log("📄 "+name)
  const contractArtifacts = artifacts.require(name);
  //console.log("contractArtifacts",contractArtifacts)
  //console.log("args",args)

  const promise =  contractArtifacts.new(...args)


  promise.on("error",(e)=>{console.log("ERROR:",e)})


  let contract = await promise


  console.log(chalk.cyan(name),"deployed to:", chalk.magenta(contract.address));
  fs.writeFileSync("artifacts/"+name+".address",contract.address);
  console.log("\n")
  return contract;
}

async function autoDeploy() {
  let contractList = fs.readdirSync("./contracts")
  for(let c in contractList){
    if(contractList[c].indexOf(".sol")>=0 && contractList[c].indexOf(".swp.")<0){
      const name = contractList[c].replace(".sol","")
      let args = []
      try{
        const argsFile = "./contracts/"+name+".args"
        if (fs.existsSync(argsFile)) {
          args = JSON.parse(fs.readFileSync(argsFile))
        }
      }catch(e){
        console.log(e)
      }
      await deploy(name,args)
    }
  }
}

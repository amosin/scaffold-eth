import {
  BigInt,
  Address,
  ipfs,
  json,
  JSONValueKind,
  log,
  TypedMap
} from "@graphprotocol/graph-ts";
import {
  NiftyYard,
  newFile,
  SetPriceCall,
  SetPriceFromSignatureCall,
  ownershipChange,
  newFilePrice
} from "../generated/NiftyYard/NiftyYard";
import {
  NiftyYardToken,
  mintedNft,
  Transfer,
  SetTokenPriceCall,
  boughtNft,
  newTokenPrice,
} from "../generated/NiftyYardToken/NiftyYardToken";
// import {
//   NiftyMediator,
//   newPrice,
//   tokenSentViaBridge,
// } from "../generated/NiftyMediator/NiftyMediator";

import {
liked
} from "../generated/Liker/Liker";
import {
  File,
  Creator,
  Token,
  TokenTransfer,
  Sale,
  RelayPrice,
  Total,
  MetaData,
  NftLookup,
  Like
} from "../generated/schema";

function updateMetaData(metric: String, value: String): void {
  let metaData = new MetaData(metric);
  metaData.value = value;
  metaData.save();
}

function incrementTotal(metric: String, timestamp: BigInt): void {
  let stats = Total.load("latest");
  let day = (timestamp / BigInt.fromI32(86400)) * BigInt.fromI32(86400);

  if (stats == null) {
    stats = new Total("latest");
  } else {
    if (stats.day !== day) {
      let yesterdayStats = stats;
      yesterdayStats.id = stats.day.toString();
      yesterdayStats.save();
      stats.id = "latest";
    }
  }

  stats.day = day;

  if (metric == "nfts") {
    stats.nfts = stats.nfts + BigInt.fromI32(1);
  } else if (metric == "tokens") {
    stats.tokens = stats.tokens + BigInt.fromI32(1);
  } else if (metric == "upgrades") {
    stats.upgrades = stats.upgrades + BigInt.fromI32(1);
  } else if (metric == "sales") {
    stats.sales = stats.sales + BigInt.fromI32(1);
  } else if (metric == "creators") {
    stats.creators = stats.creators + BigInt.fromI32(1);
  }

  stats.save();
}

function checkBestPrice(file: File | null): File | null {

  if(file !== null) {
    if(file.mintPrice.isZero()) {
      file.bestPrice = BigInt.fromI32(0)
      file.bestPriceSource = null
      file.bestPriceSetAt = null
    } else {
      file.bestPrice = file.mintPrice
      file.bestPriceSource = 'file'
      file.bestPriceSetAt = file.mintPriceSetAt
    }

    for (let i = 0, len=file.tokens.length; i < len; i++) {
        let tokens = file.tokens
        let id = tokens[i]
        let token = Token.load(id)

        if(token.price > BigInt.fromI32(0)) {
          if(file.bestPrice.isZero()) {
            file.bestPrice = token.price
            file.bestPriceSource = id
            file.bestPriceSetAt = token.priceSetAt
          } else if (token.price < file.bestPrice) {
            file.bestPrice = token.price as BigInt
            file.bestPriceSource = id
            file.bestPriceSetAt = token.priceSetAt
          }
      }
    }
  }

  return file
}


export function handlenewFile(event: newFile): void {
  let creator = Creator.load(event.params.creator.toHexString());

  if (creator == null) {
    creator = new Creator(event.params.creator.toHexString());
    creator.address = event.params.creator;
    creator.nftCount = BigInt.fromI32(1);
    incrementTotal("creators", event.block.timestamp);
  } else {
    creator.nftCount = creator.nftCount.plus(BigInt.fromI32(1));
  }

  let nft = File.load(event.params.fileUrl);

  if (nft == null) {
    nft = new File(event.params.fileUrl);
  }

  //  let jsonBytes = ipfs.cat(event.params.jsonUrl)
  //  if (jsonBytes !== null) {
  //    let data = json.fromBytes(jsonBytes!);
  //    if (data !== null) {
  //      if (data.kind !== JSONValueKind.OBJECT) {
  //        log.debug('[mapping] [loadIpfs] JSON data from IPFS is not an OBJECT', [
  //        ]);
  //    } else {
  //        let obj = data.toObject();
  //        nft.name = obj.get("name").toString();
  //        nft.image = obj.get("image").toString();
  //        nft.description = obj.get("description").toString();
  //      }
  //  }
  //  }

  nft.nftNumber = event.params.id;
  nft.creator = creator.id;
  nft.likers = new Array<string>();
  nft.likersWeight = new Array<string>();
  nft.limit = event.params.limit;
  nft.jsonUrl = event.params.jsonUrl;
  nft.createdAt = event.block.timestamp;

  nft.tokens = []
  nft.mintPrice = BigInt.fromI32(0)
  nft.bestPrice = BigInt.fromI32(0)
  nft.likeCount = BigInt.fromI32(0)

  nft.save();
  creator.save();

  let nftLookup = new NftLookup(nft.nftNumber.toString())
  nftLookup.nftId = nft.id
  nftLookup.save()

  incrementTotal("nfts", event.block.timestamp);
  updateMetaData("blockNumber", event.block.number.toString());
}

function _handleSetPrice(
  nftUrl: String,
  price: BigInt,
  timestamp: BigInt
): void {
  let file = File.load(nftUrl);

  file.mintPriceNonce = file.mintPriceNonce + BigInt.fromI32(1);
  file.mintPrice = price;
  file.mintPriceSetAt = timestamp;
  
  if(price > BigInt.fromI32(0)) {

    if(file.bestPrice.isZero()) {
      file.bestPrice = price
      file.bestPriceSource = 'file'
      file.bestPriceSetAt = timestamp
    } else if (price <= file.bestPrice) {
      file.bestPrice = price
      file.bestPriceSource = 'file'
      file.bestPriceSetAt = timestamp
    }
  } else {
    file = checkBestPrice(file)
  }

  file.save();
}

export function handleSetPriceFromSignature(
  call: SetPriceFromSignatureCall
): void {
  _handleSetPrice(call.inputs.fileUrl, call.inputs.price, call.block.timestamp);
  updateMetaData("blockNumber", call.block.number.toString());
}

export function handleSetPrice(call: SetPriceCall): void {
  _handleSetPrice(call.inputs.fileUrl, call.inputs.price, call.block.timestamp);
  updateMetaData("blockNumber", call.block.number.toString());
}

export function handleNewNftPrice(event: newFilePrice): void {
  _handleSetPrice(event.params.fileUrl, event.params.price, event.block.timestamp)
  updateMetaData("blockNumber", event.block.number.toString());
}

export function handleNewTokenPrice(event: newTokenPrice): void {
  let token = Token.load(event.params.id.toString());
  let file = File.load(token.nft)
  token.price = event.params.price;
  token.priceSetAt = event.block.timestamp;

  token.save();

  if(token.price > BigInt.fromI32(0)) {
    if(file.bestPrice.isZero()) {
      file.bestPrice = token.price
      file.bestPriceSource = token.id
      file.bestPriceSetAt = token.priceSetAt
    } else if (token.price < file.bestPrice) {
      file.bestPrice = token.price
      file.bestPriceSource = token.id
      file.bestPriceSetAt = token.priceSetAt
    }
  } else if(file.bestPrice > BigInt.fromI32(0)) {
      file = checkBestPrice(file)
  }

  file.save()
  updateMetaData("blockNumber", event.block.number.toString());
}

export function handleSetTokenPrice(call: SetTokenPriceCall): void {
  let token = Token.load(call.inputs._tokenId.toString());

  let file = File.load(token.nft)
  token.price = call.inputs._price;
  token.priceSetAt = call.block.timestamp;

  token.save();

  if(token.price > BigInt.fromI32(0)) {
    if(file.bestPrice.isZero()) {
      file.bestPrice = token.price
      file.bestPriceSource = token.id
      file.bestPriceSetAt = token.priceSetAt
    } else if (token.price < file.bestPrice) {
      file.bestPrice = token.price
      file.bestPriceSource = token.id
      file.bestPriceSetAt = token.priceSetAt
    }
  } else if(file.bestPrice > BigInt.fromI32(0)) {
      file = checkBestPrice(file)
  }

  file.save()

  updateMetaData("blockNumber", call.block.number.toString());
}

export function handleMintedNft(event: mintedNft): void {
  
  let file = File.load(event.params.nftUrl);

  file.count = file.count.plus(BigInt.fromI32(1));

  if (file.count == file.limit && file.limit != BigInt.fromI32(1)) {

    file.mintPrice = BigInt.fromI32(0)
    file.mintPriceSetAt = event.block.timestamp

    if(file.bestPrice > BigInt.fromI32(0)) {
      file = checkBestPrice(file)
    }
  }

  let tokenArray = file.tokens
  tokenArray.push(event.params.id.toString())
  file.tokens = tokenArray

  let token = new Token(event.params.id.toString());

  token.nft = event.params.nftUrl;
  token.owner = event.params.to;
  token.createdAt = event.block.timestamp;
  token.network = "xdai";
  token.price = BigInt.fromI32(0)

  file.save();
  token.save();

  incrementTotal("tokens", event.block.timestamp);
  updateMetaData("blockNumber", event.block.number.toString());
}

export function handleTransfer(event: Transfer): void {
  let tokenId = event.params.tokenId.toString();

  let token = Token.load(tokenId);

  if (token !== null) {
    token.owner = event.params.to;
    if(token.price > BigInt.fromI32(0)) {
      token.price = BigInt.fromI32(0)
      token.priceSetAt = event.block.timestamp
      token.save()

      let file = File.load(token.nft)
      file = checkBestPrice(file)
      file.save()

    } else {
      token.save()
    }
    updateMetaData("blockNumber", event.block.number.toString());
  }

  let transfer = new TokenTransfer(event.transaction.hash.toHex());

  transfer.token = tokenId;
  transfer.to = event.params.to;
  transfer.from = event.params.from;
  transfer.createdAt = event.block.timestamp;

  if (
    event.address ==
    Address.fromString("0xCF964c89f509a8c0Ac36391c5460dF94B91daba5")
  ) {
    transfer.network = "xdai";
  }
  if (
    event.address ==
    Address.fromString("0xc02697c417DdAcfbe5EdbF23eDad956BC883F4fb")
  ) {
    transfer.network = "mainnet";
  }

  transfer.save();
  updateMetaData("blockNumber", event.block.number.toString());
}

export function handleBoughtNft(event: boughtNft): void {
  let sale = new Sale(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );

  let tokenId = event.params.id.toString();

  let token = Token.load(tokenId);
  let file = File.load(event.params.nftUrl);
  let creator = Creator.load(file.creator);
  let transfer = TokenTransfer.load(event.transaction.hash.toHex());

  //let contract = NiftyYard.bind(Address.fromString("0x49dE55fbA08af88f55EB797a456fdf76B151c8b0"))
  //let creatorTake = contract.creatorTake()

  if (transfer !== null) {
    if (
      transfer.from ==
        Address.fromString("0x0000000000000000000000000000000000000000") ||
      transfer.from == creator.address
    ) {
      sale.saleType = "primary";
      sale.creatorTake = event.transaction.value;
      sale.seller = creator.address;
      creator.earnings = creator.earnings + event.transaction.value
    } else {
      sale.saleType = "secondary";
      sale.creatorTake =
        event.transaction.value.times(BigInt.fromI32(1)) / BigInt.fromI32(100);
      sale.seller = transfer.from;
      creator.earnings = creator.earnings + sale.creatorTake
    }
  }

  sale.token = tokenId;
  sale.price = event.transaction.value;
  sale.buyer = event.transaction.from;
  sale.creator = file.creator;
  sale.nft = event.params.nftUrl;
  sale.createdAt = event.block.timestamp;
  sale.transfer = event.transaction.hash.toHex();

  sale.save();
  creator.save();

  incrementTotal("sales", event.block.timestamp);
  updateMetaData("blockNumber", event.block.number.toString());
}

// export function handleMintedOnMain(event: mintedNft): void {
//   let token = Token.load(event.params.id.toString());

//   token.network = "mainnet";
//   token.upgradeTransfer = event.transaction.hash.toHex();

//   token.save();
//   updateMetaData("blockNumber", event.block.number.toString());
// }

// export function handleTokenSentViaBridge(event: tokenSentViaBridge): void {
//   let token = Token.load(event.params._tokenId.toString());

//   token.network = "mainnet";
//   token.upgradeTransfer = event.transaction.hash.toHex();

//   token.save();

//   incrementTotal("upgrades", event.block.timestamp);
//   updateMetaData("blockNumber", event.block.number.toString());
// }

// export function handleNewRelayPrice(event: newPrice): void {
//   let currentPrice = RelayPrice.load("current");

//   if (currentPrice !== null) {
//     currentPrice.id = currentPrice.createdAt.toString();
//     currentPrice.save();
//   }

//   let updatedPrice = new RelayPrice("current");
//   updatedPrice.price = event.params.price;
//   updatedPrice.createdAt = event.block.timestamp;
//   updatedPrice.save();
//   updateMetaData("blockNumber", event.block.number.toString());
// }

export function handleownershipChange(event: ownershipChange): void {
  let file = File.load(event.params.fileUrl);

  if (file == null) {
    file = File.load(event.params.fileUrl);
  }
  let creator = Creator.load(event.params.creator.toHexString());
  creator.id = event.params.newCreator.toHexString();
  creator.address = event.params.newCreator;
  file.creator = creator.id;
  creator.save();
  file.save();
}

// export function handleliked(event: liked): void {
//   let file = File.load(event.params.fileUrl);
//   let likers = file.likers;
//   let likersWeight = file.likersWeight;
//   likersWeight.push(event.params.weight.toHexString());
//   likers.push(event.params.liker.toHexString());
//   file.likers = likers;
//   file.likersWeight = likersWeight;
//   file.save();
// }

export function handleLikedFile (event: liked): void {

  let nftLookup = NftLookup.load(event.params.target.toString())
  let file = File.load(nftLookup.nftId)
  file.likeCount = file.likeCount + BigInt.fromI32(1)
  file.save()

  let newLike = new Like(event.transaction.hash.toHex() + "-" + event.logIndex.toString())
  newLike.liker = event.params.liker
  newLike.file = nftLookup.nftId
  newLike.createdAt = event.block.timestamp
  newLike.save()

}
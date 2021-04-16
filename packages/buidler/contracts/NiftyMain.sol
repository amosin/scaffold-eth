pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ITokenManagement.sol";

contract NiftyMain is ERC721, Ownable {
    constructor() public ERC721("NFT Yard", "YARDv1") {
        _setBaseURI("ipfs://ipfs/");
    }

    // event mintedNft(
    //     uint256 id,
    //     string nftUrl,
    //     string jsonUrl,
    //     address to,
    //     bytes32 msgId
    // );

    // mapping(string => EnumerableSet.UintSet) private _nftTokens;
    // mapping(uint256 => string) public tokenNft;

    // function mint(
    //     address to,
    //     uint256 tokenId,
    //     string calldata nftUrl,
    //     string calldata jsonUrl
    // ) external returns (uint256) {
    //     require(msg.sender == address(bridgeContract()));
    //     require(
    //         bridgeContract().messageSender() == mediatorContractOnOtherSide()
    //     );

    //     _nftTokens[nftUrl].add(tokenId);
    //     tokenNft[tokenId] = nftUrl;
    //     _safeMint(to, tokenId);
    //     _setTokenURI(tokenId, jsonUrl);
    //     bytes32 msgId = messageId();

    //     emit mintedNft(tokenId, nftUrl, jsonUrl, to, msgId);

    //     return tokenId;
    // }

    // function nftTokenCount(string memory _nftUrl)
    //     public
    //     view
    //     returns (uint256)
    // {
    //     uint256 _nftTokenCount = _nftTokens[_nftUrl].length();
    //     return _nftTokenCount;
    // }

    // function nftTokenByIndex(string memory nftUrl, uint256 index)
    //     public
    //     view
    //     returns (uint256)
    // {
    //     return _nftTokens[nftUrl].at(index);
    // }
}

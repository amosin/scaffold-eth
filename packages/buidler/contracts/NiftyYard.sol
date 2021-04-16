pragma solidity >=0.6.0 <0.7.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SignatureChecker.sol";
import "./INiftyYardToken.sol";
import "./INiftyYardRegistry.sol";
import "./common/NativeMetaTransaction.sol";
import "./common/ContextMixin.sol";

contract NiftyYard is
    Ownable,
    SignatureChecker,
    NativeMetaTransaction,
    ContextMixin
{
    constructor() public {
        setCheckSignatureFlag(true);
        setCreatorTake(1);
    }

    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.UintSet;

    Counters.Counter public totalNfts;

    uint256 public creatorTake;

    function setCreatorTake(uint256 _take) public onlyOwner {
        require(_take < 100, "take is more than 99 percent");
        creatorTake = _take;
    }

    address public niftyRegistry;

    function setNiftyRegistry(address _address) public onlyOwner {
        niftyRegistry = _address;
    }

    function niftyToken() private view returns (INiftyYardToken) {
        return
            INiftyYardToken(INiftyYardRegistry(niftyRegistry).tokenAddress());
    }

    event newFile(
        uint256 id,
        address indexed creator,
        string fileUrl,
        string jsonUrl,
        uint256 limit
    );
    event newFilePrice(string fileUrl, uint256 price);

    event ownershipChange(
        string fileUrl,
        address indexed creator,
        address indexed newCreator
    );

    struct File {
        uint256 id;
        address payable creator;
        string jsonUrl;
        string fileUrl;
        uint256 limit;
        bytes signature;
        uint256 price;
        Counters.Counter priceNonce;
    }

    mapping(string => uint256) public nftIdByNftUrl;
    mapping(uint256 => File) private _nftById;
    mapping(address => EnumerableSet.UintSet) private _creatorNfts;

    function _createNft(
        string memory fileUrl,
        string memory jsonUrl,
        uint256 limit,
        address payable creator
    ) internal returns (uint256) {
        totalNfts.increment();
        uint256 _nftId = totalNfts.current();

        File storage _nft = _nftById[_nftId];

        _nft.id = _nftId;
        _nft.creator = creator;
        _nft.fileUrl = fileUrl;
        _nft.jsonUrl = jsonUrl;
        _nft.limit = limit;

        nftIdByNftUrl[fileUrl] = _nftId;
        _creatorNfts[creator].add(_nftId);

        emit newFile(
            _nft.id,
            _nft.creator,
            _nft.fileUrl,
            _nft.jsonUrl,
            _nft.limit
        );

        return _nft.id;
    }

    function createNft(
        string memory fileUrl,
        string memory jsonUrl,
        uint256 limit
    ) public returns (uint256) {
        require(!(nftIdByNftUrl[fileUrl] > 0), "this nft already exists!");

        uint256 nftId = _createNft(fileUrl, jsonUrl, limit, _msgSender());

        niftyToken().firstMint(_msgSender(), fileUrl, jsonUrl);

        return nftId;
    }

    function createNftFromSignature(
        string memory fileUrl,
        string memory jsonUrl,
        uint256 limit,
        address payable creator,
        bytes memory signature
    ) public returns (uint256) {
        require(!(nftIdByNftUrl[fileUrl] > 0), "this nft already exists!");

        require(creator != address(0), "Creator must be specified.");
        bytes32 messageHash =
            keccak256(
                abi.encodePacked(
                    bytes1(0x19),
                    bytes1(0),
                    address(this),
                    creator,
                    fileUrl,
                    jsonUrl,
                    limit
                )
            );
        bool isCreatorSignature =
            checkSignature(messageHash, signature, creator);
        require(
            isCreatorSignature || !checkSignatureFlag,
            "Creator did not sign this nft"
        );

        uint256 nftId = _createNft(fileUrl, jsonUrl, limit, creator);

        _nftById[nftId].signature = signature;

        niftyToken().firstMint(creator, fileUrl, jsonUrl);

        return nftId;
    }

    function _setPrice(uint256 _nftId, uint256 price)
        private
        returns (uint256)
    {
        _nftById[_nftId].price = price;
        _nftById[_nftId].priceNonce.increment();
        emit newFilePrice(_nftById[_nftId].fileUrl, price);
        return price;
    }

    function setPrice(string memory fileUrl, uint256 price)
        public
        returns (uint256)
    {
        uint256 _nftId = nftIdByNftUrl[fileUrl];
        require(_nftId > 0, "this nft does not exist!");
        File storage _nft = _nftById[_nftId];
        require(
            _nft.creator == _msgSender(),
            "only the creator can set the price!"
        );

        return _setPrice(_nft.id, price);
    }

    function setPriceFromSignature(
        string memory fileUrl,
        uint256 price,
        bytes memory signature
    ) public returns (uint256) {
        uint256 _nftId = nftIdByNftUrl[fileUrl];
        require(_nftId > 0, "this nft does not exist!");
        File storage _nft = _nftById[_nftId];
        bytes32 messageHash =
            keccak256(
                abi.encodePacked(
                    bytes1(0x19),
                    bytes1(0),
                    address(this),
                    fileUrl,
                    price,
                    _nft.priceNonce.current()
                )
            );
        bool isCreatorSignature =
            checkSignature(messageHash, signature, _nft.creator);
        require(
            isCreatorSignature || !checkSignatureFlag,
            "Creator did not sign this price"
        );

        return _setPrice(_nft.id, price);
    }

    function transferOwnership(
        string memory fileUrl,
        address creator,
        address payable newCreator,
        bytes memory signature
    ) public {
        uint256 _nftId = nftIdByNftUrl[fileUrl];
        require(_nftId > 0, "this nft does not exist!");
        bytes32 messageHash =
            keccak256(
                abi.encodePacked(
                    bytes1(0x19),
                    bytes1(0),
                    address(this),
                    creator,
                    fileUrl
                )
            );
        bool isCreatorSignature =
            checkSignature(messageHash, signature, creator);
        require(
            isCreatorSignature || !checkSignatureFlag,
            "Creator did not sign this nft"
        );
        File storage _file = _nftById[_nftId];
        _file.creator = newCreator;
        emit ownershipChange(fileUrl, creator, newCreator);
    }

    function nftInfoById(uint256 id)
        public
        view
        returns (
            uint256,
            address,
            string memory,
            bytes memory,
            uint256,
            uint256,
            string memory,
            uint256
        )
    {
        require(
            id > 0 && id <= totalNfts.current(),
            "this nft does not exist!"
        );
        File storage _nft = _nftById[id];

        return (
            id,
            _nft.creator,
            _nft.jsonUrl,
            _nft.signature,
            _nft.price,
            _nft.limit,
            _nft.fileUrl,
            _nft.priceNonce.current()
        );
    }

    function nftInfoByNftUrl(string memory fileUrl)
        public
        view
        returns (
            uint256,
            address,
            string memory,
            bytes memory,
            uint256,
            uint256,
            string memory,
            uint256
        )
    {
        uint256 _nftId = nftIdByNftUrl[fileUrl];

        return nftInfoById(_nftId);
    }

    function nftsCreatedBy(address creator) public view returns (uint256) {
        return _creatorNfts[creator].length();
    }

    function nftOfCreatorByIndex(address creator, uint256 index)
        public
        view
        returns (uint256)
    {
        return _creatorNfts[creator].at(index);
    }

    // This is to support Native meta transactions
    // never use msg.sender directly, use _msgSender() instead
    function _msgSender()
        internal
        view
        override
        returns (address payable sender)
    {
        return ContextMixin.msgSender();
    }
}

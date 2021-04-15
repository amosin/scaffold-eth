pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// MATIC SUPPORT FOR ROOT CHAIN
import "@openzeppelin/contracts/access/AccessControl.sol";
//
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
import "./INiftyRegistry.sol";
import "./INiftyInk.sol";
import "./SignatureChecker.sol";
// MATIC SUPPORT FOR ROOT CHAIN
import "./matic/NativeMetaTransaction.sol";
import "./matic/IMintableERC721.sol";
import "./matic/ContextMixin.sol";
import "./matic/AccessControlMixin.sol";

contract NiftyToken is
    BaseRelayRecipient,
    ERC721,
    SignatureChecker,
    AccessControlMixin,
    NativeMetaTransaction,
    ContextMixin
{
    // MATIC SUPPORT FOR ROOT CHAIN
    bytes32 public constant PREDICATE_ROLE = keccak256("PREDICATE_ROLE");

    // Fee reserve address.
    address payable public feereserveaddress;

    constructor(address payable _feeaddr) public ERC721("NFT YARD", "YARD721") {
        feereserveaddress = _feeaddr;
        _setBaseURI("ipfs://ipfs/");
        setCheckSignatureFlag(true);
        // MATIC SUPPORT FOR ROOT CHAIN
        _setupContractId("NftYard");
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(PREDICATE_ROLE, _msgSender());
        _initializeEIP712("NFT YARD");
    }

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    using SafeMath for uint256;

    // Add fee for the Marketplace transfers
    uint128 public marketFee = 200; // initial 2% fee in basis points (parts per 10,000)

    // Update fee address by the previous fee addr.
    function updateFeeaddr(address payable _feeaddr) public {
        require(msg.sender == feereserveaddress, "dev: wut?");
        feereserveaddress = _feeaddr;
    }

    function setMarketFee(uint128 _value) public onlyOwner {
        marketFee = _value;
    }

    function calculateFee(uint256 _value) public view returns (uint256) {
        require((_value.mul(marketFee) >= 10000), "_value too small");
        return _value.mul(marketFee).div(10000);
    }

    address public niftyRegistry;

    function setNiftyRegistry(address _address) public onlyOwner {
        niftyRegistry = _address;
    }

    function niftyInk() private view returns (INiftyInk) {
        return INiftyInk(INiftyRegistry(niftyRegistry).inkAddress());
    }

    event mintedInk(uint256 id, string inkUrl, address to);
    event boughtInk(uint256 id, string inkUrl, address buyer, uint256 price);
    event boughtToken(uint256 id, string inkUrl, address buyer, uint256 price);
    event lockedInk(uint256 id, address recipient);
    event unlockedInk(uint256 id, address recipient);
    event newTokenPrice(uint256 id, uint256 price);

    mapping(string => EnumerableSet.UintSet) private _inkTokens;
    mapping(uint256 => string) public tokenInk;
    mapping(address => EnumerableSet.UintSet) private _addressTokens;
    mapping(uint256 => uint256) public tokenPrice;

    function inkTokenCount(string memory _inkUrl)
        public
        view
        returns (uint256)
    {
        uint256 _inkTokenCount = _inkTokens[_inkUrl].length();
        return _inkTokenCount;
    }

    function doesAddressOwnCopyOfThisFile(
        address _address,
        string memory inkUrl
    ) public returns (bool) {
        for (uint256 i = 0; i < _addressTokens[_address].length(); i++) {
            uint256 id = _addressTokens[_address].at(i);
            if (keccak256(bytes(tokenInk[id])) == keccak256(bytes(inkUrl))) {
                return true;
            }
        }
        return false;
    }

    function filesOfThisAddress(address _address)
        public
        returns (string[] memory)
    {
        uint256 len = _addressTokens[_address].length();
        string[] memory fileUrls = new string[](len);
        for (uint256 i = 0; i < len; i++) {
            fileUrls[i] = tokenInk[_addressTokens[_address].at(i)];
        }
        return fileUrls;
    }

    function _mintInkToken(
        address to,
        string memory inkUrl,
        string memory jsonUrl
    ) internal returns (uint256) {
        _tokenIds.increment();
        uint256 id = _tokenIds.current();
        _inkTokens[inkUrl].add(id);
        tokenInk[id] = inkUrl;
        _addressTokens[to].add(id);
        _mint(to, id);
        _setTokenURI(id, jsonUrl);

        emit mintedInk(id, inkUrl, to);

        return id;
    }

    function firstMint(
        address to,
        string calldata inkUrl,
        string calldata jsonUrl
    ) external returns (uint256) {
        require(_msgSender() == INiftyRegistry(niftyRegistry).inkAddress());
        _mintInkToken(to, inkUrl, jsonUrl);
    }

    function mint(address to, string memory _inkUrl)
        public
        override
        only(PREDICATE_ROLE)
        returns (uint256)
    {
        uint256 _inkId = niftyInk().inkIdByInkUrl(_inkUrl);
        require(_inkId > 0, "this ink does not exist!");
        (, address _artist, string memory _jsonUrl, , , uint256 _limit, ) =
            niftyInk().inkInfoById(_inkId);

        require(_artist == _msgSender(), "only the artist can mint!");

        require(
            inkTokenCount(_inkUrl) < _limit || _limit == 0,
            "this ink is over the limit!"
        );

        uint256 tokenId = _mintInkToken(to, _inkUrl, _jsonUrl);

        return tokenId;
    }

    function mintFromSignature(
        address to,
        string memory _inkUrl,
        bytes memory signature
    ) public returns (uint256) {
        uint256 _inkId = niftyInk().inkIdByInkUrl(_inkUrl);
        require(_inkId > 0, "this ink does not exist!");

        uint256 _count = inkTokenCount(_inkUrl);
        (, address _artist, string memory _jsonUrl, , , uint256 _limit, ) =
            niftyInk().inkInfoById(_inkId);
        require(_count < _limit || _limit == 0, "this ink is over the limit!");

        bytes32 messageHash =
            keccak256(
                abi.encodePacked(
                    bytes1(0x19),
                    bytes1(0),
                    address(this),
                    to,
                    _inkUrl,
                    _count
                )
            );
        bool isArtistSignature =
            checkSignature(messageHash, signature, _artist);
        require(
            isArtistSignature || !checkSignatureFlag,
            "only the artist can mint!"
        );

        uint256 tokenId = _mintInkToken(to, _inkUrl, _jsonUrl);

        return tokenId;
    }

    function lock(uint256 _tokenId) external {
        address _bridgeMediatorAddress =
            INiftyRegistry(niftyRegistry).bridgeMediatorAddress();
        require(
            _bridgeMediatorAddress == _msgSender(),
            "only the bridgeMediator can lock"
        );
        address from = ownerOf(_tokenId);
        _transfer(from, _msgSender(), _tokenId);
    }

    function unlock(uint256 _tokenId, address _recipient) external {
        require(
            _msgSender() ==
                INiftyRegistry(niftyRegistry).bridgeMediatorAddress(),
            "only the bridgeMediator can unlock"
        );
        require(
            _msgSender() == ownerOf(_tokenId),
            "the bridgeMediator does not hold this token"
        );
        safeTransferFrom(_msgSender(), _recipient, _tokenId);
    }

    function buyInk(string memory _inkUrl) public payable returns (uint256) {
        uint256 _inkId = niftyInk().inkIdByInkUrl(_inkUrl);
        require(_inkId > 0, "this ink does not exist!");
        (
            ,
            address payable _artist,
            string memory _jsonUrl,
            ,
            uint256 _price,
            uint256 _limit,

        ) = niftyInk().inkInfoById(_inkId);
        require(
            inkTokenCount(_inkUrl) < _limit || _limit == 0,
            "this ink is over the limit!"
        );
        require(_price > 0, "this ink does not have a price set");
        require(msg.value >= _price, "Amount sent too small");
        address _buyer = _msgSender();
        uint256 _tokenId = _mintInkToken(_buyer, _inkUrl, _jsonUrl);
        //Note: a pull mechanism would be safer here: https://docs.openzeppelin.com/contracts/2.x/api/payment#PullPayment

        // calculate fees
        uint256 fees = calculateFee(msg.value);

        // pay seller minus fees
        _artist.transfer(msg.value.sub(fees));
        // send fee to feereserveaddress feeaddr
        feereserveaddress.transfer(fees);
        emit boughtInk(_tokenId, _inkUrl, _buyer, msg.value);
        return _tokenId;
    }

    function setTokenPrice(uint256 _tokenId, uint256 _price)
        public
        returns (uint256)
    {
        require(_exists(_tokenId), "this token does not exist!");
        require(
            ownerOf(_tokenId) == _msgSender(),
            "only the owner can set the price!"
        );

        tokenPrice[_tokenId] = _price;
        emit newTokenPrice(_tokenId, _price);
        return _price;
    }

    function buyToken(uint256 _tokenId) public payable {
        uint256 _price = tokenPrice[_tokenId];
        require(_price > 0, "this token is not for sale");
        require(msg.value >= _price, "Amount sent too small");
        address _buyer = _msgSender();
        address payable _seller = address(uint160(ownerOf(_tokenId)));
        _transfer(_seller, _buyer, _tokenId);
        //Note: a pull mechanism would be safer here: https://docs.openzeppelin.com/contracts/2.x/api/payment#PullPayment

        uint256 _artistTake = niftyInk().artistTake().mul(msg.value).div(100);
        uint256 _sellerTake = msg.value.sub(_artistTake);
        string memory _inkUrl = tokenInk[_tokenId];

        (, address payable _artist, , , , , ) =
            niftyInk().inkInfoByInkUrl(_inkUrl);

        _artist.transfer(_artistTake);

        _seller.transfer(_sellerTake);

        emit boughtInk(_tokenId, _inkUrl, _buyer, msg.value);
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721) {
        _addressTokens[from].remove(tokenId);
        _addressTokens[to].add(tokenId);
        ERC721._transfer(from, to, tokenId);
    }

    function transferOwnership(
        address from,
        address to,
        uint256 tokenId
    ) public {
        ERC721._transfer(from, to, tokenId);
    }

    function inkTokenByIndex(string memory inkUrl, uint256 index)
        public
        view
        returns (uint256)
    {
        return _inkTokens[inkUrl].at(index);
    }

    function versionRecipient()
        external
        view
        virtual
        override
        returns (string memory)
    {
        return "1.0";
    }

    function setTrustedForwarder(address _trustedForwarder) public onlyOwner {
        trustedForwarder = _trustedForwarder;
    }

    function getTrustedForwarder() public view returns (address) {
        return trustedForwarder;
    }

    function _msgSender()
        internal
        view
        override
        returns (address payable sender)
    {
        return ContextMixin.msgSender();
    }

    /**
     * @dev See {IMintableERC721-exists}.
     */
    function exists(uint256 tokenId) external view override returns (bool) {
        return _exists(tokenId);
    }
}
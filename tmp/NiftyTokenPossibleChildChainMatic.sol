pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

// NiftyTokenForMaticChildChain

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// MATIC SUPPORT FOR CHILD CHAIN
import "@openzeppelin/contracts/access/AccessControl.sol";
//
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";
import "./INiftyRegistry.sol";
import "./INiftyInk.sol";
import "./SignatureChecker.sol";
// MATIC SUPPORT FOR CHILD CHAIN
import "./matic/NativeMetaTransaction.sol";
import "./matic/IMintableERC721.sol";
import "./matic/ContextMixin.sol";
import "./matic/AccessControlMixin.sol";
import "./matic/IChildToken.sol";

contract NiftyToken is
    BaseRelayRecipient,
    ERC721,
    IChildToken,
    SignatureChecker,
    AccessControlMixin,
    NativeMetaTransaction,
    ContextMixin
{
    // MATIC SUPPORT FOR CHILD CHAIN

    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");
    mapping(uint256 => bool) public withdrawnTokens;
    // limit batching of tokens due to gas limit restrictions (MATIC)
    uint256 public constant BATCH_LIMIT = 20;

    event WithdrawnBatch(address indexed user, uint256[] tokenIds);
    event TransferWithMetadata(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId,
        bytes metaData
    );

    // Fee reserve address.
    address payable public feereserveaddress;

    constructor(address payable _feeaddr, address childChainManager)
        public
        ERC721("ATIVO NFT Test1", "ANFT")
    {
        feereserveaddress = _feeaddr;
        _setBaseURI("ipfs://ipfs/");
        setCheckSignatureFlag(true);
        // MATIC SUPPORT FOR ROOT CHAIN
        _setupContractId("NftYard");
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(DEPOSITOR_ROLE, childChainManager);
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
        only(DEFAULT_ADMIN_ROLE)
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

    // MATIC CHILD CHAIN CHANGES

    /**
     * @notice called when token is deposited on root chain
     * @dev Should be callable only by ChildChainManager
     * Should handle deposit by minting the required tokenId(s) for user
     * Should set `withdrawnTokens` mapping to `false` for the tokenId being deposited
     * Minting can also be done by other functions
     * @param user user address for whom deposit is being done
     * @param depositData abi encoded tokenIds. Batch deposit also supported.
     */
    function deposit(address user, bytes calldata depositData)
        external
        override
        only(DEPOSITOR_ROLE)
    {
        // deposit single
        if (depositData.length == 32) {
            uint256 tokenId = abi.decode(depositData, (uint256));
            withdrawnTokens[tokenId] = false;
            _mint(user, tokenId);

            // deposit batch
        } else {
            uint256[] memory tokenIds = abi.decode(depositData, (uint256[]));
            uint256 length = tokenIds.length;
            for (uint256 i; i < length; i++) {
                withdrawnTokens[tokenIds[i]] = false;
                _mint(user, tokenIds[i]);
            }
        }
    }

    /**
     * @notice called when user wants to withdraw token back to root chain
     * @dev Should handle withraw by burning user's token.
     * Should set `withdrawnTokens` mapping to `true` for the tokenId being withdrawn
     * This transaction will be verified when exiting on root chain
     * @param tokenId tokenId to withdraw
     */
    function withdraw(uint256 tokenId) external {
        require(
            _msgSender() == ownerOf(tokenId),
            "ChildMintableERC721: INVALID_TOKEN_OWNER"
        );
        withdrawnTokens[tokenId] = true;
        _burn(tokenId);
    }

    /**
     * @notice called when user wants to withdraw multiple tokens back to root chain
     * @dev Should burn user's tokens. This transaction will be verified when exiting on root chain
     * @param tokenIds tokenId list to withdraw
     */
    function withdrawBatch(uint256[] calldata tokenIds) external {
        uint256 length = tokenIds.length;
        require(
            length <= BATCH_LIMIT,
            "ChildMintableERC721: EXCEEDS_BATCH_LIMIT"
        );

        // Iteratively burn ERC721 tokens, for performing
        // batch withdraw
        for (uint256 i; i < length; i++) {
            uint256 tokenId = tokenIds[i];

            require(
                _msgSender() == ownerOf(tokenId),
                string(
                    abi.encodePacked(
                        "ChildMintableERC721: INVALID_TOKEN_OWNER ",
                        tokenId
                    )
                )
            );
            withdrawnTokens[tokenId] = true;
            _burn(tokenId);
        }

        // At last emit this event, which will be used
        // in MintableERC721 predicate contract on L1
        // while verifying burn proof
        emit WithdrawnBatch(_msgSender(), tokenIds);
    }

    /**
     * @notice called when user wants to withdraw token back to root chain with token URI
     * @dev Should handle withraw by burning user's token.
     * Should set `withdrawnTokens` mapping to `true` for the tokenId being withdrawn
     * This transaction will be verified when exiting on root chain
     *
     * @param tokenId tokenId to withdraw
     */
    function withdrawWithMetadata(uint256 tokenId) external {
        require(
            _msgSender() == ownerOf(tokenId),
            "ChildMintableERC721: INVALID_TOKEN_OWNER"
        );
        withdrawnTokens[tokenId] = true;

        // Encoding metadata associated with tokenId & emitting event
        emit TransferWithMetadata(
            ownerOf(tokenId),
            address(0),
            tokenId,
            this.encodeTokenMetadata(tokenId)
        );

        _burn(tokenId);
    }

    /**
     * @notice This method is supposed to be called by client when withdrawing token with metadata
     * and pass return value of this function as second paramter of `withdrawWithMetadata` method
     *
     * It can be overridden by clients to encode data in a different form, which needs to
     * be decoded back by them correctly during exiting
     *
     * @param tokenId Token for which URI to be fetched
     */
    function encodeTokenMetadata(uint256 tokenId)
        external
        view
        virtual
        returns (bytes memory)
    {
        // You're always free to change this default implementation
        // and pack more data in byte array which can be decoded back
        // in L1
        return abi.encode(tokenURI(tokenId));
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

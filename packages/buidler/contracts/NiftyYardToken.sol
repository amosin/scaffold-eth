pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "./INiftyYardRegistry.sol";
import "./INiftyYard.sol";
import "./SignatureChecker.sol";

// MATIC SUPPORT FOR CHILD CHAIN
import "./common/IMintableERC721.sol";
import "./common/AccessControlMixin.sol";
import "./common/IChildToken.sol";
import "./common/NativeMetaTransaction.sol";
import "./common/ContextMixin.sol";

contract NiftyYardToken is
    ERC721Burnable,
    SignatureChecker,
    AccessControlMixin,
    IChildToken,
    NativeMetaTransaction,
    ContextMixin
{
    // Fee reserve address.
    address payable public feereserveaddress;

    //Matic
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

    constructor(address payable _feeaddr, address childChainManager)
        public
        ERC721("NFT Yard v1", "YARDv1")
    {
        feereserveaddress = _feeaddr;
        _setBaseURI("ipfs://ipfs/");
        setCheckSignatureFlag(true);
        // MATIC SUPPORT FOR ROOT CHAIN
        _setupContractId("NFT Yard v1");
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(DEPOSITOR_ROLE, childChainManager);
        _initializeEIP712("NFT Yard v1");
    }

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    using SafeMath for uint256;

    // Add fee for the Marketplace transfers
    uint128 public marketFee = 200; // initial 2% fee in basis points (parts per 10,000)

    // Update fee address by the previous fee addr.
    function updateFeeaddr(address payable _feeaddr) public onlyOwner {
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

    function niftyYard() private view returns (INiftyYard) {
        return INiftyYard(INiftyYardRegistry(niftyRegistry).nftAddress());
    }

    event mintedNft(uint256 id, string nftUrl, address to);
    event burnedToken(uint256 id, string nftUrl, address to);
    event boughtNft(uint256 id, string nftUrl, address buyer, uint256 price);
    event boughtToken(uint256 id, string nftUrl, address buyer, uint256 price);
    event lockedNft(uint256 id, address recipient);
    event unlockedNft(uint256 id, address recipient);
    event newTokenPrice(uint256 id, uint256 price);

    mapping(string => EnumerableSet.UintSet) private _nftTokens;
    mapping(uint256 => string) public tokenNft;
    mapping(address => EnumerableSet.UintSet) private _addressTokens;
    mapping(uint256 => uint256) public tokenPrice;

    function nftTokenCount(string memory _nftUrl)
        public
        view
        returns (uint256)
    {
        uint256 _nftTokenCount = _nftTokens[_nftUrl].length();
        return _nftTokenCount;
    }

    function doesAddressOwnCopyOfThisFile(
        address _address,
        string memory nftUrl
    ) public view returns (bool) {
        for (uint256 i = 0; i < _addressTokens[_address].length(); i++) {
            uint256 id = _addressTokens[_address].at(i);
            if (keccak256(bytes(tokenNft[id])) == keccak256(bytes(nftUrl))) {
                return true;
            }
        }
        return false;
    }

    function filesOfThisAddress(address _address)
        public
        view
        returns (string[] memory)
    {
        uint256 len = _addressTokens[_address].length();
        string[] memory fileUrls = new string[](len);
        for (uint256 i = 0; i < len; i++) {
            fileUrls[i] = tokenNft[_addressTokens[_address].at(i)];
        }
        return fileUrls;
    }

    function _mintNftToken(
        address to,
        string memory nftUrl,
        string memory jsonUrl
    ) internal returns (uint256) {
        _tokenIds.increment();
        uint256 id = _tokenIds.current();
        _nftTokens[nftUrl].add(id);
        tokenNft[id] = nftUrl;
        _addressTokens[to].add(id);
        _mint(to, id);
        _setTokenURI(id, jsonUrl);

        emit mintedNft(id, nftUrl, to);

        return id;
    }

    function firstMint(
        address to,
        string calldata nftUrl,
        string calldata jsonUrl
    ) external returns (uint256) {
        require(_msgSender() == INiftyYardRegistry(niftyRegistry).nftAddress());
        _mintNftToken(to, nftUrl, jsonUrl);
    }

    function mint(address to, string memory _nftUrl) public returns (uint256) {
        uint256 _nftId = niftyYard().nftIdByNftUrl(_nftUrl);
        require(_nftId > 0, "this nft does not exist!");
        (, address _creator, string memory _jsonUrl, , , uint256 _limit, ) =
            niftyYard().nftInfoById(_nftId);

        require(_creator == _msgSender(), "only the creator can mint!");

        require(
            nftTokenCount(_nftUrl) < _limit || _limit == 0,
            "this nft is over the limit!"
        );

        uint256 tokenId = _mintNftToken(to, _nftUrl, _jsonUrl);

        return tokenId;
    }

    function mintFromSignature(
        address to,
        string memory _nftUrl,
        bytes memory signature
    ) public returns (uint256) {
        uint256 _nftId = niftyYard().nftIdByNftUrl(_nftUrl);
        require(_nftId > 0, "this nft does not exist!");

        uint256 _count = nftTokenCount(_nftUrl);
        (, address _creator, string memory _jsonUrl, , , uint256 _limit, ) =
            niftyYard().nftInfoById(_nftId);
        require(_count < _limit || _limit == 0, "this nft is over the limit!");

        bytes32 messageHash =
            keccak256(
                abi.encodePacked(
                    bytes1(0x19),
                    bytes1(0),
                    address(this),
                    to,
                    _nftUrl,
                    _count
                )
            );
        bool isCreatorSignature =
            checkSignature(messageHash, signature, _creator);
        require(
            isCreatorSignature || !checkSignatureFlag,
            "only the creator can mint!"
        );

        uint256 tokenId = _mintNftToken(to, _nftUrl, _jsonUrl);

        return tokenId;
    }

    function lock(uint256 _tokenId) external {
        address _bridgeMediatorAddress =
            INiftyYardRegistry(niftyRegistry).bridgeMediatorAddress();
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
                INiftyYardRegistry(niftyRegistry).bridgeMediatorAddress(),
            "only the bridgeMediator can unlock"
        );
        require(
            _msgSender() == ownerOf(_tokenId),
            "the bridgeMediator does not hold this token"
        );
        safeTransferFrom(_msgSender(), _recipient, _tokenId);
    }

    function buyNft(string memory _nftUrl) public payable returns (uint256) {
        uint256 _nftId = niftyYard().nftIdByNftUrl(_nftUrl);
        require(_nftId > 0, "this nft does not exist!");
        (
            ,
            address payable _creator,
            string memory _jsonUrl,
            ,
            uint256 _price,
            uint256 _limit,

        ) = niftyYard().nftInfoById(_nftId);
        require(
            nftTokenCount(_nftUrl) < _limit || _limit == 0,
            "this nft is over the limit!"
        );
        require(_price > 0, "this nft does not have a price set");
        require(msg.value >= _price, "Amount sent too small");
        address _buyer = _msgSender();
        uint256 _tokenId = _mintNftToken(_buyer, _nftUrl, _jsonUrl);
        //Note: a pull mechanism would be safer here: https://docs.openzeppelin.com/contracts/2.x/api/payment#PullPayment

        // calculate fees
        uint256 fees = calculateFee(msg.value);

        // pay seller minus fees
        _creator.transfer(msg.value.sub(fees));
        // send fee to feereserveaddress feeaddr
        feereserveaddress.transfer(fees);
        emit boughtNft(_tokenId, _nftUrl, _buyer, msg.value);
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

        uint256 _creatorTake =
            niftyYard().creatorTake().mul(msg.value).div(100);
        uint256 _sellerTake = msg.value.sub(_creatorTake);
        string memory _nftUrl = tokenNft[_tokenId];

        (, address payable _creator, , , , , ) =
            niftyYard().nftInfoByNftUrl(_nftUrl);

        _creator.transfer(_creatorTake);

        _seller.transfer(_sellerTake);

        emit boughtNft(_tokenId, _nftUrl, _buyer, msg.value);
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

    function nftTokenByIndex(string memory nftUrl, uint256 index)
        public
        view
        returns (uint256)
    {
        return _nftTokens[nftUrl].at(index);
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

    /**
     * As another option for supporting trading without requiring meta transactions, override isApprovedForAll to whitelist OpenSea proxy accounts on Matic
     */
    function isApprovedForAll(address _owner, address _operator)
        public
        view
        override
        returns (bool isOperator)
    {
        if (_operator == address(0x58807baD0B376efc12F5AD86aAc70E78ed67deaE)) {
            return true;
        }

        return ERC721.isApprovedForAll(_owner, _operator);
    }

    function burnToken(uint256 _tokenId, string memory _nftUrl) public {
        require(
            _msgSender() == ownerOf(_tokenId),
            "NFTYard: INVALID_TOKEN_OWNER"
        );
        burn(_tokenId);
        emit burnedToken(_tokenId, _nftUrl, _msgSender());
    }

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

    function contractURI() public view returns (string memory) {
        return "https://nftyard.io/metadata/nftyard_v1";
    }
}

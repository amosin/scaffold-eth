import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { ethers } from "ethers";
import {
  Row,
  Popover,
  Button,
  List,
  Form,
  Typography,
  Spin,
  Space,
  Descriptions,
  notification,
} from "antd";
import { AddressInput, Address } from "./components";
import {
  SendOutlined,
  QuestionCircleOutlined,
  RocketOutlined,
  SyncOutlined,
  LinkOutlined,
  FireOutlined
} from "@ant-design/icons";
import { useContractLoader } from "./hooks";
import {
  getFromIPFS,
  transactionHandler,
} from "./helpers";
import SendNftForm from "./SendNftForm.js";
import BurnTokenForm from "./BurnTokenForm.js";
import LikeButton from "./LikeButton.js";
import NiftyShop from "./NiftyShop.js";
import UpgradeNftButton from "./UpgradeNftButton.js";
import { useQuery } from "react-apollo";
import { NFT_QUERY, NFT_MAIN_QUERY } from "./apollo/queries";
import ApolloClient, { InMemoryCache } from "apollo-boost";

const mainClient = new ApolloClient({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT_MAINNET,
  cache: new InMemoryCache(),
});

export default function ViewNft(props) {
  let { hash } = useParams();

  const drawingCanvas = useRef(null);
  const [canvasKey, setCanvasKey] = useState(Date.now());
  const [size, setSize] = useState([
    0.8 * props.calculatedVmin,
    0.8 * props.calculatedVmin,
  ]); //["70vmin", "70vmin"]) //["50vmin", "50vmin"][750, 500]
  const [drawingSize, setDrawingSize] = useState(0);

  const [holders, setHolders] = useState(<Spin />);
  const [minting, setMinting] = useState(false);
  const [buying, setBuying] = useState(false);
  const [mintForm] = Form.useForm();
  const [priceForm] = Form.useForm();
  const [buyButton, setBuyButton] = useState();
  const [mintFlow, setMintFlow] = useState();

  const metaWriteContracts = useContractLoader(
    props.metaProvider ? props.metaProvider : props.kovanProvider
  );

  //  const [nftChainInfo, setNftChainInfo] = useState()
  const [targetId, setTargetId] = useState();
  //  const [nftPrice, setNftPrice] = useState(0)
  //const [mintedCount, setMintedCount] = useState()

  const [nftJson, setNftJson] = useState({});
  const [mainnetTokens, setMainnetTokens] = useState({});
  const [blockNumber, setBlockNumber] = useState(0);
  const [data, setData] = useState();

  const [drawing, setDrawing] = useState();

  // const { loading: loadingMain, error: errorMain, data: dataMain } = useQuery(
  //   NFT_MAIN_QUERY,
  //   {
  //     variables: { nftUrl: hash },
  //     pollInterval: 600,
  //     client: mainClient,
  //   }
  // );
  const dataMain = '';

  const { loading, error, data: dataRaw } = useQuery(NFT_QUERY, {
    variables: { nftUrl: hash },
    pollInterval: 2500,
  });

  useEffect(() => {
    const getNft = async (_data) => {
      let _blockNumber = parseInt(_data.metaData.value);
      console.log(blockNumber, _blockNumber);
      if (_blockNumber >= blockNumber) {
        let tIpfsConfig = { ...props.ipfsConfig };
        tIpfsConfig["timeout"] = 10000;
        let newNftJson = await getFromIPFS(_data.nft.jsonUrl, tIpfsConfig);

        setData(_data);
        setBlockNumber(_blockNumber);
        setNftJson(JSON.parse(newNftJson));
      }
    };

    dataRaw && dataRaw.nft ? getNft(dataRaw) : console.log("loading");
  }, [dataRaw, props.address]);

  useEffect(() => {
    if (
      props.address &&
      data &&
      data.nft &&
      props.address.toLowerCase() === data.nft.creator.id &&
      (parseInt(data.nft.count) < parseInt(data.nft.limit) ||
        data.nft.limit === "0")
    ) {
      const mintNftForm = (
        <Row style={{ justifyContent: "center" }}>
          <Form
            form={mintForm}
            layout={"inline"}
            name="mintNft"
            onFinish={mint}
            onFinishFailed={onFinishFailed}
          >
            <Form.Item
              name="to"
              rules={[
                {
                  required: true,
                  message: "Which address should receive this artwork?",
                },
              ]}
            >
              <AddressInput
                ensProvider={props.mainnetProvider}
                placeholder={"to address"}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={minting}>
                Mint
              </Button>
            </Form.Item>
          </Form>
        </Row>
      );
      setMintFlow(
        <Popover content={mintNftForm} title="Mint">
          <Button type="secondary">
            <SendOutlined /> Mint
          </Button>
        </Popover>
      );
    }
    data && data.nft
      ? setBuyButton(
          <NiftyShop
            injectedProvider={props.injectedProvider}
            metaProvider={props.metaProvider}
            type={"nft"}
            nft={nftJson}
            itemForSale={hash}
            gasPrice={props.gasPrice}
            address={props.address ? props.address.toLowerCase() : null}
            ownerAddress={data.nft.creator.id}
            priceNonce={data.nft.mintPriceNonce ? data.nft.mintPriceNonce : "0"}
            price={data.nft.mintPrice}
            transactionConfig={props.transactionConfig}
            visible={
              data.nft.count
                ? parseInt(data.nft.count) < parseInt(data.nft.limit) ||
                  data.nft.limit === "0"
                : false
            }
          />
        )
      : console.log("waiting");
  }, [data, props.address, nftJson]);

  useEffect(() => {
    console.log("running dataMain", dataMain);
    if (dataMain) {
      let tempMainnetTokens = {};
      for (let i of dataMain.tokens) {
        console.log(i);
        tempMainnetTokens[i["id"]] = i["owner"];
      }

      setMainnetTokens(tempMainnetTokens);
    }
  }, [dataMain]);

  let mintDescription;
  let nftChainInfoDisplay;
  let detailContent;
  let likeButtonDisplay;
  let detailsDisplay;
  let nextHolders;

  const mint = async (values) => {
    setMinting(true);

    let contractName = "NiftyYardToken";
    let regularFunction = "mint";
    let regularFunctionArgs = [values["to"], hash];
    let signatureFunction = "mintFromSignature";
    let signatureFunctionArgs = [values["to"], hash];
    let getSignatureTypes = [
      "bytes",
      "bytes",
      "address",
      "address",
      "string",
      "uint256",
    ];
    let getSignatureArgs = [
      "0x19",
      "0x0",
      metaWriteContracts["NiftyYardToken"].address,
      values["to"],
      hash,
      parseInt(data.nft.count),
    ];
    
    const gasPrice = props.gasPrice;

    let mintNftConfig = {
      ...props.transactionConfig,
      contractName,
      regularFunction,
      regularFunctionArgs,
      signatureFunction,
      signatureFunctionArgs,
      getSignatureTypes,
      getSignatureArgs,
      gasPrice,
    };

    console.log(mintNftConfig);

    const bytecode = await props.transactionConfig.localProvider.getCode(
      values["to"]
    );
    const mainnetBytecode = await props.mainnetProvider.getCode(values["to"]);
    let result;
    if (
      (!bytecode ||
        bytecode === "0x" ||
        bytecode === "0x0" ||
        bytecode === "0x00") &&
      (!mainnetBytecode ||
        mainnetBytecode === "0x" ||
        mainnetBytecode === "0x0" ||
        mainnetBytecode === "0x00")
    ) {
      result = await transactionHandler(mintNftConfig);
      notification.open({
        message: "🙌 Minting successful!",
        description: "👀 Minted to " + values["to"],
      });
    } else {
      notification.open({
        message: "📛 Sorry! Unable to mint to this address",
        description: "This address is a smart contract 📡",
      });
    }

    mintForm.resetFields();
    setMinting(false);
    console.log("result", result);
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  const viewCreator = (address) => {
    props.setCreator(address);
    props.setTab("nfts");
  };

  if (!nftJson || !nftJson.name || !data) {
    nftChainInfoDisplay = (
      <div style={{ marginTop: 32 }}>
        <Spin />
      </div>
    );
  } else {
    const sendNftButton = (tokenOwnerAddress, tokenId) => {
      if (
        props.address &&
        tokenOwnerAddress.toLowerCase() === props.address.toLowerCase()
      ) {
        return (
          <Popover
            content={
              <SendNftForm
                tokenId={tokenId}
                address={props.address}
                mainnetProvider={props.mainnetProvider}
                injectedProvider={props.injectedProvider}
                transactionConfig={props.transactionConfig}
              />
            }
            title="Send Nft"
          >
            <Button type="secondary" style={{ margin: 4, marginBottom: 12 }}>
              <SendOutlined /> Send
            </Button>
          </Popover>
        );
      }
    };


    const burnToken = (tokenOwnerAddress, tokenId) => {
      if (
        props.address &&
        tokenOwnerAddress.toLowerCase() === props.address.toLowerCase()
      ) {
        return (
          <Popover
            content={
              <BurnTokenForm
                tokenId={tokenId}
                address={props.address}
                nftUrl={hash}
                mainnetProvider={props.mainnetProvider}
                injectedProvider={props.injectedProvider}
                transactionConfig={props.transactionConfig}
                gasPrice={props.gasPrice}
              />
            }
            title="Burn Token"
          >
            <Button type="danger" style={{ margin: 4, marginBottom: 12 }}>
              <FireOutlined /> Burn
            </Button>
          </Popover>
        );
      }
    };

    const relayTokenButton = (relayed, tokenOwnerAddress, tokenId) => {
      if (
        props.address &&
        tokenOwnerAddress.toLowerCase() === props.address.toLowerCase() &&
        relayed === false
      ) {
        return (
          <UpgradeNftButton
            tokenId={tokenId}
            injectedProvider={props.injectedProvider}
            gasPrice={props.gasPrice}
            upgradePrice={props.upgradePrice}
            transactionConfig={props.transactionConfig}
          />
        );
      }
    };

    

    if (data.nft && data.nft.limit === "0") {
      mintDescription = (data.nft.count ? data.nft.count : "0") + " minted";
    } else if (data.nft) {
      mintDescription =
        (data.nft.count ? data.nft.count : "0") +
        "/" +
        data.nft.limit +
        " created";
    }

    if (data && data.nft) {
      nextHolders = (
        <Row style={{ justifyContent: "center" }}>
          <List
            header={
              <Row
                style={{
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {" "}
                <Space>
                  <Typography.Title level={3} style={{ marginBottom: "0px" }}>
                    {mintDescription}
                  </Typography.Title>{" "}
                  {mintFlow}
                  {buyButton}
                </Space>
              </Row>
            }
            itemLayout="horizontal"
            dataSource={data.nft.tokens}
            renderItem={(item) => {
              const openseaButton = (
                <Button
                  type="primary"
                  style={{
                    margin: 8,
                    background: "#722ed1",
                    borderColor: "#722ed1",
                  }}
                  onClick={() => {
                    console.log("item", item);
                    window.open(
                      process.env.REACT_APP_NETWORK_OPENSEA +
                        item.id
                    );
                  }}
                >
                  <RocketOutlined /> View on OpenSea
                </Button>
              );
              //console.log(item.owner);
              return (
                <List.Item>
                  <Address
                    value={
                      mainnetTokens[item.id]
                        ? mainnetTokens[item.id]
                        : item.owner
                    }
                    ensProvider={props.mainnetProvider}
                  />
                  <a
                    style={{ padding: 8, fontSize: 32 }}
                    href={
                      process.env.REACT_APP_NETWORK_EXPLORER + "/tokens/" + process.env.REACT_APP_NETWORK_TOKENADDR + "/instance/" +
                      item.id + "/token-transfers"
                    }
                    target="_blank"
                  >
                    <LinkOutlined />
                  </a>
                  
                  {/* {mainnetTokens[item.id] ? (
                    openseaButton
                  ) : item.network === "mainnet" ? (
                    <Typography.Title level={4} style={{ marginLeft: 16 }}>
                      Upgrading to Ethereum <SyncOutlined spin />
                    </Typography.Title>
                  ) : (
                    <></>
                  )} */}

                  {item.id ? (
                    openseaButton
                  ) : item.network === "mainnet" ? (
                    <Typography.Title level={4} style={{ marginLeft: 16 }}>
                      Upgrading to Ethereum <SyncOutlined spin />
                    </Typography.Title>
                  ) : (
                    <></>
                  )}


                  {sendNftButton(item.owner, item.id)}
                  {burnToken(item.owner, item.id)}
                  {/* {relayTokenButton(
                    item.network === "mainnet",
                    item.owner,
                    item.id
                  )} */}
                  <div style={{ marginLeft: 4, marginTop: 4 }}>
                    <NiftyShop
                      injectedProvider={props.injectedProvider}
                      metaProvider={props.metaProvider}
                      type={"token"}
                      nft={nftJson}
                      itemForSale={item.id}
                      gasPrice={props.gasPrice}
                      address={
                        props.address ? props.address.toLowerCase() : null
                      }
                      ownerAddress={item.owner}
                      price={item.price}
                      visible={!(item.network === "mainnet")}
                      transactionConfig={props.transactionConfig}
                    />
                  </div>
                </List.Item>
              );
            }}
          />
        </Row>
      );

      detailContent = (
        <Descriptions>
          <Descriptions.Item label="Name">{nftJson.name}</Descriptions.Item>
          <Descriptions.Item label="Creator">
            {data.nft.creator.id}
          </Descriptions.Item>
          <Descriptions.Item label="fileHash">{hash}</Descriptions.Item>
          <Descriptions.Item label="id">{data.nft.nftNumber}</Descriptions.Item>
          <Descriptions.Item label="jsonUrl">
            {data.nft.jsonUrl}
          </Descriptions.Item>
          <Descriptions.Item label="Image">{nftJson.image}</Descriptions.Item>
          <Descriptions.Item label="Count">
            {data.nft.count ? data.nft.count : "0"}
          </Descriptions.Item>
          <Descriptions.Item label="Limit">{data.nft.limit}</Descriptions.Item>
          <Descriptions.Item label="Description">
            {nftJson.description}
          </Descriptions.Item>
          <Descriptions.Item label="Price">
            {data.nft.mintPrice > 0
              ? ethers.utils.formatEther(data.nft.mintPrice)
              : "No price set"}
          </Descriptions.Item>
        </Descriptions>
      );

      likeButtonDisplay = (
        <div
          style={{ marginRight: -props.calculatedVmin * 0.8, marginTop: -20 }}
        >
          <LikeButton injectedProvider={props.injectedProvider}
            metaProvider={props.metaProvider}
            metaSigner={props.metaSigner}
            injectedGsnSigner={props.injectedGsnSigner}
            signingProvider={props.injectedProvider}
            localProvider={props.kovanProvider}
            gasPrice={props.gasPrice}
            contractAddress={
              props.readKovanContracts
                ? props.readKovanContracts["NiftyYard"]["address"]
                : ""
            }
            targetId={data.nft.nftNumber}
            likerAddress={props.address}
                      fileUrl={data.nft.id}
            transactionConfig={props.transactionConfig}
          />
        </div>
      );

      detailsDisplay = (
        <div
          style={{
            marginLeft: -props.calculatedVmin * 0.77,
            marginTop: -20,
            opacity: 0.5,
          }}
        >
          <Popover content={detailContent} title="Nft Details">
            <QuestionCircleOutlined />
          </Popover>
        </div>
      );

      nftChainInfoDisplay = (
        <>
          <Row style={{ justifyContent: "center", marginTop: -16 }}>
            <Space>
              <Link to={`/accounts/${data.nft.creator.id}`}>
                <Typography>
                  <span style={{ verticalAlign: "middle", fontSize: 16, color: "#FFFFFF" }}>
                    {" account: "}
                  </span>
                </Typography>
                <Address
                  value={data.nft.creator.id}
                  ensProvider={props.mainnetProvider}
                  clickable={false}
                />
              </Link>
            </Space>
          </Row>
        </>
      );
    }
  }

  let imageFromIpfsToHelpWithNetworking;
  if (nftJson) {
    imageFromIpfsToHelpWithNetworking = (
      <img width={1} height={1} src={nftJson.image} />
    );
  }

  let bottom = (
    <div>
      {likeButtonDisplay}
      {detailsDisplay}
      <div style={{ marginTop: 16, margin: "auto" }}>{nftChainInfoDisplay}</div>

      <div style={{ marginTop: 20 }}>{nextHolders}</div>
      {imageFromIpfsToHelpWithNetworking}
    </div>
  );

  let top = (
    <div>
      <Row
        style={{
          width: "90vmin",
          margin: "0 auto",
          marginTop: "1vh",
          justifyContent: "center",
        }}
      >
        <Typography.Text
          style={{ color: "#FFFFFF" }}
          copyable={{ text: nftJson ? nftJson.external_url : "" }}
          style={{ verticalAlign: "middle", paddingLeft: 5, fontSize: 28 }}
        >
          <a href={"/" + hash} style={{ color: "#FFFFFF" }}>
            {nftJson ? nftJson.name : <Spin />}
          </a>
        </Typography.Text>

      </Row>
    </div>
  );

  return (
    <div style={{ textAlign: "center" }}>
      {top}
      <div
        style={{
          backgroundColor: "#666666",
          width: size[0],
          margin: "0 auto",
          border: "1px solid #999999",
          boxShadow: "2px 2px 8px #AAAAAA",
        }}
      >
        <img src={nftJson.image} style={{ width: "100%", display: "block"}}/>
      </div>
      {bottom}
    </div>
  );
}

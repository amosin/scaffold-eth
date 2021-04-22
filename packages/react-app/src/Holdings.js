import React, { useState, useEffect } from "react";
import { useQuery, useLazyQuery } from "react-apollo";
import {
  HOLDINGS_QUERY,
  HOLDINGS_MAIN_QUERY,
  HOLDINGS_MAIN_NFTS_QUERY,
} from "./apollo/queries";
import ApolloClient, { InMemoryCache } from "apollo-boost";
import { isBlocklisted } from "./helpers";
import { Link } from "react-router-dom";
import { Row, Col, Divider, Switch, Button, Empty, Popover } from "antd";
import { SendOutlined, RocketOutlined } from "@ant-design/icons";
import { Loader } from "./components";
import SendNftForm from "./SendNftForm.js";
import TransferOwnershipForm from "./TransferOwnershipForm"
import UpgradeNftButton from "./UpgradeNftButton.js";

const mainClient = new ApolloClient({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT_MAINNET,
  cache: new InMemoryCache(),
});

export default function Holdings(props) {
  const [holdings, setHoldings] = useState(); // Array with the token id's currently held
  const [tokens, setTokens] = useState({}); // Object holding information about relevant tokens
  const [myCreationOnly, setmyCreationOnly] = useState(true);

  const [blockNumber, setBlockNumber] = useState(0);
  const [data, setData] = useState(); // Data filtered for latest block update that we have seen

  // const { loading: loadingMain, error: errorMain, data: dataMain } = useQuery(
  //   HOLDINGS_MAIN_QUERY,
  //   {
  //     variables: { owner: props.address },
  //     client: mainClient,
  //     pollInterval: 4000,
  //   }
  // );

  const dataMain = '';

  const [
    mainNftsQuery,
    { loading: loadingMainNfts, error: errorMainNfts, data: dataMainNfts },
  ] = useLazyQuery(HOLDINGS_MAIN_NFTS_QUERY);

  const { loading, error, data: dataRaw } = useQuery(HOLDINGS_QUERY, {
    variables: { owner: props.address },
    pollInterval: 4000,
  });

  const getMetadata = async (jsonURL) => {
    const response = await fetch("https://ipfs.io/ipfs/" + jsonURL);
    const data = await response.json();
    return data;
  };

  const getTokens = (_data) => {
    _data.forEach(async (token) => {
      if (isBlocklisted(token.nft.jsonUrl)) return;
      let _token = token;
      _token.network = "mumbai";
      _token.nft.metadata = await getMetadata(token.nft.jsonUrl);
      //setTokens((tokens) => [...tokens, _token]);
      let _newToken = {};
      _newToken[_token.id] = _token;
      setTokens((tokens) => ({ ...tokens, ..._newToken }));
    });
    updateHoldings(
      data && data.tokens ? data.tokens : [],
      dataMain && dataMain.tokens ? dataMain.tokens : []
    );
  };

  const getMainNfts = async (_data) => {
    let _nftList = _data.map((a) => a.nft);
    let mainNfts = await mainNftsQuery({
      variables: { nftList: _nftList },
    });
  };

  const getMainTokens = (_data, nfts, ownerIsCreator = false) => {
    _data.forEach(async (token) => {
      if (isBlocklisted(token.jsonUrl)) return;
      let _token = Object.assign({}, token);
      const _tokenNft = nfts.filter((nft) => nft.id === _token.nft);
      _token.nft = _tokenNft[0];
      if (
        ownerIsCreator &&
        _token.nft.creator.address !== props.address.toLowerCase()
      )
        return;
      _token.network = "Mainnet";
      _token.nft.metadata = await getMetadata(token.jsonUrl);
      let _newToken = {};
      _newToken[_token.id] = _token;
      setTokens((tokens) => ({ ...tokens, ..._newToken }));
      console.log(tokens)
    });
    updateHoldings(
      data && data.tokens ? data.tokens : [],
      dataMain && dataMain.tokens ? dataMain.tokens : []
    );
    console.log(tokens);
  };

  const updateHoldings = (_tokens, _mainTokens) => {
    let tokenList = _tokens.map((i) => i.id);
    let mainTokenList = _mainTokens.map((i) => i.id);
    setHoldings([...tokenList, ...mainTokenList]);
    //console.log(_tokens);
  };

  const handleFilter = () => {
    setmyCreationOnly((myCreationOnly) => !myCreationOnly);
    setTokens({});
    if (!myCreationOnly) {
      getTokens(data.tokens);
      getMainTokens(dataMain.tokens, dataMainNfts.nfts);
    } else {
      getTokens(
        data.tokens
          .filter(
            (token) => token.nft.creator.address === props.address.toLowerCase()
          )
          .reverse()
      );
      if (dataMain.tokens && dataMain.nfts) {
        getMainTokens(dataMain.tokens, dataMainNfts.nfts, true);
      }
    }
  };

  useEffect(() => {
    const getHoldings = async (_data) => {
      let _blockNumber = parseInt(_data.metaData.value);
      //console.log(blockNumber, _blockNumber);
      if (_blockNumber >= blockNumber) {
        setData(_data);
        setBlockNumber(_blockNumber);
      }
    };

    dataRaw ? getHoldings(dataRaw) : console.log("loading data");
  }, [dataRaw]);

  useEffect(() => {
    data ? getTokens(data.tokens) : console.log("loading tokens");
  }, [data]);

  useEffect(() => {
    dataMain ? getMainNfts(dataMain.tokens) : console.log("loading main nfts");
  }, [dataMain]);

  useEffect(() => {
    dataMain && dataMainNfts
      ? getMainTokens(dataMain.tokens, dataMainNfts.nfts)
      : console.log("loading main tokens");
  }, [dataMainNfts]);

  if (loading) return <Loader />;
  if (error) {
    if (!props.address || (data && data.tokens && data.tokens.length <= 0)) {
      return <Empty />;
    } else {
      return `Error! ${error.message}`;
    }
  }
  console.log(data)
  return (
    <div className="holdings">
      <Row>
        <Col span={12}>
          <p style={{ margin: 0 }}>
            <b>All Holdings:</b> {holdings ? holdings.length : 0}
          </p>
        </Col>
        <Col span={12}>
          <p style={{ margin: 0 }}>
            <b>My Creation: </b>
            {holdings && tokens
              ? holdings.filter(
                (id) =>
                  id in tokens &&
                  tokens[id].nft.creator.address ===
                  props.address.toLowerCase()
              ).length
              : 0}
          </p>
        </Col>
      </Row>

      <Divider />
      <Row justify="end" style={{ marginBottom: 20 }}>
        <Col>
          Created by me only:{" "}
          <Switch defaultChecked={!myCreationOnly} onChange={handleFilter} />
        </Col>
      </Row>
      <div className="nfts-grid">
        <ul style={{ padding: 0, textAlign: "center", listStyle: "none" }}>
          {holdings
            ? holdings
              .filter((id) => id in tokens)
              .map((id) => (
                <li
                  key={id}
                  style={{
                    display: "inline-block",
                    verticalAlign: "top",
                    margin: 10,
                    padding: 10,
                    border: "1px solid #e5e5e6",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    transition: 'box-shadow .3s',
                  }}
                >
                  <Link
                    to={"assets/" + tokens[id].nft.id}
                    style={{ color: "black" }}
                  >
                    <div className="assetImage" style={{
                        height: 200,
                        width: 200,
                        textAlign: 'center',
                      }}>
                    <img
                      src={tokens[id].nft.metadata.image}
                      alt={tokens[id].nft.metadata.name}
                      width="300"
                      style={{
                        objectFit: 'contain',
                        height: 'auto',
                        width: 'auto',
                        maxWidth: '100%',
                        maxHeight: '100%',
                        borderRadius: "10px"
                      }}
                    />
                    </div>
                    <h3
                      style={{ color: "white", margin: "10px 0px 5px 0px", fontWeight: "700", fontSize: 15, textTransform: 'uppercase' }}
                    >
                      {tokens[id].nft.metadata.name.length > 18
                        ? tokens[id].nft.metadata.name
                          .slice(0, 10)
                          .concat("...")
                        : tokens[id].nft.metadata.name}
                    </h3>

                    <p style={{ color: "#5e5e5e", margin: "0", zoom: 0.8 }}>
                      Edition: {tokens[id].nft.count}/{tokens[id].nft.limit}
                    </p>
                  </Link>
                  <Divider style={{ margin: "10px 0" }} />
                  <Row justify={"space-between"}>
                    {tokens[id].network === "mumbai" ? (
                      <>
                        <Popover
                          content={
                            <SendNftForm
                              tokenId={tokens[id].id}
                              address={props.address}
                              mainnetProvider={props.mainnetProvider}
                              injectedProvider={props.injectedProvider}
                              transactionConfig={props.transactionConfig}
                            />
                          }
                          title="Send Nft"
                        >
                          <Button
                            size="small"
                            type="secondary"
                            style={{ 
                              margin: 4, marginBottom: 4, fontSize: 10 }}
                          >
                            <SendOutlined /> Send
                            </Button>
                        </Popover>
                        <Popover
                          content={
                            <TransferOwnershipForm
                              tokenId={tokens[id].id}
                              fileUrl={tokens[id].nft.id}
                              address={props.address}
                              mainnetProvider={props.mainnetProvider}
                              injectedProvider={props.injectedProvider}
                              transactionConfig={props.transactionConfig}
                            />
                          }
                          title="Transfer Ownership"
                        >
                          {/* <Button
                            size="small"
                            type="secondary"
                            style={{ margin: 4, marginBottom: 12 }}
                          >
                            <SendOutlined /> Transfer Ownership
                            </Button> */}
                        </Popover>
                        {/* <UpgradeNftButton
                          tokenId={tokens[id].id}
                          injectedProvider={props.injectedProvider}
                          gasPrice={props.gasPrice}
                          upgradePrice={props.upgradePrice}
                          transactionConfig={props.transactionConfig}
                          buttonSize="small"
                        /> */}
                        <Button
                          type="primary"
                          size="small"
                          style={{
                            margin: 2,
                            fontSize: 10,
                            background: "#722ed1",
                            borderColor: "#722ed1",
                          }}
                          onClick={() => {
                            console.log("item", id);
                            window.open(
                              "https://testnets.opensea.io/assets/mumbai/0x186c4c038e04b56ad63bfff71b8149dc49e9b88b/" +
                              id
                            );
                          }}
                        >
                          <RocketOutlined /> View on OpenSea
                        </Button>
                      </>
                    ) : (
                        <Button
                          type="primary"
                          style={{
                            margin: 8,
                            background: "#722ed1",
                            borderColor: "#722ed1",
                          }}
                          onClick={() => {
                            console.log("item", id);
                            window.open(
                              "https://opensea.io/assets/0xc02697c417ddacfbe5edbf23edad956bc883f4fb/" +
                              id
                            );
                          }}
                        >
                          <RocketOutlined /> View on OpenSea
                        </Button>
                      )}
                  </Row>
                </li>
              ))
            : null}
        </ul>
      </div>
    </div>
  );
}


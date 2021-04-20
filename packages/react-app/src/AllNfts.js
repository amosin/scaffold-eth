import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "react-apollo";
import { Link } from "react-router-dom";
import { NFTS_QUERY } from "./apollo/queries";
import { isBlocklisted } from "./helpers";
import { Row } from "antd";
import { Loader } from "./components";
import { ethers } from 'ethers';
import LikeButton from "./LikeButton.js";

export default function AllNfts(props) {
  let [allNfts, setAllNfts] = useState([]);
  let [nfts, setNfts] = useState({});
  const { loading, error, data, fetchMore } = useQuery(NFTS_QUERY, {
    variables: {
      first: 48,
      skip: 0,
    },
    fetchPolicy: "no-cache"
  });

  const getMetadata = async (jsonURL) => {
    const response = await fetch("https://ipfs.io/ipfs/" + jsonURL);
    const data = await response.json();
    return data;
  };

  const getNfts = (data) => {
    setAllNfts([...allNfts, ...data]);
    data.forEach(async (nft) => {
      if (isBlocklisted(nft.jsonUrl)) return;
      let _nft = nft;
      _nft.metadata = await getMetadata(nft.jsonUrl);
      let _newNft = {};
      _newNft[_nft.nftNumber] = _nft;
      setNfts((nfts) => ({ ...nfts, ..._newNft }));
      //setNfts((nfts) => [...nfts, _nft]);
    });
  };

  const onLoadMore = useCallback(() => {
    if (
      Math.round(window.scrollY + window.innerHeight) >=
      Math.round(document.body.scrollHeight)
    ) {
      fetchMore({
        variables: {
          skip: allNfts.length,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return fetchMoreResult;
        },
      });
    }
  }, [fetchMore, allNfts.length]);

  useEffect(() => {
    data ? getNfts(data.nfts) : console.log("loading");
  }, [data]);

  useEffect(() => {
    window.addEventListener("scroll", onLoadMore);
    return () => {
      window.removeEventListener("scroll", onLoadMore);
    };
  }, [onLoadMore]);

  if (loading) return <Loader />;
  if (error) return `Error! ${error.message}`;
  

  // data.nfts.forEach(nft => {
  //   console.log(nft);
  // });

  return (
    <div className="allnfts-main">
      <h1 style={{ padding: 0, textAlign: "center", listStyle: "none", color: "white"}}> LATEST MINTED NFTs </h1>
      <div className="nfts-grid">
      
        <ul style={{ padding: 0, textAlign: "center", listStyle: "none" }}>
          {nfts
            ? Object.keys(nfts)
                .sort((a, b) => b - a)
                .map((nft) => (
                  <li
                    key={nfts[nft].id}
                    style={{
                      display: "inline-block",
                      verticalAlign: "top",
                      margin: 10,
                      padding: 10,
                      border: "1px solid #e5e5e6",
                      borderRadius: "10px",
                      fontWeight: "bold"
                    }}
                  >
                    <Link to={"assets/" + nfts[nft].id} style={{ color: "white" }}>
                      <img
                        src={nfts[nft].metadata.image}
                        alt={nfts[nft].metadata.name}
                        width="300"
                        style={{
                          border: "1px solid #e5e5e6",
                          borderRadius: "10px"
                        }}
                      />
                  <Row
                  align="middle"
                  style={{ textAlign: "center", justifyContent: "center", width:"180" }}
                  >
                  <h3
                    style={{ color: "white", margin: "10px 0px 5px 0px", fontWeight: "700" }}
                  >
                    {nfts[nft].metadata.name.length > 18
                      ? nfts[nft].metadata.name.slice(0, 15).concat("...")
                      : nfts[nft].metadata.name}
                  </h3>
                  </Row>
                <Row
                    align="middle"
                    style={{ textAlign: "center", justifyContent: "center" }}
                  >
                                        {nfts[nft].mintPrice > 0 &&
                      (nfts[nft].limit === 0 || nfts[nft].count < nfts[nft].limit) ? (
                        <>
                          <p
                            style={{
                              color: "#5e5e5e",
                              margin: "0",
                            }}
                          >
                            Price: <b style={{color: '#73ad21'}}>{nfts[nft].mintPrice / 1e18} </b>
                          </p>

                          <img
                            src="https://gateway.pinata.cloud/ipfs/QmbYA7QhqFTLzVSAzE9ymfVvdE1hwBskmXE4X4EK9FevMa"
                            alt="MATIC"
                            style={{ marginLeft: 5, width: 20 }}
                          />
                        </>
                      ) : (
                        <>
                          <img
                            src="https://gateway.pinata.cloud/ipfs/QmbYA7QhqFTLzVSAzE9ymfVvdE1hwBskmXE4X4EK9FevMa"
                            alt="MATIC"
                            style={{ marginLeft: 5, width: 20, visibility: "hidden"}}
                          />
                        </>
                      )}
                    </Row>
                  {/* <Row
                    align="middle"
                    style={{ textAlign: "center", justifyContent: "center", width: "180" }}
                  >
                    {(nfts[nft].bestPrice > 0)
                      ? (<><p
                      style={{
                        color: "#5e5e5e",
                        margin: "0"
                      }}
                    >
                      <b>{parseFloat(ethers.utils.formatEther(nfts[nft].bestPrice))} </b>
                    </p>

                    <img
                      src="https://gateway.pinata.cloud/ipfs/QmQicgCRLfrrvdvioiPHL55mk5QFaQiX544b4tqBLzbfu6"
                      alt="xdai"
                      style={{ marginLeft: 5 }}
                    /></>)
                    : <>
                    <img
                      src="https://gateway.pinata.cloud/ipfs/QmQicgCRLfrrvdvioiPHL55mk5QFaQiX544b4tqBLzbfu6"
                      alt="xdai"
                      style={{ marginLeft: 5, visibility: "hidden" }}
                    />
                    </> }
                    <div style={{marginLeft: 10, marginRight: 10}}>
                    <LikeButton
                      metaProvider={props.metaProvider}
                      metaSigner={props.metaSigner}
                      injectedGsnSigner={props.injectedGsnSigner}
                      signingProvider={props.injectedProvider}
                      localProvider={props.kovanProvider}
                      contractAddress={props.contractAddress}
                      targetId={nfts[nft].nftNumber}
                      likerAddress={props.address}
                      transactionConfig={props.transactionConfig}
                      likeCount={0}
                      hasLiked={ 0 || false}
                      marginBottom={"0px"}
                    />
                    </div>
                  </Row> */}


                    </Link>
                  </li>
                ))
            : null}
        </ul>
        <Row justify="center"></Row>
      </div>
    </div>
  );
}

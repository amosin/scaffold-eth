import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "react-apollo";
import { Link } from "react-router-dom";
import { INKS_QUERY } from "./apollo/queries";
import { isBlocklisted } from "./helpers";
import { Row } from "antd";
import { Loader } from "./components";
import { ethers } from 'ethers';
import LikeButton from "./LikeButton.js";

export default function AllInks(props) {
  let [allInks, setAllInks] = useState([]);
  let [inks, setInks] = useState({});
  const { loading, error, data, fetchMore } = useQuery(INKS_QUERY, {
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

  const getInks = (data) => {
    setAllInks([...allInks, ...data]);
    data.forEach(async (ink) => {
      if (isBlocklisted(ink.jsonUrl)) return;
      let _ink = ink;
      _ink.metadata = await getMetadata(ink.jsonUrl);
      let _newInk = {};
      _newInk[_ink.inkNumber] = _ink;
      setInks((inks) => ({ ...inks, ..._newInk }));
      //setInks((inks) => [...inks, _ink]);
    });
  };

  const onLoadMore = useCallback(() => {
    if (
      Math.round(window.scrollY + window.innerHeight) >=
      Math.round(document.body.scrollHeight)
    ) {
      fetchMore({
        variables: {
          skip: allInks.length,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return fetchMoreResult;
        },
      });
    }
  }, [fetchMore, allInks.length]);

  useEffect(() => {
    data ? getInks(data.inks) : console.log("loading");
  }, [data]);

  useEffect(() => {
    window.addEventListener("scroll", onLoadMore);
    return () => {
      window.removeEventListener("scroll", onLoadMore);
    };
  }, [onLoadMore]);

  if (loading) return <Loader />;
  if (error) return `Error! ${error.message}`;

  return (
    <div className="allinks-main">
      <h1 style={{ padding: 0, textAlign: "center", listStyle: "none", color: "white"}}> LATEST MINTED NFTs </h1>
      <div className="inks-grid">
      
        <ul style={{ padding: 0, textAlign: "center", listStyle: "none" }}>
          {inks
            ? Object.keys(inks)
                .sort((a, b) => b - a)
                .map((ink) => (
                  <li
                    key={inks[ink].id}
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
                    <Link to={"assets/" + inks[ink].id} style={{ color: "white" }}>
                      <img
                        src={inks[ink].metadata.image}
                        alt={inks[ink].metadata.name}
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
                    {inks[ink].metadata.name.length > 18
                      ? inks[ink].metadata.name.slice(0, 15).concat("...")
                      : inks[ink].metadata.name}
                  </h3>
                  </Row>
                  
                  {/* <Row
                    align="middle"
                    style={{ textAlign: "center", justifyContent: "center", width: "180" }}
                  >
                    {(inks[ink].bestPrice > 0)
                      ? (<><p
                      style={{
                        color: "#5e5e5e",
                        margin: "0"
                      }}
                    >
                      <b>{parseFloat(ethers.utils.formatEther(inks[ink].bestPrice))} </b>
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
                      targetId={inks[ink].inkNumber}
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

import { Button, Col, Row, Spin } from 'antd';
import 'antd/dist/antd.css';
import ApolloClient, { gql, InMemoryCache } from 'apollo-boost';
import { ethers } from 'ethers';
import { Provider as JotaiProvider } from 'jotai';
import React, { useState } from 'react';
import { ApolloProvider } from 'react-apollo';
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';
import { Faucet, Ramp } from './components';
import { useContractLoader } from './hooks';
import NftyWallet from './NftyWallet.js';
import detectEthereumProvider from '@metamask/detect-provider'

if (!process.env.REACT_APP_GRAPHQL_ENDPOINT) {
  throw new Error(
    'REACT_APP_GRAPHQL_ENDPOINT environment variable not defined'
  );
}

const client = new ApolloClient({
  uri: process.env.REACT_APP_GRAPHQL_ENDPOINT,
  cache: new InMemoryCache(),
});

const NFTS_QUERY = gql`
  query nfts {
    nfts(first: 5) {
      id
      nftId
      jsonUrl
    }
  }
`;

const mainnetProvider = new ethers.providers.InfuraProvider(
  'mainnet',
  '9ea7e149b122423991f56257b882261c'
);
let kovanProvider;

let localProvider;
let networkBanner = null;
if (process.env.REACT_APP_NETWORK_NAME) {
  if (process.env.REACT_APP_NETWORK_NAME === 'xdai') {
    console.log('🎉 XDAINETWORK + 🚀 Mainnet Ethereum');
    localProvider = mainnetProvider;
    kovanProvider = new ethers.providers.JsonRpcProvider(
      'https://dai.poa.network'
    );
  } else if (process.env.REACT_APP_NETWORK_NAME === 'sokol') {
    console.log('THIS.IS.SOKOL');
    localProvider = new ethers.providers.JsonRpcProvider(
      'https://sokol.poa.network'
    );
  } else if (process.env.REACT_APP_NETWORK_NAME === 'mumbai') {
    networkBanner = <div className="network-banner">Network: Mumbai</div>;
    console.log('THIS IS MUMBAI NETWORK');
    localProvider = new ethers.providers.JsonRpcProvider(
      'https://rpc-mumbai.maticvigil.com'
    );
    kovanProvider = new ethers.providers.JsonRpcProvider(
      'https://rpc-mumbai.maticvigil.com'
    );
  } else if (process.env.REACT_APP_NETWORK_NAME === 'matic') {
    networkBanner = <div className="network-banner">Network: Polygon</div>;
    console.log('THIS IS MUMBAI NETWORK');
    localProvider = new ethers.providers.JsonRpcProvider(
      'https://rpc-mainnet.maticvigil.com'
    );
    kovanProvider = new ethers.providers.JsonRpcProvider(
      'https://rpc-mainnet.maticvigil.com'
    );
  }
   else {
    localProvider = new ethers.providers.InfuraProvider(
      process.env.REACT_APP_NETWORK_NAME,
      '9ea7e149b122423991f56257b882261c'
    );
    kovanProvider = new ethers.providers.InfuraProvider(
      'kovan',
      '9ea7e149b122423991f56257b882261c'
    );
  }
} else {
  networkBanner = <div className="network-banner">Network: Polygon</div>;
  // localProvider = mainnetProvider; //new ethers.providers.JsonRpcProvider("http://localhost:8545");
  localProvider = new ethers.providers.JsonRpcProvider('http://localhost:8546');
  kovanProvider = new ethers.providers.JsonRpcProvider('http://localhost:8546'); // yarn run sidechain
}

function App() {
  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  const [metaProvider, setMetaProvider] = useState();
  const price = 1;
  const gasPrice = 2000000000;


  // function setGasPrice(gasPrice){
  //   gasPrice = gasPrice * 1000000000;
  //   console.log(gasPrice)
  // }

  // fetch('https://gasstation-mainnet.matic.network')
  // .then(response => response.json())
  // .then(json => setGasPrice(json.fastest))

  // Mainnet contract:
  const readContracts = useContractLoader(localProvider);

  const readKovanContracts = useContractLoader(kovanProvider);

  return (
    
    <ApolloProvider client={client}>
      <JotaiProvider>
        <NftyWallet
          address={address}
          setAddress={setAddress}
          localProvider={localProvider}
          injectedProvider={injectedProvider}
          setInjectedProvider={setInjectedProvider}
          mainnetProvider={mainnetProvider}
          price={price}
          minimized={true}
          readContracts={readContracts}
          readKovanContracts={readKovanContracts}
          gasPrice={gasPrice}
          kovanProvider={kovanProvider}
          metaProvider={metaProvider}
          setMetaProvider={setMetaProvider}
        />
        <div
          style={{
            zIndex: 10,
            position: 'fixed',
            textAlign: 'left',
            left: 0,
            bottom: 20,
            padding: 10,
          }}
        >
          <Row gutter={8}>
            {!process.env.REACT_APP_NETWORK_NAME ||
            process.env.REACT_APP_NETWORK_NAME === 'xdai' ? (
              ''
            ) : (
              <>
                {/* <Col>
                  <Ramp price={price} address={address} />
                </Col> */}
                {/* <Col>
                  <Button
                    onClick={() => {
                      window.open('https://ethgasstation.info/');
                    }}
                    size="large"
                    shape="round"
                  >
                    <span
                      style={{ marginRight: 8 }}
                      role="img"
                      aria-label="Fuel_pump"
                    >
                      ⛽️
                    </span>
                    {parseInt(gasPrice) / 10 ** 9}g
                  </Button>
                </Col> */}
              </>
            )}
            {process.env.REACT_APP_NETWORK_NAME ? (
              ''
            ) : (
              <>
                {/* <Col>
                  <Faucet
                    localProvider={kovanProvider}
                    placeholder={'sidechain faucet'}
                    price={price}
                  />
                </Col> */}
              </>
            )}
          </Row>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {!readContracts && (
            <Spin
              style={{
                opacity: metaProvider ? 0.125 : 0.3,
              }}
            />
          )}
        </div>
        {networkBanner}
      </JotaiProvider>
    </ApolloProvider>
  );
}

export default App;

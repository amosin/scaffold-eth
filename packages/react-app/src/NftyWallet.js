import { Button, Drawer } from 'antd';
import React, { useState } from 'react';
import { BrowserRouter, Redirect, Route, Switch } from 'react-router-dom';
import AllNfts from './AllNfts.js';
import Creator from './Creator.js';
import { Account } from './components';
import Footer from './components/Footer';
import Homepage from './components/Homepage';
import Navigation from './components/Navigation';
import CreateFile from './CreateFile.js';
import DebugContracts from './DebugContracts.js';
import Help from './Help.js';
import Holdings from './Holdings.js';
import { useContractReader, useLocalStorage } from './hooks';
import ViewNft from './ViewNft.js';


const Web3HttpProvider = require('web3-providers-http');

const ipfsConfigInfura = {
  host: 'ipfs.infura.io',
  port: '5001',
  protocol: 'https',
};
const ipfsConfig = {
  host: 'ipfs.infura.io',
  port: '5001',
  protocol: 'https',
  timeout: 2500,
};

export default function NftyWallet(props) {
  const calculatedVmin = Math.min(
    window.document.body.clientHeight,
    window.document.body.clientWidth
  );

  const [tab, setTab] = useState('create');

  const [mode, setMode] = useState('edit');

  const [drawing, setDrawing] = useLocalStorage('drawing');
  const [viewDrawing, setViewDrawing] = useState();
  const [ipfsHash, setIpfsHash] = useState();
  const [nft, setNft] = useState({});
  const [renderKey, setRenderKey] = useState(Date.now());
  const [canvasKey, setCanvasKey] = useState(Date.now());

  const [injectedGsnSigner, setInjectedGsnSigner] = useState();

  const [creator, setCreator] = useState();
  const [drawerVisibility, setDrawerVisibility] = useState(false);

  let transactionConfig = {
    address: props.address,
    localProvider: props.kovanProvider,
    injectedProvider: props.injectedProvider,
    injectedGsnSigner: injectedGsnSigner,
    metaSigner: props.metaProvider,
  };

  let nftyBalance = useContractReader(
    props.readKovanContracts,
    'NiftyYardToken',
    'balanceOf',
    [props.address],
    4000
  );
  // let nftyMainBalance = useContractReader(
  //   props.readContracts,
  //   'NiftyMain',
  //   'balanceOf',
  //   [props.address],
  //   4000
  // );
  let upgradePrice = useContractReader(
    props.readKovanContracts,
    'NiftyMediator',
    'relayPrice',
    29999
  );

  // let displayBalance;
  // if (nftyMainBalance && nftyBalance) {
  //   displayBalance =
  //     Number(nftyMainBalance.toString()) + Number(nftyBalance.toString());
  // }

  const showDrawer = () => {
    setDrawerVisibility(true);
  };

  const onCloseDrawer = () => {
    setDrawerVisibility(false);
  };

  return (
    <BrowserRouter>
      <main className="site-main">
        <div className="content">
          <Navigation address={props.address} />
          {/* {process.env.REACT_APP_NETWORK_NAME && supportButton}*/}
          <div className="wallet-info">
            <Account
              address={props.address}
              setAddress={props.setAddress}
              localProvider={props.kovanProvider}
              injectedProvider={props.injectedProvider}
              setInjectedProvider={props.setInjectedProvider}
              setInjectedGsnSigner={setInjectedGsnSigner}
              mainnetProvider={props.mainnetProvider}
              price={props.price}
              minimized={props.minimized}
              setMetaProvider={props.setMetaProvider}
            />
          </div>

          <Switch>
            <Route exact path="/">
            <AllNfts />
              {/* <Homepage
                localProvider={props.localProvider}
                injectedProvider={props.injectedProvider}
              /> */}
            </Route>
            <Route path="/debug">
              <DebugContracts {...props} />
            </Route>
            <Route path="/latest">
              <AllNfts />
            </Route>
            {/* <Route path="/curated">
            <CuratedNfts {...props} />
          </Route> */}

            <Route path="/holdings">
              <Holdings
                {...props}
                address={props.address}
                transactionConfig={transactionConfig}
                upgradePrice={upgradePrice}
              />
            </Route>

            <Route path="/accounts/:address">
              <Creator {...props} />
            </Route>

            <Route path="/create-asset">
              <CreateFile
                {...props}
                key={renderKey}
                canvasKey={canvasKey}
                address={props.address}
                mainnetProvider={props.mainnetProvider}
                injectedProvider={props.injectedProvider}
                metaProvider={props.metaProvider}
                kovanProvider={props.kovanProvider}
                readKovanContracts={props.readKovanContracts}
                mode={mode}
                nft={nft}
                ipfsHash={ipfsHash}
                setMode={setMode}
                setIpfsHash={setIpfsHash}
                setNft={setNft}
                drawing={drawing}
                setDrawing={setDrawing}
                viewDrawing={viewDrawing}
                setViewDrawing={setViewDrawing}
                ipfsConfig={ipfsConfig}
                ipfsConfigInfura={ipfsConfigInfura}
                gasPrice={props.gasPrice}
                calculatedVmin={calculatedVmin}
                transactionConfig={transactionConfig}
              />
            </Route>

            {/* <Route path="/create">
            <div>
              <CreateNft
                {...props}
                key={renderKey}
                canvasKey={canvasKey}
                address={props.address}
                mainnetProvider={props.mainnetProvider}
                injectedProvider={props.injectedProvider}
                metaProvider={props.metaProvider}
                kovanProvider={props.kovanProvider}
                readKovanContracts={props.readKovanContracts}
                mode={mode}
                nft={nft}
                ipfsHash={ipfsHash}
                setMode={setMode}
                setIpfsHash={setIpfsHash}
                setNft={setNft}
                drawing={drawing}
                setDrawing={setDrawing}
                viewDrawing={viewDrawing}
                setViewDrawing={setViewDrawing}
                ipfsConfig={ipfsConfig}
                ipfsConfigInfura={ipfsConfigInfura}
                gasPrice={props.gasPrice}
                calculatedVmin={calculatedVmin}
                transactionConfig={transactionConfig}
              />
            </div>
          </Route> */}

            <Route path="/assets/:hash">
              <div>
                <ViewNft
                  {...props}
                  address={props.address}
                  creator={creator}
                  calculatedVmin={calculatedVmin}
                  canvasKey={canvasKey}
                  drawing={drawing}
                  gasPrice={props.gasPrice}
                  injectedProvider={props.injectedProvider}
                  nft={nft}
                  ipfsConfig={ipfsConfig}
                  ipfsConfigInfura={ipfsConfigInfura}
                  ipfsHash={ipfsHash}
                  key={renderKey}
                  kovanProvider={props.kovanProvider}
                  mainnetProvider={props.mainnetProvider}
                  metaProvider={props.metaProvider}
                  readContracts={props.readContracts}
                  readKovanContracts={props.readKovanContracts}
                  setCreator={setCreator}
                  setDrawing={setDrawing}
                  setNft={setNft}
                  setIpfsHash={setIpfsHash}
                  setMode={setMode}
                  setTab={setTab}
                  setViewDrawing={setViewDrawing}
                  transactionConfig={transactionConfig}
                  upgradePrice={upgradePrice}
                  viewDrawing={viewDrawing}
                />
              </div>
            </Route>

            <Route
              path="/:hash(Qm[A-Z]\w+)"
              render={(props) => (
                <Redirect to={`/assets/${props.match.params.hash}`} />
              )}
            />
          </Switch>
        </div>

        <Footer showDrawer={showDrawer} />

        <Drawer
          title="HELP"
          width={520}
          onClose={onCloseDrawer}
          visible={drawerVisibility}
          bodyStyle={{ paddingBottom: 80 }}
          footer={
            <div
              style={{
                textAlign: 'right',
              }}
            >
              <Button onClick={onCloseDrawer}>Close</Button>
            </div>
          }
        >
          <Help />
        </Drawer>
      </main>
    </BrowserRouter>
  );
}

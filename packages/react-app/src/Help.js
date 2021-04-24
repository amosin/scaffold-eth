import React from "react";
import { Row, Divider } from "antd";

export default function Help() {
  return (
    <div>
      <h2 style={{ fontWeight: "bold" }}>Add Polygon(Matic) to MetaMask</h2>
      <ul style={{ padding: 0 }}>
        <p>
          1- Open MetaMask, and select "Custom RPC" from the Network Dropdown.
        </p>
        <Row justify="center">
          <div style={{ marginBottom: 20 }}>
            <img
              width="300"
              src="https://gateway.pinata.cloud/ipfs/QmRnTpJuVDq1cTvWcfzEttpgysnnsbhCmmmR7QxXxBtyfz"
              alt="metamask"
            />
          </div>
        </Row>
        <p>
          2- In the "Custom RPC" Settings, add in the MATIC network details and
          click Save:
        </p>
        <ul>
          <li>
            Network Name: <b>Matic Mainnet</b>
          </li>
          <li>
            New RPC URL: <b>https://rpc-mainnet.matic.network</b>
          </li>
          <li>
            ChainID: <b>137</b>
          </li>
          <li>
            Symbol: <b>MATIC</b>
          </li>
          <li>
            Block Explorer URL: <b>https://explorer-mainnet.maticvigil.com/</b>
          </li>
        </ul>
        <Row justify="center">
          <div style={{ margin: "20px 0" }}>
            <img
              width="300"
              src="https://gateway.pinata.cloud/ipfs/QmRz4hhMngHpwwKHnRkLDM3wER82ZTUGPcenNLErY19cH4"
              alt="metamask-2"
            />
          </div>
        </Row>
      </ul>
      <Divider />
      <h2 style={{ fontWeight: "bold" }}>Export Burner Wallet private key</h2>
      <p><a href="https://github.com/austintgriffith/burner-wallet">Burner Wallet - More INFO</a></p>
      <p>
        If you are not using MetaMask, you can export your burning wallet
        private key:{" "}
      </p>
      <ul>
        <li>Click on "Wallet" button</li>
        <Row justify="center">
          <div>
            <img
              width="400"
              src="https://gateway.pinata.cloud/ipfs/QmbsYrJ8xyMpTnFZxb9WUewoDCn3Z2YXd9mu5nK5JrmTYN"
              alt="export-private-key-1"
            />
          </div>
        </Row>
        <li>Click on "Private Key" button</li>
        <Row justify="center">
          <div style={{ margin: "20px 0" }}>
            <img
              width="400"
              src="https://gateway.pinata.cloud/ipfs/QmNrApV7hdKR7yCC6Dmhp7NfYXddNVGVTNsGhsL7r84vPV"
              alt="export-private-key-2"
            />
          </div>
        </Row>
      </ul>
      <Divider />
      <h2 style={{ fontWeight: "bold" }}>Upgrade nfts to Ethereum mainnet</h2>
      <p>
        Coming soon!
      </p>
    </div>
  );
}

import React, { useState } from "react";
import { useHistory } from "react-router-dom";
import "antd/dist/antd.css";
import InfoPop from './components/InfoPop';
import "./App.css";
import {
  Button,
  Input,
  InputNumber,
  Form,
  Modal,
  Space,
  message,
  Typography,
} from "antd";
import { addToIPFS, transactionHandler } from "./helpers";
import {
  SketchPicker,
  CirclePicker,
  TwitterPicker,
} from "react-color";
import { useAtom } from "jotai";
import { Uploader } from "./components";
import { imageUrlAtom } from "./hooks/Uploader";
import { MinusCircleTwoTone, PlusOutlined } from '@ant-design/icons';

const Hash = require("ipfs-only-hash");
const pickers = [CirclePicker, TwitterPicker, SketchPicker];



export default function CreateFile(props) {
  let history = useHistory();
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [userDescription, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [number, setNumber] = useState(0);
  const [attribute, setAttribute] = useState([]);
  const [attributeValue, setAttributeValue] = useState([]);
  const [imageUrl, setImageUrl] = useAtom(imageUrlAtom);

  const gasPrice = props.gasPrice;

  const mintNft = async (nftUrl, jsonUrl, limit) => {
    let contractName = "NiftyYard";
    let regularFunction = "createNft";
    let regularFunctionArgs = [
      nftUrl,
      jsonUrl,
      props.nft.attributes[0]["value"],
    ];
    let signatureFunction = "createNftFromSignature";
    let signatureFunctionArgs = [
      nftUrl,
      jsonUrl,
      props.nft.attributes[0]["value"],
      props.address,
    ];
    let getSignatureTypes = [
      "bytes",
      "bytes",
      "address",
      "address",
      "string",
      "string",
      "uint256",
    ];
    let getSignatureArgs = [
      "0x19",
      "0x0",
      props.readKovanContracts["NiftyYard"].address,
      props.address,
      nftUrl,
      jsonUrl,
      limit,
    ];

    let createNftConfig = {
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

    console.log(createNftConfig);

    let result = await transactionHandler(createNftConfig);

    return result;
  };

  const createNft = async (values) => {
    console.log("Success:", values);
    console.log("imageUrl", imageUrl);

    setSending(true);

    let imageBuffer = Buffer.from(imageUrl.split(",")[1], "base64");

    let currentNft = props.nft;

    currentNft["attributes"] = [
      {
        trait_type: "Limit",
        value: values.limit.toString(),
      },
      {
        trait_type: "Collection Name",
        value: values.collectionName,
      },
    ];

    if (values.collectionName){
      currentNft["attributes"] = [
        {
          trait_type: "Limit",
          value: values.limit.toString(),
        },
        {
          trait_type: "Collection",
          value: values.collectionName,
        },
      ];
    } else {
      currentNft["attributes"] = [
        {
          trait_type: "Limit",
          value: values.limit.toString(),
        },
        {
          trait_type: "Collection",
          value: "NFT Yard V1",
        },
      ];
    }

    if (values.attributes) {
      values.attributes.forEach(attrib => currentNft["attributes"].push(attrib));
    }
    

    currentNft["name"] = values.title;
    let newEns;
    try {
      newEns = await props.mainnetProvider.lookupAddress(props.address);
    } catch (e) {
      console.log(e);
    }
    const timeInMs = new Date();
    const addressForDescription = !newEns ? props.address : newEns;
    if (values.userDescription){
      currentNft["description"] = values.userDescription;
    } else {
      currentNft["description"] =
      "NFT Minted by " +
      addressForDescription +
      " on " +
      timeInMs.toUTCString();
    }


    props.setIpfsHash();

    const imageHash = await Hash.of(imageBuffer);
    console.log("imageHash", imageHash);

    currentNft["image"] = "https://ipfs.io/ipfs/" + imageHash;

    if (values.externalUrl){
      currentNft["external_url"] = values.externalUrl;
    } else {
      currentNft["external_url"] = "https://nftyard.io/" + imageHash;
    }

    props.setNft(currentNft);
    console.log("Nft:", props.nft);

    var nftStr = JSON.stringify(props.nft);
    const nftBuffer = Buffer.from(nftStr);

    const jsonHash = await Hash.of(nftBuffer);
    console.log("jsonHash", jsonHash);

    try {
      var mintResult = await mintNft(
        imageHash,
        jsonHash,
        values.limit.toString()
      );
    } catch (e) {
      if (e.data.code === -32603) {
        Modal.error({
          title: "This NFT already exists!",
          content: (
            <>
            <p>You are trying to create a NFT that already exists.</p>
              <p>
                It's supposed to be a NON FUNGIBLE TOKEN right? try another file...
              </p>
            </>
          ),
        });
      } else {
        Modal.error({
          title: "something went wrong!",
          content: (
            <>
            {e.data.message}
            </>
          ),
        });
      }
     
      
      console.log(e.data.message);
      setSending(false);
    }

    if (mintResult) {
      const imageResult = addToIPFS(imageBuffer, props.ipfsConfig);
      const nftResult = addToIPFS(nftBuffer, props.ipfsConfig);

      const imageResultInfura = addToIPFS(imageBuffer, props.ipfsConfigInfura);
      const nftResultInfura = addToIPFS(nftBuffer, props.ipfsConfigInfura);

      Promise.all([imageResult, nftResult]).then((values) => {
        console.log("FINISHED UPLOADING TO PINNER", values);
        message.destroy();
      });

      setSending(false);
      history.push("/assets/" + imageHash);

      Promise.all([imageResultInfura, nftResultInfura]).then((values) => {
        console.log("INFURA FINISHED UPLOADING!", values);
      });

      setImageUrl(null);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("errorInfo:", errorInfo);
  };

  
  const top = (
    <div><br></br>
      <Typography.Title level={3} style={{ color: "white", marginBottom: 25 }}>Create your own NFT 👷🏻</Typography.Title>
      <Form
      labelCol={{ span: 24 }}
      wrapperCol={{
        span: 30,
      }}
        layout={"horizontal"}
        name="createFile"
        onFinish={createNft}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          name="title"
          label="Name"
          labelAlign = "right"
          rules={[
            { required: true, message: "What is this NFT called?" },
          ]}
        >
          <Input
            onChange={(e) => setName(e.target.value)}
            placeholder={"Give your NFT a Title"}
            style={{ fontSize: 16 }}
          />
        </Form.Item>

        {/* Description */}
        
        
        <Form.Item
         label={<span style={{marginTop: 18}}> <span>Description</span><InfoPop item="Description" textAlign="left"/></span>}
         labelAlign = "left"
          name="userDescription"
          rules={[
            { required: false, message: "Give your NFT a Description." },
          ]}
        >
          
          <Input.TextArea
            onChange={(e) => setDescription(e.target.value)}
            placeholder={"Description"}
            style={{ fontSize: 16 }}
          />      
        </Form.Item>

        {/* <Form.Item
        label={<span style={{marginTop: 20}}> <span>Link to your own NFT Website (OPTIONAL)</span><InfoPop item="External Url" textAlign="left"/></span>}
         labelAlign = "left"
          name="externalUrl"
          rules={[
            { required: false, message: "Optionally you can add your own website." },
          ]}
        >
  
          <Input
            onChange={(e) => setExternalUrl(e.target.value)}
            placeholder={"Example: https://mywebsite.com/nft_address"}
            style={{ fontSize: 16 }}
          />  
        </Form.Item> */}

        <Form.Item
        label={<span style={{marginTop: 20}}> <span>Collection Name</span><InfoPop item="Collection Name" textAlign="left"/></span>}
         labelAlign = "left"
          name="collectionName"
          rules={[
            { required: false, message: "Group your NFTs into collection" },
          ]}
        >
          <Input
            onChange={(e) => setCollectionName(e.target.value)}
            placeholder={"My First NFT Collection"}
            style={{ fontSize: 16 }}
          />  
        </Form.Item>

        <Form.List name="attributes">        
        {(fields, { add, remove }) => (
          <>
          <span style={{color: '#73ad21', fontSize: 16}}>Custom Properties</span>
          <InfoPop item="Custom Properties" textAlign="left"/>
            {fields.map(field => (
              <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                <Form.Item
                labelAlign = "left"
                  {...field}
                  name={[field.name, 'trait_type']}
                  fieldKey={[field.fieldKey, 'trait_type']}
                  rules={[{ required: true, message: 'Missing Property' }]}
                >
                  <Input 
                  onChange={(e) => setAttribute(e.target.value)}
                  placeholder="Property Name" 
                  />
                </Form.Item>
                <Form.Item
                  {...field}
                  name={[field.name, 'value']}
                  fieldKey={[field.fieldKey, 'value']}
                  rules={[{ required: true, message: 'Missing value' }]}
                >
                  <Input 
                  onChange={(e) => setAttributeValue(e.target.value)}
                  placeholder="Value" 
                  />
                </Form.Item>
                <MinusCircleTwoTone onClick={() => remove(field.name)} />
              </Space>
            ))}
            <Form.Item>
              <Button type="dashed" shape="round" ghost="true" onClick={() => add()} block icon={<PlusOutlined />}>
                Add Custom Property
              </Button>
            </Form.Item>
          </>
        )}
      </Form.List>


      <Form.Item 
          labelCol={{ span: 4 }}
          label={<span style={{marginTop: 20}}> <span>Supply</span><InfoPop item="Supply" textAlign="left"/></span>}
          labelAlign = "left"
          name="limit"
          rules={[{ required: true, message: "How many files can be minted?" }]}
        >
          
          <InputNumber
            onChange={(e) => {
              setNumber(e);
            }}
            placeholder={"Limit"}
            style={{ fontSize: 16 }}
            min={0}
            precision={0}
          />
          
        </Form.Item>

        <Form.Item
        style={{ textAlign: "center" }}>
          <Button
            loading={sending}
            type="primary"
            htmlType="submit"
            disabled={!name || !number || !imageUrl}
          >
            Upload
          </Button>
        </Form.Item>



        
      </Form>

    </div>
  );

  return (
    <div  className="createfile">
       <div  className="createfile-right">
      {top}
      </div>
      <p style={{fontSize: 14}}>You can Only Upload Image Files For Now.</p>
      <InfoPop item="Upload" textAlign="left"/>
      <Uploader />
    </div>
  );
}

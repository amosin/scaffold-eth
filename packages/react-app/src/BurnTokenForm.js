import React, { useState } from "react";
import { Form, Button, notification } from "antd";
import { AddressInput } from "./components";
import { transactionHandler } from "./helpers";
import { useContractLoader } from "./hooks";

export default function BurnTokenForm(props) {
  const [sending, setSending] = useState(false);
  const [form] = Form.useForm();

  const execBurnToken = async (values) => {
    setSending(true);
    console.log("Success:", props.tokenId);

    let contractName = "NiftyYardToken";
    let regularFunction = "burnToken";
    let regularFunctionArgs = [props.tokenId, props.nftUrl];
    const gasPrice = props.gasPrice;

    let txConfig = {
      ...props.transactionConfig,
      contractName,
      regularFunction,
      regularFunctionArgs,
      gasPrice,
    };

    console.log(txConfig);

    let result;
    try {
      const mainnetBytecode = "0x0";
      if (
        !mainnetBytecode ||
        mainnetBytecode === "0x" ||
        mainnetBytecode === "0x0" ||
        mainnetBytecode === "0x00"
      ) {
        console.log("yes now we try");
        result = await transactionHandler(txConfig);
        console.log('Result: ' + result);
        notification.open({
          message: "👋 Burn successful!",
          description: "👀 The supply has been decreased",
        });
      } else {
        notification.open({
          message: "📛 Sorry! Unable to Burn",
          description: "This address is a smart contract 📡",
        });
      }

      console.log('Result: ' + result);
      //await tx(writeContracts["NiftyYardToken"].safeTransferFrom(props.address, values['to'], props.tokenId))
      form.resetFields();
      setSending(false);
    } catch (e) {
      console.log(result);
      form.resetFields();
      setSending(false);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  let output = (
    <Form
      form={form}
      layout={"inline"}
      name="burnToken"
      initialValues={{ tokenId: props.tokenId }}
      onFinish={execBurnToken}
      onFinishFailed={onFinishFailed}
    >


      <Form.Item>
        <Button type="danger" htmlType="submit" onClick={() => {
                console.log("item", props.tokenId);
              }} loading={sending}>
          Burn!
        </Button>
      </Form.Item>
    </Form>
  );

  return output;
}


{/* <Button type="secundary" onClick={() => {
                console.log("item", item.id);
              }} loading={minting}>
            <FireOutlined />
              </Button> */}
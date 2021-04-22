import React from 'react';
import { Popover } from 'antd';
import descriptionExample from '../images/descriptionExample.png';
import propertiesExample from '../images/propertiesExample.png';
import artExample from '../images/artExample.png';
import {
    InfoCircleTwoTone
  } from "@ant-design/icons";

  const getContent = (item) => {
    if (item === "Description") {
        return (
            <div>
            <p>Provide a description for your NFT. This will be shown on places like Opensea as follows: </p>
            <img src={descriptionExample} alt="Description Example" width="340"/> 
            <p>Description plays a important role on your NFT and you cannot modify this later. </p>
          </div>
          );
    } else if (item === "Custom Properties") {
        return (
            <div>
            <p>Custom properties are the attributes of your NFT. You can add whatever you like here. </p>
             <p>Those properties will show on Opensea as the follow example:</p> 
            <img src={propertiesExample} alt="Properties Example" width="340"/> 
            <p>On this example we have <b>BLOODLINE</b> as the attribute name and <b>Nakamoto</b> the value.</p>
            <p> Also we have atribute <b>Gender</b> with value of <b>Colt</b>.</p>
            <p><a target="_blank" href="https://opensea.io/assets/matic/0xa5f1ea7df861952863df2e8d1312f7305dabf215/8077">https://opensea.io/assets/matic/0xa5f1ea7df861952863df2e8d1312f7305dabf215/8077</a> </p>
            <br />
            <p>Suggestions:</p>
            <p>For a Digital Art:</p>
            <img src={artExample} alt="Art Properties Example" width="340"/> 
          </div>
          );
    } else if (item === "Collection Name") {
      return (
          <div>
          <p>This will help group your NFTs into Categories. Also it will show on OpenSea as a Collection Property</p>
        </div>
        );
    } else if (item === "Supply") {
        return (
            <div>
            <p>This is the max number of copies would you like to be available. After you create only one NFT will be minted.</p>
            <p>You can always mint more or set up a price for other to buy and mint a new copy </p>
            <p>Minimum value for suppy is 1.</p>
          </div>
          );
    } else if (item === "External Url") {
        return (
            <div>
            <p>If you have an website and you would want to show that link on Opensea add it here.</p>
            <p>This is an optional field. If you don't have a website leave it blank</p> 
            <p>If you add a wrong website or something that doesn't exist the link on Opensea will be broken </p>
            <p>and you can't change it later...</p> 
          </div>
          );
    } else if (item === "Upload") {
      return (
          <div>
          <p>Supported Files: jpg, png, gif, and svg</p>
        </div>
        );
    } else {
        return (
            <div>
            <p>Content for Unkown</p>
          </div>
          );
    }

  }


function InfoPop({ item, textAlign }) {
    return (
    <>
        
    <p style={{color: 'white', fontSize: 12, textAlign: textAlign}}>More info: <Popover content={getContent(item)} title={item} trigger="hover"><InfoCircleTwoTone/> </Popover></p>
    </>
    )
}

export default InfoPop

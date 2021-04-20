import React from 'react';
import { Popover } from 'antd';
import descriptionExample from '../images/descriptionExample.png';
import {
    InfoCircleTwoTone
  } from "@ant-design/icons";

  const getContent = (item) => {
    if (item === "Description") {
        return (
            <div>
            <p>Provide a description for your NFT. This will be shown on places like Opensea as follows: </p>
            <img src={descriptionExample} alt="Description Example" width="340"/>
          </div>
          );
    } else if (item === "Custom Attributes") {
        return (
            <div>
            <p>THIS IS IMPORTANT!</p>
          </div>
          );
    } else if (item === "Limit") {
        return (
            <div>
            <p>Content for {item}</p>
          </div>
          );
    } else if (item === "External Url") {
        return (
            <div>
            <p>Content for {item}</p>
          </div>
          );
    } else if (item === "Upload") {
      return (
          <div>
          <p>Supported Files: </p>
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

import React, { useState } from "react";
import { Upload, message } from "antd";
import { LoadingOutlined, InboxOutlined } from "@ant-design/icons";

import { useUploader } from "../hooks";

const Uploader = () => {
  const {
    loading,
    imageUrl,
    handleChange,
    customRequest,
    beforeUpload,
  } = useUploader();

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <InboxOutlined style={{ fontSize: 65 }}/>}
      <div style={{ marginTop: 8 }}>
      <p className="ant-upload-text">Click or drag file to this area to upload</p>
      <p className="ant-upload-hint">select media on your device</p>
      <p></p></div>
    </div>
  );

  return (
    <div className="uploader">
    <Upload.Dragger
      name="avatar"
      listType="picture-card"
      className="avatar-uploader"
      showUploadList={false}
      beforeUpload={beforeUpload}
      onChange={handleChange}
      customRequest={customRequest}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="avatar" style={{ width: "100%" }} />
      ) : (
        uploadButton
      )}
    </Upload.Dragger>
    </div>
  );
};

export default Uploader;

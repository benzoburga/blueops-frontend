import React from "react";
import { FaFolderPlus } from "react-icons/fa";
import "../../styles/uploadbutton.css";

const UploadButton = ({ onOpenCreateFolder }) => {
  return (
    <div className="button-container">
      <div className="upload-card" onClick={onOpenCreateFolder}>
        <div className="icon-container">
          <FaFolderPlus />
        </div>
        <div className="upload-card__label">
          
        </div>
      </div>
    </div>
  );
};

export default UploadButton;

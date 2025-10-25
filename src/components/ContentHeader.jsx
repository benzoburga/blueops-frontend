import React, { useState } from 'react';
import { BiSearch } from 'react-icons/bi';

const ContentHeader = ({ onSearch }) => {
  const [searchText, setSearchText] = useState('');

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchText(value);
    onSearch(value); // Aquí enviamos el texto al `Content.jsx`
  };

  return (
    <div className="content--header">
      <h1 className="header--title">Clientes </h1>
      <div className="header--activity">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Buscar Cliente Aquí..." 
            value={searchText} 
            onChange={handleSearchChange} 
          />
          <BiSearch className="icon" />
        </div>
      </div>
    </div>
  );
};

export default ContentHeader;

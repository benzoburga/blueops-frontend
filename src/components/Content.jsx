import React, { useState } from 'react';
import ContentHeader from './ContentHeader';
import "../styles/content.css";
import Card from './Card';
import TeacherList from './TeacherList';

const Content = () => {
  const [searchText, setSearchText] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false); // 👈

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
  };

  return (
    <div className="content">
      <ContentHeader onSearch={setSearchText} />
      <Card onDeleteModeToggle={toggleDeleteMode} />
      <TeacherList searchText={searchText} isDeleteMode={isDeleteMode} />
    </div>
  );
};

export default Content;

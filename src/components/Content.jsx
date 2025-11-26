import React, { useState } from 'react';
import ContentHeader from './ContentHeader';
import "../styles/content.css";
import Card from './Card';
import TeacherList from './TeacherList';
import useIsMobile from '@/utils/useIsMobile';

const Content = () => {
  const [searchText, setSearchText] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const toggleDeleteMode = () => setIsDeleteMode(!isDeleteMode);

  const isMobile = useIsMobile(); // 👈 detectar móvil

  return (
    <div className="content">
      <ContentHeader onSearch={setSearchText} />
      <Card onDeleteModeToggle={toggleDeleteMode} />

      {isMobile ? (
        /* ===== Vista compacta para móvil ===== */
        <div style={{ display: "grid", gap: "10px" }}>
          <TeacherList
            searchText={searchText}
            isDeleteMode={isDeleteMode}
            compact={true} // 👈 le avisamos al componente que es modo móvil
          />
        </div>
      ) : (
        /* ===== Vista normal (desktop) ===== */
        <TeacherList searchText={searchText} isDeleteMode={isDeleteMode} />
      )}
    </div>
  );
};

export default Content;

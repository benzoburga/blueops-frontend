import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';

const ClientArchivesCard = ({ title, icon, onClick, showDelete, onDelete }) => {
  const navigate = useNavigate();
  const { clientName } = useParams();

  const handleClick = () => {
     if (onClick) onClick();
  };

  return (
    <div className="archives-card" onClick={handleClick}>
      {icon && <div className="icon-container">{icon}</div>}
      <h3>{title || 'Apartado'}</h3>
      {showDelete && (
        <button className="delete-btn" onClick={(e) => {
          e.stopPropagation(); // Evita navegar al hacer click
          onDelete();
        }}>
          <FaTrash />
        </button>
      )}
    </div>
  );
};

export default ClientArchivesCard;

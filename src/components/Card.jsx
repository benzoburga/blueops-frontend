import React from 'react';
import { BiUserPlus, BiTrash } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';

const Card = ({ onDeleteModeToggle }) => {
  const navigate = useNavigate();

  const courses = [
    {
      title: 'Crear ',
      icon: <BiUserPlus />,
      onClick: () => navigate('/admin/crear-cliente'),
    },
    {
      title: 'Borrar',
      icon: <BiTrash />,
      onClick: onDeleteModeToggle, // ahora activa el modo borrar
    },
  ];

  return (
    <div className="card--container">
  {courses.map((item, index) => (
    <div className="card icon-only" key={index} onClick={item.onClick}>
      <div className="card--cover">{item.icon}</div>
    </div>
  ))}
</div>

  );
};

export default Card;

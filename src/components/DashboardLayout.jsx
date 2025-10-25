import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Content from './Content'; // Clientes
import FileList from './GlobalSearch/FileList'; // Buscar Archivos

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-content">
        <Routes>
          <Route path="clientes" element={<Content />} />
          <Route path="archivos" element={<FileList />} />
        </Routes>
      </div>
    </div>
  );
};

export default DashboardLayout;

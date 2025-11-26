import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Content from './Content';                 // Clientes
import FileList from './GlobalSearch/FileList';  // Buscar Archivos
import useIsMobile from '@/utils/useIsMobile';
import '@/styles/mobile-shell.css';              // 👈 nuevo CSS

export default function DashboardLayout() {
  const isMobile = useIsMobile(1024);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => { if (!isMobile) setIsOpen(false); }, [isMobile]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isMobile ? (isOpen ? 'open' : '') : 'static'}`}>
        <Sidebar
          isOpen={true}
          toggleSidebar={() => setIsOpen(false)}
          onNavigate={() => setIsOpen(false)}
        />
      </aside>

      {isMobile && isOpen && (
        <div className="drawer-overlay" onClick={() => setIsOpen(false)} />
      )}

      <section className="app-content">
        <header className="app-header">
          {isMobile && (
            <button className="menu-btn" onClick={() => setIsOpen(v => !v)} aria-label="Abrir menú">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <h1 className="app-title">BlueOps</h1>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Content />} />
            <Route path="clientes" element={<Content />} />
            <Route path="archivos" element={<FileList />} />
          </Routes>
        </main>
      </section>
    </div>
  );
}

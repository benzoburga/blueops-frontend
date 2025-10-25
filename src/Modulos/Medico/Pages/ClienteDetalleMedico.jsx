//ClienteDetalleMedico.jsx
import { useNavigate, useParams } from "react-router-dom";
import SidebarMedico from "../Components/SidebarMedico";
import "../Styles/LayoutMedico.css";
import { MOCK_CLIENTES } from "../data/mockClientes";

const ClienteDetalleMedico = () => {
  const [isOpen, setIsOpen] = useState(() => {
  const saved = localStorage.getItem("medico.sidebar_open");
  return saved === null ? true : saved === "true";
});
  const toggleSidebar = () => {
  setIsOpen(prev => {
    const next = !prev;
    localStorage.setItem("medico.sidebar_open", String(next));
    return next;
  });
};
  const { id } = useParams();
  const navigate = useNavigate();

  const cliente = MOCK_CLIENTES.find((c) => String(c.id) === String(id));

  return (
    <div className="layout-container">
      <SidebarMedico isOpen={isOpen} toggleSidebar={toggleSidebar} />
      <main className={`main-content ${isOpen ? "expanded" : "collapsed"}`}>
        <h2 className="title">Cliente seleccionado</h2>
        {cliente ? (
          <div className="card">
            <p><strong>Nombre comercial:</strong> {cliente.nombreComercial}</p>
            <p><strong>Representante legal:</strong> {cliente.representanteLegal}</p>
            <p><strong>RUC:</strong> {cliente.ruc}</p>
            <p><strong>Empresa:</strong> {cliente.empresa}</p>
          </div>
        ) : (
          <p>No se encontró el cliente.</p>
        )}
        <button className="close-btn" onClick={() => navigate(-1)}>Volver</button>
      </main>
    </div>
  );
};

export default ClienteDetalleMedico;

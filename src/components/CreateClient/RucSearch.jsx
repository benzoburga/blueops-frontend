// RucSearch.jsx
const RucSearch = ({ value, onChange, onFill }) => {
  const handleChange = (e) => {
    onChange(e.target.value); // 🔹 actualiza el estado en CreateClientForm
  };

  const handleConsultar = async () => {
    // 🔹 aquí luego conectas tu API de SUNAT (apiperu.dev o la tuya)
    // por ahora simulemos que devuelve un objeto con data
    const fakeData = {
      nombre_comercial: 'Empresa Demo SAC',
      domicilio_fiscal: 'Av. Siempre Viva 123',
      tipo_contribuyente_id: 4, // Sociedad Anónima
      estado_contribuyente_id: 1,
      condicion_contribuyente_id: 1,
    };
    onFill(fakeData); // 🔹 rellena datos en el estado principal
  };

  return (
    <div className="ruc-search">
      <label>Número de RUC (*)</label>
      <div className="ruc-input-container">
        <input
          type="text"
          placeholder="Ingrese RUC"
          value={value}
          onChange={handleChange}
        />
        <button
          type="button"
          className="sunat-button"
          onClick={handleConsultar}
        >
          Consultar SUNAT
        </button>
      </div>
    </div>
  );
};

export default RucSearch;

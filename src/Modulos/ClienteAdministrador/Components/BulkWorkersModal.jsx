import { useEffect, useMemo, useState } from "react";
import "../Styles/BulkWorkersModal.css";

/* ===== helpers ===== */
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lines = (txt) =>
  String(txt ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((s) => s.trimEnd()) // preserva espacios internos pero quita salto
    .filter((s) => s.length > 0);

// normaliza fechas a yyyy-mm-dd; soporta dd/mm/aaaa, dd-mm-aaaa, dd/mm/aa, yyyy-mm-dd
function toISODate(any) {
  const s = String(any || "").trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // yyyy-mm-dd
  let m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2}|\d{4})$/);
  if (!m) return "";
  let [_, d, mo, y] = m;
  d = +d;
  mo = +mo;
  y = String(y).length === 2 ? 2000 + +y : +y; // asume 20xx
  if (y < 1900 || y > 2100) return "";
  if (mo < 1 || mo > 12) return "";
  const dim = new Date(y, mo, 0).getDate();
  if (d < 1 || d > dim) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${y}-${pad(mo)}-${pad(d)}`;
}

// normalizador tolerante (sin tildes/puntos/guiones)
const norm = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.\s_-]+/g, " ")
    .trim();

// alias útiles
const SEXO_ALIASES = new Map([
  ["m", "Masculino"],
  ["masc", "Masculino"],
  ["masculino", "Masculino"],
  ["f", "Femenino"],
  ["fem", "Femenino"],
  ["femenino", "Femenino"],
  ["o", "Otro"],
  ["otro", "Otro"],
]);

const TIPO_DOC_ALIASES = new Map([
  ["dni", "DNI"],
  ["d n i", "DNI"],
  ["ce", "CE"],
  ["carnet extranjeria", "CE"],
  ["pasaporte", "Pasaporte"],
  ["passport", "Pasaporte"],
  ["ruc", "RUC"],
  ["ci", "CI"],
  ["carnet identidad", "CI"],
]);

const RIESGOS = ["Alto Riesgo", "Bajo Riesgo", "No incluye"];

export default function BulkWorkersModal({
  open,
  onClose,
  onConfirm,
  puestos = [],
  tiposIdent = [],
  sexos = [],
}) {
  const [rowsCount, setRowsCount] = useState(5);
  const [rows, setRows] = useState([]);

  // mapas para match rápido
  const puestoByKey = useMemo(() => {
    const m = new Map();
    puestos.forEach((p) => m.set(norm(p.nombre), p.nombre));
    return m;
  }, [puestos]);

  const sexoByKey = useMemo(() => {
    const m = new Map();
    sexos.forEach((s) => m.set(norm(s), s));
    for (const [k, v] of SEXO_ALIASES) if (!m.has(k)) m.set(k, v);
    return m;
  }, [sexos]);

  // tipo doc: buscamos por nombre normalizado y devolvemos id
  const tipoDocByKey = useMemo(() => {
    const m = new Map();
    tiposIdent.forEach((t) => m.set(norm(t.nombre), t.id));
    for (const [aliasKey, canonLabel] of TIPO_DOC_ALIASES) {
      const id = tiposIdent.find((t) => norm(t.nombre) === norm(canonLabel))?.id;
      if (id && !m.has(aliasKey)) m.set(aliasKey, id);
    }
    return m;
  }, [tiposIdent]);

  // columnas en el mismo orden que tu Excel
  const columns = useMemo(
    () => [
      {
        key: "tipoIdentificacionId",
        label: "Tipo Doc.",
        type: "combo",
        options: tiposIdent.map((t) => ({ value: t.id, label: t.nombre })),
        paste: (val) => tipoDocByKey.get(norm(val)) ?? "",
        fromDisplay: (display) => tipoDocByKey.get(norm(display)) ?? "",
        toDisplay: (id) => tiposIdent.find((t) => t.id === id)?.nombre ?? "",
      },
      { key: "identificacion", label: "N° Ident.", type: "text", paste: (v) => String(v).trim() },
      { key: "nombre", label: "Nombres", type: "text", paste: (v) => String(v).trim() },
      { key: "apellido", label: "Apellidos", type: "text", paste: (v) => String(v).trim() },
      {
        key: "sexo",
        label: "Sexo",
        type: "combo",
        options: sexos.map((s) => ({ value: s, label: s })),
        paste: (val) => sexoByKey.get(norm(val)) ?? "",
        fromDisplay: (display) => sexoByKey.get(norm(display)) ?? "",
        toDisplay: (v) => v ?? "",
      },
      { key: "direccion", label: "Dirección", type: "text", paste: (v) => String(v).trim().slice(0, 255) },
      { key: "fechaNacimiento", label: "F. Nacimiento", type: "date", paste: toISODate },
      { key: "fechaInicio", label: "F. Inicio", type: "date", paste: toISODate },
      {
        key: "puesto",
        label: "Puesto",
        type: "combo",
        options: puestos.map((p) => ({ value: p.nombre, label: p.nombre })),

        // Si coincide con un puesto existente, usa ese nombre.
        // Si no, deja el texto libre (para que el backend lo cree).
        paste: (val) => {
          const raw = String(val || "").trim();
          const hit = puestoByKey.get(norm(raw));
          return hit ?? raw.slice(0, 120); // límite de seguridad
        },
        fromDisplay: (display) => {
          const raw = String(display || "").trim();
          const hit = puestoByKey.get(norm(raw));
          return hit ?? raw.slice(0, 120);
        },
        toDisplay: (v) => v ?? "",
      },
      {
        key: "tipoRiesgoPuesto",
        label: "Riesgo puesto",
        type: "combo",
        options: RIESGOS.map((v) => ({ value: v, label: v })),
        paste: (v) => {
          const k = norm(v);
          if (k.includes("alto")) return "Alto Riesgo";
          if (k.includes("bajo")) return "Bajo Riesgo";
          if (k.includes("no incluye") || k === "no" || k === "ninguno") return "No incluye";
          return "";
        },
        fromDisplay: (display) => {
          const k = norm(display);
          if (k.includes("alto")) return "Alto Riesgo";
          if (k.includes("bajo")) return "Bajo Riesgo";
          if (k.includes("no incluye")) return "No incluye";
          return "";
        },
        toDisplay: (v) => v ?? "",
      },
      { key: "numero", label: "Teléfono", type: "text", paste: (v) => String(v).trim().slice(0, 30) },
      { key: "correo", label: "Correo", type: "email", paste: (v) => String(v).trim().slice(0, 255) },
    ],
    [tiposIdent, sexos, puestos, tipoDocByKey, sexoByKey, puestoByKey]
  );

  const defaults = useMemo(
    () => ({
      tipoIdentificacionId: "",
      sexo: "",
      puesto: "",
      tipoRiesgoPuesto: "",
    }),
    []
  );

  useEffect(() => {
    if (!open) return;
    const n = clamp(rowsCount, 1, 300);
    setRows(
      Array.from({ length: n }, () => ({
        ...defaults,
        identificacion: "",
        nombre: "",
        apellido: "",
        direccion: "",
        fechaInicio: "",
        fechaNacimiento: "",
        correo: "",
        numero: "",
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleRowsCount = (e) => {
    const n = clamp(+e.target.value || 1, 1, 300);
    setRowsCount(n);
    setRows((prev) => {
      const next = [...prev];
      if (n > prev.length) {
        for (let i = prev.length; i < n; i++)
          next.push({
            ...defaults,
            identificacion: "",
            nombre: "",
            apellido: "",
            direccion: "",
            fechaInicio: "",
            fechaNacimiento: "",
            correo: "",
            numero: "",
          });
      } else next.length = n;
      return next;
    });
  };

  const setCell = (r, key, val) => {
    setRows((prev) => {
      const next = [...prev];
      next[r] = { ...next[r], [key]: val };
      return next;
    });
  };

  /* =========== PEGADO AVANZADO (tabla completa) =========== */

  // detecta delimitador: tab > ; > ,
  const detectDelim = (s) => {
    if (s.includes("\t")) return "\t";
    // preferir ; si hay ; y no hay tabs
    if (s.includes(";")) return ";";
    return ",";
  };

  const splitRow = (row, delim) => {
    // quita comillas envolventes si vienen
    return row.split(delim).map((cell) => {
      let v = cell;
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      return v.trim();
    });
  };

  const looksLikeHeader = (sliceCols, firstValues) => {
    // si el primer renglón coincide (normalizado) con labels visibles, lo tomamos como header
    const labels = sliceCols.map((c) => norm(c.label));
    const vals = firstValues.map((v) => norm(v));
    // al menos 60% de match
    let hits = 0;
    const n = Math.min(labels.length, vals.length);
    for (let i = 0; i < n; i++) if (labels[i] === vals[i]) hits++;
    return n > 0 && hits / n >= 0.6;
  };

  const handleGridPaste = (e, rStart, cStart) => {
    const txt = e.clipboardData?.getData("text") ?? "";
    if (!txt) return;
    e.preventDefault();

    const delim = detectDelim(txt);
    const rawLines = lines(txt);
    if (!rawLines.length) return;

    // parse a matriz
    const matrix = rawLines.map((row) => splitRow(row, delim));

    // si parece tener encabezado (coincide con labels a partir de cStart), saltarlo
    const colSlice = columns.slice(cStart);
    if (looksLikeHeader(colSlice, matrix[0])) {
      matrix.shift();
      if (!matrix.length) return;
    }

    setRows((prev) => {
      const next = [...prev];

      for (let i = 0; i < matrix.length; i++) {
        const rIdx = rStart + i;
        if (rIdx >= next.length) break;

        const rowObj = { ...next[rIdx] };
        const rowVals = matrix[i];

        for (let j = 0; j < rowVals.length; j++) {
          const cIdx = cStart + j;
          if (cIdx >= columns.length) break;

          const colCfg = columns[cIdx];
          const normalize = colCfg?.paste || ((v) => v);
          rowObj[colCfg.key] = normalize(rowVals[j]);
        }

        next[rIdx] = rowObj;
      }

      return next;
    });
  };

  // pegado vertical (fallback cuando solo pegas una columna en una celda)
  const handleSingleColumnPaste = (e, rStart, colKey) => {
    const txt = e.clipboardData?.getData("text") ?? "";
    if (!txt) return;
    e.preventDefault();

    const colCfg = columns.find((c) => c.key === colKey);
    const normalize = colCfg?.paste || ((v) => v);
    const L = lines(txt);

    setRows((prev) => {
      const next = [...prev];
      for (let i = 0; i < L.length; i++) {
        const rIdx = rStart + i;
        if (rIdx >= next.length) break;
        const normVal = normalize(L[i]);
        next[rIdx] = { ...next[rIdx], [colKey]: normVal };
      }
      return next;
    });
  };

  // decide si es “tabla” (hay tab/;/, y más de 1 col) o “una sola columna”
  const onPasteSmart = (e, rStart, cStart, colKey) => {
    const txt = e.clipboardData?.getData("text") ?? "";
    if (!txt) return;
    const delim = detectDelim(txt);
    const firstLine = (txt.split(/\r\n|\n|\r/)[0] || "");
    const cols = splitRow(firstLine, delim);
    if (cols.length > 1 || txt.includes("\t")) {
      handleGridPaste(e, rStart, cStart);
    } else {
      handleSingleColumnPaste(e, rStart, colKey);
    }
  };

  /* ========================================================== */

  const confirm = () => {
    const out = rows
      .map((r) => ({
        ...r,
        tipoRiesgoPuesto: r.tipoRiesgoPuesto || "",
        nombre: (r.nombre || "").trim(),
        apellido: (r.apellido || "").trim(),
        identificacion: (r.identificacion || "").trim(),
        direccion: (r.direccion || "").trim(),
        correo: (r.correo || "").trim(),
        numero: (r.numero || "").trim(),
      }))
      .filter((r) => r.nombre || r.apellido || r.identificacion);
    onConfirm?.(out);
    onClose?.();
  };

  if (!open) return null;

  return (
    <div className="modal-mask" onMouseDown={onClose}>
      <div className="modal-panel modal-panel--wide" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Añadir múltiples trabajadores</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="bulk-controls">
            <label>Cantidad de filas</label>
            <input type="number" min={1} max={300} value={rowsCount} onChange={handleRowsCount} />
            <div className="hint">
              Puedes pegar <strong>una columna</strong> o una <strong>tabla completa de Excel</strong>. Si la primera fila son encabezados, los detectamos y los omitimos.
            </div>
          </div>

          <div className="bulk-table-wrapper">
            <table className="bulk-table">
              <colgroup>
                <col style={{ width: "48px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "240px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "200px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "220px" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>#</th>
                  {columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="idx">{rIdx + 1}</td>
                    {columns.map((col, cIdx) => {
                      const datalistId = `dl-${col.key}`;
                      if (col.type === "combo") {
                        const display = col.toDisplay ? col.toDisplay(row[col.key]) : row[col.key] ?? "";
                        return (
                          <td
                            key={col.key}
                            onPaste={(e) => onPasteSmart(e, rIdx, cIdx, col.key)}
                          >
                            <input
                              list={datalistId}
                              value={display}
                              onChange={(e) => {
                                const v = e.target.value;
                                const mapped = col.fromDisplay ? col.fromDisplay(v) : v;
                                setCell(rIdx, col.key, mapped);
                              }}
                              placeholder="-- seleccionar --"
                              title={display || ""}
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck={false}
                              name={`${col.key}-${rIdx}`}
                            />
                            <datalist id={datalistId}>
                              {col.options.map((opt) => (
                                <option key={`${col.key}-${opt.value}`} value={opt.label} />
                              ))}
                            </datalist>
                          </td>
                        );
                      }
                      return (
                        <td key={col.key} onPaste={(e) => onPasteSmart(e, rIdx, cIdx, col.key)}>
                          <input
                            type={col.type === "date" ? "date" : col.type}
                            value={row[col.key] ?? ""}
                            onChange={(e) => setCell(rIdx, col.key, e.target.value)}
                            placeholder={col.type === "date" ? "dd/mm/aaaa o yyyy-mm-dd" : ""}
                            title={row[col.key] ?? ""}
                            autoComplete="off"
                            autoCorrect="off"
                            autoCapitalize="off"
                            spellCheck={false}
                            name={`${col.key}-${rIdx}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-save" onClick={confirm}>
            Agregar filas
          </button>
        </div>
      </div>
    </div>
  );
}

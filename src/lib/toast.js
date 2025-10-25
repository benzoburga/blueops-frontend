// src/lib/toast.js
let toastContainer;

function ensureContainer() {
  if (toastContainer) return toastContainer;
  toastContainer = document.createElement("div");
  toastContainer.id = "toast-container";
  Object.assign(toastContainer.style, {
    position: "fixed",
    right: "16px",
    bottom: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    zIndex: 9999,
    pointerEvents: "none", // no bloquea clicks
  });
  document.body.appendChild(toastContainer);
  return toastContainer;
}

export function toast(message, { type = "success", duration = 3000 } = {}) {
  const container = ensureContainer();

  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;

  // estilos inline (rápido) + animación
  Object.assign(el.style, {
    pointerEvents: "auto",
    minWidth: "260px",
    maxWidth: "360px",
    padding: "10px 12px",
    borderRadius: "10px",
    color: "#0f172a",
    background: "#e2e8f0",
    boxShadow: "0 10px 25px rgba(2,8,23,.12)",
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: 500,
    transform: "translateY(8px)",
    opacity: "0",
    transition: "all .25s ease",
    borderLeft: "6px solid #64748b",
  });

  // colores por tipo
  const colors = {
    success: { bg: "#e8fff1", border: "#22c55e" },
    info:    { bg: "#eef6ff", border: "#3b82f6" },
    warn:    { bg: "#fff7ed", border: "#f59e0b" },
    error:   { bg: "#fff1f2", border: "#ef4444" },
  };
  const c = colors[type] || colors.success;
  el.style.background = c.bg;
  el.style.borderLeftColor = c.border;

  // botón de cierre
  const close = document.createElement("button");
  close.innerHTML = "&times;";
  Object.assign(close.style, {
    background: "transparent",
    border: "none",
    color: "#334155",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: "16px",
    marginLeft: "12px",
  });
  close.addEventListener("click", () => remove());
  const row = document.createElement("div");
  Object.assign(row.style, { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" });
  const text = document.createElement("div");
  text.textContent = message;
  row.appendChild(text);
  row.appendChild(close);
  el.textContent = "";
  el.appendChild(row);

  // montar
  container.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transform = "translateY(0)";
    el.style.opacity = "1";
  });

  let timer = setTimeout(remove, duration);

  // si el mouse pasa por encima, pausa el autohide
  el.addEventListener("mouseenter", () => clearTimeout(timer));
  el.addEventListener("mouseleave", () => (timer = setTimeout(remove, 1200)));

  function remove() {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => container.contains(el) && container.removeChild(el), 200);
  }

  return { close: remove };
}

export function confirmToast(
  message,
  { okText = "Sí, archivar", cancelText = "Cancelar" } = {}
) {
  const container = ensureContainer();

  const el = document.createElement("div");
  Object.assign(el.style, {
    pointerEvents: "auto",
    minWidth: "300px",
    maxWidth: "420px",
    padding: "12px",
    borderRadius: "12px",
    background: "#fff7ed",            // ámbar suave
    borderLeft: "6px solid #f59e0b",
    boxShadow: "0 10px 25px rgba(2,8,23,.12)",
    transform: "translateY(8px)",
    opacity: "0",
    transition: "all .25s ease",
  });

  const text = document.createElement("div");
  Object.assign(text.style, {
    marginBottom: "12px",
    color: "#111827",
    fontWeight: 600,
    fontSize: "14px",
    lineHeight: "20px",
  });
  text.textContent = message;

  const row = document.createElement("div");
  Object.assign(row.style, {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  });

  // ⬅️ CANCELAR: borde y texto rojo, con hover
  const btnCancel = document.createElement("button");
  Object.assign(btnCancel.style, {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid #ef4444",
    background: "#fff",
    color: "#ef4444",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    lineHeight: "20px",
  });
  btnCancel.textContent = cancelText;
  btnCancel.addEventListener("mouseenter", () => (btnCancel.style.background = "#fff1f2"));
  btnCancel.addEventListener("mouseleave", () => (btnCancel.style.background = "#fff"));

  // ✅ ACEPTAR: botón ámbar
  const btnOk = document.createElement("button");
  Object.assign(btnOk.style, {
    padding: "8px 12px",
    borderRadius: "10px",
    border: "none",
    background: "#f59e0b",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "14px",
    lineHeight: "20px",
  });
  btnOk.textContent = okText;

  row.appendChild(btnCancel);
  row.appendChild(btnOk);
  el.appendChild(text);
  el.appendChild(row);
  container.appendChild(el);

  requestAnimationFrame(() => {
    el.style.transform = "translateY(0)";
    el.style.opacity = "1";
  });

  const close = () => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => container.contains(el) && container.removeChild(el), 200);
  };

  return new Promise((resolve) => {
    btnCancel.addEventListener("click", () => { close(); resolve(false); });
    btnOk.addEventListener("click", () => { close(); resolve(true); });
  });
}



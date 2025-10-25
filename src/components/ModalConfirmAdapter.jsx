import DeleteConfirmModal from '@/components/DeleteConfirmModal';

// Adaptador de props para distintos nombres posibles
export default function ModalConfirmAdapter({ open, title, message, onAccept, onCancel }) {
  return (
    <DeleteConfirmModal
      // visibilidad (manda todos los alias comunes)
      open={open}
      isOpen={open}
      show={open}
      visible={open}

      // título y texto (manda alias)
      title={title}
      heading={title}
      header={title}
      message={message}
      description={message}
      body={message}

      // acciones (manda alias)
      onConfirm={onAccept}
      onAccept={onAccept}
      onOk={onAccept}
      onYes={onAccept}

      onCancel={onCancel}
      onClose={onCancel}
      onDismiss={onCancel}
      onNo={onCancel}
    />
  );
}

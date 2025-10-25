//UseDocumentAssigner.js
import { useState } from 'react';
import { clients } from '../../../../mocks/clients';
import { categories } from '../../../../mocks/categories';
import { clientFiles } from '../../../../mocks/clientFiles';


export default function useDocumentAssigner() {
  const [selectedClient, setSelectedClient] = useState(clients[0].id);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [showModal, setShowModal] = useState(false);

  return {
    selectedClient, setSelectedClient,
    selectedCategory, setSelectedCategory,
    selectedFiles, setSelectedFiles,
    selectedWorkers, setSelectedWorkers,
    showModal, setShowModal,
    files: clientFiles[selectedCategory]
  };
}

import { clients } from './clients';
import { categories } from './categories';

const structuredFiles = {
  2025: {
    Reglamentos: [
      {
        name: 'RIT Reglamento interno de seguridad y salud en el trabajo.pdf',
        type: 'pdf',
        code: 'SST.PO.001',
        approvalDate: '16/03/2022',
        uploadDate: '20/03/2022',
        version: '1',
        versions: [],
        url: '/archivos/SST.RG.001 Reglamento Interno de Seguridad y Salud en el Trabajo.pdf'
      },
      
    ]
  },
  2024: {
    Monitoreo: [
      {
        name: '2024.12 Informe de Monitoreo Biológico.pdf',
        type: 'pdf',
        code: 'SST.PO.001',
        approvalDate: '16/03/2022',
        uploadDate: '20/03/2024',
        version: '1',
        versions: []
      },
      {
        name: 'Política SST.pdf',
        type: 'pdf',
        code: 'SST.PO.001',
        approvalDate: '16/03/2022',
        uploadDate: '20/03/2024',
        version: '1',
        versions: []
      }
    ]
  },
  2023: {
    General: [
      {
        name: 'SIG.PO.001 POLITICA DEL SISTEMA INTEGRADO DE GESTION.pdf',
        type: 'pdf',
        code: 'SST.PO.001',
        approvalDate: '01/01/2025',
        uploadDate: '04/01/2025',
        version: '1',
        versions: []
      },
      {
        name: 'SIG.PO.001 POLITICA DEL SISTEMA INTEGRADO DE GESTION.pdf',
        type: 'pdf',
        code: 'SST.PO.001',
        approvalDate: '01/01/2025',
        uploadDate: '04/01/2025',
        version: '1',
        versions: []
      },
      {
        name: '2025.01.20 Informe de Gestión SST 2025.pdf',
        type: 'pdf',
        code: 'No incluye',
        approvalDate: 'No incluye',
        uploadDate: '04/01/2025',
        version: '1',
        versions: []
      }
    ]
  }
};


// Mismo contenido para todos los clientes y categorías (puedes personalizar luego)
export const clientFiles = Object.fromEntries(
  clients.map(client => [
    client.id,
    Object.fromEntries(
      categories.map(cat => [cat, cat === 'Políticas y Reglamentos' ? structuredFiles : {}])
    )
  ])
);
export default clientFiles;


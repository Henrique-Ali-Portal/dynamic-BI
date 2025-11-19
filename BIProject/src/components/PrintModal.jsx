import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { fetchData, fetchJoinedData } from '../services/dataService'; // Import fetchData and fetchJoinedData

// Import the specific widget components
import SimpleBarChart from './widgets/BarChart';
import SingleValue from './widgets/SingleValue';
import Table from './widgets/Table';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    // Applying fixed width always as requested
    width: '29.7cm', 
    maxWidth: '29.7cm', 
    maxHeight: '90vh',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '0', // Padding will be handled by inner divs
    display: 'flex',
    flexDirection: 'column',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
};

Modal.setAppElement('#root'); // Ensure this is set to your app's root element

const UnknownWidget = ({ type }) => (
  <div className="text-center text-red-500">
    <p>Tipo de widget desconhecido: "{type}"</p>
  </div>
);

function PrintModal({ isOpen, onRequestClose, widget, activeGlobalFilters }) {
  const [printData, setPrintData] = useState(null);
  const [loadingPrintData, setLoadingPrintData] = useState(true);
  const [printDataError, setPrintDataError] = useState(null);

  useEffect(() => {
    async function loadPrintData() {
      if (!isOpen || !widget || (!widget.dataSource && !widget.relationshipName)) {
        setPrintData(null);
        setLoadingPrintData(false);
        setPrintDataError(null);
        return;
      }

      setLoadingPrintData(true);
      setPrintDataError(null);
      try {
        let data = null;
        if (widget.dataSource) {
          data = await fetchData(widget.dataSource, activeGlobalFilters);
        } else if (widget.relationshipName) {
          data = await fetchJoinedData(widget.relationshipName, activeGlobalFilters);
        }
        setPrintData(data);
      } catch (err) {
        console.error(`Erro ao carregar dados para impressão do widget ${widget.id} da fonte/relação ${widget.dataSource || widget.relationshipName}:`, err);
        setPrintDataError(`Erro ao carregar dados para impressão: ${err.message}`);
      } finally {
        setLoadingPrintData(false);
      }
    }
    loadPrintData();
  }, [isOpen, widget, activeGlobalFilters]); // Re-fetch when modal opens, widget or activeGlobalFilters changes

  useEffect(() => {
    if (isOpen && !loadingPrintData && !printDataError && printData) {
      const timer = setTimeout(() => {
        window.print();
        onRequestClose(); // Close modal automatically after print dialog is opened
      }, 500); // Delay to allow content to render

      // Cleanup function to clear timeout if modal closes before print dialog opens
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isOpen, loadingPrintData, printDataError, printData, onRequestClose]); // Added printData to dependency array

  const renderContent = () => {
    if (!widget) return null;

    if (loadingPrintData) {
      return <div className="text-center text-blue-500">Carregando dados para impressão...</div>;
    }

    if (printDataError) {
      return <div className="text-center text-red-600">Erro: {printDataError}</div>;
    }

    if (!printData || printData.length === 0) {
      return <div className="text-center text-gray-500">Nenhum dado disponível para impressão.</div>;
    }

    switch (widget.type) {
      case 'bar':
        return <SimpleBarChart data={printData} config={widget.config} />;
      case 'singleValue':
        return <SingleValue data={printData} config={widget.config} />;
      case 'table':
        return <Table data={printData} config={widget.config} />;
      default:
        return <UnknownWidget type={widget.type} />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      contentLabel="Imprimir Componente"
    >
      {/* This is the content that will be visible on screen AND printed */}
      <div className="printable-content p-8">
        <h2 className="text-2xl font-bold mb-4">{widget?.config?.title || 'Componente'}</h2>
        <div className="print-widget-content" style={{ height: '60vh', width: '100%' }}>
          {renderContent()}
        </div>
      </div>
      
      {/* This part is hidden during printing */}
      <div className="p-4 bg-gray-100 border-t text-center print-hidden">
        <p>A janela de impressão foi aberta. Se não, verifique as configurações do seu navegador.</p>
        {/* Removed "Imprimir Agora" button */}
        <button onClick={onRequestClose} className="mt-2 px-4 py-2 bg-gray-300 rounded-md">Fechar</button>
      </div>

      <style>
        {`
          @page {
            margin: 1.5cm; /* Margins for the printed page */
          }
          @media print {
            /* Hide the main application content */
            #root {
              display: none !important;
            }
            /* Ensure the modal overlay doesn't interfere visually, but doesn't hide content */
            .ReactModal__Overlay {
              background-color: transparent !important;
              position: static !important; /* Allow content to flow naturally */
              overflow: visible !important;
            }
            /* Ensure the modal content is visible and takes full width */
            .ReactModal__Content {
              position: static !important;
              inset: auto !important;
              border: none !important;
              padding: 0 !important;
              /* Width and max-width are now set in customStyles, so no need to override here unless different for print */
              height: auto !important;
              max-height: none !important;
              border-radius: 0 !important;
              transform: none !important;
              overflow: visible !important;
              background-color: white !important; /* Ensure white background */
            }
            /* Hide the close button/footer of the modal */
            .print-hidden {
              display: none !important;
            }
            /* Adjust widget content for print */
            .print-widget-content {
              height: auto !important;
              width: 100% !important; /* This will be 100% of the 29.7cm parent */
              max-width: 100% !important;
              /* Removed page-break-inside: avoid; to allow table to break across pages */
            }
            /* Ensure title can break if needed */
            .printable-content h2 {
              page-break-after: auto !important;
              page-break-before: auto !important;
              page-break-inside: auto !important;
            }
            /* Explicitly allow table content to break across pages */
            table, table tbody, table thead, table tr, table td, table th {
              page-break-inside: auto !important;
            }
            /* Override overflow and height for the table's wrapper div in print */
            .overflow-auto.h-full {
              overflow: visible !important;
              height: auto !important;
            }
            /* Force Recharts ResponsiveContainer and SVG to take full width */
            .recharts-responsive-container {
              width: 100% !important;
              max-width: 100% !important;
            }
            .recharts-wrapper svg {
              width: 100% !important;
              max-width: 100% !important;
            }
          }
        `}
      </style>
    </Modal>
  );
}

export default PrintModal;
import React from 'react';
import Modal from 'react-modal';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '80vh',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
};

Modal.setAppElement('#root');

function DataSourceModal({ isOpen, onRequestClose, dataSources, onSelectSource }) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      contentLabel="Selecionar Fonte de Dados"
    >
      <h2 className="text-2xl font-bold mb-4">Selecionar Fonte de Dados</h2>
      <div className="flex-grow overflow-y-auto mb-4">
        {dataSources.length === 0 ? (
          <p className="text-gray-500">Nenhuma fonte de dados encontrada.</p>
        ) : (
          <ul>
            {dataSources.map((source, index) => (
              <li key={index} className="mb-2">
                <button
                  onClick={() => onSelectSource(source)}
                  className="w-full text-left px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  {source}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="text-right">
        <button onClick={onRequestClose} className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400">Fechar</button>
      </div>
    </Modal>
  );
}

export default DataSourceModal;

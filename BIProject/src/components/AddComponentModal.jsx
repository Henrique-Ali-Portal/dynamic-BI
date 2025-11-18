import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';

import BarChartForm from './forms/BarChartForm';
import SingleValueForm from './forms/SingleValueForm';
import TableForm from './forms/TableForm';
import { listRelationships } from '../services/dataService'; // Import listRelationships

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '600px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '2rem',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
};

Modal.setAppElement('#root');

function AddComponentModal({ isOpen, onRequestClose, onWidgetAdd, availableColumns, availableDataSources, editingWidget }) {
  const [step, setStep] = useState(1);
  const [widgetType, setWidgetType] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState('');
  const [selectedRelationship, setSelectedRelationship] = useState(''); // New state for selected relationship
  const [sourceType, setSourceType] = useState('dataSource'); // 'dataSource' or 'relationship'
  const [availableRelationships, setAvailableRelationships] = useState([]); // New state for available relationships

  // Effect to handle editingWidget prop changes
  useEffect(() => {
    if (editingWidget) {
      setWidgetType(editingWidget.type);
      if (editingWidget.dataSource) {
        setSourceType('dataSource');
        setSelectedDataSource(editingWidget.dataSource);
      } else if (editingWidget.relationshipName) {
        setSourceType('relationship');
        setSelectedRelationship(editingWidget.relationshipName);
      }
      setStep(2); // Go directly to step 2 for editing
    } else {
      setStep(1); // Back to step 1 for adding new
      setWidgetType(null);
      setSourceType('dataSource'); // Default to data source
      setSelectedDataSource(availableDataSources.length > 0 ? availableDataSources[0] : ''); // Set default or first available
      setSelectedRelationship(availableRelationships.length > 0 ? availableRelationships[0].name : ''); // Set default or first available relationship
    }
  }, [editingWidget, availableDataSources, availableRelationships]);

  // Effect to load available relationships
  useEffect(() => {
    async function loadRelationships() {
      try {
        const relationships = await listRelationships();
        setAvailableRelationships(relationships);
        if (relationships.length > 0) {
          setSelectedRelationship(relationships[0].name);
        }
      } catch (error) {
        console.error("Erro ao carregar relações:", error);
      }
    }
    if (isOpen) { // Only load relationships when modal is open
      loadRelationships();
    }
  }, [isOpen]);

  const handleTypeSelect = (type) => {
    setWidgetType(type);
    setStep(2);
  };

  const handleClose = () => {
    setStep(1);
    setWidgetType(null);
    setSourceType('dataSource'); // Reset to default
    setSelectedDataSource(availableDataSources.length > 0 ? availableDataSources[0] : ''); // Reset selected data source
    setSelectedRelationship(availableRelationships.length > 0 ? availableRelationships[0].name : ''); // Reset selected relationship
    onRequestClose(); // This will also clear editingWidget in Dashboard
  };

  const handleFormSubmit = (formData) => {
    const widgetConfig = {
      type: widgetType,
      config: formData,
    };
    if (sourceType === 'dataSource') {
      widgetConfig.dataSource = selectedDataSource;
    } else {
      widgetConfig.relationshipName = selectedRelationship;
    }
    onWidgetAdd(widgetConfig);
    handleClose();
  };

  const renderStepOne = () => (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">{editingWidget ? "Editar Componente" : "Adicionar Novo Componente"}</h2>
      
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Tipo de Fonte
        </label>
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="sourceType"
              value="dataSource"
              checked={sourceType === 'dataSource'}
              onChange={() => setSourceType('dataSource')}
              disabled={editingWidget ? true : false}
            />
            <span className="ml-2">Fonte Direta</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio"
              name="sourceType"
              value="relationship"
              checked={sourceType === 'relationship'}
              onChange={() => setSourceType('relationship')}
              disabled={editingWidget ? true : false}
            />
            <span className="ml-2">Relação</span>
          </label>
        </div>
      </div>

      {sourceType === 'dataSource' && (
        <div className="mb-6">
          <label htmlFor="dataSourceSelect" className="block text-gray-700 text-sm font-bold mb-2">
            {editingWidget ? "Fonte de Dados Atual" : "Selecione a Fonte de Dados"}
          </label>
          <select
            id="dataSourceSelect"
            value={selectedDataSource}
            onChange={(e) => setSelectedDataSource(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={editingWidget ? true : false} // Disable if editing
          >
            {availableDataSources.length === 0 ? (
              <option value="">Nenhuma fonte disponível</option>
            ) : (
              availableDataSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))
            )}
          </select>
          {availableDataSources.length === 0 && (
            <p className="text-red-500 text-xs italic mt-2">Nenhuma fonte de dados encontrada. Certifique-se de que há arquivos .xlsx na pasta 'backend/data/'.</p>
          )}
        </div>
      )}

      {sourceType === 'relationship' && (
        <div className="mb-6">
          <label htmlFor="relationshipSelect" className="block text-gray-700 text-sm font-bold mb-2">
            {editingWidget ? "Relação Atual" : "Selecione a Relação"}
          </label>
          <select
            id="relationshipSelect"
            value={selectedRelationship}
            onChange={(e) => setSelectedRelationship(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={editingWidget ? true : false} // Disable if editing
          >
            {availableRelationships.length === 0 ? (
              <option value="">Nenhuma relação disponível</option>
            ) : (
              availableRelationships.map((rel) => (
                <option key={rel.name} value={rel.name}>
                  {rel.name}
                </option>
              ))
            )}
          </select>
          {availableRelationships.length === 0 && (
            <p className="text-red-500 text-xs italic mt-2">Nenhuma relação encontrada. Crie uma na tela de relações.</p>
          )}
        </div>
      )}

      <p className="text-gray-600 mb-8 text-center">Selecione o tipo de componente que você deseja criar.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => handleTypeSelect('bar')} 
          className="p-6 border rounded-lg hover:bg-gray-100 hover:border-green-500 transition"
          disabled={sourceType === 'dataSource' ? !selectedDataSource : !selectedRelationship}
        >
          Gráfico de Barras
        </button>
        <button 
          onClick={() => handleTypeSelect('singleValue')} 
          className="p-6 border rounded-lg hover:bg-gray-100 hover:border-green-500 transition"
          disabled={sourceType === 'dataSource' ? !selectedDataSource : !selectedRelationship}
        >
          Valor Único
        </button>
        <button 
          onClick={() => handleTypeSelect('table')} 
          className="p-6 border rounded-lg hover:bg-gray-100 hover:border-green-500 transition"
          disabled={sourceType === 'dataSource' ? !selectedDataSource : !selectedRelationship}
        >
          Tabela
        </button>
      </div>
    </div>
  );

  const renderStepTwo = () => {
    const formProps = {
      onSubmit: handleFormSubmit,
      onCancel: handleClose,
      availableColumns: availableColumns, // This prop is now less relevant, forms fetch their own
      availableDataSources: availableDataSources, // Still useful for context
      selectedDataSource: sourceType === 'dataSource' ? selectedDataSource : null,
      selectedRelationship: sourceType === 'relationship' ? selectedRelationship : null,
      defaultValues: editingWidget ? editingWidget.config : {}, // Pass default values for editing
    };

    switch (widgetType) {
      case 'bar':
        return <BarChartForm {...formProps} />;
      case 'singleValue':
        return <SingleValueForm {...formProps} />;
      case 'table':
        return <TableForm {...formProps} />;
      default:
        return <p>Tipo de componente inválido.</p>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={customStyles}
      contentLabel={editingWidget ? "Editar Componente" : "Adicionar Componente"}
    >
      <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl leading-none">&times;</button>
      {step === 1 ? renderStepOne() : renderStepTwo()}
    </Modal>
  );
}

export default AddComponentModal;

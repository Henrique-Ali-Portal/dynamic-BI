import React, { useState, useEffect } from 'react';
import { fetchData, fetchJoinedData } from '../services/dataService'; // Import fetchData and fetchJoinedData

// Import the specific widget components
import SimpleBarChart from './widgets/BarChart';
import SingleValue from './widgets/SingleValue';
import Table from './widgets/Table';

// A component to render a placeholder for unknown widget types
const UnknownWidget = ({ type }) => (
  <div className="text-center text-red-500">
    <p>Tipo de widget desconhecido: "{type}"</p>
  </div>
);

// The main Widget component that acts as a dispatcher
function Widget({ widget, onEdit, onRemove, onDuplicate, onPrint }) {
  const { id, type, config, dataSource, relationshipName } = widget; // Include relationshipName

  const [widgetData, setWidgetData] = useState(null);
  const [loadingWidgetData, setLoadingWidgetData] = useState(true);
  const [widgetDataError, setWidgetDataError] = useState(null);

  useEffect(() => {
    async function loadWidgetData() {
      setLoadingWidgetData(true);
      setWidgetDataError(null);
      let data = null;

      try {
        if (dataSource) {
          data = await fetchData(dataSource);
        } else if (relationshipName) {
          data = await fetchJoinedData(relationshipName);
        } else {
          setWidgetData(null);
          setLoadingWidgetData(false);
          setWidgetDataError("Nenhuma fonte de dados ou relação especificada para o widget.");
          return;
        }
        setWidgetData(data);
      } catch (err) {
        console.error(`Erro ao carregar dados para o widget ${id} da fonte/relação ${dataSource || relationshipName}:`, err);
        setWidgetDataError(`Erro ao carregar dados: ${err.message}`);
      } finally {
        setLoadingWidgetData(false);
      }
    }
    loadWidgetData();
  }, [dataSource, relationshipName, id]); // Re-fetch when dataSource or relationshipName changes

  const renderContent = () => {
    if (loadingWidgetData) {
      return <div className="text-center text-blue-500">Carregando dados do widget...</div>;
    }

    if (widgetDataError) {
      return <div className="text-center text-red-600">Erro: {widgetDataError}</div>;
    }

    if (!widgetData || widgetData.length === 0) {
      return <div className="text-center text-gray-500">Nenhum dado disponível.</div>;
    }

    switch (type) {
      case 'bar':
        return <SimpleBarChart data={widgetData} config={config} />;
      case 'singleValue':
        return <SingleValue data={widgetData} config={config} />;
      case 'table':
        return <Table data={widgetData} config={config} />;
      default:
        return <UnknownWidget type={type} />;
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-md flex flex-col h-full">
      <div className="p-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">{config.title || `Widget ${id.split('-')[1]}`}</h3>
        <div className="flex space-x-2 no-drag">
          <button
            onClick={() => onPrint(widget)}
            className="text-gray-500 hover:text-gray-800 cursor-pointer"
            title="Imprimir Widget"
          >
            {/* Icon for Print - using a simple text for now */}
            🖨️
          </button>
          <button
            onClick={() => onDuplicate(widget)}
            className="text-gray-500 hover:text-green-600 cursor-pointer"
            title="Duplicar Widget"
          >
            {/* Icon for Duplicate - using a simple text for now */}
            📄
          </button>
          <button
            onClick={() => onEdit(widget)}
            className="text-gray-500 hover:text-blue-600 cursor-pointer"
            title="Editar Widget"
          >
            {/* Icon for Edit - using a simple text for now */}
            ⚙️
          </button>
          <button
            onClick={() => onRemove(widget.id)}
            className="text-gray-500 hover:text-red-600 cursor-pointer"
            title="Remover Widget"
          >
            {/* Icon for Remove - using a simple text for now */}
            🗑️
          </button>
        </div>
      </div>
      <div className="flex-grow p-4 overflow-auto">
        {renderContent()}
      </div>
    </div>
  );
}

export default Widget;
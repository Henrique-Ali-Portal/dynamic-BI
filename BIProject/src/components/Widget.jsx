import React, { useState, useEffect, useMemo } from 'react';
import { fetchData, fetchJoinedData } from '../services/dataService';

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
function Widget({ widget, onEdit, onRemove, onDuplicate, onPrint, activeGlobalFilters }) {
  const { id, type, config, dataSource, relationshipName } = widget;

  const [originalData, setOriginalData] = useState(null);
  const [displayedData, setDisplayedData] = useState(null);
  const [loadingWidgetData, setLoadingWidgetData] = useState(true);
  const [widgetDataError, setWidgetDataError] = useState(null);

  // Effect 1: Fetch raw, unfiltered data when the source changes
  useEffect(() => {
    async function loadWidgetData() {
      setLoadingWidgetData(true);
      setWidgetDataError(null);
      setOriginalData(null);
      setDisplayedData(null);

      try {
        let data = null;
        if (dataSource) {
          data = await fetchData(dataSource);
        } else if (relationshipName) {
          data = await fetchJoinedData(relationshipName);
        } else {
          setWidgetDataError("Nenhuma fonte de dados ou relação especificada para o widget.");
          return;
        }
        setOriginalData(data);
        setDisplayedData(data); // Initially, displayed data is the same as original
      } catch (err) {
        console.error(`Erro ao carregar dados para o widget ${id} da fonte/relação ${dataSource || relationshipName}:`, err);
        setWidgetDataError(`Erro ao carregar dados: ${err.message}`);
      } finally {
        setLoadingWidgetData(false);
      }
    }
    loadWidgetData();
  }, [dataSource, relationshipName, id]);

  // Effect 2: Apply client-side filters whenever activeGlobalFilters or originalData changes
  useEffect(() => {
    if (!originalData) {
      return;
    }

    if (!activeGlobalFilters || activeGlobalFilters.length === 0) {
      setDisplayedData(originalData);
      return;
    }

    let filteredData = [...originalData];

    activeGlobalFilters.forEach(filter => {
      // Ensure the widget's data source matches the filter's data source
      if (filter.sourceName !== dataSource && filter.sourceName !== relationshipName) {
        return; // Skip this filter if it's not for this widget's data source
      }

      filteredData = filteredData.filter(row => {
        const rowValue = row[filter.column];
        if (rowValue === null || rowValue === undefined) {
          return false;
        }

        switch (filter.type) {
          case 'numeric': {
            const numericRowValue = parseFloat(rowValue);
            if (isNaN(numericRowValue)) return false;

            const { operator, value, min_value, max_value } = filter.config;
            if (operator === 'equals' && value !== null) return numericRowValue === value;
            if (operator === 'greater_than' && value !== null) return numericRowValue > value;
            if (operator === 'less_than' && value !== null) return numericRowValue < value;
            if (operator === 'between' && min_value !== null && max_value !== null) {
              return numericRowValue >= min_value && numericRowValue <= max_value;
            }
            return true;
          }

          case 'date': {
            const dateRowValue = new Date(rowValue);
            if (isNaN(dateRowValue.getTime())) return false;
            
            // Normalize to midnight to compare dates only, not times
            dateRowValue.setHours(0, 0, 0, 0);

            const { operator, value, start_date, end_date } = filter.config;
            if (operator === 'equals' && value) {
              const filterDate = new Date(value);
              filterDate.setHours(0,0,0,0);
              return dateRowValue.getTime() === filterDate.getTime();
            }
            if (operator === 'before' && value) return dateRowValue < new Date(value);
            if (operator === 'after' && value) return dateRowValue > new Date(value);
            if (operator === 'between' && start_date && end_date) {
              return dateRowValue >= new Date(start_date) && dateRowValue <= new Date(end_date);
            }
            return true;
          }

          case 'selection': {
            const { selected_options } = filter.config;
            if (!selected_options || selected_options.length === 0) return true; // No selection means don't filter
            return selected_options.includes(String(rowValue));
          }

          default:
            return true;
        }
      });
    });

    setDisplayedData(filteredData);
  }, [activeGlobalFilters, originalData, dataSource, relationshipName]);


  const renderContent = () => {
    if (loadingWidgetData) {
      return <div className="text-center text-blue-500">Carregando dados do widget...</div>;
    }

    if (widgetDataError) {
      return <div className="text-center text-red-600">Erro: {widgetDataError}</div>;
    }

    if (!displayedData || displayedData.length === 0) {
      return <div className="text-center text-gray-500">Nenhum dado disponível.</div>;
    }

    switch (type) {
      case 'bar':
        return <SimpleBarChart data={displayedData} config={config} />;
      case 'singleValue':
        return <SingleValue data={displayedData} config={config} />;
      case 'table':
        return <Table data={displayedData} config={config} />;
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
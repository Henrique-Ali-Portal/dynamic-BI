import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { saveFilter, listFilters, listDataSources, listRelationships, fetchData, fetchJoinedData, deleteFilter } from '../services/dataService';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
};

Modal.setAppElement('#root');

function FilterManagementModal({ isOpen, onRequestClose, onFilterSaved }) {
  const [filterName, setFilterName] = useState('');
  const [sourceType, setSourceType] = useState('dataSource'); // 'dataSource' or 'relationship'
  const [sourceName, setSourceName] = useState('');
  const [column, setColumn] = useState('');
  const [filterType, setFilterType] = useState('numeric'); // 'numeric', 'date', 'selection'
  const [filterConfig, setFilterConfig] = useState({});
  const [availableSources, setAvailableSources] = useState([]);
  const [availableRelationships, setAvailableRelationships] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [uniqueColumnValues, setUniqueColumnValues] = useState([]); // For selection filter
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingFilterName, setEditingFilterName] = useState(null);


  const resetForm = useCallback(() => {
    setFilterName('');
    setSourceType('dataSource');
    setSourceName('');
    setColumn('');
    setFilterType('numeric');
    setFilterConfig({});
    setUniqueColumnValues([]);
    setMessage('');
    setIsEditing(false);
    setEditingFilterName(null);
  }, []);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const [sources, relationships, savedFilters] = await Promise.all([
          listDataSources(),
          listRelationships(),
          listFilters(),
        ]);
        setAvailableSources(sources);
        setAvailableRelationships(relationships.map(r => r.name));
        setFilters(savedFilters);
      } catch (err) {
        console.error("Erro ao carregar dados iniciais para o modal de filtro:", err);
        setError("Erro ao carregar dados iniciais.");
      } finally {
        setLoading(false);
      }
    }
    if (isOpen) {
      loadInitialData();
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    async function loadColumns() {
      if (!sourceName) {
        setAvailableColumns([]);
        return;
      }
      try {
        let data = [];
        // Fetch only a small sample to get column names, not all data
        if (sourceType === 'dataSource') {
          data = await fetchData(sourceName);
        } else {
          data = await fetchJoinedData(sourceName);
        }
        if (data && data.length > 0) {
          setAvailableColumns(Object.keys(data[0]));
        } else {
          setAvailableColumns([]);
        }
      } catch (err) {
        console.error(`Erro ao carregar colunas para ${sourceName}:`, err);
        setAvailableColumns([]);
      }
    }
    loadColumns();
  }, [sourceType, sourceName]);

  // Effect to load unique values for 'selection' filter type
  useEffect(() => {
    async function loadUniqueColumnValues() {
      if (filterType === 'selection' && sourceName && column) {
        try {
          let data = [];
          if (sourceType === 'dataSource') {
            data = await fetchData(sourceName);
          } else {
            data = await fetchJoinedData(sourceName);
          }
          if (data && data.length > 0 && data[0].hasOwnProperty(column)) {
            const values = [...new Set(data.map(item => item[column]))].filter(v => v !== null && v !== undefined).map(String);
            setUniqueColumnValues(values);
          } else {
            setUniqueColumnValues([]);
          }
        } catch (err) {
          console.error(`Erro ao carregar valores únicos para a coluna ${column}:`, err);
          setUniqueColumnValues([]);
        }
      } else {
        setUniqueColumnValues([]);
      }
    }
    loadUniqueColumnValues();
  }, [filterType, sourceType, sourceName, column]);

  const handleSaveFilter = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);

    // Basic validation
    if (!filterName || !sourceName || !column) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const filterPayload = {
      name: filterName,
      sourceType,
      sourceName,
      column,
      type: filterType,
      config: {
        ...filterConfig,
        type: filterType,
      },
    };

    try {
      await saveFilter(filterPayload);
      setMessage(isEditing ? 'Filtro atualizado com sucesso!' : 'Filtro salvo com sucesso!');
      onFilterSaved(); // Notify parent to refresh filters
      const updatedFilters = await listFilters();
      setFilters(updatedFilters);
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar filtro:", err);
      setError(err.message || "Erro ao salvar filtro.");
    }
  };

  const handleEditFilter = (filter) => {
    setFilterName(filter.name);
    setSourceType(filter.sourceType);
    setSourceName(filter.sourceName);
    setColumn(filter.column);
    setFilterType(filter.type);
    setFilterConfig(filter.config || {});
    setIsEditing(true);
    setEditingFilterName(filter.name);
    setMessage('');
    setError(null);
  };

  const handleDeleteFilter = async (name) => {
    if (!window.confirm(`Tem certeza que deseja deletar o filtro "${name}"?`)) {
      return;
    }
    try {
      await deleteFilter(name);
      setMessage(`Filtro "${name}" deletado com sucesso!`);
      onFilterSaved();
      const updatedFilters = await listFilters();
      setFilters(updatedFilters);
    } catch (err) {
      console.error("Erro ao deletar filtro:", err);
      setError(err.message || "Erro ao deletar filtro.");
    }
  };

  const handleClose = () => {
    resetForm();
    onRequestClose();
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onRequestClose={handleClose} style={customStyles} contentLabel="Gerenciar Filtros">
        <div className="text-center py-8">Carregando...</div>
      </Modal>
    );
  }

  const renderFilterConfigInputs = () => {
    switch (filterType) {
      case 'numeric':
        return (
          <>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-2">Operador Numérico:</label>
              <select
                value={filterConfig.operator || 'equals'}
                onChange={(e) => setFilterConfig({ ...filterConfig, operator: e.target.value })}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="equals">Igual a</option>
                <option value="greater_than">Maior que</option>
                <option value="less_than">Menor que</option>
                <option value="between">Entre</option>
              </select>
            </div>
            {filterConfig.operator === 'between' ? (
              <div className="flex gap-2 mb-4">
                <div className="w-1/2">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Valor Mínimo:</label>
                  <input
                    type="number"
                    value={filterConfig.min_value || ''}
                    onChange={(e) => setFilterConfig({ ...filterConfig, min_value: parseFloat(e.target.value) })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    step="any"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Valor Máximo:</label>
                  <input
                    type="number"
                    value={filterConfig.max_value || ''}
                    onChange={(e) => setFilterConfig({ ...filterConfig, max_value: parseFloat(e.target.value) })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    step="any"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Valor:</label>
                <input
                  type="number"
                  value={filterConfig.value || ''}
                  onChange={(e) => setFilterConfig({ ...filterConfig, value: parseFloat(e.target.value) })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  step="any"
                />
              </div>
            )}
          </>
        );
      case 'date':
        return (
          <>
            <div className="mb-3">
              <label className="block text-gray-700 text-sm font-bold mb-2">Operador de Data:</label>
              <select
                value={filterConfig.operator || 'equals'}
                onChange={(e) => setFilterConfig({ ...filterConfig, operator: e.target.value })}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="equals">Igual a</option>
                <option value="before">Antes de</option>
                <option value="after">Depois de</option>
                <option value="between">Entre</option>
              </select>
            </div>
            {filterConfig.operator === 'between' ? (
              <div className="flex gap-2 mb-4">
                <div className="w-1/2">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Data Inicial:</label>
                  <input
                    type="date"
                    value={filterConfig.start_date || ''}
                    onChange={(e) => setFilterConfig({ ...filterConfig, start_date: e.target.value })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Data Final:</label>
                  <input
                    type="date"
                    value={filterConfig.end_date || ''}
                    onChange={(e) => setFilterConfig({ ...filterConfig, end_date: e.target.value })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Data:</label>
                <input
                  type="date"
                  value={filterConfig.value || ''}
                  onChange={(e) => setFilterConfig({ ...filterConfig, value: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
            )}
          </>
        );
      case 'selection':
        return (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Valores Selecionados:</label>
            <div className="border rounded p-2 max-h-40 overflow-y-auto">
              {uniqueColumnValues.length === 0 ? (
                <p className="text-gray-500">Nenhum valor único encontrado para a coluna selecionada.</p>
              ) : (
                uniqueColumnValues.map((val) => (
                  <div key={val} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`selection-${val}`}
                      value={val}
                      checked={(filterConfig.selected_options || []).includes(val)}
                      onChange={(e) => {
                        const newSelectedOptions = e.target.checked
                          ? [...(filterConfig.selected_options || []), val]
                          : (filterConfig.selected_options || []).filter((option) => option !== val);
                        setFilterConfig({ ...filterConfig, selected_options: newSelectedOptions });
                      }}
                      className="mr-2"
                    />
                    <label htmlFor={`selection-${val}`}>{val}</label>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} style={customStyles} contentLabel="Gerenciar Filtros">
      <h2 className="text-2xl font-bold mb-4">Gerenciar Filtros Universais</h2>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>}

      <form onSubmit={handleSaveFilter} className="mb-8 p-4 border rounded-md bg-gray-50">
        <h3 className="text-xl font-semibold mb-3">{isEditing ? `Editar Filtro: ${editingFilterName}` : 'Criar Novo Filtro'}</h3>
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-2">Nome do Filtro:</label>
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            disabled={isEditing} // Cannot change name when editing
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Fonte:</label>
          <select
            value={sourceType}
            onChange={(e) => { setSourceType(e.target.value); setSourceName(''); setColumn(''); setFilterConfig({}); }}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={isEditing}
          >
            <option value="dataSource">Fonte de Dados Direta</option>
            <option value="relationship">Relação de Dados</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-2">Nome da Fonte/Relação:</label>
          <select
            value={sourceName}
            onChange={(e) => { setSourceName(e.target.value); setColumn(''); setFilterConfig({}); }}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            disabled={isEditing}
          >
            <option value="">Selecione...</option>
            {sourceType === 'dataSource' && availableSources.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
            {sourceType === 'relationship' && availableRelationships.map(rel => (
              <option key={rel} value={rel}>{rel}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-2">Coluna:</label>
          <select
            value={column}
            onChange={(e) => { setColumn(e.target.value); setFilterConfig({}); }}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            disabled={isEditing || !sourceName || availableColumns.length === 0}
          >
            <option value="">Selecione...</option>
            {availableColumns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Filtro:</label>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setFilterConfig({}); }}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            disabled={isEditing}
          >
            <option value="numeric">Numérico</option>
            <option value="date">Data</option>
            <option value="selection">Seleção</option>
          </select>
        </div>

        {column && renderFilterConfigInputs()}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isEditing ? 'Atualizar Filtro' : 'Salvar Filtro'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancelar Edição
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Fechar
          </button>
        </div>
      </form>

      <h3 className="text-xl font-semibold mb-3">Filtros Salvos</h3>
      {filters.length === 0 ? (
        <p>Nenhum filtro salvo ainda.</p>
      ) : (
        <ul className="list-disc pl-5">
          {filters.map((f) => (
            <li key={f.name} className="mb-2 p-2 border rounded-md bg-white flex justify-between items-center">
              <div>
                <span className="font-semibold">{f.name}</span>: ({f.sourceName} - {f.column}) Tipo: {f.type}{' '}
                {f.config && f.config.operator && `(${f.config.operator})`}
                {f.config && f.config.value && ` = ${f.config.value}`}
                {f.config && f.config.min_value && f.config.max_value && ` entre ${f.config.min_value} e ${f.config.max_value}`}
                {f.config && f.config.start_date && f.config.end_date && ` entre ${f.config.start_date} e ${f.config.end_date}`}
                {f.config && f.config.selected_options && ` [${f.config.selected_options.join(', ')}]`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditFilter(f)}
                  className="bg-green-500 hover:bg-green-700 text-white text-sm py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteFilter(f.name)}
                  className="bg-red-500 hover:bg-red-700 text-white text-sm py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default FilterManagementModal;
import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { saveFilter, listFilters, listDataSources, listRelationships, fetchData, fetchJoinedData } from '../services/dataService';

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
  const [filterType, setFilterType] = useState('equals'); // equals, contains, greater_than, less_than
  const [filterValue, setFilterValue] = useState('');
  const [availableSources, setAvailableSources] = useState([]);
  const [availableRelationships, setAvailableRelationships] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

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
  }, [isOpen]);

  useEffect(() => {
    async function loadColumns() {
      if (!sourceName) {
        setAvailableColumns([]);
        return;
      }
      try {
        let data = [];
        if (sourceType === 'dataSource') {
          data = await fetchData(sourceName);
        } else {
          data = await fetchJoinedData(sourceName);
        }
        if (data.length > 0) {
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

  const resetForm = () => {
    setFilterName('');
    setSourceType('dataSource');
    setSourceName('');
    setColumn('');
    setFilterType('equals');
    setFilterValue('');
    setMessage('');
  };

  const handleSaveFilter = async (e) => {
    e.preventDefault();
    setMessage('');
    setError(null);

    const newFilter = {
      name: filterName,
      sourceType,
      sourceName,
      column,
      type: filterType,
      value: filterValue,
    };

    try {
      await saveFilter(newFilter);
      setMessage('Filtro salvo com sucesso!');
      onFilterSaved(); // Notify parent to refresh filters
      const updatedFilters = await listFilters();
      setFilters(updatedFilters);
      resetForm();
    } catch (err) {
      console.error("Erro ao salvar filtro:", err);
      setError(err.message || "Erro ao salvar filtro.");
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

  return (
    <Modal isOpen={isOpen} onRequestClose={handleClose} style={customStyles} contentLabel="Gerenciar Filtros">
      <h2 className="text-2xl font-bold mb-4">Gerenciar Filtros Universais</h2>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {message && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{message}</div>}

      <form onSubmit={handleSaveFilter} className="mb-8 p-4 border rounded-md bg-gray-50">
        <h3 className="text-xl font-semibold mb-3">Criar Novo Filtro</h3>
        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-2">Nome do Filtro:</label>
          <input
            type="text"
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-2">Tipo de Fonte:</label>
          <select
            value={sourceType}
            onChange={(e) => { setSourceType(e.target.value); setSourceName(''); setColumn(''); }}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="dataSource">Fonte de Dados Direta</option>
            <option value="relationship">Relação de Dados</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 text-sm font-bold mb-2">Nome da Fonte/Relação:</label>
          <select
            value={sourceName}
            onChange={(e) => { setSourceName(e.target.value); setColumn(''); }}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
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
            onChange={(e) => setColumn(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
            disabled={!sourceName || availableColumns.length === 0}
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
            onChange={(e) => setFilterType(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="equals">Igual a</option>
            <option value="contains">Contém</option>
            <option value="greater_than">Maior que</option>
            <option value="less_than">Menor que</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2">Valor do Filtro:</label>
          <input
            type="text"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Salvar Filtro
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Cancelar
          </button>
        </div>
      </form>

      <h3 className="text-xl font-semibold mb-3">Filtros Salvos</h3>
      {filters.length === 0 ? (
        <p>Nenhum filtro salvo ainda.</p>
      ) : (
        <ul className="list-disc pl-5">
          {filters.map((f, index) => (
            <li key={index} className="mb-2 p-2 border rounded-md bg-white flex justify-between items-center">
              <div>
                <span className="font-semibold">{f.name}</span>: {f.column} {f.type} "{f.value}" (Fonte: {f.sourceName} [{f.sourceType}])
              </div>
              {/* Adicionar botões de Editar/Excluir aqui futuramente */}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default FilterManagementModal;
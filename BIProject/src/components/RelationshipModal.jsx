import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { useForm } from 'react-hook-form';
import { listDataSources, fetchData, saveRelationship } from '../services/dataService';

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '700px',
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

function RelationshipModal({ isOpen, onRequestClose, onRelationshipSaved }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [availableDataSources, setAvailableDataSources] = useState([]);
  const [source1Columns, setSource1Columns] = useState([]);
  const [source2Columns, setSource2Columns] = useState([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingColumns1, setLoadingColumns1] = useState(false);
  const [loadingColumns2, setLoadingColumns2] = useState(false);
  const [error, setError] = useState(null);

  const watchSource1 = watch('source1');
  const watchSource2 = watch('source2');

  // Load available data sources on mount
  useEffect(() => {
    async function loadSources() {
      try {
        setLoadingSources(true);
        const sources = await listDataSources();
        setAvailableDataSources(sources);
        if (sources.length > 0) {
          setValue('source1', sources[0]);
          if (sources.length > 1) {
            setValue('source2', sources[1]);
          } else {
            setValue('source2', sources[0]); // If only one source, default both to it
          }
        }
      } catch (err) {
        setError(`Erro ao carregar fontes de dados: ${err.message}`);
      } finally {
        setLoadingSources(false);
      }
    }
    loadSources();
  }, [setValue]);

  // Load columns for source 1 when it changes
  useEffect(() => {
    async function loadCols1() {
      if (!watchSource1) {
        setSource1Columns([]);
        return;
      }
      setLoadingColumns1(true);
      setError(null);
      try {
        const data = await fetchData(watchSource1);
        if (data && data.length > 0) {
          setSource1Columns(Object.keys(data[0]));
        } else {
          setSource1Columns([]);
          setError(`Fonte '${watchSource1}' não contém dados ou está vazia.`);
        }
      } catch (err) {
        setError(`Erro ao carregar colunas da fonte '${watchSource1}': ${err.message}`);
      } finally {
        setLoadingColumns1(false);
      }
    }
    loadCols1();
  }, [watchSource1]);

  // Load columns for source 2 when it changes
  useEffect(() => {
    async function loadCols2() {
      if (!watchSource2) {
        setSource2Columns([]);
        return;
      }
      setLoadingColumns2(true);
      setError(null);
      try {
        const data = await fetchData(watchSource2);
        if (data && data.length > 0) {
          setSource2Columns(Object.keys(data[0]));
        } else {
          setSource2Columns([]);
          setError(`Fonte '${watchSource2}' não contém dados ou está vazia.`);
        }
      } catch (err) {
        setError(`Erro ao carregar colunas da fonte '${watchSource2}': ${err.message}`);
      } finally {
        setLoadingColumns2(false);
      }
    }
    loadCols2();
  }, [watchSource2]);

  const onSubmit = useCallback(async (data) => {
    try {
      await saveRelationship(data);
      onRelationshipSaved();
      onRequestClose();
    } catch (err) {
      setError(`Erro ao salvar relação: ${err.message}`);
    }
  }, [onRelationshipSaved, onRequestClose]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      contentLabel="Definir Relação de Dados"
    >
      <h2 className="text-2xl font-bold mb-4">Definir Nova Relação de Dados</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="flex-grow flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Relationship Name */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome da Relação</label>
            <input
              type="text"
              id="name"
              {...register('name', { required: 'O nome da relação é obrigatório' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {/* Source 1 Selection */}
          <div>
            <label htmlFor="source1" className="block text-sm font-medium text-gray-700">Fonte de Dados 1</label>
            <select
              id="source1"
              {...register('source1', { required: 'Selecione a primeira fonte' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              disabled={loadingSources}
            >
              {loadingSources && <option value="">Carregando...</option>}
              {!loadingSources && availableDataSources.length === 0 && <option value="">Nenhuma fonte disponível</option>}
              {availableDataSources.map(source => <option key={source} value={source}>{source}</option>)}
            </select>
            {errors.source1 && <p className="mt-1 text-sm text-red-600">{errors.source1.message}</p>}
          </div>

          {/* Column 1 Selection */}
          <div>
            <label htmlFor="column1" className="block text-sm font-medium text-gray-700">Coluna Chave da Fonte 1</label>
            <select
              id="column1"
              {...register('column1', { required: 'Selecione a coluna chave da primeira fonte' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              disabled={loadingColumns1 || source1Columns.length === 0}
            >
              {loadingColumns1 && <option value="">Carregando...</option>}
              {!loadingColumns1 && source1Columns.length === 0 && <option value="">Nenhuma coluna disponível</option>}
              {source1Columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
            {errors.column1 && <p className="mt-1 text-sm text-red-600">{errors.column1.message}</p>}
          </div>

          {/* Source 2 Selection */}
          <div>
            <label htmlFor="source2" className="block text-sm font-medium text-gray-700">Fonte de Dados 2</label>
            <select
              id="source2"
              {...register('source2', { required: 'Selecione a segunda fonte' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              disabled={loadingSources}
            >
              {loadingSources && <option value="">Carregando...</option>}
              {!loadingSources && availableDataSources.length === 0 && <option value="">Nenhuma fonte disponível</option>}
              {availableDataSources.map(source => <option key={source} value={source}>{source}</option>)}
            </select>
            {errors.source2 && <p className="mt-1 text-sm text-red-600">{errors.source2.message}</p>}
          </div>

          {/* Column 2 Selection */}
          <div>
            <label htmlFor="column2" className="block text-sm font-medium text-gray-700">Coluna Chave da Fonte 2</label>
            <select
              id="column2"
              {...register('column2', { required: 'Selecione a coluna chave da segunda fonte' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              disabled={loadingColumns2 || source2Columns.length === 0}
            >
              {loadingColumns2 && <option value="">Carregando...</option>}
              {!loadingColumns2 && source2Columns.length === 0 && <option value="">Nenhuma coluna disponível</option>}
              {source2Columns.map(col => <option key={col} value={col}>{col}</option>)}
            </select>
            {errors.column2 && <p className="mt-1 text-sm text-red-600">{errors.column2.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-auto">
          <button
            type="button"
            onClick={onRequestClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={loadingSources || loadingColumns1 || loadingColumns2 || availableDataSources.length < 2}
          >
            Salvar Relação
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default RelationshipModal;
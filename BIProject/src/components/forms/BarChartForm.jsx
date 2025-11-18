import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { fetchData, fetchJoinedData } from '../../services/dataService'; // Import fetchData and fetchJoinedData

const aggregationFunctions = ['Soma', 'Média', 'Contagem', 'Mínimo', 'Máximo'];

function BarChartForm({ onSubmit, onCancel, selectedDataSource, selectedRelationship, defaultValues = {} }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: defaultValues,
  });

  const [columns, setColumns] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);

  useEffect(() => {
    async function loadColumns() {
      setColumns([]); // Clear columns on source change
      setDataLoading(true);
      setDataError(null);

      try {
        let data = [];
        if (selectedDataSource) {
          data = await fetchData(selectedDataSource);
        } else if (selectedRelationship) {
          data = await fetchJoinedData(selectedRelationship);
        } else {
          setDataLoading(false);
          return; // No source selected
        }
        
        if (data && data.length > 0) {
          setColumns(Object.keys(data[0]));
        } else {
          setColumns([]);
          setDataError('A fonte de dados/relação selecionada não contém dados ou está vazia.');
        }
      } catch (err) {
        console.error("Erro ao buscar dados para colunas:", err);
        setDataError(`Erro ao carregar colunas: ${err.message}`);
      } finally {
        setDataLoading(false);
      }
    }
    loadColumns();
  }, [selectedDataSource, selectedRelationship]); // Re-run when either changes

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const isEditing = Object.keys(defaultValues).length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-2xl font-bold mb-6">{isEditing ? "Editar Gráfico de Barras" : "Configurar Gráfico de Barras"}</h2>
      
      {dataLoading && <p className="text-blue-500 mb-4">Carregando colunas...</p>}
      {dataError && <p className="text-red-600 mb-4">{dataError}</p>}

      {/* Title Field */}
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>
        <input
          type="text"
          id="title"
          {...register('title', { required: 'O título é obrigatório' })}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          disabled={dataLoading || !!dataError}
        />
        {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>}
      </div>

      {/* X-Axis Column */}
      <div className="mb-4">
        <label htmlFor="xAxisColumn" className="block text-sm font-medium text-gray-700">Eixo X (Categorias)</label>
        <select
          id="xAxisColumn"
          {...register('xAxisColumn', { required: 'Selecione uma coluna para o eixo X' })}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          disabled={dataLoading || !!dataError || columns.length === 0}
        >
          <option value="">-- Selecione uma coluna --</option>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        {errors.xAxisColumn && <p className="mt-2 text-sm text-red-600">{errors.xAxisColumn.message}</p>}
      </div>

      {/* Y-Axis Column */}
      <div className="mb-4">
        <label htmlFor="yAxisColumn" className="block text-sm font-medium text-gray-700">Eixo Y (Valores)</label>
        <select
          id="yAxisColumn"
          {...register('yAxisColumn', { required: 'Selecione uma coluna para o eixo Y' })}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          disabled={dataLoading || !!dataError || columns.length === 0}
        >
          <option value="">-- Selecione uma coluna --</option>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        {errors.yAxisColumn && <p className="mt-2 text-sm text-red-600">{errors.yAxisColumn.message}</p>}
      </div>

      {/* Aggregation Function */}
      <div className="mb-6">
        <label htmlFor="aggregation" className="block text-sm font-medium text-gray-700">Função de Agregação</label>
        <select
          id="aggregation"
          {...register('aggregation', { required: 'Selecione uma função' })}
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          disabled={dataLoading || !!dataError || columns.length === 0}
        >
          <option value="">-- Selecione uma função --</option>
          {aggregationFunctions.map(func => <option key={func} value={func}>{func}</option>)}
        </select>
        {errors.aggregation && <p className="mt-2 text-sm text-red-600">{errors.aggregation.message}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          disabled={dataLoading || !!dataError || columns.length === 0}
        >
          {isEditing ? "Salvar Configuração" : "Adicionar Componente"}
        </button>
      </div>
    </form>
  );
}

export default BarChartForm;
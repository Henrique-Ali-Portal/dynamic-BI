import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { fetchData, fetchJoinedData } from '../../services/dataService'; // Import fetchData and fetchJoinedData

function TableForm({ onSubmit, onCancel, selectedDataSource, selectedRelationship, defaultValues = {} }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      ...defaultValues,
      columns: defaultValues.columns || [], // Ensure columns is an array for checkboxes
    },
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
    reset({
      ...defaultValues,
      columns: defaultValues.columns || [],
    });
  }, [defaultValues, reset]);

  const isEditing = Object.keys(defaultValues).length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-2xl font-bold mb-6">{isEditing ? "Editar Tabela" : "Configurar Tabela"}</h2>
      
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

      {/* Columns Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700">Colunas para Exibir</label>
        <div className="mt-2 p-3 border border-gray-300 rounded-md max-h-48 overflow-y-auto">
          {columns.length === 0 && !dataLoading && !dataError && (
            <p className="text-gray-500">Nenhuma coluna disponível para esta fonte de dados.</p>
          )}
          {columns.map(col => (
            <div key={col} className="flex items-center">
              <input
                type="checkbox"
                id={`col-${col}`}
                value={col}
                {...register('columns', { required: 'Selecione pelo menos uma coluna' })}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                disabled={dataLoading || !!dataError}
              />
              <label htmlFor={`col-${col}`} className="ml-3 text-sm text-gray-700">{col}</label>
            </div>
          ))}
        </div>
        {errors.columns && <p className="mt-2 text-sm text-red-600">{errors.columns.message}</p>}
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

export default TableForm;
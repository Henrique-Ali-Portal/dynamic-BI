import React, { useState, useEffect, useCallback } from 'react';
import { listFilters, fetchData, fetchJoinedData } from '../services/dataService';

function FilterSidebar({ onApplyFilters, activeFilters }) {
  const [filters, setFilters] = useState([]);
  const [filterValues, setFilterValues] = useState({}); // Stores the current input values for each filter
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    async function loadFilters() {
      setLoading(true);
      setError(null);
      try {
        const fetchedFilters = await listFilters();
        setFilters(fetchedFilters);

        // Initialize filter values based on fetched filters
        const initialFilterValues = {};
        fetchedFilters.forEach(filter => {
          if (filter.type === 'numeric') {
            initialFilterValues[filter.name] = {
              operator: filter.config?.operator || 'equals',
              value: filter.config?.value || '',
              min_value: filter.config?.min_value || '',
              max_value: filter.config?.max_value || '',
            };
          } else if (filter.type === 'date') {
            initialFilterValues[filter.name] = {
              operator: filter.config?.operator || 'equals',
              value: filter.config?.value || '',
              start_date: filter.config?.start_date || '',
              end_date: filter.config?.end_date || '',
            };
          } else if (filter.type === 'selection') {
            initialFilterValues[filter.name] = {
              selected_options: filter.config?.selected_options || [],
              unique_values: [], // Will be loaded dynamically
            };
          }
        });
        setFilterValues(initialFilterValues);
      } catch (err) {
        console.error("Erro ao carregar filtros:", err);
        setError("Erro ao carregar filtros.");
      } finally {
        setLoading(false);
      }
    }
    loadFilters();
  }, []);

  // Effect to load unique values for 'selection' filter type when the sidebar is open
  useEffect(() => {
    if (!isCollapsed) {
      filters.forEach(async (filter) => {
        if (filter.type === 'selection' && filter.sourceName && filter.column && filterValues[filter.name]?.unique_values?.length === 0) {
          try {
            let data = [];
            if (filter.sourceType === 'dataSource') {
              data = await fetchData(filter.sourceName);
            } else {
              data = await fetchJoinedData(filter.sourceName);
            }
            if (data && data.length > 0 && data[0].hasOwnProperty(filter.column)) {
              const uniqueValues = [...new Set(data.map(item => item[filter.column]))]
                .filter(v => v !== null && v !== undefined)
                .map(String)
                .sort(); // Sort for consistent display
              setFilterValues(prev => ({
                ...prev,
                [filter.name]: {
                  ...prev[filter.name],
                  unique_values: uniqueValues,
                }
              }));
            }
          } catch (err) {
            console.error(`Erro ao carregar valores únicos para a coluna ${filter.column}:`, err);
          }
        }
      });
    }
  }, [isCollapsed, filters, filterValues]);

  const handleFilterValueChange = useCallback((filterName, key, value) => {
    setFilterValues(prev => {
      const currentFilter = prev[filterName];
      if (!currentFilter) return prev;

      if (key === 'selected_options') {
        const newSelectedOptions = currentFilter.selected_options.includes(value)
          ? currentFilter.selected_options.filter(opt => opt !== value)
          : [...currentFilter.selected_options, value];
        return {
          ...prev,
          [filterName]: {
            ...currentFilter,
            selected_options: newSelectedOptions,
          },
        };
      } else {
        return {
          ...prev,
          [filterName]: {
            ...currentFilter,
            [key]: value,
          },
        };
      }
    });
  }, []);

  const handleApplyAllFilters = () => {
    const appliedFilters = [];
    filters.forEach(filter => {
      const currentValues = filterValues[filter.name];
      if (!currentValues) return;

      if (filter.type === 'numeric') {
        const config = {
          type: filter.type,
          operator: currentValues.operator,
          value: currentValues.value !== '' ? parseFloat(currentValues.value) : null,
          min_value: currentValues.min_value !== '' ? parseFloat(currentValues.min_value) : null,
          max_value: currentValues.max_value !== '' ? parseFloat(currentValues.max_value) : null,
        };
        // Only apply if there's a meaningful value
        if (config.operator === 'between' && (config.min_value !== null || config.max_value !== null)) {
          appliedFilters.push({ ...filter, config });
        } else if (config.operator !== 'between' && config.value !== null) {
          appliedFilters.push({ ...filter, config });
        }
      } else if (filter.type === 'date') {
        const config = {
          type: filter.type,
          operator: currentValues.operator,
          value: currentValues.value || null,
          start_date: currentValues.start_date || null,
          end_date: currentValues.end_date || null,
        };
        // Only apply if there's a meaningful value
        if (config.operator === 'between' && (config.start_date || config.end_date)) {
          appliedFilters.push({ ...filter, config });
        } else if (config.operator !== 'between' && config.value) {
          appliedFilters.push({ ...filter, config });
        }
      } else if (filter.type === 'selection' && currentValues.selected_options && currentValues.selected_options.length > 0) {
        appliedFilters.push({
          ...filter,
          config: {
            type: filter.type,
            selected_options: currentValues.selected_options,
          },
        });
      }
    });
    onApplyFilters(appliedFilters);
  };

  const renderFilterInput = (filter) => {
    const currentValues = filterValues[filter.name];
    if (!currentValues) return null;

    switch (filter.type) {
      case 'numeric':
        return (
          <div className="mt-2">
            <select
              value={currentValues.operator || 'equals'}
              onChange={(e) => handleFilterValueChange(filter.name, 'operator', e.target.value)}
              className="w-full text-sm bg-gray-700 border-gray-600 rounded mb-1"
            >
              <option value="equals">Igual a</option>
              <option value="greater_than">Maior que</option>
              <option value="less_than">Menor que</option>
              <option value="between">Entre</option>
            </select>
            {currentValues.operator === 'between' ? (
              <div className="flex gap-1">
                <input
                  type="number"
                  placeholder="Min"
                  value={currentValues.min_value}
                  onChange={(e) => handleFilterValueChange(filter.name, 'min_value', e.target.value)}
                  className="w-1/2 text-sm bg-gray-700 border-gray-600 rounded px-2 py-1"
                  step="any"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={currentValues.max_value}
                  onChange={(e) => handleFilterValueChange(filter.name, 'max_value', e.target.value)}
                  className="w-1/2 text-sm bg-gray-700 border-gray-600 rounded px-2 py-1"
                  step="any"
                />
              </div>
            ) : (
              <input
                type="number"
                placeholder="Valor"
                value={currentValues.value}
                onChange={(e) => handleFilterValueChange(filter.name, 'value', e.target.value)}
                className="w-full text-sm bg-gray-700 border-gray-600 rounded px-2 py-1"
                step="any"
              />
            )}
          </div>
        );
      case 'date':
        return (
          <div className="mt-2">
            <select
              value={currentValues.operator || 'equals'}
              onChange={(e) => handleFilterValueChange(filter.name, 'operator', e.target.value)}
              className="w-full text-sm bg-gray-700 border-gray-600 rounded mb-1"
            >
              <option value="equals">Igual a</option>
              <option value="before">Antes de</option>
              <option value="after">Depois de</option>
              <option value="between">Entre</option>
            </select>
            {currentValues.operator === 'between' ? (
              <div className="flex gap-1">
                <input
                  type="date"
                  value={currentValues.start_date}
                  onChange={(e) => handleFilterValueChange(filter.name, 'start_date', e.target.value)}
                  className="w-1/2 text-sm bg-gray-700 border-gray-600 rounded px-2 py-1"
                />
                <input
                  type="date"
                  value={currentValues.end_date}
                  onChange={(e) => handleFilterValueChange(filter.name, 'end_date', e.target.value)}
                  className="w-1/2 text-sm bg-gray-700 border-gray-600 rounded px-2 py-1"
                />
              </div>
            ) : (
              <input
                type="date"
                value={currentValues.value}
                onChange={(e) => handleFilterValueChange(filter.name, 'value', e.target.value)}
                className="w-full text-sm bg-gray-700 border-gray-600 rounded px-2 py-1"
              />
            )}
          </div>
        );
      case 'selection':
        return (
          <div className="mt-2 max-h-40 overflow-y-auto bg-gray-700 p-2 rounded">
            {currentValues.unique_values?.length === 0 ? (
              <p className="text-gray-400 text-xs">Carregando valores...</p>
            ) : (
              currentValues.unique_values?.map(val => (
                <div key={val} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`filter-${filter.name}-${val}`}
                    checked={currentValues.selected_options.includes(val)}
                    onChange={() => handleFilterValueChange(filter.name, 'selected_options', val)}
                    className="form-checkbox h-3 w-3 text-blue-600"
                  />
                  <label htmlFor={`filter-${filter.name}-${val}`} className="ml-1 text-gray-300 text-xs">{val}</label>
                </div>
              ))
            )}
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="w-64 bg-gray-800 text-white p-4 flex-shrink-0">
        <div className="text-center">Carregando filtros...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-64 bg-gray-800 text-white p-4 flex-shrink-0">
        <div className="text-center text-red-400">Erro: {error}</div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-800 text-white flex-shrink-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-12' : 'w-64 p-4'
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        {!isCollapsed && <h3 className="text-lg font-semibold">Filtros Universais</h3>}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-gray-400 hover:text-white">
          {isCollapsed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 12h14" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div>
          {filters.length === 0 ? (
            <p className="text-gray-400 text-sm">Nenhum filtro disponível.</p>
          ) : (
            <div className="space-y-4">
              {filters.map((filter) => (
                <div key={filter.name} className="bg-gray-700 p-3 rounded-md">
                  <p className="font-semibold text-gray-200">{filter.name}</p>
                  <p className="text-xs text-gray-400 mb-1">({filter.column})</p>
                  {renderFilterInput(filter)}
                </div>
              ))}
              <button
                onClick={handleApplyAllFilters}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
              >
                Aplicar Filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterSidebar;
import React, { useState, useEffect } from 'react';
import { listFilters } from '../services/dataService';

function FilterSidebar({ onApplyFilters, activeFilters }) {
  const [filters, setFilters] = useState([]);
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
      } catch (err) {
        console.error("Erro ao carregar filtros:", err);
        setError("Erro ao carregar filtros.");
      } finally {
        setLoading(false);
      }
    }
    loadFilters();
  }, []); // Load filters once on mount

  const handleFilterToggle = (filter) => {
    const isFilterActive = activeFilters.some(
      (f) => f.name === filter.name && f.column === filter.column && f.value === filter.value
    );

    let updatedFilters;
    if (isFilterActive) {
      updatedFilters = activeFilters.filter(
        (f) => !(f.name === filter.name && f.column === filter.column && f.value === filter.value)
      );
    } else {
      updatedFilters = [...activeFilters, filter];
    }
    onApplyFilters(updatedFilters);
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
            <ul>
              {filters.map((filter) => (
                <li key={filter.name} className="mb-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="form-checkbox h-4 w-4 text-blue-600"
                      checked={activeFilters.some(
                        (f) => f.name === filter.name && f.column === filter.column && f.value === filter.value
                      )}
                      onChange={() => handleFilterToggle(filter)}
                    />
                    <span className="ml-2 text-gray-300 text-sm">
                      {filter.name} ({filter.column} {filter.type} {filter.value})
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default FilterSidebar;
import React, { useState, useCallback } from 'react';
import Dashboard from '../pages/Dashboard';
import FilterSidebar from '../components/FilterSidebar';
import RelationshipModal from '../components/RelationshipModal';
import FilterManagementModal from '../components/FilterManagementModal';

function AppLayout() {
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  const [isFilterManagementModalOpen, setIsFilterManagementModalOpen] = useState(false);
  const [activeGlobalFilters, setActiveGlobalFilters] = useState([]);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);

  // Callbacks for modals, can be expanded later
  const handleRelationshipSaved = useCallback(() => {
    console.log("Relação salva, atualizando se necessário.");
    // Here you could add logic to refetch data sources if needed
  }, []);

  const handleFilterSaved = useCallback(() => {
    console.log("Filtro salvo, atualizando a sidebar.");
    setSidebarRefreshKey(prevKey => prevKey + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow flex-shrink-0">
        <div className="max-w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard BI</h1>
        </div>
      </header>

      {/* Main content flex container */}
      <div className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <FilterSidebar
          key={sidebarRefreshKey}
          onApplyFilters={setActiveGlobalFilters}
          activeFilters={activeGlobalFilters}
        />

        {/* Main content area */}
        <main className="flex-grow p-6 overflow-y-auto">
          {/* Global Action Buttons */}
          <div className="mb-4 flex space-x-2">
            <button
              onClick={() => setIsRelationshipModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Definir Relação
            </button>
            <button
              onClick={() => setIsFilterManagementModalOpen(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
            >
              Gerenciar Filtros
            </button>
          </div>
          
          {/* Dashboard for tabs and widgets */}
          <Dashboard activeGlobalFilters={activeGlobalFilters} />
        </main>
      </div>

      {/* Modals */}
      {isRelationshipModalOpen && (
        <RelationshipModal
          isOpen={isRelationshipModalOpen}
          onRequestClose={() => setIsRelationshipModalOpen(false)}
          onRelationshipSaved={handleRelationshipSaved}
        />
      )}
      {isFilterManagementModalOpen && (
        <FilterManagementModal
          isOpen={isFilterManagementModalOpen}
          onRequestClose={() => setIsFilterManagementModalOpen(false)}
          onFilterSaved={handleFilterSaved}
        />
      )}
    </div>
  );
}

export default AppLayout;


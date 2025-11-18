import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import '/node_modules/react-grid-layout/css/styles.css';
import '/node_modules/react-resizable/css/styles.css';

import Widget from '../components/Widget';
import AddComponentModal from '../components/AddComponentModal';
import PrintModal from '../components/PrintModal';
import RelationshipModal from '../components/RelationshipModal'; // Import RelationshipModal
import FilterManagementModal from '../components/FilterManagementModal'; // Import FilterManagementModal
import FilterSidebar from '../components/FilterSidebar'; // Import FilterSidebar
import { fetchData, loadState, saveState, listDataSources } from '../services/dataService'; // Keep listDataSources for AddComponentModal

const ResponsiveGridLayout = WidthProvider(Responsive);

// Custom hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [nextTabId, setNextTabId] = useState(1);
  const [nextWidgetId, setNextWidgetId] = useState(0);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [editingTabNameId, setEditingTabNameId] = useState(null);
  const [newTabName, setNewTabName] = useState('');
  const [printingWidget, setPrintingWidget] = useState(null);

  // State for all available data sources, fetched once
  const [allAvailableDataSources, setAllAvailableDataSources] = useState([]);
  // State for relationship modal visibility
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  // State for filter management modal visibility
  const [isFilterManagementModalOpen, setIsFilterManagementModalOpen] = useState(false);
  // State for currently active global filters
  const [activeGlobalFilters, setActiveGlobalFilters] = useState([]);

  const debouncedTabs = useDebounce(tabs, 1000);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch available data sources once
        const sources = await listDataSources();
        setAllAvailableDataSources(sources);

        // Fetch initial data for a default source (e.g., 'vendas') or the first available
        const defaultSource = sources.length > 0 ? sources[0] : 'vendas';
        const initialData = await fetchData(defaultSource);
        setData(initialData);

        const savedState = await loadState('dashboard');

        if (savedState && savedState.tabs && savedState.tabs.length > 0) {
          setTabs(savedState.tabs);
          setActiveTabId(savedState.activeTabId || savedState.tabs[0].id);
          setNextTabId(savedState.nextTabId || 1);
          setNextWidgetId(savedState.nextWidgetId || 0);
        } else {
          setTabs([{ id: 'tab-1', name: 'Nova Aba 1', widgets: [], layout: [] }]);
          setActiveTabId('tab-1');
          setNextTabId(2);
        }

      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []); // Empty dependency array to run only once on mount

  useEffect(() => {
    if (debouncedTabs.length === 0 && !activeTabId) {
      return;
    }

    const stateToSave = {
      tabs: debouncedTabs,
      activeTabId,
      nextTabId,
      nextWidgetId,
    };
    saveState('dashboard', stateToSave);
    console.log('Dashboard state saved.');
  }, [debouncedTabs, activeTabId, nextTabId, nextWidgetId]);

  const activeTab = useMemo(() => tabs.find(tab => tab.id === activeTabId), [tabs, activeTabId]);
  // availableColumns will now depend on the data of the *currently active* widget, not global data
  // For now, we'll keep it based on the dashboard's 'data' state, but this will change when widgets fetch their own data.
  const availableColumns = data && data.length > 0 ? Object.keys(data[0]) : [];

  const handleAddOrUpdateWidget = useCallback((widgetConfig) => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId) {
        if (editingWidget) {
          const updatedWidgets = tab.widgets.map(w => 
            w.id === editingWidget.id ? { ...w, ...widgetConfig } : w
          );
          return { ...tab, widgets: updatedWidgets };
        } else {
          const newWidgetId = `widget-${nextWidgetId}`;
          const newWidget = {
            id: newWidgetId,
            ...widgetConfig,
            // dataSource will now come from AddComponentModal
            layout: {
              i: newWidgetId,
              x: (tab.widgets.length * 4) % 12,
              y: Infinity,
              w: 4,
              h: 6,
              minW: 2,
              minH: 3,
            },
          };
          setNextWidgetId(prevId => prevId + 1);
          return {
            ...tab,
            widgets: [...tab.widgets, newWidget],
            layout: [...tab.layout, newWidget.layout],
          };
        }
      }
      return tab;
    }));
    setIsModalOpen(false);
    setEditingWidget(null);
  }, [activeTabId, nextWidgetId, editingWidget]);

  const handleRemoveWidget = useCallback((widgetIdToRemove) => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId) {
        const updatedWidgets = tab.widgets.filter(w => w.id !== widgetIdToRemove);
        const updatedLayout = tab.layout.filter(l => l.i !== widgetIdToRemove);
        return { ...tab, widgets: updatedWidgets, layout: updatedLayout };
      }
      return tab;
    }));
  }, [activeTabId]);

  const handleEditWidget = useCallback((widgetToEdit) => {
    setEditingWidget(widgetToEdit);
    setIsModalOpen(true);
  }, []);

  const handleDuplicateWidget = useCallback((widgetToDuplicate) => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId) {
        const newWidgetId = `widget-${nextWidgetId}`;
        const newWidget = {
          ...widgetToDuplicate,
          id: newWidgetId,
          layout: {
            ...widgetToDuplicate.layout,
            i: newWidgetId,
            y: Infinity,
          },
        };
        setNextWidgetId(prevId => prevId + 1);
        return {
          ...tab,
          widgets: [...tab.widgets, newWidget],
          layout: [...tab.layout, newWidget.layout],
        };
      }
      return tab;
    }));
  }, [activeTabId, nextWidgetId]);

  const handlePrintWidget = useCallback((widgetToPrint) => {
    setPrintingWidget(widgetToPrint);
  }, []);

  const handleRelationshipSaved = useCallback(() => {
    // Optionally refresh relationships list if needed elsewhere
    console.log("Relação salva, atualizando se necessário.");
  }, []);

  const handleFilterSaved = useCallback(() => {
    // Optionally refresh filters list if needed elsewhere
    console.log("Filtro salvo, atualizando se necessário.");
  }, []);

  const onLayoutChange = useCallback((newLayout) => {
    setTabs(prevTabs => prevTabs.map(tab => {
      if (tab.id === activeTabId) {
        const updatedWidgets = tab.widgets.map(widget => {
          const layoutItem = newLayout.find(item => item.i === widget.id);
          return { ...widget, layout: layoutItem || widget.layout };
        });
        return { ...tab, widgets: updatedWidgets, layout: newLayout };
      }
      return tab;
    }));
  }, [activeTabId]);

  const addTab = () => {
    const newTabId = `tab-${nextTabId}`;
    const newTab = { id: newTabId, name: `Nova Aba ${nextTabId}`, widgets: [], layout: [] };
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTabId);
    setNextTabId(prevId => prevId + 1);
  };

  const handleRemoveTab = useCallback((tabIdToRemove) => {
    setTabs(prevTabs => {
      const filteredTabs = prevTabs.filter(tab => tab.id !== tabIdToRemove);
      if (filteredTabs.length === 0) {
        const newTabId = 'tab-1';
        const newTab = { id: newTabId, name: 'Nova Aba 1', widgets: [], layout: [] };
        setActiveTabId(newTabId);
        setNextTabId(2);
        return [newTab];
      } else if (tabIdToRemove === activeTabId) {
        setActiveTabId(filteredTabs[0].id);
      }
      return filteredTabs;
    });
  }, [activeTabId]);

  const handleRenameTab = useCallback((tabId, newName) => {
    setTabs(prevTabs => prevTabs.map(tab => 
      tab.id === tabId ? { ...tab, name: newName } : tab
    ));
    setEditingTabNameId(null);
  }, []);

  const handleDoubleClickTab = useCallback((tabId, currentName) => {
    setEditingTabNameId(tabId);
    setNewTabName(currentName);
  }, []);

  const handleTabNameChange = useCallback((e) => {
    setNewTabName(e.target.value);
  }, []);

  const handleTabNameInputKeyDown = useCallback((e, tabId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameTab(tabId, newTabName);
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      setEditingTabNameId(null);
    }
  }, [handleRenameTab, newTabName]);

  if (loading) {
    return <div className="p-4 text-center">Carregando estado do dashboard...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600 text-center">Erro ao carregar dados: {error.message}</div>;
  }

  if (!activeTab) {
    return <div className="p-4 text-center">Nenhuma aba ativa encontrada. Clique em '+' para adicionar uma.</div>;
  }

  return (
    <div className="flex"> {/* Outer flex container */}
      <FilterSidebar onApplyFilters={setActiveGlobalFilters} activeFilters={activeGlobalFilters} /> 
      <div className="flex-grow p-4"> {/* Main content area, now flexible */}
        <AddComponentModal
          isOpen={isModalOpen}
          onRequestClose={() => { setIsModalOpen(false); setEditingWidget(null); }}
          onWidgetAdd={handleAddOrUpdateWidget}
          availableColumns={availableColumns}
          availableDataSources={allAvailableDataSources} // Pass all available data sources
          editingWidget={editingWidget}
        />
        {printingWidget && (
          <PrintModal
            isOpen={!!printingWidget}
            onRequestClose={() => setPrintingWidget(null)}
            widget={printingWidget}
          />
        )}
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

        <div className="flex border-b border-gray-200 mb-4">
          {tabs.map(tab => (
            <div key={tab.id} className="flex items-center group">
              {editingTabNameId === tab.id ? (
                <input
                  type="text"
                  value={newTabName}
                  onChange={handleTabNameChange}
                  onBlur={() => handleRenameTab(tab.id, newTabName)}
                  onKeyDown={(e) => handleTabNameInputKeyDown(e, tab.id)}
                  className="py-2 px-4 -mb-px border-b-2 border-green-600 text-green-600 font-semibold focus:outline-none focus:ring-0 bg-transparent"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setActiveTabId(tab.id)}
                  onDoubleClick={() => handleDoubleClickTab(tab.id, tab.name)}
                  className={`py-2 px-4 -mb-px border-b-2 ${
                    activeTabId === tab.id
                      ? 'border-green-600 text-green-600 font-semibold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } cursor-pointer`}
                >
                  {tab.name}
                </button>
              )}
              {tabs.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveTab(tab.id); }}
                  className="ml-1 text-gray-400 hover:text-red-600 cursor-pointer no-drag opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remover Aba"
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTab}
            className="py-2 px-4 -mb-px border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            +
          </button>
        </div>

        <div className="mb-4 flex space-x-2"> {/* Removed data source selection button */}
          <button
            onClick={() => { setIsModalOpen(true); setEditingWidget(null); }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            Adicionar Componente à Aba Atual
          </button>
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

        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: activeTab.layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          onLayoutChange={onLayoutChange}
          isDraggable={true}
          isResizable={true}
          draggableCancel=".no-drag"
          measureBeforeMount={false}
          useCSSTransforms={true}
          compactType="vertical"
          preventCollision={false}
        >
          {activeTab.widgets.map((widget) => (
            <div key={widget.id} data-grid={widget.layout}>
              <Widget
                widget={widget}
                data={data} // This 'data' is still the global one, will need to be updated per widget
                onEdit={handleEditWidget}
                onRemove={handleRemoveWidget}
                onDuplicate={handleDuplicateWidget}
                onPrint={handlePrintWidget}
                activeGlobalFilters={activeGlobalFilters} // Pass active global filters
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
}

export default Dashboard;
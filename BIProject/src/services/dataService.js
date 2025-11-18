const API_BASE_URL = 'http://127.0.0.1:8001/api'; // URL do seu backend FastAPI

export const listDataSources = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/data-sources`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao listar fontes de dados:`, error);
    throw error;
  }
};

export const saveRelationship = async (relationship) => {
  try {
    const response = await fetch(`${API_BASE_URL}/relationships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(relationship),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao salvar relação:`, error);
    throw error;
  }
};

export const listRelationships = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/relationships`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao listar relações:`, error);
    throw error;
  }
};

export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}/data/${endpoint}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar dados do endpoint ${endpoint}:`, error);
    throw error;
  }
};

export const fetchJoinedData = async (relationshipName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/data/joined/${relationshipName}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao buscar dados combinados para a relação ${relationshipName}:`, error);
    throw error;
  }
};

export const saveFilter = async (filter) => {
  try {
    const response = await fetch(`${API_BASE_URL}/filters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filter),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao salvar filtro:`, error);
    throw error;
  }
};

export const listFilters = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/filters`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao listar filtros:`, error);
    throw error;
  }
};

export const saveState = async (saveName, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/saves/${saveName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao salvar estado ${saveName}:`, error);
    throw error;
  }
};

export const loadState = async (saveName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/saves/${saveName}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Erro HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Erro ao carregar estado ${saveName}:`, error);
    throw error;
  }
};

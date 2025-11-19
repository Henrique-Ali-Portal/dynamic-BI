import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8001/api'; // URL do seu backend FastAPI

export const listDataSources = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/data-sources`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao listar fontes de dados:`, error);
    throw error;
  }
};

export const saveRelationship = async (relationship) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/relationships`, relationship);
    return response.data;
  } catch (error) {
    console.error(`Erro ao salvar relação:`, error);
    throw error;
  }
};

export const listRelationships = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/relationships`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao listar relações:`, error);
    throw error;
  }
};

export const fetchData = async (endpoint) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/data/${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar dados do endpoint ${endpoint}:`, error);
    throw error;
  }
};

export const fetchJoinedData = async (relationshipName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/data/joined/${relationshipName}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar dados combinados para a relação ${relationshipName}:`, error);
    throw error;
  }
};

export const saveFilter = async (filter) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/filters`, filter);
    return response.data;
  } catch (error) {
    console.error(`Erro ao salvar filtro:`, error);
    throw error;
  }
};

export const listFilters = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/filters`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao listar filtros:`, error);
    throw error;
  }
};

export const deleteFilter = async (filterName) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/filters/${filterName}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao deletar filtro ${filterName}:`, error);
    throw error;
  }
};

export const saveState = async (saveName, data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/saves/${saveName}`, data);
    return response.data;
  } catch (error) {
    console.error(`Erro ao salvar estado ${saveName}:`, error);
    throw error;
  }
};

export const loadState = async (saveName) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/saves/${saveName}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao carregar estado ${saveName}:`, error);
    throw error;
  }
};

import os
import pandas as pd
from fastapi import FastAPI, HTTPException, Request, Query # Adicionado Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import logging
import numpy as np
from logging.handlers import RotatingFileHandler
from typing import Optional # Adicionado Optional

# --- CONFIGURAÇÃO DE DIRETÓRIOS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
SAVES_DIR = os.path.join(BASE_DIR, "Saves")
LOG_FILE_PATH = os.path.join(BASE_DIR, "LogFalha.txt")

# --- CONFIGURAÇÃO DE LOGGING ---
# Rotação de logs: 1MB por arquivo, mantendo 5 arquivos de backup.
file_handler = RotatingFileHandler(LOG_FILE_PATH, maxBytes=1_000_000, backupCount=5, encoding='utf-8')
stream_handler = logging.StreamHandler() # Para o console

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        file_handler,
        stream_handler
    ]
)

# --- CONFIGURAÇÃO DA APLICAÇÃO ---
app = FastAPI(
    title="Dashboard BI Backend",
    description="API Mock para servir dados de arquivos Excel e gerenciar o estado do dashboard.",
    version="1.0.0"
)

# Garante que os diretórios de dados e saves existam
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(SAVES_DIR, exist_ok=True)

# --- MIDDLEWARE (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ENDPOINTS DA API ---

@app.get("/", tags=["Root"], summary="Verifica o status da API")
async def read_root():
    """Endpoint raiz para verificar se a API está online."""
    return {"status": "API online", "message": "Bem-vindo à API do Dashboard BI!"}

# --- ENDPOINTS PARA FONTES DE DADOS (EXCEL) ---

@app.get("/api/data-sources", tags=["Data Sources"], summary="Lista todas as fontes de dados Excel disponíveis")
async def list_data_sources():
    """
    Retorna uma lista dos nomes dos arquivos .xlsx disponíveis na pasta 'data/'.
    """
    try:
        excel_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.xlsx')]
        source_names = [os.path.splitext(f)[0] for f in excel_files]
        logging.info(f"Fontes de dados listadas: {source_names}")
        return JSONResponse(content=source_names)
    except Exception as e:
        logging.exception("Erro ao listar fontes de dados.")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao listar fontes de dados. Verifique o LogFalha.txt."
        )

@app.get("/api/data/{file_name}", tags=["Data Sources"], summary="Obtém dados de um arquivo Excel")
async def get_data_from_excel(file_name: str, filters: Optional[str] = Query(None)): # Adicionado parâmetro filters
    """
    Lê um arquivo .xlsx da pasta 'data' e o retorna como um array de objetos JSON.
    Aplica filtros opcionais se fornecidos.
    """
    file_path = os.path.join(DATA_DIR, f"{file_name}.xlsx")
    logging.debug(f"Tentando acessar o arquivo: {file_path}")

    if not os.path.exists(file_path):
        logging.error(f"Arquivo não encontrado: {file_path}")
        raise HTTPException(
            status_code=404,
            detail=f"Fonte de dados '{file_name}.xlsx' não encontrada. Verifique o LogFalha.txt."
        )

    logging.debug(f"Arquivo encontrado. Tentando ler com pandas...")
    try:
        df = pd.read_excel(file_path)
        
        # Aplicar filtros se existirem
        if filters:
            try:
                filter_list = json.loads(filters)
                for f in filter_list:
                    column = f.get("column")
                    value = f.get("value")
                    filter_type = f.get("type")

                    if column and value is not None and filter_type:
                        if column not in df.columns:
                            logging.warning(f"Coluna '{column}' para filtro não encontrada no DataFrame.")
                            continue # Pula este filtro se a coluna não existir

                        if filter_type == "equals":
                            df = df[df[column] == value]
                        elif filter_type == "contains":
                            df = df[df[column].astype(str).str.contains(str(value), case=False, na=False)]
                        elif filter_type == "greater_than":
                            df = df[pd.to_numeric(df[column], errors='coerce') > pd.to_numeric(value, errors='coerce')]
                        elif filter_type == "less_than":
                            df = df[pd.to_numeric(df[column], errors='coerce') < pd.to_numeric(value, errors='coerce')]
                        # Adicionar outros tipos de filtro conforme necessário
            except json.JSONDecodeError:
                logging.error(f"Filtros fornecidos não são um JSON válido: {filters}")
                raise HTTPException(status_code=400, detail="Filtros fornecidos não são um JSON válido.")
            except Exception as filter_e:
                logging.exception(f"Erro ao aplicar filtros: {filter_e}")
                raise HTTPException(status_code=500, detail=f"Erro ao aplicar filtros: {filter_e}")

        # Substitui NaN por None para compatibilidade com JSON
        df = df.replace(np.nan, None)
        logging.info(f"Sucesso! Arquivo '{file_path}' lido e processado pelo pandas. {len(df)} registros após filtros.")
        data = df.to_dict(orient="records")
        return JSONResponse(content=data)
    except Exception as e:
        logging.exception(f"Ocorreu um erro ao tentar ler ou filtrar o arquivo '{file_path}' com pandas.")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao ler, processar ou filtrar o arquivo '{file_name}.xlsx'. Verifique o LogFalha.txt para mais detalhes."
        )

# --- ENDPOINTS PARA PERSISTÊNCIA (SAVES) ---

@app.get("/api/saves/{save_name}", tags=["Persistence"], summary="Carrega um arquivo de configuração")
async def load_dashboard_state(save_name: str):
    """
    Carrega um arquivo .json da pasta 'Saves'.
    """
    file_path = os.path.join(SAVES_DIR, f"{save_name}.json")
    logging.debug(f"Tentando carregar estado de '{file_path}'")

    if not os.path.exists(file_path):
        logging.warning(f"Arquivo de save '{file_path}' não encontrado. Retornando estado vazio.")
        return JSONResponse(content={}, status_code=200)

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = json.load(f)
        logging.info(f"Estado '{file_path}' carregado com sucesso.")
        return JSONResponse(content=content)
    except Exception as e:
        logging.exception(f"Erro ao ler o arquivo de save '{file_path}'.")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao ler o arquivo '{save_name}.json'. Verifique o LogFalha.txt."
        )

@app.post("/api/saves/{save_name}", tags=["Persistence"], summary="Salva o estado do dashboard")
async def save_dashboard_state(save_name: str, request: Request):
    """
    Salva um corpo JSON em um arquivo .json na pasta 'Saves'.
    """
    file_path = os.path.join(SAVES_DIR, f"{save_name}.json")
    logging.debug(f"Tentando salvar estado em '{file_path}'")

    try:
        data = await request.json()
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        logging.info(f"Estado '{file_path}' salvo com sucesso.")
        return {"status": "sucesso", "message": f"Estado salvo em '{save_name}.json'"}
    except json.JSONDecodeError:
        logging.error("Corpo da requisição para salvar não é um JSON válido.")
        raise HTTPException(status_code=400, detail="Requisição inválida. Esperado um JSON válido.")
    except Exception as e:
        logging.exception(f"Erro ao salvar o arquivo '{file_path}'.")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao salvar o arquivo '{save_name}.json'. Verifique o LogFalha.txt."
        )

# --- ENDPOINTS PARA RELAÇÕES DE DADOS ---

RELATIONSHIPS_FILE = os.path.join(SAVES_DIR, "relationships.json")

@app.post("/api/relationships", tags=["Data Relationships"], summary="Salva uma nova relação entre fontes de dados")
async def save_relationship(request: Request):
    """
    Salva uma nova definição de relação entre duas fontes de dados.
    A relação é um objeto JSON com 'name', 'source1', 'column1', 'source2', 'column2'.
    """
    try:
        new_relationship = await request.json()
        # Basic validation
        required_fields = ["name", "source1", "column1", "source2", "column2"]
        if not all(field in new_relationship for field in required_fields):
            raise HTTPException(status_code=400, detail="Campos obrigatórios ausentes na definição da relação.")

        relationships = []
        if os.path.exists(RELATIONSHIPS_FILE):
            with open(RELATIONSHIPS_FILE, "r", encoding="utf-8") as f:
                relationships = json.load(f)
        
        # Check for duplicate name
        if any(r.get("name") == new_relationship["name"] for r in relationships):
            raise HTTPException(status_code=409, detail=f"Relação com o nome '{new_relationship['name']}' já existe.")

        relationships.append(new_relationship)

        with open(RELATIONSHIPS_FILE, "w", encoding="utf-8") as f:
            json.dump(relationships, f, indent=4, ensure_ascii=False)
        
        logging.info(f"Relação '{new_relationship['name']}' salva com sucesso.")
        return {"status": "sucesso", "message": f"Relação '{new_relationship['name']}' salva."}
    except json.JSONDecodeError:
        logging.error("Corpo da requisição para salvar relação não é um JSON válido.")
        raise HTTPException(status_code=400, detail="Requisição inválida. Esperado um JSON válido.")
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.exception("Erro ao salvar relação.")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao salvar relação. Verifique o LogFalha.txt."
        )

@app.get("/api/relationships", tags=["Data Relationships"], summary="Lista todas as relações de dados salvas")
async def list_relationships():
    """
    Retorna uma lista de todas as relações de dados salvas.
    """
    try:
        if not os.path.exists(RELATIONSHIPS_FILE):
            return JSONResponse(content=[])
        
        with open(RELATIONSHIPS_FILE, "r", encoding="utf-8") as f:
            relationships = json.load(f)
        
        logging.info("Relações listadas com sucesso.")
        return JSONResponse(content=relationships)
    except Exception as e:
        logging.exception("Erro ao listar relações.")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao listar relações. Verifique o LogFalha.txt."
        )

@app.get("/api/data/joined/{relationship_name}", tags=["Data Sources"], summary="Obtém dados combinados de uma relação")
async def get_joined_data(relationship_name: str, filters: Optional[str] = Query(None)): # Adicionado parâmetro filters
    """
    Realiza um INNER JOIN entre duas fontes de dados com base em uma relação definida
    e retorna os dados combinados como um array de objetos JSON.
    Aplica filtros opcionais se fornecidos.
    """
    try:
        if not os.path.exists(RELATIONSHIPS_FILE):
            raise HTTPException(status_code=404, detail="Nenhuma relação definida.")
        
        with open(RELATIONSHIPS_FILE, "r", encoding="utf-8") as f:
            relationships = json.load(f)
        
        relationship = next((r for r in relationships if r["name"] == relationship_name), None)
        if not relationship:
            raise HTTPException(status_code=404, detail=f"Relação '{relationship_name}' não encontrada.")

        source1_name = relationship["source1"]
        column1 = relationship["column1"]
        source2_name = relationship["source2"]
        column2 = relationship["column2"]

        file_path1 = os.path.join(DATA_DIR, f"{source1_name}.xlsx")
        file_path2 = os.path.join(DATA_DIR, f"{source2_name}.xlsx")

        if not os.path.exists(file_path1):
            raise HTTPException(status_code=404, detail=f"Fonte de dados '{source1_name}.xlsx' não encontrada.")
        if not os.path.exists(file_path2):
            raise HTTPException(status_code=404, detail=f"Fonte de dados '{source2_name}.xlsx' não encontrada.")

        df1 = pd.read_excel(file_path1)
        df2 = pd.read_excel(file_path2)

        # Perform INNER JOIN
        # Suffixes are added to differentiate columns with the same name from different sources
        joined_df = pd.merge(df1, df2, left_on=column1, right_on=column2, how='inner', suffixes=(f'_{source1_name}', f'_{source2_name}'))
        
        # Aplicar filtros se existirem
        if filters:
            try:
                filter_list = json.loads(filters)
                for f in filter_list:
                    column = f.get("column")
                    value = f.get("value")
                    filter_type = f.get("type")

                    if column and value is not None and filter_type:
                        if column not in joined_df.columns:
                            logging.warning(f"Coluna '{column}' para filtro não encontrada no DataFrame combinado.")
                            continue # Pula este filtro se a coluna não existir

                        if filter_type == "equals":
                            joined_df = joined_df[joined_df[column] == value]
                        elif filter_type == "contains":
                            joined_df = joined_df[joined_df[column].astype(str).str.contains(str(value), case=False, na=False)]
                        elif filter_type == "greater_than":
                            joined_df = joined_df[pd.to_numeric(joined_df[column], errors='coerce') > pd.to_numeric(value, errors='coerce')]
                        elif filter_type == "less_than":
                            joined_df = joined_df[pd.to_numeric(joined_df[column], errors='coerce') < pd.to_numeric(value, errors='coerce')]
                        # Adicionar outros tipos de filtro conforme necessário
            except json.JSONDecodeError:
                logging.error(f"Filtros fornecidos não são um JSON válido: {filters}")
                raise HTTPException(status_code=400, detail="Filtros fornecidos não são um JSON válido.")
            except Exception as filter_e:
                logging.exception(f"Erro ao aplicar filtros: {filter_e}")
                raise HTTPException(status_code=500, detail=f"Erro ao aplicar filtros: {filter_e}")

        # Replace NaN with None for JSON compatibility
        joined_df = joined_df.replace(np.nan, None)

        logging.info(f"Sucesso! Dados combinados para a relação '{relationship_name}'. {len(joined_df)} registros após filtros.")
        return JSONResponse(content=joined_df.to_dict(orient="records"))

    except HTTPException as he:
        raise he
    except Exception as e:
        logging.exception(f"Erro ao obter dados combinados para a relação '{relationship_name}'.")
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao obter dados combinados para a relação '{relationship_name}'. Verifique o LogFalha.txt."
        )

# --- ENDPOINTS PARA FILTROS UNIVERSAIS ---

FILTERS_FILE = os.path.join(SAVES_DIR, "filters.json")

@app.post("/api/filters", tags=["Universal Filters"], summary="Salva um novo filtro universal")
async def save_filter(request: Request):
    """
    Salva uma nova definição de filtro universal.
    O filtro é um objeto JSON com 'name', 'type', 'column', 'sourceType', 'sourceName'.
    """
    try:
        new_filter = await request.json()
        # Basic validation
        required_fields = ["name", "type", "column", "sourceType", "sourceName"]
        if not all(field in new_filter for field in required_fields):
            raise HTTPException(status_code=400, detail="Campos obrigatórios ausentes na definição do filtro.")

        filters = []
        if os.path.exists(FILTERS_FILE):
            with open(FILTERS_FILE, "r", encoding="utf-8") as f:
                filters = json.load(f)
        
        # Check for duplicate name
        if any(f.get("name") == new_filter["name"] for f in filters):
            raise HTTPException(status_code=409, detail=f"Filtro com o nome '{new_filter['name']}' já existe.")

        filters.append(new_filter)

        with open(FILTERS_FILE, "w", encoding="utf-8") as f:
            json.dump(filters, f, indent=4, ensure_ascii=False)
        
        logging.info(f"Filtro '{new_filter['name']}' salvo com sucesso.")
        return {"status": "sucesso", "message": f"Filtro '{new_filter['name']}' salvo."}
    except json.JSONDecodeError:
        logging.error("Corpo da requisição para salvar filtro não é um JSON válido.")
        raise HTTPException(status_code=400, detail="Requisição inválida. Esperado um JSON válido.")
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.exception("Erro ao salvar filtro.")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao salvar filtro. Verifique o LogFalha.txt."
        )

@app.get("/api/filters", tags=["Universal Filters"], summary="Lista todos os filtros universais salvos")
async def list_filters():
    """
    Retorna uma lista de todos os filtros universais salvos.
    """
    try:
        if not os.path.exists(FILTERS_FILE):
            return JSONResponse(content=[])
        
        with open(FILTERS_FILE, "r", encoding="utf-8") as f:
            filters = json.load(f)
        
        logging.info("Filtros listados com sucesso.")
        return JSONResponse(content=filters)
    except Exception as e:
        logging.exception("Erro ao listar filtros.")
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao listar filtros. Verifique o LogFalha.txt."
        )
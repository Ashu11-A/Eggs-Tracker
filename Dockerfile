FROM python:3.12-slim

# Define diretório de trabalho
WORKDIR /app

# Instala dependências mínimas do sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instala uv (gerenciador de pacotes Python rápido)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copia arquivos de dependências do projeto
COPY pyproject.toml uv.lock* ./

# Sincroniza dependências usando uv
RUN uv sync --frozen

# Copia o código da aplicação da pasta model e script de download
COPY model/main.py ./
COPY download_model.py ./

# Baixa o modelo GlotLID durante o build da imagem
# O modelo será incluído na imagem Docker (~200MB)
# Isso evita download a cada execução do container
# -u: unbuffered output para ver o progresso em tempo real
RUN .venv/bin/python -u download_model.py

# Define variável de ambiente para o caminho do modelo
ENV MODEL_PATH=/app/model_cache

# Expõe a porta da API
EXPOSE 8000

# Healthcheck para garantir que a API está respondendo
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/docs || exit 1

# Comando para iniciar a aplicação FastAPI com uvicorn
CMD [".venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

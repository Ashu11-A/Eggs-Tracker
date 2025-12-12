# Dockerfile para API de identificação de idioma com GlotLID
FROM python:3.11-slim

# Define diretório de trabalho
WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copia arquivos de dependências
COPY pyproject.toml uv.lock* ./

# Instala uv para gerenciamento de pacotes
RUN pip install --no-cache-dir uv

# Instala dependências do projeto
RUN uv pip install --system -r pyproject.toml || \
    (pip install --no-cache-dir fastapi uvicorn pydantic fasttext huggingface-hub)

# Copia o código da aplicação
COPY main.py ./

# Baixa o modelo durante o build (evita download a cada execução)
RUN python -c "from huggingface_hub import hf_hub_download; \
    import os; \
    model_path = hf_hub_download(repo_id='cis-lmu/glotlid', filename='model.bin', cache_dir='/app/model_cache'); \
    print(f'Model downloaded to: {model_path}'); \
    with open('/app/model_path.txt', 'w') as f: f.write(model_path)"

# Define variável de ambiente para o modelo
ENV MODEL_PATH=/app/model_cache

# Expõe a porta da API
EXPOSE 8000

# Comando para iniciar a aplicação
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

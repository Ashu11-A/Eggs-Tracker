# GlotLID Language Detection API

API para detecção de idioma usando o modelo GlotLID da cis-lmu.

## Desenvolvimento Local

### Usando Docker

```bash
# Build da imagem
docker build -t eggs-tracker-glotlid:latest .

# Executar container
docker run -p 8000:8000 eggs-tracker-glotlid:latest
```

### Usando Python diretamente

```bash
# Instalar dependências
pip install fastapi uvicorn pydantic fasttext huggingface-hub

# Executar API
uvicorn main:app --reload
```

## Uso

A API estará disponível em `http://localhost:8000`.

### Endpoint: POST /identify

Detecta o idioma de um texto.

**Request:**
```json
{
  "text_content": "Este é um texto em português"
}
```

**Response:**
```json
{
  "language": "por_Latn",
  "confidence": 0.98
}
```

### Documentação Interativa

Acesse `http://localhost:8000/docs` para a documentação Swagger interativa.

## Modelo

Este serviço usa o modelo [GlotLID](https://huggingface.co/cis-lmu/glotlid) para identificação de idioma.
O modelo é baixado automaticamente durante o build do Docker ou na primeira execução.

## Variáveis de Ambiente

- `MODEL_PATH`: Caminho para o arquivo do modelo (padrão: baixado do Hugging Face)

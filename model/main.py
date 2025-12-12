import os
import re
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import fasttext
from huggingface_hub import hf_hub_download

# Variável global para armazenar o modelo carregado
language_model = None

@asynccontextmanager
async def lifespan(application: FastAPI) -> AsyncGenerator:
  """
  Gerenciador de ciclo de vida da aplicação.
  """
  global language_model
  try:
    model_path = os.getenv("MODEL_PATH", "./model.bin")
    
    # Se for um diretório, procura o model.bin dentro dele
    if os.path.isdir(model_path):
      # Procura recursivamente pelo model.bin
      for root, dirs, files in os.walk(model_path):
        if "model.bin" in files:
          model_path = os.path.join(root, "model.bin")
          break
    
    if not os.path.exists(model_path):
      print(f"Modelo não encontrado em {model_path}. Baixando do Hugging Face...")
      model_path = hf_hub_download(
        repo_id="cis-lmu/glotlid",
        filename="model.bin",
        cache_dir="/tmp/hf_cache"
      )
    
    print(f"Carregando modelo de: {model_path}")
    language_model = fasttext.load_model(model_path)
    print("✓ Modelo GlotLID carregado com sucesso!")
    
  except Exception as error:
    print(f"✗ Erro crítico ao carregar o modelo: {error}")
    import traceback
    traceback.print_exc()
  
  yield
  
  print("Limpando recursos...")
  language_model = None

app = FastAPI(
  title="GlotLID Language Identifier API",
  lifespan=lifespan
)

class TextInput(BaseModel):
  text_content: str

class LanguagePrediction(BaseModel):
  language: str
  confidence: float

def clean_input_text(raw_text: str) -> str:
  """
  Realiza a limpeza do texto para adequação ao FastText.
  1. Remove URLs (ruído).
  2. Substitui quebras de linha (\r\n, \n) por espaços.
  3. Remove espaços múltiplos e excessivos.
  """
  # Remove URLs (http/https) pois não ajudam na identificação da língua
  text_without_urls = re.sub(r'http\S+', '', raw_text)
  
  # Substitui quebras de linha e tabs por espaços simples
  # Isso resolve o problema do '\r\n' mencionado
  text_single_line = text_without_urls.replace('\r', ' ').replace('\n', ' ').replace('\t', ' ')
  
  # Remove múltiplos espaços em branco consecutivos resultantes da limpeza
  cleaned_text = re.sub(r'\s+', ' ', text_single_line).strip()
  
  return cleaned_text

@app.post("/identify", response_model=LanguagePrediction)
async def identify_language(input_data: TextInput) -> LanguagePrediction:
  """
  Endpoint para identificação de linguagem com pré-processamento de texto.
  """
  if language_model is None:
    raise HTTPException(status_code=503, detail="Modelo não inicializado.")

  # Processa o texto para remover caracteres especiais de formatação
  sanitized_text = clean_input_text(input_data.text_content)
  
  print(sanitized_text)
  
  # Se o texto ficar vazio após limpeza (ex: só tinha links ou espaços), retorna erro ou trata
  if not sanitized_text:
     raise HTTPException(status_code=400, detail="O texto fornecido não contém conteúdo analisável.")

  # Realiza a predição
  prediction_labels, prediction_probabilities = language_model.predict(sanitized_text, k=1)

  detected_label = prediction_labels[0].replace("__label__", "")
  confidence_score = float(prediction_probabilities[0])

  return LanguagePrediction(
    language=detected_label,
    confidence=confidence_score
  )
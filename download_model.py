#!/usr/bin/env python3
"""Script para baixar o modelo GlotLID durante o build da imagem Docker."""
import os
import sys
from huggingface_hub import hf_hub_download

# Força flush imediato do output
sys.stdout.reconfigure(line_buffering=True)

print("=" * 80, flush=True)
print("📥 INICIANDO DOWNLOAD DO MODELO GLOTLID", flush=True)
print("=" * 80, flush=True)
print(f"Repositório: cis-lmu/glotlid", flush=True)
print(f"Arquivo: model.bin (~200MB)", flush=True)
print(f"Destino: /app/model_cache", flush=True)
print("-" * 80, flush=True)

try:
    print("Conectando ao Hugging Face...", flush=True)
    model_path = hf_hub_download(
        repo_id="cis-lmu/glotlid",
        filename="model.bin",
        cache_dir="/app/model_cache",
        resume_download=True
    )
    print("-" * 80, flush=True)
    print(f"✓ SUCESSO! Modelo baixado para: {model_path}", flush=True)
    
    # Salva o caminho do modelo
    with open("/app/model_path.txt", "w") as f:
        f.write(model_path)
    
    # Verifica o tamanho do arquivo
    if os.path.exists(model_path):
        size_mb = os.path.getsize(model_path) / (1024 * 1024)
        print(f"✓ Tamanho do arquivo: {size_mb:.2f} MB", flush=True)
    
    print("=" * 80, flush=True)
    print("✓ MODELO INCLUÍDO NA IMAGEM COM SUCESSO!", flush=True)
    print("=" * 80, flush=True)
    
except Exception as e:
    print(f"✗ ERRO ao baixar modelo: {e}", flush=True)
    sys.exit(1)

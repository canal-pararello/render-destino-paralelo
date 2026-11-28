"""Gera imagens de cena com Animagine XL 4.0 em CPU (máquina do GitHub Actions, 4 núcleos).

Uso (dentro do workflow): python gerar_cpu.py pedido.json --parte 0 --partes 10 --saida out
Pedido = mesmo formato do agente_imagens.json do Kaggle (+ largura/altura/passos opcionais).
"""
import argparse
import json
import time
from pathlib import Path

import torch
from compel import Compel, ReturnedEmbeddingsType
from diffusers import EulerAncestralDiscreteScheduler, StableDiffusionXLPipeline

ap = argparse.ArgumentParser()
ap.add_argument("pedido")
ap.add_argument("--parte", type=int, default=0)
ap.add_argument("--partes", type=int, default=1)
ap.add_argument("--saida", default="out")
a = ap.parse_args()

pedido = json.loads(Path(a.pedido).read_text(encoding="utf-8"))
cenas = pedido["cenas"][a.parte :: a.partes]
L, A = pedido.get("largura", 1024), pedido.get("altura", 576)
passos = pedido.get("passos_cpu", pedido.get("passos", 28))
torch.set_num_threads(max(1, torch.get_num_threads()))
print(f"parte {a.parte}/{a.partes}: {len(cenas)} cenas, {L}x{A}, {passos} passos, {torch.get_num_threads()} threads", flush=True)

t0 = time.time()
pipe = StableDiffusionXLPipeline.from_pretrained(pedido["modelo"], torch_dtype=torch.float32, use_safetensors=True)
if pedido.get("lora_repo"):
    pipe.load_lora_weights(pedido["lora_repo"], weight_name=pedido.get("lora_weight"))
    print(f"LoRA carregado: {pedido['lora_repo']}", flush=True)
pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(pipe.scheduler.config)
pipe.enable_vae_tiling()
print(f"modelo carregado em {time.time() - t0:.0f}s", flush=True)
compel = Compel(tokenizer=[pipe.tokenizer, pipe.tokenizer_2], text_encoder=[pipe.text_encoder, pipe.text_encoder_2],
                returned_embeddings_type=ReturnedEmbeddingsType.PENULTIMATE_HIDDEN_STATES_NON_NORMALIZED,
                requires_pooled=[False, True], truncate_long_prompts=False)

saida = Path(a.saida)
saida.mkdir(parents=True, exist_ok=True)
for c in cenas:
    t = time.time()
    texto = c["prompt"].replace("(", ",").replace(")", ",")
    with torch.inference_mode():
        cond, pool = compel(texto)
        neg, neg_pool = compel(c.get("negativo") or pedido["negativo"])
        cond, neg = compel.pad_conditioning_tensors_to_same_length([cond, neg])
        img = pipe(prompt_embeds=cond, pooled_prompt_embeds=pool, negative_prompt_embeds=neg,
                   negative_pooled_prompt_embeds=neg_pool, width=L, height=A, num_inference_steps=passos,
                   guidance_scale=pedido.get("cfg", 5.0),
                   generator=torch.Generator("cpu").manual_seed(1000 + c["n"])).images[0]
    img.save(saida / f"cena-{c['n']:03d}.jpg", quality=93)
    print(f"[{c['n']:03d}] {time.time() - t:.0f}s", flush=True)
print(f"total {time.time() - t0:.0f}s", flush=True)

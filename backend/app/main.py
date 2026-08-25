import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth_deps import obter_usuario_atual
from app.routers import (
    auth,
    usuarios,
    maquinas,
    fornecedores,
    manutencoes,
    preventivas,
    abastecimentos,
    notas_fiscais,
    checklist,
    dashboard,
    relatorios,
    financeiro,
    logs,
)

load_dotenv()

app = FastAPI(
    title="Controle de Frota API",
    description="API do sistema de controle de frota (máquinas, manutenções, abastecimentos, notas fiscais, checklist).",
    version="0.1.0",
)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# /auth (login) fica público -- sem exigir token, é a própria porta de entrada.
app.include_router(auth.router)

# Todos os demais módulos exigem estar logado (token JWT válido no header Authorization).
# Ações de exclusão exigem papel 'admin' -- isso é checado individualmente em cada
# rota DELETE dos routers abaixo, via dependency `exigir_admin`.
_protegido = [Depends(obter_usuario_atual)]

app.include_router(usuarios.router, dependencies=_protegido)
app.include_router(maquinas.router, dependencies=_protegido)
app.include_router(fornecedores.router, dependencies=_protegido)
app.include_router(manutencoes.router, dependencies=_protegido)
app.include_router(preventivas.router, dependencies=_protegido)
app.include_router(abastecimentos.router, dependencies=_protegido)
app.include_router(notas_fiscais.router, dependencies=_protegido)
app.include_router(checklist.router, dependencies=_protegido)
app.include_router(dashboard.router, dependencies=_protegido)
app.include_router(relatorios.router, dependencies=_protegido)
app.include_router(financeiro.router, dependencies=_protegido)
app.include_router(logs.router, dependencies=_protegido)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "controle-frota-api"}

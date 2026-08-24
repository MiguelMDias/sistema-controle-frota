from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TipoManutencao(str, Enum):
    preventiva = "preventiva"
    corretiva = "corretiva"


class StatusManutencao(str, Enum):
    concluida = "concluida"
    pendente = "pendente"
    em_andamento = "em_andamento"


# ---------- Manutenções (histórico realizado) ----------

class ManutencaoBase(BaseModel):
    maquina_id: int
    fornecedor_id: Optional[int] = None
    data: date
    tipo: TipoManutencao
    descricao: str
    horimetro: Optional[float] = None
    km: Optional[float] = None
    custo: Optional[float] = None
    status: StatusManutencao = StatusManutencao.concluida


class ManutencaoCreate(ManutencaoBase):
    pass


class ManutencaoUpdate(BaseModel):
    maquina_id: Optional[int] = None
    fornecedor_id: Optional[int] = None
    data: Optional[date] = None
    tipo: Optional[TipoManutencao] = None
    descricao: Optional[str] = None
    horimetro: Optional[float] = None
    km: Optional[float] = None
    custo: Optional[float] = None
    status: Optional[StatusManutencao] = None


class Manutencao(ManutencaoBase):
    id: int
    created_at: datetime
    # campos "achatados" pra facilitar exibição na tabela sem o front
    # precisar cruzar com /maquinas e /fornecedores toda hora
    maquina_codigo: Optional[str] = None
    fornecedor_nome: Optional[str] = None


# ---------- Planos de preventiva (regras de vencimento) ----------

class PlanoPreventivaBase(BaseModel):
    maquina_id: int
    descricao: str
    intervalo_horimetro: Optional[float] = None
    intervalo_km: Optional[float] = None
    intervalo_dias: Optional[int] = None


class PlanoPreventivaCreate(PlanoPreventivaBase):
    pass


class PlanoPreventivaUpdate(BaseModel):
    descricao: Optional[str] = None
    intervalo_horimetro: Optional[float] = None
    intervalo_km: Optional[float] = None
    intervalo_dias: Optional[int] = None


class PlanoPreventiva(PlanoPreventivaBase):
    id: int
    ultima_execucao_id: Optional[int] = None
    proxima_data: Optional[date] = None
    proximo_horimetro: Optional[float] = None
    proximo_km: Optional[float] = None
    created_at: datetime
    # campos calculados, não vêm do banco -- ver router
    maquina_codigo: Optional[str] = None
    status_calculado: Optional[str] = None  # "vencida" | "proxima" | "em_dia"

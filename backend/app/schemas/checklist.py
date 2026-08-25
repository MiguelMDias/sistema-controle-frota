from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ItemChecklist(BaseModel):
    item: str
    obrigatorio: bool = True


class ChecklistModeloBase(BaseModel):
    tipo_maquina: str
    nome: str
    itens: list[ItemChecklist]


class ChecklistModeloCreate(ChecklistModeloBase):
    pass


class ChecklistModelo(ChecklistModeloBase):
    id: int
    created_at: datetime


class RespostaItem(BaseModel):
    item: str
    ok: bool
    obs: Optional[str] = None


class ChecklistExecucaoCreate(BaseModel):
    maquina_id: int
    modelo_id: Optional[int] = None
    operador: Optional[str] = None
    horimetro: Optional[float] = None
    km: Optional[float] = None
    respostas: list[RespostaItem]


class ChecklistExecucao(BaseModel):
    id: int
    maquina_id: int
    modelo_id: Optional[int] = None
    operador: Optional[str] = None
    data: datetime
    horimetro: Optional[float] = None
    km: Optional[float] = None
    respostas: list[RespostaItem]
    tem_pendencia: bool
    maquina_codigo: Optional[str] = None

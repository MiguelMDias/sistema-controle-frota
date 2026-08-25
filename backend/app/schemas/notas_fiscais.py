from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class TipoNota(str, Enum):
    peca = "peca"
    servico = "servico"
    outro = "outro"


class NotaFiscalBase(BaseModel):
    numero: str
    serie: str = "1"
    fornecedor_id: Optional[int] = None
    data_emissao: date
    tipo: TipoNota
    valor_total: float
    arquivo_url: Optional[str] = None
    observacoes: Optional[str] = None


class NotaFiscalCreate(NotaFiscalBase):
    maquina_ids: list[int] = []  # máquinas vinculadas (N:N)


class NotaFiscalUpdate(BaseModel):
    numero: Optional[str] = None
    serie: Optional[str] = None
    fornecedor_id: Optional[int] = None
    data_emissao: Optional[date] = None
    tipo: Optional[TipoNota] = None
    valor_total: Optional[float] = None
    arquivo_url: Optional[str] = None
    observacoes: Optional[str] = None
    maquina_ids: Optional[list[int]] = None


class NotaFiscal(NotaFiscalBase):
    id: int
    created_at: datetime
    fornecedor_nome: Optional[str] = None
    maquinas: list[str] = []  # códigos das máquinas vinculadas

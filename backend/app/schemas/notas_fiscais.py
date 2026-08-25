from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class TipoNota(str, Enum):
    peca = "peca"
    servico = "servico"
    outro = "outro"


class ItemNotaFiscal(BaseModel):
    nome: str = Field(..., max_length=200)
    quantidade: float = Field(..., gt=0)
    valor_unitario: float = Field(..., ge=0)


class ItemNotaFiscalOut(ItemNotaFiscal):
    id: int


class NotaFiscalBase(BaseModel):
    numero: str = Field(..., min_length=1, max_length=10, examples=["000123"])
    serie: str = "1"
    fornecedor_id: int
    data_emissao: date
    tipo: TipoNota
    valor_total: float
    centro_despesa_id: Optional[int] = None
    arquivo_url: Optional[str] = None
    observacoes: Optional[str] = None

    @field_validator("numero")
    @classmethod
    def validar_numero(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Número da nota deve conter apenas números")
        return v

    @field_validator("data_emissao")
    @classmethod
    def validar_data_emissao(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Data de emissão não pode ser uma data futura")
        return v


class NotaFiscalCreate(NotaFiscalBase):
    maquina_ids: list[int] = []  # máquinas vinculadas (N:N)
    itens: list[ItemNotaFiscal] = []


class NotaFiscalUpdate(BaseModel):
    numero: Optional[str] = Field(None, min_length=1, max_length=10)
    serie: Optional[str] = None
    fornecedor_id: Optional[int] = None
    data_emissao: Optional[date] = None
    tipo: Optional[TipoNota] = None
    valor_total: Optional[float] = None
    centro_despesa_id: Optional[int] = None
    arquivo_url: Optional[str] = None
    observacoes: Optional[str] = None
    maquina_ids: Optional[list[int]] = None
    itens: Optional[list[ItemNotaFiscal]] = None

    @field_validator("numero")
    @classmethod
    def validar_numero(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.isdigit():
            raise ValueError("Número da nota deve conter apenas números")
        return v

    @field_validator("data_emissao")
    @classmethod
    def validar_data_emissao(cls, v: Optional[date]) -> Optional[date]:
        if v is None:
            return v
        if v > date.today():
            raise ValueError("Data de emissão não pode ser uma data futura")
        return v


class NotaFiscal(NotaFiscalBase):
    id: int
    created_at: datetime
    fornecedor_nome: Optional[str] = None
    maquinas: list[str] = []  # códigos das máquinas vinculadas
    itens: list[ItemNotaFiscalOut] = []

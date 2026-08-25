from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator

ANO_MINIMO = 1980


def _ano_maximo() -> int:
    return datetime.now().year + 1


class TipoMaquina(str, Enum):
    carro = "carro"
    trator = "trator"
    empilhadeira_gas = "empilhadeira_gas"
    empilhadeira_eletrica = "empilhadeira_eletrica"


class SituacaoMaquina(str, Enum):
    ativa = "ativa"
    inativa = "inativa"
    manutencao = "manutencao"
    baixada = "baixada"


class MaquinaBase(BaseModel):
    codigo: str = Field(..., max_length=20, examples=["MAQ-0012"])
    numero_patrimonial: Optional[str] = Field(None, max_length=30)
    numero_serie: Optional[str] = Field(None, max_length=30)
    tipo: TipoMaquina
    marca: Optional[str] = Field(None, max_length=20)
    modelo: Optional[str] = Field(None, max_length=20)
    ano: Optional[int] = None
    situacao: SituacaoMaquina = SituacaoMaquina.ativa
    centro_despesa_id: Optional[int] = None
    responsavel: Optional[str] = None
    foto_url: Optional[str] = None

    @field_validator("ano")
    @classmethod
    def validar_ano(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        maximo = _ano_maximo()
        if v < ANO_MINIMO or v > maximo:
            raise ValueError(f"Ano deve estar entre {ANO_MINIMO} e {maximo}")
        return v


class MaquinaCreate(MaquinaBase):
    pass


class MaquinaUpdate(BaseModel):
    """Todos os campos opcionais -- permite update parcial (PATCH)."""
    codigo: Optional[str] = Field(None, max_length=20)
    numero_patrimonial: Optional[str] = Field(None, max_length=30)
    numero_serie: Optional[str] = Field(None, max_length=30)
    tipo: Optional[TipoMaquina] = None
    marca: Optional[str] = Field(None, max_length=20)
    modelo: Optional[str] = Field(None, max_length=20)
    ano: Optional[int] = None
    situacao: Optional[SituacaoMaquina] = None
    centro_despesa_id: Optional[int] = None
    responsavel: Optional[str] = None
    foto_url: Optional[str] = None

    @field_validator("ano")
    @classmethod
    def validar_ano(cls, v: Optional[int]) -> Optional[int]:
        if v is None:
            return v
        maximo = _ano_maximo()
        if v < ANO_MINIMO or v > maximo:
            raise ValueError(f"Ano deve estar entre {ANO_MINIMO} e {maximo}")
        return v


class Maquina(MaquinaBase):
    id: int
    horimetro_atual: float = 0
    km_atual: float = 0
    created_at: datetime
    updated_at: datetime


class CentroDespesa(BaseModel):
    id: int
    nome: str
    ativo: bool = True


class CentroDespesaCreate(BaseModel):
    nome: str = Field(..., max_length=50)

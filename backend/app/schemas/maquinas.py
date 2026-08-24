from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class TipoMaquina(str, Enum):
    carro = "carro"
    trator = "trator"
    empilhadeira_gas = "empilhadeira_gas"
    empilhadeira_eletrica = "empilhadeira_eletrica"


class SituacaoMaquina(str, Enum):
    ativa = "ativa"
    manutencao = "manutencao"
    baixada = "baixada"


class MaquinaBase(BaseModel):
    codigo: str = Field(..., max_length=20, examples=["MAQ-0012"])
    numero_patrimonial: Optional[str] = None
    tipo: TipoMaquina
    marca: Optional[str] = None
    modelo: Optional[str] = None
    ano: Optional[int] = None
    situacao: SituacaoMaquina = SituacaoMaquina.ativa
    centro_custo: Optional[str] = None
    responsavel: Optional[str] = None
    foto_url: Optional[str] = None


class MaquinaCreate(MaquinaBase):
    pass


class MaquinaUpdate(BaseModel):
    """Todos os campos opcionais -- permite update parcial (PATCH)."""
    codigo: Optional[str] = None
    numero_patrimonial: Optional[str] = None
    tipo: Optional[TipoMaquina] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    ano: Optional[int] = None
    situacao: Optional[SituacaoMaquina] = None
    centro_custo: Optional[str] = None
    responsavel: Optional[str] = None
    foto_url: Optional[str] = None


class Maquina(MaquinaBase):
    id: int
    horimetro_atual: float = 0
    km_atual: float = 0
    created_at: datetime
    updated_at: datetime

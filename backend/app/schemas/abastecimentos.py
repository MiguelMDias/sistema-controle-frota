from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class TipoCombustivel(str, Enum):
    gasolina = "gasolina"
    diesel = "diesel"
    gas_glp = "gas_glp"
    energia_eletrica = "energia_eletrica"


class AbastecimentoBase(BaseModel):
    maquina_id: int
    fornecedor_id: Optional[int] = None
    data: date
    tipo_combustivel: TipoCombustivel
    quantidade: float  # litros, kg (gás) ou kWh, dependendo do tipo
    valor_total: float
    horimetro: Optional[float] = None
    km: Optional[float] = None


class AbastecimentoCreate(AbastecimentoBase):
    pass


class AbastecimentoUpdate(BaseModel):
    maquina_id: Optional[int] = None
    fornecedor_id: Optional[int] = None
    data: Optional[date] = None
    tipo_combustivel: Optional[TipoCombustivel] = None
    quantidade: Optional[float] = None
    valor_total: Optional[float] = None
    horimetro: Optional[float] = None
    km: Optional[float] = None


class Abastecimento(AbastecimentoBase):
    id: int
    created_at: datetime
    maquina_codigo: Optional[str] = None
    fornecedor_nome: Optional[str] = None

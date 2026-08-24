from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FornecedorBase(BaseModel):
    nome: str = Field(..., max_length=200)
    cnpj: Optional[str] = Field(None, max_length=20)
    telefone: Optional[str] = None
    email: Optional[str] = None
    contato: Optional[str] = None


class FornecedorCreate(FornecedorBase):
    pass


class FornecedorUpdate(BaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None
    contato: Optional[str] = None


class Fornecedor(FornecedorBase):
    id: int
    created_at: datetime

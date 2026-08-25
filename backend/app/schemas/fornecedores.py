from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class FornecedorBase(BaseModel):
    nome: str = Field(..., max_length=200)
    cnpj: str = Field(..., min_length=14, max_length=14, examples=["12345678000199"])
    telefone: Optional[str] = Field(None, max_length=13)
    email: Optional[str] = Field(None, max_length=50)
    contato: Optional[str] = None

    @field_validator("cnpj")
    @classmethod
    def validar_cnpj(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("CNPJ deve conter apenas números (14 dígitos, sem pontuação)")
        if len(v) != 14:
            raise ValueError("CNPJ deve ter exatamente 14 dígitos")
        return v

    @field_validator("telefone")
    @classmethod
    def validar_telefone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        if not v.isdigit():
            raise ValueError("Telefone deve conter apenas números (DDD + número, sem pontuação)")
        return v


class FornecedorCreate(FornecedorBase):
    pass


class FornecedorUpdate(BaseModel):
    nome: Optional[str] = Field(None, max_length=200)
    cnpj: Optional[str] = Field(None, min_length=14, max_length=14)
    telefone: Optional[str] = Field(None, max_length=13)
    email: Optional[str] = Field(None, max_length=50)
    contato: Optional[str] = None

    @field_validator("cnpj")
    @classmethod
    def validar_cnpj(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.isdigit():
            raise ValueError("CNPJ deve conter apenas números (14 dígitos, sem pontuação)")
        if len(v) != 14:
            raise ValueError("CNPJ deve ter exatamente 14 dígitos")
        return v

    @field_validator("telefone")
    @classmethod
    def validar_telefone(cls, v: Optional[str]) -> Optional[str]:
        if v is None or v == "":
            return None
        if not v.isdigit():
            raise ValueError("Telefone deve conter apenas números (DDD + número, sem pontuação)")
        return v


class Fornecedor(FornecedorBase):
    id: int
    created_at: datetime

#!/bin/bash
# Popula fornecedores e notas fiscais de teste, chamando a API local.
# Uso: ./seed.sh (rode dentro da pasta backend, com o uvicorn já rodando)

API_URL="${1:-http://localhost:8000}"

echo "Usando API: $API_URL"
echo ""
echo "=== Criando fornecedores ==="

curl -s -X POST "$API_URL/fornecedores" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Oficina do João", "cnpj": "12345678000199", "telefone": "6133331111", "email": "contato@oficinajoao.com", "contato": "João Silva"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  criado: {d[\"nome\"]} (id={d[\"id\"]})')"

curl -s -X POST "$API_URL/fornecedores" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Posto Ipiranga Centro", "cnpj": "98765432000188", "telefone": "6133332222"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  criado: {d[\"nome\"]} (id={d[\"id\"]})')"

curl -s -X POST "$API_URL/fornecedores" \
  -H "Content-Type: application/json" \
  -d '{"nome": "Peças & Cia Tratores", "cnpj": "11222333000144", "email": "vendas@pecascia.com"}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  criado: {d[\"nome\"]} (id={d[\"id\"]})')"

echo ""
echo "=== Buscando IDs para vincular nas notas fiscais ==="

FORNECEDOR_ID=$(curl -s "$API_URL/fornecedores?busca=Oficina" | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['id'])")
MAQUINA_ID=$(curl -s "$API_URL/maquinas" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if d else '')")

echo "  fornecedor_id=$FORNECEDOR_ID  maquina_id=$MAQUINA_ID"

if [ -z "$MAQUINA_ID" ]; then
  echo "  AVISO: nenhuma máquina encontrada. Cadastre uma máquina antes de rodar as notas fiscais."
  exit 0
fi

echo ""
echo "=== Criando notas fiscais ==="

curl -s -X POST "$API_URL/notas-fiscais" \
  -H "Content-Type: application/json" \
  -d "{\"numero\": \"1001\", \"serie\": \"1\", \"fornecedor_id\": $FORNECEDOR_ID, \"data_emissao\": \"$(date +%Y-%m-%d)\", \"tipo\": \"peca\", \"valor_total\": 450.00, \"observacoes\": \"Troca de filtro de óleo\", \"maquina_ids\": [$MAQUINA_ID]}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  criada: nota {d[\"numero\"]} (id={d[\"id\"]})')"

curl -s -X POST "$API_URL/notas-fiscais" \
  -H "Content-Type: application/json" \
  -d "{\"numero\": \"1002\", \"serie\": \"1\", \"fornecedor_id\": $FORNECEDOR_ID, \"data_emissao\": \"$(date +%Y-%m-%d)\", \"tipo\": \"servico\", \"valor_total\": 300.00, \"maquina_ids\": [$MAQUINA_ID]}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  criada: nota {d[\"numero\"]} (id={d[\"id\"]})')"

echo ""
echo "Concluído! Confira em Fornecedores e Notas Fiscais no navegador."

# Controle de Frota

Sistema de controle de frota (máquinas, manutenções, abastecimentos, notas fiscais, checklist).

## Como rodar (sem instalar nada no seu PC)

Este projeto usa **GitHub Codespaces** — um ambiente de desenvolvimento completo rodando na nuvem,
acessado pelo navegador. Node.js, Python e todas as dependências já vêm prontos automaticamente.

### 1. Subir o projeto pro GitHub
No seu perfil do GitHub, crie um repositório novo (ex: `controle-frota`) e envie estes arquivos
(pelo próprio site do GitHub: "Add file" → "Upload files", arraste a pasta inteira).

### 2. Abrir no Codespaces
No repositório, clique no botão verde **Code** → aba **Codespaces** → **Create codespace on main**.

Aguarde alguns minutos na primeira vez — ele vai instalar Node.js, Python e todas as dependências
sozinho (definido em `.devcontainer/devcontainer.json`). Você verá o progresso no terminal.

### 3. Configurar as variáveis de ambiente
No terminal do Codespaces (já aberto no navegador):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edite `backend/.env` e cole sua `SUPABASE_SERVICE_KEY`
(pegue em: Supabase → Project Settings → API → service_role secret).

### 4. Rodar o backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0
```
O Codespaces vai perguntar se quer abrir a porta 8000 no navegador — aceite.

### 5. Rodar o frontend (em outro terminal)
No VS Code do navegador, abra um novo terminal (ícone `+`) e rode:
```bash
cd frontend
npm run dev -- --host 0.0.0.0
```
O Codespaces abre automaticamente a porta 5173 com o preview do sistema.

## Deploy em produção (depois de testado)

### Frontend no Vercel

1. Acesse [vercel.com](https://vercel.com) → login com GitHub
2. **Add New** → **Project** → selecione o repositório `controle-frota`
3. Em **Root Directory**, clique em **Edit** e selecione `frontend`
4. O Vercel detecta Vite automaticamente (Build Command: `npm run build`, Output: `dist`)
5. Em **Environment Variables**, adicione:
   ```
   VITE_API_URL=https://sua-url-do-backend.up.railway.app
   ```
   (a URL real do backend, depois que o Railway finalizar o deploy)
6. Clique em **Deploy**

O `vercel.json` já está configurado para lidar com as rotas do React Router (evita erro 404 ao recarregar a página em `/maquinas`, `/manutencoes`, etc.)

### Backend no Railway
Veja seção de configuração no topo do repositório (Root Directory = `backend`, Start Command com `uvicorn`).

### Banco
Supabase já configurado -- nenhuma etapa adicional de deploy necessária.

Depois que backend e frontend estiverem publicados, **atualize as variáveis de ambiente cruzadas**:
- No Railway: `FRONTEND_URL` deve apontar para a URL final do Vercel
- No Vercel: `VITE_API_URL` deve apontar para a URL final do Railway

Nenhuma dessas etapas exige instalar nada na sua máquina -- tudo roda na nuvem dos próprios serviços.

// Dados fictícios usados exclusivamente no modo Observador.
// Nenhuma chamada nesse modo chega a sair pro backend -- tudo é resolvido aqui,
// localmente, então o "observador" nunca tem acesso ao banco de dados real.

const maquinasDemo = [
  { id: -1, codigo: 'DEMO-001', numero_patrimonial: 'ABC-1D23', tipo: 'carro', marca: 'Fiat', modelo: 'Strada', ano: 2022, situacao: 'ativa', centro_despesa_id: null, responsavel: 'Colaborador Exemplo', horimetro_atual: 0, km_atual: 18500, foto_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: -2, codigo: 'DEMO-002', numero_patrimonial: '02', tipo: 'empilhadeira_eletrica', marca: 'Still', modelo: 'CLX 25', ano: 2020, situacao: 'ativa', centro_despesa_id: null, responsavel: null, horimetro_atual: 1240, km_atual: 0, foto_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: -3, codigo: 'DEMO-003', numero_patrimonial: 'MAQ-0003', tipo: 'trator', marca: 'New Holland', modelo: 'TL75E', ano: 2018, situacao: 'manutencao', centro_despesa_id: null, responsavel: null, horimetro_atual: 3320, km_atual: 0, foto_url: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

const fornecedoresDemo = [
  { id: -1, nome: 'Oficina Exemplo Ltda', cnpj: '00000000000100', telefone: '1100000000', email: 'contato@exemplo.com', contato: 'Fulano de Tal', created_at: new Date().toISOString() },
  { id: -2, nome: 'Posto Demonstração', cnpj: '00000000000200', telefone: '1100000001', email: null, contato: null, created_at: new Date().toISOString() },
]

const manutencoesDemo = [
  { id: -1, maquina_id: -2, fornecedor_id: -1, data: new Date().toISOString().slice(0, 10), tipo: 'preventiva', descricao: 'Troca de óleo e filtro (exemplo)', horimetro: 1240, km: null, custo: 320.5, status: 'concluida', maquina_codigo: 'DEMO-002', fornecedor_nome: 'Oficina Exemplo Ltda', created_at: new Date().toISOString() },
]

const preventivasDemo = [
  { id: -1, maquina_id: -2, descricao: 'Revisão a cada 250h (exemplo)', intervalo_horimetro: 250, intervalo_km: null, intervalo_dias: null, proxima_data: null, proximo_horimetro: 1490, proximo_km: null, maquina_codigo: 'DEMO-002', status_calculado: 'proxima', created_at: new Date().toISOString() },
]

const abastecimentosDemo = [
  { id: -1, maquina_id: -1, fornecedor_id: -2, data: new Date().toISOString().slice(0, 10), tipo_combustivel: 'gasolina', quantidade: 40, valor_total: 260, horimetro: null, km: 18500, maquina_codigo: 'DEMO-001', fornecedor_nome: 'Posto Demonstração', created_at: new Date().toISOString() },
]

const notasFiscaisDemo = [
  { id: -1, numero: '000001', serie: '1', fornecedor_id: -1, centro_despesa_id: null, data_emissao: new Date().toISOString().slice(0, 10), tipo: 'peca', valor_total: 320.5, observacoes: 'Nota de exemplo', fornecedor_nome: 'Oficina Exemplo Ltda', maquinas: ['DEMO-002'], itens: [{ id: -1, nome: 'Óleo de motor 15W40', quantidade: 4, valor_unitario: 80.125 }], created_at: new Date().toISOString() },
]

const checklistModelosDemo = [
  { id: -1, tipo_maquina: 'carro', nome: 'Inspeção diária (exemplo)', itens: [{ item: 'Nível de óleo', obrigatorio: true }, { item: 'Calibragem dos pneus', obrigatorio: true }], created_at: new Date().toISOString() },
]

const checklistExecucoesDemo = [
  { id: -1, maquina_id: -1, modelo_id: -1, operador: 'Colaborador Exemplo', data: new Date().toISOString(), horimetro: null, km: 18500, respostas: [{ item: 'Nível de óleo', ok: true, obs: '' }], tem_pendencia: false, maquina_codigo: 'DEMO-001' },
]

const dashboardResumoDemo = {
  total_maquinas: maquinasDemo.length,
  maquinas_ativas: maquinasDemo.filter((m) => m.situacao === 'ativa').length,
  em_manutencao: maquinasDemo.filter((m) => m.situacao === 'manutencao').length,
  preventivas_vencidas: 0,
  preventivas_proximas: 1,
  custos_mes: 580.5,
}

const dashboardCustosPorMesDemo = [
  { ano: 2026, mes: 3, total: 0 },
  { ano: 2026, mes: 4, total: 120 },
  { ano: 2026, mes: 5, total: 0 },
  { ano: 2026, mes: 6, total: 340 },
  { ano: 2026, mes: 7, total: 90 },
  { ano: 2026, mes: 8, total: 580.5 },
]

const dashboardCustosPorCategoriaDemo = [
  { categoria: 'Manutenção', total: 320.5 },
  { categoria: 'Combustível', total: 260 },
]

const dashboardFrotaPorSituacaoDemo = [
  { situacao: 'ativa', label: 'Ativa', total: 2 },
  { situacao: 'manutencao', label: 'Em Manutenção', total: 1 },
]

const dashboardFrotaPorTipoDemo = [
  { tipo: 'carro', label: 'Carro', total: 1 },
  { tipo: 'empilhadeira_eletrica', label: 'Empilhadeira Elétrica', total: 1 },
  { tipo: 'trator', label: 'Trator', total: 1 },
]

const dashboardAlertasDemo = [
  { severidade: 'alta', tipo: 'preventiva_vencida', maquina_codigo: 'DEMO-003', descricao: 'Preventiva vencida: Revisão a cada 250h (exemplo)' },
  { severidade: 'media', tipo: 'checklist_pendencia', maquina_codigo: 'DEMO-001', descricao: 'Checklist com pendência em 24/08' },
]

const dashboardTopCustosDemo = [
  { maquina_id: -2, codigo: 'DEMO-002', total: 320.5 },
  { maquina_id: -1, codigo: 'DEMO-001', total: 260 },
]

const centrosDespesaDemo = [
  { id: -1, nome: 'Logística (exemplo)', ativo: true },
  { id: -2, nome: 'Manutenção (exemplo)', ativo: true },
]

const financeiroVisaoGeralDemo = {
  manutencao: 320.5,
  abastecimento: 260,
  nota_fiscal: 320.5,
  total: 901,
  num_maquinas_ativas: 2,
  custo_medio_por_maquina: 450.5,
}

const financeiroCustoPorMaquinaDemo = [
  { maquina_id: -2, codigo: 'DEMO-002', tipo: 'empilhadeira_eletrica', centro_despesa_nome: null, manutencao: 320.5, abastecimento: 0, nota_fiscal: 320.5, total: 641 },
  { maquina_id: -1, codigo: 'DEMO-001', tipo: 'carro', centro_despesa_nome: null, manutencao: 0, abastecimento: 260, nota_fiscal: 0, total: 260 },
]

const financeiroCustoPorMesDemo = Array.from({ length: 12 }, (_, i) => ({
  mes: i + 1,
  manutencao: i === 7 ? 320.5 : 0,
  abastecimento: i === 7 ? 260 : 0,
  nota_fiscal: i === 7 ? 320.5 : 0,
  total: i === 7 ? 901 : 0,
}))

const financeiroComparacaoPeriodosDemo = {
  periodo_a: { manutencao: 320.5, abastecimento: 260, nota_fiscal: 320.5, total: 901 },
  periodo_b: { manutencao: 120, abastecimento: 90, nota_fiscal: 0, total: 210 },
  variacao_percentual: 329.05,
}

const financeiroComparacaoCentrosDemo = [
  { centro_despesa_id: -1, nome: 'Logística (exemplo)', manutencao: 0, abastecimento: 260, nota_fiscal: 0, total: 260 },
  { centro_despesa_id: null, nome: '(Sem centro de despesa)', manutencao: 320.5, abastecimento: 0, nota_fiscal: 320.5, total: 641 },
]

const logsAuditoriaDemo = [
  {
    id: -1, usuario_id: -1, usuario_nome: 'Admin Exemplo', acao: 'criar', entidade: 'maquina', entidade_id: -1,
    descricao: 'Máquina DEMO-001 cadastrada', created_at: new Date().toISOString(),
    dados_antes: null,
    dados_depois: { codigo: 'DEMO-001', tipo: 'carro', situacao: 'ativa', ano: 2022 },
  },
  {
    id: -2, usuario_id: -1, usuario_nome: 'Admin Exemplo', acao: 'atualizar', entidade: 'nota_fiscal', entidade_id: -1,
    descricao: 'Nota fiscal 000001/1 atualizada', created_at: new Date(Date.now() - 3600_000).toISOString(),
    dados_antes: { valor_total: 280.5, tipo: 'peca' },
    dados_depois: { valor_total: 320.5, tipo: 'peca' },
  },
  {
    id: -3, usuario_id: -1, usuario_nome: 'Admin Exemplo', acao: 'atualizar', entidade: 'abastecimento', entidade_id: -1,
    descricao: 'Abastecimento de DEMO-001 atualizado', created_at: new Date(Date.now() - 7200_000).toISOString(),
    dados_antes: { tipo_combustivel: 'gasolina', quantidade: 38 },
    dados_depois: { tipo_combustivel: 'diesel_s10', quantidade: 40 },
  },
]

// Mapeia padrões de rota (regex) para a resposta simulada.
// Ordem importa: padrões mais específicos primeiro.
const ROTAS_MOCK = [
  { padrao: /^\/logs\/usuarios-ativos/, dados: () => [{ id: -1, nome: 'Admin Exemplo' }] },
  { padrao: /^\/logs/, dados: () => logsAuditoriaDemo },
  { padrao: /^\/dashboard\/resumo$/, dados: () => dashboardResumoDemo },
  { padrao: /^\/dashboard\/custos-por-mes/, dados: () => dashboardCustosPorMesDemo },
  { padrao: /^\/dashboard\/custos-por-categoria/, dados: () => dashboardCustosPorCategoriaDemo },
  { padrao: /^\/dashboard\/frota-por-situacao/, dados: () => dashboardFrotaPorSituacaoDemo },
  { padrao: /^\/dashboard\/frota-por-tipo/, dados: () => dashboardFrotaPorTipoDemo },
  { padrao: /^\/dashboard\/alertas/, dados: () => dashboardAlertasDemo },
  { padrao: /^\/dashboard\/top-custos-maquinas/, dados: () => dashboardTopCustosDemo },
  { padrao: /^\/abastecimentos\/consumo\//, dados: () => ({ maquina_id: -1, maquina_codigo: 'DEMO-001', consumo_medio: 11.4, unidade: 'km/litro' }) },
  { padrao: /^\/financeiro\/visao-geral/, dados: () => financeiroVisaoGeralDemo },
  { padrao: /^\/financeiro\/custo-por-maquina/, dados: () => financeiroCustoPorMaquinaDemo },
  { padrao: /^\/financeiro\/custo-por-mes/, dados: () => financeiroCustoPorMesDemo },
  { padrao: /^\/financeiro\/comparacao-periodos/, dados: () => financeiroComparacaoPeriodosDemo },
  { padrao: /^\/financeiro\/comparacao-centros/, dados: () => financeiroComparacaoCentrosDemo },
  { padrao: /^\/maquinas\/centros-despesa\/listar/, dados: () => centrosDespesaDemo },
  { padrao: /^\/maquinas/, dados: () => maquinasDemo },
  { padrao: /^\/fornecedores/, dados: () => fornecedoresDemo },
  { padrao: /^\/manutencoes/, dados: () => manutencoesDemo },
  { padrao: /^\/preventivas/, dados: () => preventivasDemo },
  { padrao: /^\/abastecimentos/, dados: () => abastecimentosDemo },
  { padrao: /^\/notas-fiscais/, dados: () => notasFiscaisDemo },
  { padrao: /^\/checklist\/modelos/, dados: () => checklistModelosDemo },
  { padrao: /^\/checklist\/execucoes/, dados: () => checklistExecucoesDemo },
]

export function obterMock(url) {
  const caminho = url.replace(/^https?:\/\/[^/]+/, '')
  const rota = ROTAS_MOCK.find((r) => r.padrao.test(caminho))
  return rota ? rota.dados() : []
}

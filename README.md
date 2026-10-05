# IEC Partner Network

Crie uma plataforma web independente chamada ECO INDICA, exclusiva para gestão de indicações do Instituto Experiência do Cliente (IEC). Não integrar ao sistema de Cliente Oculto existente. A plataforma deve ter cadastro, login, banco de dados e autenticação próprios, usando Supabase.

DESIGN

Interface moderna, profissional e responsiva, com identidade visual branco, preto e amarelo. Use fundo branco, textos pretos, amarelo como cor de destaque para CTAs, indicadores e elementos importantes. Layout limpo, semelhante a um SaaS/CRM financeiro. Desktop e mobile.

AUTENTICAÇÃO

Criar cadastro próprio com:

Nome completo

E-mail

CPF

Senha

Login com e-mail e senha.
Usar Supabase Auth.
CPF deve ser único.
Criar perfis com papel indicador e admin.
Proteger rotas conforme o papel.

ESTRUTURA PRINCIPAL

INDICADOR

Dashboard inicial com:

Total de pesquisadores indicados

Total de empresas indicadas

Indicações convertidas

Bonificações aprovadas

Bonificações pagas

Bonificações pendentes

Menu:

Dashboard

Indicar Pesquisador

Indicar Empresa

Minhas Indicações

Minhas Bonificações

Financeiro

Como Funciona

Meu Perfil

INDICAR PESQUISADOR

Formulário:

Nome

Jornada: Academia, Farmácia ou Varejo

Telefone

E-mail

Cidade

Estado

Observações

Ao enviar, registrar automaticamente data/hora, indicador responsável e status inicial Indicação registrada.

Fluxo:
Indicação registrada → Cadastro pendente → Em análise → Apto → Selecionado → Pesquisa realizada → Relatório entregue → Relatório aprovado → Bonificação aprovada → Pago.

Bonificação: R$ 20,00, condicionada às regras do programa.

INDICAR EMPRESA

Formulário:

Nome da empresa

CNPJ

Segmento

Cidade

Estado

Site/Instagram

Número de unidades

Nome do responsável

Cargo

Telefone

E-mail

Já possui contato com a empresa? Sim/Não

Como conhece a empresa?

Qual solução acredita que a empresa poderia contratar?

Observações

Ao enviar, mostrar aviso:
"Enviar uma indicação não garante automaticamente a bonificação. A bonificação de R$ 50,00 será devida somente após a validação da indicação e a confirmação de contratação de um projeto ou serviço do IEC."

Fluxo:
Nova → Em validação → Contato pendente → Contatada → Em negociação → Fechada/Perdida/Duplicada/Não elegível.

Bonificação: R$ 50,00 somente após fechamento confirmado.

MINHAS INDICAÇÕES

Tabela com:

Data

Tipo

Nome da indicação

Status

Valor da bonificação

Permitir filtros por tipo e status.
Mostrar detalhes completos ao clicar em uma indicação.

MINHAS BONIFICAÇÕES

Dashboard financeiro mostrando:

Total acumulado

Total aprovado

Total pago

Total pendente

Bonificações de pesquisadores

Bonificações de empresas

Tabela:

Data

Tipo

Indicação

Valor

Data de aprovação

Data de pagamento

Status

Status financeiro:
Pendente → Aprovada → Pagamento programado → Pago.

FINANCEIRO

Criar um módulo financeiro próprio para o indicador e outro para o administrador.

Indicador

Mostrar:

Saldo/total a receber

Total recebido

Total pendente

Histórico de entradas

Histórico de pagamentos

Permitir visualizar cada movimentação financeira.

Administrador

Criar controle de entradas e saídas:

Tipo: Entrada ou Saída

Categoria

Descrição

Valor

Data

Status

Observação

Indicação relacionada, quando aplicável

Dashboard financeiro com:

Total de entradas

Total de saídas

Bonificações pendentes

Bonificações aprovadas

Bonificações pagas

Saldo financeiro

Não permitir que o indicador altere dados financeiros administrativos.

PAINEL ADMINISTRATIVO

Área exclusiva para admins.

Funcionalidades:

Dashboard geral

Lista de todas as indicações

Filtro por tipo

Filtro por status

Filtro por indicador

Busca por nome

Visualização dos detalhes

Validar/invalidar indicação

Atribuir responsável comercial

Registrar contatos

Registrar proposta

Atualizar negociação

Confirmar fechamento

Aprovar bonificação

Registrar pagamento

Adicionar observações

Visualizar histórico/auditoria

Para empresas, criar uma visão de CRM simplificado:
Empresa | Indicador | Status | Responsável | Data | Bonificação.

REGRAS DE NEGÓCIO

Registrar data e hora de toda indicação.

A primeira indicação válida deve ter prioridade em caso de duplicidade.

Uma indicação não gera bonificação automaticamente.

Separar indicação, validação, bonificação e pagamento como estados independentes.

Detectar/sinalizar autorreferência.

Sinalizar possíveis cadastros fraudulentos.

Empresa já cliente ou em negociação ativa não gera nova bonificação.

Bonificação de empresa somente após fechamento confirmado.

Indicador só pode visualizar suas próprias indicações e finanças.

Admin pode visualizar e gerenciar tudo.

Criar histórico de alterações importantes.

BANCO SUPABASE

Criar schema relacional com RLS e chaves estrangeiras.

Tabelas principais:
profiles

id

nome_completo

email

cpf

role

created_at

indicacoes

id

indicador_id

tipo

status

data_registro

validade

created_at

updated_at

indicacao_pesquisador

id

indicacao_id

nome

jornada

telefone

email

cidade

estado

observacoes

indicacao_empresa

id

indicacao_id

nome_empresa

cnpj

segmento

cidade

estado

site_instagram

unidades

responsavel_nome

responsavel_cargo

telefone

email

possui_contato

como_conhece

solucao_interesse

observacoes

oportunidades_comerciais

id

indicacao_id

responsavel_id

status

contatos

proposta

negociacao

fechamento

data_fechamento

observacoes

bonificacoes

id

indicacao_id

indicador_id

valor

status

data_aprovacao

data_pagamento

observacoes

movimentacoes_financeiras

id

tipo

categoria

descricao

valor

data

status

indicador_id

indicacao_id

observacoes

created_at

historico_indicacoes

id

indicacao_id

usuario_id

status_anterior

status_novo

observacao

created_at

Criar índices para buscas frequentes e constraints para evitar duplicidades relevantes.

NOTIFICAÇÕES

Criar sistema de notificações internas para:

Indicação recebida

Indicação validada

Empresa contatada

Oportunidade em negociação

Empresa fechada

Bonificação aprovada

Bonificação paga

Indicação recusada/invalidada

SEGURANÇA

Implementar RLS no Supabase.
Indicadores só acessam seus próprios dados.
Admins possuem acesso administrativo.
Nunca expor CPF ou dados financeiros de outros indicadores.
Validar formulários no frontend e backend.
Criar confirmação antes de ações críticas.

MVP

Priorizar funcionamento completo de:
cadastro/login → dashboard → indicação de pesquisador → indicação de empresa → histórico → status → bonificações → financeiro → painel administrativo → gestão comercial → aprovação → pagamento.

Não implementar ranking, gamificação, metas ou campanhas agora. Deixar arquitetura preparada para futura expansão.

Entregar a aplicação funcional, conectada ao Supabase, com CRUD completo, autenticação, RLS, validações, estados de loading/erro/sucesso e dados reais do banco. Não usar dados mockados como solução final.

sb_publishable_G7IHND3KoSst9-NOrRnFSQ_usq26bye
https://kfxwjfagaalrmleascrt.supabase.co

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c75f6b3e-f4b0-4858-877b-3f6407e1767c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

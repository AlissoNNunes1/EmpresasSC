# EmpresasSC

Sistema de cadastro e gestão de empresas para o municio de São Cristvão. Permite registrar, filtrar, analisar e exportar dados de empresas com controle de acesso por perfil de usuário.

---

## Funcionalidades

- **Cadastro de empresas** com consulta automática de CNPJ via BrasilAPI (pré-preenchimento do formulário)
- **Filtros avançados** por categoria, bairro, porte, situação e número de empregados
- **Dashboard analítico** com KPIs e gráficos de distribuição por categoria, bairro e porte
- **Exportação** de dados em CSV, XLSX e PDF (respeitando filtros ativos)
- **Importação em massa** via CSV/XLSX com detecção de duplicatas
- **Campos personalizados** — administrador pode renomear campos, definir visibilidade, reordenar e adicionar campos extras por empresa
- **Gerenciamento de categorias** com edição e exclusão inline
- **Controle de acesso por papel** (Admin, Analista, Visualizador)
- **Log de acesso** com rastreamento de todas as operações

---

## Papéis de Usuário

| Papel | Permissões |
|---|---|
| `ADMIN` | Acesso total — incluindo configurações, usuários e exclusão de registros |
| `ANALISTA` | Criar e editar empresas |
| `VISUALIZADOR` | Apenas leitura e exportação |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Linguagem | TypeScript 5 |
| Banco de dados | SQLite via Prisma 6 |
| Autenticação | NextAuth 4 |
| UI | Tailwind CSS 4 + Shadcn UI + Lucide |
| Gráficos | Recharts |
| Validação | Zod 4 |
| Exportação | xlsx + pdf-lib |

---

## Requisitos

- Node.js 20+
- npm 10+

---

## Instalação

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações (ver seção abaixo)

# 3. Execute as migrações do banco
npm run prisma:migrate

# 4. (Opcional) Popule o banco com dados iniciais
npm run prisma:seed

# 5. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Variáveis de Ambiente

```env
# URL do banco de dados (SQLite por padrão)
DATABASE_URL="file:./prisma/dev.db"

# Segredo do NextAuth — troque em produção
NEXTAUTH_SECRET="troque-esta-chave-em-producao"

# URL base da aplicação
NEXTAUTH_URL="http://localhost:3000"
```

---

## Scripts

```bash
npm run dev              # Servidor de desenvolvimento
npm run build            # Build de produção
npm start                # Servidor de produção
npm run lint             # Lint com ESLint

npm run prisma:generate  # Gera o Prisma Client
npm run prisma:migrate   # Aplica migrações do banco
npm run prisma:seed      # Popula o banco com dados iniciais
```

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── (dashboard)/         # Páginas autenticadas
│   │   ├── page.tsx         # Dashboard com KPIs
│   │   ├── empresas/        # Listagem, detalhes e cadastro
│   │   ├── usuarios/        # Gerenciamento de usuários (Admin)
│   │   ├── relatorios/      # Relatórios e exportações
│   │   └── configuracoes/   # Configurações do sistema (Admin)
│   └── api/                 # Rotas de API (REST)
├── components/              # Componentes React reutilizáveis
├── lib/                     # Serviços, auth, prisma client, utils
├── services/                # Serviços client-side (fetch)
└── types/                   # Tipos TypeScript compartilhados
prisma/
├── schema.prisma            # Modelo de dados
└── migrations/              # Histórico de migrações
```

---

## Modelos Principais

- **Empresa** — CNPJ, razão social, porte, situação, categoria, endereço
- **Pessoa** — Responsáveis vinculados à empresa (proprietário, gerente, RH)
- **Categoria** — Classificação de empresas
- **CampoEmpresa** — Configuração de campos (builtin e customizados)
- **ValorCampoEmpresa** — Valores dos campos customizados por empresa
- **Usuario** — Usuários do sistema com papel e status
- **ConfiguracaoSistema** — Configurações globais da aplicação
- **LogAcesso** — Auditoria de operações

---

## Produção

Antes de implantar em produção:

1. Defina `NEXTAUTH_SECRET` com um valor aleatório e seguro (`openssl rand -base64 32`)
2. Ajuste `NEXTAUTH_URL` para o domínio público da aplicação
3. Considere migrar de SQLite para PostgreSQL para ambientes com múltiplos usuários simultâneos
4. Configure backups regulares do arquivo de banco de dados

---

## Licença

Uso interno — FUMCTUR / Prefeitura Municipal.

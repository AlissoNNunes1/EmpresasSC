-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "papel" TEXT NOT NULL DEFAULT 'VISUALIZADOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "empresas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "porte" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "atividade_principal" TEXT NOT NULL,
    "numero_empregados" INTEGER NOT NULL,
    "situacao" TEXT NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "empresas_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empresa_id" INTEGER NOT NULL,
    "cep" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    CONSTRAINT "enderecos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pessoas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empresa_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    CONSTRAINT "pessoas_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mv_resumo_categoria" (
    "categoria" TEXT NOT NULL PRIMARY KEY,
    "total_empresas" INTEGER NOT NULL,
    "total_empregados" INTEGER NOT NULL,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mv_resumo_bairro" (
    "bairro" TEXT NOT NULL PRIMARY KEY,
    "total_empresas" INTEGER NOT NULL,
    "total_empregados" INTEGER NOT NULL,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "mv_resumo_porte" (
    "porte" TEXT NOT NULL PRIMARY KEY,
    "total_empresas" INTEGER NOT NULL,
    "total_empregados" INTEGER NOT NULL,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "logs_acesso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER,
    "email" TEXT,
    "rota" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "logs_acesso_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nome_key" ON "categorias"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE INDEX "empresas_categoria_id_idx" ON "empresas"("categoria_id");

-- CreateIndex
CREATE INDEX "empresas_porte_idx" ON "empresas"("porte");

-- CreateIndex
CREATE INDEX "empresas_situacao_idx" ON "empresas"("situacao");

-- CreateIndex
CREATE UNIQUE INDEX "enderecos_empresa_id_key" ON "enderecos"("empresa_id");

-- CreateIndex
CREATE INDEX "enderecos_bairro_idx" ON "enderecos"("bairro");

-- CreateIndex
CREATE INDEX "pessoas_empresa_id_idx" ON "pessoas"("empresa_id");

-- CreateIndex
CREATE INDEX "logs_acesso_usuario_id_idx" ON "logs_acesso"("usuario_id");

-- CreateIndex
CREATE INDEX "logs_acesso_rota_idx" ON "logs_acesso"("rota");

-- CreateIndex
CREATE INDEX "logs_acesso_criado_em_idx" ON "logs_acesso"("criado_em");

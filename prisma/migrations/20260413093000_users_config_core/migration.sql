-- Adiciona status ativo para categorias
ALTER TABLE "categorias" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;

-- Cria tabela de configuracoes do sistema
CREATE TABLE "configuracoes_sistema" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "nome_sistema" TEXT NOT NULL DEFAULT 'EmpresasSC',
  "nome_municipio" TEXT NOT NULL DEFAULT 'Sao Cristovao',
  "logo_url" TEXT,
  "email_institucional" TEXT NOT NULL DEFAULT 'contato@empresassc.local',
  "min_empregados_pequena" INTEGER NOT NULL DEFAULT 10,
  "max_empregados_pequena" INTEGER NOT NULL DEFAULT 49,
  "min_empregados_media" INTEGER NOT NULL DEFAULT 50,
  "max_empregados_media" INTEGER NOT NULL DEFAULT 249,
  "categoria_padrao_id" INTEGER,
  "politica_senha_min_caracteres" INTEGER NOT NULL DEFAULT 8,
  "tempo_sessao_minutos" INTEGER NOT NULL DEFAULT 480,
  "controle_login_ativo" BOOLEAN NOT NULL DEFAULT false,
  "integracao_cnpj_ativa" BOOLEAN NOT NULL DEFAULT false,
  "webhook_url" TEXT,
  "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" DATETIME NOT NULL,
  CONSTRAINT "configuracoes_sistema_categoria_padrao_id_fkey" FOREIGN KEY ("categoria_padrao_id") REFERENCES "categorias" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "configuracoes_sistema_categoria_padrao_id_idx" ON "configuracoes_sistema"("categoria_padrao_id");

-- Cria linha padrao inicial para a aplicacao
INSERT INTO "configuracoes_sistema" (
  "nome_sistema",
  "nome_municipio",
  "email_institucional",
  "atualizado_em"
)
VALUES (
  'EmpresasSC',
  'Sao Cristovao',
  'contato@empresassc.local',
  CURRENT_TIMESTAMP
);

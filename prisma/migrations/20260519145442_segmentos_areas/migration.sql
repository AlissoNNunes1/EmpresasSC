-- CreateTable
CREATE TABLE "segmentos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "cor" TEXT,
    "icone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 999,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "usuario_segmentos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "usuario_id" INTEGER NOT NULL,
    "segmento_id" INTEGER NOT NULL,
    CONSTRAINT "usuario_segmentos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "usuario_segmentos_segmento_id_fkey" FOREIGN KEY ("segmento_id") REFERENCES "segmentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "areas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "cor" TEXT,
    "geo_json" TEXT NOT NULL,
    "segmento_id" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "areas_segmento_id_fkey" FOREIGN KEY ("segmento_id") REFERENCES "segmentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_empresas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "razao_social" TEXT NOT NULL,
    "nome_fantasia" TEXT,
    "cnpj" TEXT NOT NULL,
    "porte" TEXT NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "atividade_principal" TEXT NOT NULL,
    "numero_empregados" INTEGER NOT NULL,
    "situacao" TEXT NOT NULL,
    "segmento_id" INTEGER,
    "lat" REAL,
    "lng" REAL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "empresas_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "empresas_segmento_id_fkey" FOREIGN KEY ("segmento_id") REFERENCES "segmentos" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_empresas" ("atividade_principal", "atualizadoEm", "categoria_id", "cnpj", "criadoEm", "id", "nome_fantasia", "numero_empregados", "porte", "razao_social", "situacao") SELECT "atividade_principal", "atualizadoEm", "categoria_id", "cnpj", "criadoEm", "id", "nome_fantasia", "numero_empregados", "porte", "razao_social", "situacao" FROM "empresas";
DROP TABLE "empresas";
ALTER TABLE "new_empresas" RENAME TO "empresas";
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");
CREATE INDEX "empresas_categoria_id_idx" ON "empresas"("categoria_id");
CREATE INDEX "empresas_porte_idx" ON "empresas"("porte");
CREATE INDEX "empresas_situacao_idx" ON "empresas"("situacao");
CREATE INDEX "empresas_segmento_id_idx" ON "empresas"("segmento_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "segmentos_slug_key" ON "segmentos"("slug");

-- CreateIndex
CREATE INDEX "usuario_segmentos_usuario_id_idx" ON "usuario_segmentos"("usuario_id");

-- CreateIndex
CREATE INDEX "usuario_segmentos_segmento_id_idx" ON "usuario_segmentos"("segmento_id");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_segmentos_usuario_id_segmento_id_key" ON "usuario_segmentos"("usuario_id", "segmento_id");

-- CreateIndex
CREATE INDEX "areas_segmento_id_idx" ON "areas"("segmento_id");

-- CreateTable
CREATE TABLE "campos_empresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'TEXTO',
    "builtin" BOOLEAN NOT NULL DEFAULT false,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "visivel" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 999,
    "opcoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "valores_campos_empresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empresa_id" INTEGER NOT NULL,
    "campo_id" INTEGER NOT NULL,
    "valor" TEXT NOT NULL,
    CONSTRAINT "valores_campos_empresa_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "valores_campos_empresa_campo_id_fkey" FOREIGN KEY ("campo_id") REFERENCES "campos_empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "campos_empresa_nome_key" ON "campos_empresa"("nome");

-- CreateIndex
CREATE INDEX "valores_campos_empresa_empresa_id_idx" ON "valores_campos_empresa"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "valores_campos_empresa_empresa_id_campo_id_key" ON "valores_campos_empresa"("empresa_id", "campo_id");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_campos_empresa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'TEXTO',
    "builtin" BOOLEAN NOT NULL DEFAULT false,
    "obrigatorio" BOOLEAN NOT NULL DEFAULT false,
    "visivel" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 999,
    "opcoes" TEXT,
    "segmento_id" INTEGER,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL,
    CONSTRAINT "campos_empresa_segmento_id_fkey" FOREIGN KEY ("segmento_id") REFERENCES "segmentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_campos_empresa" ("atualizado_em", "builtin", "criado_em", "id", "label", "nome", "obrigatorio", "opcoes", "ordem", "tipo", "visivel") SELECT "atualizado_em", "builtin", "criado_em", "id", "label", "nome", "obrigatorio", "opcoes", "ordem", "tipo", "visivel" FROM "campos_empresa";
DROP TABLE "campos_empresa";
ALTER TABLE "new_campos_empresa" RENAME TO "campos_empresa";
CREATE UNIQUE INDEX "campos_empresa_nome_key" ON "campos_empresa"("nome");
CREATE INDEX "campos_empresa_segmento_id_idx" ON "campos_empresa"("segmento_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

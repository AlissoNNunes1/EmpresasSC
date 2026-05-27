-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_categorias" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "segmento_id" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "categorias_segmento_id_fkey" FOREIGN KEY ("segmento_id") REFERENCES "segmentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_categorias" ("ativo", "atualizadoEm", "criadoEm", "id", "nome") SELECT "ativo", "atualizadoEm", "criadoEm", "id", "nome" FROM "categorias";
DROP TABLE "categorias";
ALTER TABLE "new_categorias" RENAME TO "categorias";
CREATE INDEX "categorias_segmento_id_idx" ON "categorias"("segmento_id");
CREATE UNIQUE INDEX "categorias_nome_segmento_id_key" ON "categorias"("nome", "segmento_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

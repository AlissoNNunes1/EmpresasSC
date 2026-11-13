-- CreateTable
CREATE TABLE "duplicatas_nao_duplicatas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "empresa_a_id" INTEGER NOT NULL,
    "empresa_b_id" INTEGER NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "duplicatas_nao_duplicatas_empresa_a_id_fkey" FOREIGN KEY ("empresa_a_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "duplicatas_nao_duplicatas_empresa_b_id_fkey" FOREIGN KEY ("empresa_b_id") REFERENCES "empresas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "duplicatas_nao_duplicatas_empresa_a_id_empresa_b_id_key" ON "duplicatas_nao_duplicatas"("empresa_a_id", "empresa_b_id");

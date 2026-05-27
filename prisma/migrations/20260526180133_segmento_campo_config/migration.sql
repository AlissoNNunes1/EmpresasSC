-- CreateTable
CREATE TABLE "segmento_campo_config" (
    "segmento_id" INTEGER NOT NULL,
    "campo_id" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY ("segmento_id", "campo_id"),
    CONSTRAINT "segmento_campo_config_segmento_id_fkey" FOREIGN KEY ("segmento_id") REFERENCES "segmentos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "segmento_campo_config_campo_id_fkey" FOREIGN KEY ("campo_id") REFERENCES "campos_empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

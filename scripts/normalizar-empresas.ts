// Uso: npm run normalizar:empresas
// Normaliza o cadastro inteiro agora, fora do servidor web.
import { prisma } from "../src/lib/prisma";
import { executarNormalizacao } from "../src/lib/services/normalizacao/empresas";

executarNormalizacao()
  .then((resultado) => console.log(JSON.stringify(resultado, null, 2)))
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

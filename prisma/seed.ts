import { PapelUsuario, PorteEmpresa, PrismaClient, SituacaoEmpresa, TipoResponsavel } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const categorias = ["Comercio", "Industria", "Servicos", "Tecnologia", "Saude", "Educacao"];

  for (const nome of categorias) {
    await prisma.categoria.upsert({
      where: { nome },
      update: { ativo: true },
      create: { nome, ativo: true },
    });
  }

  await prisma.configuracaoSistema.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nomeSistema: "EmpresasSC",
      nomeMunicipio: "Sao Cristovao",
      emailInstitucional: "contato@empresassc.local",
    },
  });

  const senhaHash = await hash("Admin@123", 10);

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@empresassc.local" },
    update: {
      nome: "Administrador",
      papel: PapelUsuario.ADMIN,
      ativo: true,
      senhaHash,
    },
    create: {
      nome: "Administrador",
      email: "admin@empresassc.local",
      senhaHash,
      papel: PapelUsuario.ADMIN,
      ativo: true,
    },
  });

  const categoriaComercio = await prisma.categoria.findUnique({ where: { nome: "Comercio" } });

  if (categoriaComercio) {
    const empresa = await prisma.empresa.upsert({
      where: { cnpj: "11111111000199" },
      update: {},
      create: {
        razaoSocial: "Mercadinho Sao Cristovao LTDA",
        nomeFantasia: "Mercadinho da Praca",
        cnpj: "11111111000199",
        porte: PorteEmpresa.MICRO,
        categoriaId: categoriaComercio.id,
        atividadePrincipal: "Comercio varejista de alimentos",
        numeroEmpregados: 12,
        situacao: SituacaoEmpresa.ATIVA,
        endereco: {
          create: {
            cep: "49100000",
            bairro: "Centro",
            logradouro: "Rua da Matriz, 120",
          },
        },
        responsaveis: {
          create: [
            {
              nome: "Joao Batista",
              tipo: TipoResponsavel.PROPRIETARIO,
              cpf: "11122233344",
              contato: "(79) 99999-0000",
            },
          ],
        },
      },
    });

    console.log(`Empresa exemplo pronta: ${empresa.razaoSocial}`);
  }

  // ── Segmentos padrão ────────────────────────────────────────────────────────
  const segmentosData = [
    { nome: "Comércio Geral", slug: "comercio", cor: "#1b3383", icone: "Building2", ordem: 1 },
    { nome: "MEI", slug: "mei", cor: "#059669", icone: "Briefcase", ordem: 2 },
    { nome: "Economia Popular e Solidária", slug: "eps", cor: "#7c3aed", icone: "Users2", ordem: 3 },
  ];

  for (const s of segmentosData) {
    await prisma.segmento.upsert({
      where: { slug: s.slug },
      update: { nome: s.nome, cor: s.cor, icone: s.icone, ordem: s.ordem },
      create: { ...s, ativo: true },
    });
  }

  // ── Migrar empresas existentes para o segmento "Comércio Geral" ─────────────
  const segComercio = await prisma.segmento.findUnique({ where: { slug: "comercio" } });
  if (segComercio) {
    await prisma.empresa.updateMany({
      where: { segmentoId: null },
      data: { segmentoId: segComercio.id },
    });
    console.log("Empresas existentes migradas para 'Comércio Geral'");
  }

  console.log(`Admin inicial: ${admin.email} / senha: Admin@123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/

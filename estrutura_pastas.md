Vou te passar uma estrutura **prática, escalável e alinhada com Next.js (App Router)**, já pensando em:

* dashboard administrativo
* controle de acesso
* CRUD de empresas
* filtros + BI básico

---

## Estrutura base (frontend - Next.js)

```
/src
  /app
    /login
      page.tsx

    /(dashboard)
      /layout.tsx
      /page.tsx

      /empresas
        page.tsx
        /[id]
          page.tsx
        /novo
          page.tsx

      /usuarios
        page.tsx

      /relatorios
        page.tsx

      /configuracoes
        page.tsx

  /components
    /ui
    /layout
      sidebar.tsx
      header.tsx
    /empresas
      empresa-form.tsx
      empresa-table.tsx
      empresa-filtros.tsx
    /charts
      empresas-por-bairro.tsx
      empresas-por-categoria.tsx

  /services
    api.ts
    empresas.service.ts
    usuarios.service.ts

  /hooks
    useEmpresas.ts
    useAuth.ts

  /lib
    utils.ts
    auth.ts

  /types
    empresa.ts
    usuario.ts

  /constants
    categorias.ts
    roles.ts

  /styles
    globals.css
```

---

## Explicação objetiva por camada

### `/app`

* roteamento (Next.js App Router)
* cada pasta = rota
* `(dashboard)` = agrupador lógico (não aparece na URL)

---

### `/components`

Separação por domínio:

* `ui` → botões, inputs (Shadcn)
* `layout` → sidebar, header
* `empresas` → tudo relacionado ao módulo principal
* `charts` → gráficos do dashboard

---

### `/services`

Camada de comunicação com backend

Exemplo:

```ts
// empresas.service.ts
export async function getEmpresas(params) {
  return api.get('/empresas', { params })
}
```

---

### `/hooks`

Encapsula lógica

Exemplo:

* `useEmpresas` → fetch + estado
* `useAuth` → sessão/usuário

---

### `/types`

Tipagem centralizada (importante com Prisma/API)

---

### `/lib`

Funções utilitárias e configs globais

---

## Organização por domínio (ponto importante)

Evite misturar tudo.

Você já está separando por domínio:

* empresas
* usuários
* relatórios

Isso facilita:

* manutenção
* crescimento
* possível virar SaaS

---

## Estrutura da tela de empresas (exemplo real)

```
/components/empresas
  empresa-form.tsx
  empresa-table.tsx
  empresa-filtros.tsx
  empresa-modal.tsx
```

---

## Fluxo típico (como tudo se conecta)

1. `page.tsx` (rota)
2. chama `useEmpresas`
3. hook usa `empresas.service`
4. service chama API
5. dados renderizados em `empresa-table`

---

## Controle de acesso (frontend)

No layout:

```ts
// /app/(dashboard)/layout.tsx
if (!session) redirect('/login')
```

E por role:

```ts
if (user.role !== 'admin') return <SemPermissao />
```

#1b3383
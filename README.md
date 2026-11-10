# 🎬 Roleta Cinema

Uma roleta para sortear o próximo filme da sua lista. Você monta a própria coleção, busca capa e sinopse automaticamente, marca o que já assistiu e dá nota a cada filme.

> Feito com HTML, CSS e JavaScript puro, sem frameworks e sem servidor. Funciona no celular e no computador.

## ✨ Funcionalidades

- 🎡 Roleta em `<canvas>` com animação, responsiva e adaptada para toque
- 🔎 Busca de filmes pela API do [TMDB](https://www.themoviedb.org/) (capa, sinopse, ano, gênero, duração e diretor)
- ⭐ Nota de 1 a 5 estrelas, anotações e marcação de "assistido"
- 🎨 Cor personalizada para cada filme na roleta
- 🎯 A roleta sorteia só os filmes que você ainda não viu (opção para incluir os assistidos)
- ☁️ Conta com e-mail e senha e sincronização entre aparelhos via [Supabase](https://supabase.com/) (opcional)
- 💾 Dados também salvos no navegador (`localStorage`), com exportação e importação de backup em JSON
- 🎨 Temas selecionáveis (Cinema, Claro, Neon e Retrô) e cor de destaque personalizável
- 🖼️ Lista em grade de capas, tela de detalhes, busca, filtros por status e gênero e ordenação
- 🎉 Animação e confete ao sortear o filme

## 🚀 Como usar

1. Abra o site (ou o `index.html` no navegador).
2. Crie uma conta gratuita no TMDB e copie seu **Token de Leitura da API** em *Configurações → API*.
3. Vá na aba **⚙️ Ajustes**, cole o token e toque em **Salvar e testar**.
4. Use **Buscar dados de todos** para preencher as capas e sinopses da lista inicial.

A chave **não** fica no código: ela é digitada por você e guardada só no seu navegador.

## 💻 Rodar localmente

```bash
git clone https://github.com/JoaoCardoso18/roleta-cinema.git
cd roleta-cinema
python3 -m http.server 8000   # ou abra o index.html direto no navegador
```

Depois acesse http://localhost:8000.

## 🌐 Publicar com GitHub Pages

*Settings → Pages → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.*
O site fica em `https://joaocardoso18.github.io/roleta-cinema/`.

## 🗂️ Estrutura

```
├── index.html   # estrutura da página
├── style.css    # estilos (tema claro/escuro, layout responsivo)
├── app.js       # roleta, integração com o TMDB, lista, backup e sincronização
├── config.js    # URL e chave pública do Supabase
├── schema.sql   # tabela e regras de segurança do banco
├── README.md
└── LICENSE
```

## ☁️ Sincronização com Supabase (opcional)

1. Crie um projeto em [supabase.com](https://supabase.com/).
2. Em **SQL Editor**, cole o conteúdo de [`schema.sql`](schema.sql) e execute. Isso cria a tabela `movies` com RLS: cada pessoa só enxerga e altera os próprios filmes.
3. Em **Authentication → URL Configuration**, defina o *Site URL* como o endereço do seu GitHub Pages.
4. Em **Project Settings → API**, copie a *Project URL* e a chave *anon/publishable* para o [`config.js`](config.js).
5. No site, abra **⚙️ Ajustes → Conta e sincronização**, crie sua conta e entre. A lista local é enviada para a nuvem no primeiro login.

> A chave anon/publishable pode ficar no código porque a segurança vem das políticas RLS. Nunca publique a chave `service_role`.

## 🛣️ Próximos passos

- [x] Sincronizar a lista entre aparelhos (Supabase)
- [ ] Listas por categoria (terror, família, clássicos…)
- [ ] Nota de 0 a 10 e ordenação por nota
- [ ] Trocar o filme associado quando o TMDB trouxer o errado
- [ ] Modo PWA (instalar no celular e usar offline)

## 📄 Créditos e licença

Dados de filmes fornecidos pelo [TMDB](https://www.themoviedb.org/). Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.

Código sob licença [MIT](LICENSE).

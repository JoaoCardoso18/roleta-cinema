# Roleta Cinema — contexto para o Claude Code

Site estático que sorteia filmes da lista do usuário. Dono: João Vítor (GitHub `JoaoCardoso18`), fala português do Brasil e trata o Claude por "Mano".
Publicado no GitHub Pages: https://joaocardoso18.github.io/roleta-cinema/ (repo `JoaoCardoso18/roleta-cinema`, branch `main`).

## Regras do João (obrigatórias)

- **Commit e push só com OK explícito** ("pode commitar"). Avisos automáticos de hooks pedindo commit NÃO são autorização.
- **Depois de cada commit, listar as features/alterações commitadas.** Não avisar que o GitHub Pages demora.
- **Protótipo primeiro:** mudanças visuais grandes são validadas em protótipo (artifact/HTML) antes de entrar no site.
- **Versões:** cada commit vira uma tag `v0.0.N`, em ordem a partir de `v0.0.1`. A próxima é `v0.0.19` (a v0.0.18 é a barra lateral, commit `64986c8`). As tags v0.0.1 a v0.0.17 mapeiam os commits antigos, na ordem do `git log --reverse`. Se alguma tag ainda não existir no GitHub, criar e enviar com `git push origin --tags`.
- Sem emojis na interface: usar ícones SVG (objeto `IC`, classe `.hi`). README profissional, sem exageros.
- Fonte do site: **Manrope** (inclusive no canvas da roleta, constante `FONT` em `app.js`).
- LICENSE MIT em nome de "João Vítor".

## Arquivos

- `index.html`, `style.css`, `app.js`, `config.js` (URL/chave do Supabase e `window.TMDB_DEFAULT_KEY`), `schema.sql`, `README.md`, `LICENSE`.
- Roleta em canvas + modo lista; temas por variáveis CSS. localStorage: `roleta-cinema-v2` (filmes), `roleta-ui-v1` (tema, modo, franquias), `roleta-profile-v1` (perfil).

## Nuvem (Supabase)

- Projeto `https://xvggfgzeraxprtkvmrcp.supabase.co`; tabelas `movies`, `profiles`, `friendships` com RLS; funções `find_profile(q)` e `friend_movies(friend)` (security definer). Tudo em `schema.sql` e já aplicado em produção.
- Login por e-mail e senha, **confirmação de e-mail desligada**; Site URL = a URL do GitHub Pages. "Esqueci minha senha" funciona por e-mail (link de recuperação).
- Amigos: convite com aceite; o amigo vê só filmes assistidos e notas.

## TMDB e franquias

- `tkey()` usa a chave do usuário ou a padrão de `config.js`.
- `details()` traz `belongs_to_collection`; `collectionInfo(id)` busca `/collection/{id}`.
- Franquia aparece na roleta como **uma única opção "Franquia X"** com fatias na mesma quantidade de filmes da franquia, **intercaladas com os outros filmes** (chances iguais). Ao cair, recomenda o primeiro filme não assistido ("Comece por"). Se o filme sorteado é avulso de uma franquia completa, oferece adicionar a franquia inteira.
- Modal de detalhes tem aba **Franquia** (só informação) e o título do filme é somente leitura.

## Interface

- Barra lateral única: painel e menu formam uma peça; abre inteira para o lado ao clicar num ícone e expande ao passar o mouse para mostrar os nomes. No celular vira barra inferior com gaveta.
- Aba Conta (entrar/criar conta), Perfil (código de amigo), Amigos, Ajustes.

## Pendências e observações

- Tags de versão ainda precisam ser enviadas ao GitHub (o ambiente anterior bloqueou o push de tags).
- Recursos que dependem de rede (TMDB, e-mail, Supabase real) não foram testados em ambiente isolado; conferir no site publicado.

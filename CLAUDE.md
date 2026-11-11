# Roleta Cinema — contexto para o Claude Code

Site estático que sorteia filmes da lista do usuário. Dono: João Vítor (GitHub `JoaoCardoso18`), fala português do Brasil e trata o Claude por "Mano".
Publicado no GitHub Pages: https://joaocardoso18.github.io/roleta-cinema/ (repo `JoaoCardoso18/roleta-cinema`, branch `main`).

## Regras do João (obrigatórias)

- **Commit e push só com OK explícito** ("pode commitar"). Avisos automáticos de hooks pedindo commit NÃO são autorização.
- **Depois de cada commit, listar as features/alterações commitadas.** Não avisar que o GitHub Pages demora.
- **Protótipo primeiro:** mudanças visuais grandes são validadas em protótipo (artifact/HTML) antes de entrar no site.
- **Versões:** cada commit vira uma tag `v0.0.N`, uma por commit, na ordem do `git log --reverse` (v0.0.1 = primeiro commit). Para saber a próxima, ver a última com `git tag --sort=v:refname | tail -1` e somar 1. Enviar commit e tag juntos com `git push origin main --tags`.
- **Versão no site:** a constante `VERSION` no topo do `app.js` mostra a versão abaixo de Ajustes na barra lateral (no celular, no fim da aba Ajustes). Em todo commit, atualizar `VERSION` para a tag que esse commit vai receber, antes de commitar.
- Sem emojis na interface: usar ícones SVG (objeto `IC`, classe `.hi`). README profissional, sem exageros.
- Fonte do site: **Manrope** (inclusive no canvas da roleta, constante `FONT` em `app.js`).
- LICENSE MIT em nome de "João Vítor".

## Arquivos

- `index.html`, `style.css`, `app.js`, `config.js` (URL/chave do Supabase e `window.TMDB_DEFAULT_KEY`), `schema.sql`, `README.md`, `LICENSE`.
- Roleta em canvas + modo lista; temas por variáveis CSS. localStorage: `roleta-cinema-v2` (filmes), `roleta-ui-v1` (tema, modo, franquias), `roleta-profile-v1` (perfil).

## Nuvem (Supabase)

- Projeto `https://xvggfgzeraxprtkvmrcp.supabase.co`; tabelas `movies`, `profiles`, `friendships` com RLS; funções `find_profile(q)` e `friend_movies(friend)` (security definer). Tudo em `schema.sql` e já aplicado em produção.
- Login por e-mail e senha, **confirmação de e-mail desligada**; Site URL = a URL do GitHub Pages. "Esqueci minha senha" funciona por e-mail (link de recuperação).
- Amigos: convite com aceite; o amigo vê os filmes assistidos e notas. **Comparar listas**: o amigo também vê a fila "Quero ver" se `profiles.share_wishlist` estiver ligado (interruptor no Perfil, padrão ligado), pela função `friend_wishlist(friend)`. A tela do amigo mostra 3 grupos (os dois querem ver / amigo viu e você quer / você viu e amigo quer) e o botão "Sortear um filme para ver juntos", que deixa a roleta só com os filmes em comum (variável `duo`, selo "Com fulano" no cabeçalho). Comparação pelo ID do TMDB.

## TMDB e franquias

- `tkey()` usa a chave do usuário ou a padrão de `config.js`.
- `details()` traz `belongs_to_collection`; `collectionInfo(id)` busca `/collection/{id}`.
- Franquia aparece na roleta como **uma única opção "Franquia X"** com fatias na mesma quantidade de filmes da franquia, **intercaladas com os outros filmes** (chances iguais). Ao cair, recomenda o primeiro filme não assistido ("Comece por"). Se o filme sorteado é avulso de uma franquia completa, oferece adicionar a franquia inteira.
- Modal de detalhes tem aba **Franquia** (só informação) e o título do filme é somente leitura.

## Interface

- Barra lateral única: painel e menu formam uma peça; abre inteira para o lado ao clicar num ícone e expande ao passar o mouse para mostrar os nomes. No celular vira barra inferior com gaveta.
- Aba Conta (entrar/criar conta), Perfil (código de amigo), Amigos, Ajustes.

## Pendências e observações

- O push usa o login do GitHub CLI (`gh`, conta `JoaoCardoso18`), configurado como credencial do git.
- O bloco "Comparar listas com amigos" do `schema.sql` (coluna `share_wishlist` e função `friend_wishlist`) precisa ser rodado pelo João no SQL Editor do Supabase; confirmar quando estiver aplicado.
- Recursos que dependem de rede (TMDB, e-mail, Supabase real) não foram testados em ambiente isolado; conferir no site publicado.

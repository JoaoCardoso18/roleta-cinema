# Roleta Cinema

Aplicação web para escolher o próximo filme a assistir. O usuário monta uma lista, sorteia um título e acompanha o que já viu, com notas e anotações. Os dados dos filmes vêm da API do TMDB, e a conta e a sincronização entre aparelhos usam o Supabase.

Demonstração: https://joaocardoso18.github.io/roleta-cinema/

Desenvolvido com HTML, CSS e JavaScript puro, sem framework e sem etapa de build. Funciona em computador e celular.

## Funcionalidades

**Sorteio**
- Dois modos: roleta em `<canvas>` e lista animada.
- Filtro por gênero e opção de incluir ou não os filmes já assistidos.
- Imagem de fundo do filme sorteado, obtida do TMDB.

**Lista de filmes**
- Busca no TMDB com capa, sinopse, ano, gênero, duração e diretor.
- Marcação de assistido, nota de 1 a 5 e anotações privadas.
- Busca, filtros por status e gênero, e ordenação.

**Conta e amigos**
- Cadastro e login com e-mail e senha.
- Perfil com nome e nome de usuário (@).
- Sistema de amizade por convite e aceite. Cada amigo vê apenas os filmes assistidos e as notas; a fila "Quero ver" e as anotações permanecem privadas.
- Sincronização da lista entre aparelhos.

**Personalização e dados**
- Temas Cinema, Claro, Neon e Retrô, além de um tema customizado com escolha de cada cor.
- Dados também mantidos no navegador (`localStorage`), com exportação e importação de backup em JSON.
- Exclusão em lote dos filmes "Quero ver", com confirmação em duas etapas.

## Como usar

1. Acesse o site e abra a aba **Conta** para criar uma conta ou entrar. A conta é opcional: sem ela, a lista fica salva apenas no navegador.
2. Em **Meus filmes**, busque um título e adicione à lista.
3. Toque em **Girar** para sortear.

O site já inclui uma chave do TMDB para buscar os dados dos filmes. Quem preferir pode informar a própria chave em **Ajustes**.

## Executar localmente

```bash
git clone https://github.com/JoaoCardoso18/roleta-cinema.git
cd roleta-cinema
python3 -m http.server 8000
```

Acesse http://localhost:8000. Também é possível abrir o `index.html` diretamente no navegador.

## Configuração

### TMDB

1. Crie uma conta em [themoviedb.org](https://www.themoviedb.org/) e gere uma chave em *Configurações → API*.
2. Defina a chave padrão do site em `config.js`:

   ```js
   window.TMDB_DEFAULT_KEY = 'sua-chave-v3';
   ```

A aplicação roda no navegador, portanto essa chave fica visível no código. Ela é somente de leitura e pode ser revogada e substituída a qualquer momento.

### Supabase

1. Crie um projeto em [supabase.com](https://supabase.com/).
2. No **SQL Editor**, execute o conteúdo de [`schema.sql`](schema.sql). Ele cria as tabelas `movies`, `profiles` e `friendships`, as políticas de acesso (RLS) e as funções de busca de perfil e de leitura dos filmes de um amigo.
3. Em **Project Settings → API**, copie a *Project URL* e a chave *anon/publishable* para o [`config.js`](config.js).
4. Em **Authentication → URL Configuration**, defina o *Site URL* como o endereço da publicação.
5. Opcional: em **Authentication → Sign In / Providers**, desative *Confirm email* para permitir o acesso imediato após o cadastro. Com a opção desativada, o endereço de e-mail informado não é verificado.

A chave anon/publishable pode ficar no código, porque a proteção dos dados vem das políticas RLS. Nunca publique a chave `service_role`.

## Publicação

O projeto é estático e pode ser publicado com o GitHub Pages: *Settings → Pages → Deploy from a branch → `main` / `(root)`*.

## Estrutura

```
.
├── index.html   Estrutura da página
├── style.css    Estilos, temas e layout responsivo
├── app.js       Sorteio, integração com o TMDB, lista, perfil, amigos, backup e sincronização
├── config.js    Configuração: Supabase e chave padrão do TMDB
├── schema.sql   Tabelas, políticas de acesso e funções do banco
├── README.md
└── LICENSE
```

## Roadmap

- [x] Sincronização entre aparelhos
- [x] Perfil e amigos
- [ ] Listas por categoria
- [x] Comparação de listas e sorteio de filme em comum entre amigos
- [ ] Troca do filme associado quando o TMDB retorna o título errado
- [ ] PWA (instalação no celular e uso offline)

## Créditos e licença

Dados de filmes fornecidos pelo [TMDB](https://www.themoviedb.org/). Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.

Código sob licença [MIT](LICENSE).

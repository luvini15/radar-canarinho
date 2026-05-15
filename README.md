# Radar Canarinho V3 — abas, botão atualizar e mídias

## O que mudou

- Removeu rating/nota do card.
- Cards agora mostram ranking no Instagram, não nota.
- Adicionou botão "Atualizar dados".
- Adicionou rota `/api/player-media` para foto do jogador e escudo do clube via TheSportsDB.
- Adicionou rota `/api/matches` para partidas via football-data.org.
- Mantém abas internas:
  - Resumo
  - Ranking
  - Jogadores
  - Escalação
  - Comparador
  - Análises

## Rodar

```powershell
npm install
npm run dev
```

## Criar .env.local

Crie `.env.local` na raiz:

```env
SHEETS_CSV_URL=https://docs.google.com/spreadsheets/d/1rfHqW1esqkFiskdx4UuPDtQ21TQOVJfPmEEEGE0ERgM/export?format=csv&gid=0
FOOTBALL_DATA_KEY=SUA_CHAVE
THESPORTSDB_KEY=SUA_CHAVE
HIGHLIGHTLY_KEY=SUA_CHAVE
```

## Se aparecer erro antigo

```powershell
Ctrl + C
Remove-Item -Recurse -Force .next
npm run dev
```

## Testes

```txt
http://localhost:3000/api/sheets
http://localhost:3000/api/player-media?name=Neymar
http://localhost:3000/api/matches
```
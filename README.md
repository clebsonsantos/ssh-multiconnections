# SSH Multiconnect

Cliente SSH desktop com suporte a múltiplas conexões simultâneas em abas. Alternativa ao Asbru Connection Manager, com importação do formato Asbru e formato próprio de export/import.

**Stack:** Tauri v2 · Next.js 15 · React 19 · Rust (russh) · xterm.js · Zustand · Tailwind CSS

---

## Funcionalidades

- Múltiplas sessões SSH abertas em abas simultâneas
- Terminal PTY real via [russh](https://github.com/warp-tech/russh) (sem dependência do binário `ssh`)
- Autenticação por senha ou chave privada (PEM)
- Jump host (bastion)
- Importação de arquivos `.yml` exportados pelo **Asbru Connection Manager**
- Export/Import no formato JSON próprio
- Busca de conexões na sidebar
- Confirmação escrita obrigatória ao deletar conexão
- Dados salvos localmente em `~/.local/share/ssh-multiconnect/connections.json` (Linux) ou `%APPDATA%\ssh-multiconnect\connections.json` (Windows)

---

## Pré-requisitos

### Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### Node.js

Versão 18 ou superior. Recomendado via [nvm](https://github.com/nvm-sh/nvm).

### Dependências do sistema — Linux (Debian/Ubuntu/WSL)

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  build-essential \
  libssl-dev \
  pkg-config
```

> Ou execute o script incluso: `sudo ./setup.sh`

### Dependências do sistema — Windows

1. Instale o [Microsoft C++ Build Tools](https://aka.ms/buildtools) (componente "Desenvolvimento para desktop com C++")
2. Instale o [WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/) (já incluso no Windows 11)
3. Instale o [Node.js](https://nodejs.org)

---

## Instalação

```bash
git clone <repo>
cd ssh-multiconnections
npm install
```

---

## Desenvolvimento

```bash
npm run tauri:dev
```

Abre a janela desktop com hot-reload. O frontend (Next.js) roda em `localhost:1420` e o backend Rust recompila automaticamente a cada mudança.

---

## Build

### Linux (.AppImage e .deb)

```bash
# Adicionar target (uma vez)
rustup target add x86_64-unknown-linux-gnu

# Gerar binários
npm run tauri:build:linux
```

Artefatos gerados em:
```
src-tauri/target/x86_64-unknown-linux-gnu/release/bundle/
├── appimage/   → SSH Multiconnect_0.1.0_amd64.AppImage
└── deb/        → SSH Multiconnect_0.1.0_amd64.deb
```

### Windows (.exe instalador NSIS)

**Opção 1 — Build nativo no Windows** *(recomendado)*

```powershell
rustup target add x86_64-pc-windows-msvc
npm run tauri:build
```

**Opção 2 — Cross-compile do Linux** *(requer mingw-w64)*

```bash
sudo apt-get install -y mingw-w64
rustup target add x86_64-pc-windows-gnu
npm run tauri:build:windows
```

Artefatos gerados em:
```
src-tauri/target/x86_64-pc-windows-*/release/bundle/
└── nsis/  → SSH Multiconnect_0.1.0_x64-setup.exe
```

> Para builds Windows mais confiáveis via CI, use um runner Windows no GitHub Actions com `tauri-action`.

---

## Uso

### Adicionar conexão

Clique no **+** no topo da sidebar ou clique com botão direito em qualquer conexão e escolha **Edit**.

| Campo | Descrição |
|-------|-----------|
| Name | Nome de exibição da conexão |
| Host | IP ou hostname |
| Port | Porta SSH (padrão: 22) |
| Username | Usuário do servidor |
| Auth type | `Password`, `Private Key` ou `SSH Agent` |
| Password | Senha (clique no 👁 para revelar / copiar) |
| Private Key | Conteúdo PEM da chave privada |
| Passphrase | Senha da chave privada (se houver) |
| Jump Host | Bastion/proxy SSH intermediário |
| Auto-reconnect | Reconecta automaticamente se cair |
| Favourite | Marca com ★ na sidebar |

### Conectar

- **Duplo clique** na conexão na sidebar
- Ou clique no ícone **▶** que aparece ao passar o mouse
- Ou clique com botão direito → **Connect**

### Múltiplas sessões

Cada conexão abre em uma aba independente na parte superior. Clique na aba para alternar entre sessões. O **×** fecha a sessão.

### Importar do Asbru

1. No Asbru, exporte suas conexões em **File → Export**
2. No SSH Multiconnect, clique no ícone de import/export (↑ na sidebar)
3. Escolha **Import from Asbru** e selecione o arquivo `.yml`

### Export / Import (formato próprio)

No mesmo menu de import/export:

- **Export JSON** — salva todas as conexões em um arquivo `.json`
- **Import .json** — importa um arquivo exportado anteriormente (merge com existentes)

### Deletar conexão

Clique no ícone 🗑 (hover) ou botão direito → **Delete**. É necessário digitar o nome exato da conexão para confirmar.

---

## Estrutura do projeto

```
ssh-multiconnections/
├── src/                          # Frontend Next.js / React
│   ├── app/                      # Layout e página raiz
│   ├── components/
│   │   ├── AppLayout.tsx         # Layout principal
│   │   ├── Sidebar/              # Lista de conexões
│   │   ├── Terminal/             # Abas e terminal xterm.js
│   │   └── Dialogs/              # Formulário e import/export
│   ├── lib/
│   │   ├── types.ts              # Tipos TypeScript
│   │   ├── asbru.ts              # Parser do formato Asbru YAML
│   │   └── tauri-commands.ts     # Bridge para comandos Rust
│   └── store/index.ts            # Estado global (Zustand)
│
├── src-tauri/                    # Backend Rust / Tauri
│   ├── src/
│   │   ├── lib.rs                # Comandos Tauri expostos ao frontend
│   │   ├── ssh/mod.rs            # Gerenciador de sessões SSH (russh)
│   │   └── storage/mod.rs        # Persistência de conexões em JSON
│   ├── capabilities/main.json    # Permissões Tauri v2
│   ├── icons/                    # Ícones da aplicação
│   └── tauri.conf.json           # Configuração Tauri
│
├── setup.sh                      # Script de dependências Linux
└── package.json
```

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run tauri:dev` | Inicia em modo desenvolvimento |
| `npm run tauri:build` | Build para a plataforma atual |
| `npm run tauri:build:linux` | Build para Linux (x86_64) |
| `npm run tauri:build:windows` | Cross-compile para Windows (requer mingw-w64) |
| `npm run dev` | Inicia apenas o frontend Next.js (sem Tauri) |
| `npm run build` | Build estático do frontend |

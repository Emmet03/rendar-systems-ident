# Setup Guide - Rendar Systems Ident

Dieses Dokument beschreibt alle notwendigen Schritte zur Einrichtung des Projekts.

## Voraussetzungen

- **Node.js** (Version 16 oder höher)
- **npm** (kommt mit Node.js) oder **yarn**
- **Git**

## Installation

### 1. Node.js installieren

Falls nicht bereits installiert, lade Node.js herunter und installiere es:
- https://nodejs.org/ (LTS-Version empfohlen)

Überprüfe die Installation:
```bash
node --version
npm --version
```

### 2. Repository klonen

```bash
git clone https://github.com/Emmet03/rendar-systems-ident.git
cd rendar-systems-ident
```

### 3. Backend-Dependencies installieren

```bash
cd backend
npm install
```

**Installierte Packages:**

#### Production Dependencies
- `express` - Web-Framework
- `cors` - Cross-Origin Resource Sharing
- `better-sqlite3` - SQLite Datenbank

#### Development Dependencies
- `typescript` - TypeScript Compiler
- `tsx` - TypeScript Executor (für Development)
- `ts-node` - TypeScript Node Runner
- Type Definitions: `@types/express`, `@types/cors`, `@types/better-sqlite3`, `@types/node`

### 4. Frontend-Dependencies installieren (optional)

Die Frontend-Projekte sind momentan vanilla JavaScript und benötigen keine npm-Dependencies.

Falls später npm-Dependencies hinzukommen:

```bash
# FrontendAdmin
cd ../frontendAdmin
npm install

# FrontendEmpire
cd ../frontendEmpire
npm install
```

## Umgebungsvariablen

### Backend (.env)

Erstelle eine `.env` Datei im `backend/` Verzeichnis:

```env
PORT=3000
NODE_ENV=development
```

Die `.env` Datei ist in der `.gitignore` aufgeführt und wird nicht ins Repository gepusht.

### Frontend Admin (.env)

Erstelle eine `.env` Datei im `frontendAdmin/` Verzeichnis mit den notwendigen Konfigurationen.

## Starten des Projekts

### Backend starten

```bash
cd backend
npm run dev
```

Der Server läuft dann unter `http://localhost:3000`

### Frontends öffnen

**FrontendAdmin:**
- Datei: `frontendAdmin/index.html`
- Im Browser öffnen (z.B. mit Live Server)

**FrontendEmpire:**
- Datei: `frontendEmpire/imperium.html`
- Im Browser öffnen

## Datenbanksetup

Die Datenbank wird automatisch beim ersten Start initialisiert:

```bash
npm run dev
```

Die SQLite-Datenbank wird unter `backend/data/event.sqlite` erstellt.

## Häufige Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Backend im Development-Modus starten |
| `npm install` | Dependencies installieren |
| `npm list` | Installierte Packages anzeigen |

## Troubleshooting

### Port 3000 ist bereits belegt

Änder den PORT in der `.env`:
```env
PORT=3001
```

### better-sqlite3 Installation schlägt fehl

Stelle sicher, dass Python und Build-Tools installiert sind:

**Windows:**
```bash
npm install --global windows-build-tools
```

Dann erneut versuchen:
```bash
npm install
```

### Module nicht gefunden

Stelle sicher, dass alle Dependencies installiert sind:
```bash
rm -r node_modules package-lock.json
npm install
```

## Projektstruktur

```
rendar-systems-ident/
├── backend/
│   ├── index.ts           # Express Server
│   ├── package.json       # Backend Dependencies
│   ├── tsconfig.json      # TypeScript Config
│   ├── controllers/       # API Controller
│   ├── models/            # Data Models
│   ├── routes/            # API Routes
│   ├── utils/             # Utilities (DB, Schema)
│   └── data/              # SQLite Datenbank
├── frontendAdmin/         # Admin Interface
├── frontendEmpire/        # Empire Interface
├── .gitignore             # Git Ignore File
└── SETUP.md               # Dieses Dokument
```

## Support

Bei Problemen:
1. Überprüfe, ob Node.js und npm installiert sind
2. Lösche `node_modules` und `package-lock.json` und installiere neu
3. Stelle sicher, dass die `.env` Datei korrekt konfiguriert ist

# Star Wars LARP – Client-Server Identifikations- und Bezahlsystem

Dieses Projekt beschreibt ein Client-Server-System für ein Star-Wars-LARP, das zur Identifikation von Spielern und zum bargeldlosen Bezahlen innerhalb des Spiels genutzt wird.

Spieler erhalten ID-Karten mit QR-Codes, die eine eindeutige Nummer enthalten. Diese Nummer ist in der Datenbank mit der spielinternen Identität und einem Kontostand verknüpft.

## Funktionen

- Spieleridentifikation  
  - Scannen der ID-Karte zur Anzeige der spielinternen Identität  
  - Nutzung durch imperiale Kontrollstellen (z. B. Sicherheitschecks)

- Bargeldloses Bezahlen  
  - Bezahlung an der Bar per QR-Code  
  - Automatische Anpassung des Kontostands

- Zentrales Kontosystem  
  - Jeder Spieler besitzt ein eindeutiges Konto  
  - Kontostand wird serverseitig verwaltet

- Client-Server-Architektur  
  - Mehrere Clients (Bar, Imperium, Admin)  
  - Zentrale Datenhaltung auf dem Server

## Systemübersicht

[ ID-Karte (QR-Code) ]
|
v
[ Client (Scanner / Bar / Imperium) ]
|
v
[ Server / API ]
|
v
[ Datenbank ]


Alle relevanten Informationen (Name, Fraktion, Kontostand, Status) werden serverseitig aufgelöst.

## Datenbankmodell (Beispiel)

### Spieler
- id (eindeutig)
- codename / Name
- Fraktion
- Kontostand

### Transaktionen
- id
- spieler_id
- Betrag
- Typ (Bar, Strafe, Belohnung)
- Zeitstempel

## Clients

### Bar-Client
- Scan der ID-Karte
- Auswahl des Betrags
- Abzug vom Kontostand
- Anzeige von Erfolg / Fehler

### Imperiums-Client
- Scan der ID-Karte
- Anzeige der Identität
- Anzeige von Statusinformationen
- Keine Kontostand-Änderung

### Admin-Client (optional)
- Spieler anlegen / bearbeiten
- Kontostände anpassen
- Logs einsehen

## Sicherheit (Ingame & Technisch)

- QR-Code enthält keine Klartextdaten
- Änderungen am Kontostand nur über Server
- Optionale PIN- oder Rollenprüfung pro Client
- Logging aller Transaktionen

## Anforderungen

- Server mit Datenbank (z. B. SQLite, PostgreSQL, MySQL)
- Clients mit Kamera oder QR-Scanner
- Netzwerkverbindung (lokal oder Event-WLAN)

## Erweiterungsmöglichkeiten

- Mehrere Währungen
- Fraktionsabhängige Preise
- Fahndungsstatus / Sperrung von Konten

## Ziel

Ziel des Systems ist eine immersive, einfache und zuverlässige Lösung für Identifikation und Bezahlung im Spiel, ohne Outgame-Verwaltung oder Bargeld.

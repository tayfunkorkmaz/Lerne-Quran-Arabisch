# Quranisches Arabisch — Lern-App

Eine Lern-App für quranisches Arabisch, basierend auf einer sprachwissenschaftlichen Methodik. Der Lernende arbeitet am konsonantischen Quran-Text ohne Vokalzeichen und erarbeitet sich Wurzeln, Formen und Vokalisierung systematisch.

## Starten

```bash
npm install
npm run dev
```

Öffne `http://localhost:5173` im Browser.

## Build

```bash
npm run build
```

Die fertige App liegt dann in `dist/`.

## Module

| Modul | Beschreibung |
|-------|-------------|
| **Modul 1** | Schrift-Trainer — Alphabet, Positionen, Minimalpaare, Sure-1-Test |
| **Modul 2** | Morphologie-Dojo — 24 Morphologie-Lektionen (Stufe 2) + 51 Syntax/Partikel-Lektionen (Stufe 3–4) |
| **Modul 3** | Vers-Werkstatt — Qurantext Vers für Vers analysieren (Partikeln, Wurzel, Form, Vokalisierung, Bedeutung, Syntax) |
| **Modul 4** | Wurzel-Notizbuch — Automatisch wachsendes Wurzelverzeichnis mit Lane's-Lexikon-Links |
| **Modul 5** | SRS — Spaced Repetition mit SM-2-Algorithmus, 6 Kartentypen |
| **Modul 6** | Dashboard — Quran-Heatmap, Fortschritt, Streak, SRS-Statistik |
| **Modul 7** | Fortgeschrittene Stufen — Rhetorik, Ellipse, Rektion |
| **Modul 8** | Werkzeuge — Nachschlagewerke und Referenzen |

## Datenquellen

- **Qurantext:** tanzil.net Simple Clean (114 Suren, 6.236 Verse, nur Konsonanten)
- **Lexikon:** Lane's Lexikon (verlinkt, nicht eingebettet)
- **Audio:** everyayah.com Vers-für-Vers-Rezitationen (gestreamt)

## Technologie

- React 19 + Vite 8
- Lokaler Browser-Speicher (IndexedDB via localforage)
- Kein Backend — alles läuft im Browser
- SHA-256 Integritätsprüfung des Qurantextes beim Start

## Methodik

Der Lernende arbeitet am konsonantischen Text. Vokalzeichen werden als spätere Notationsschicht vom konsonantischen Grundgerüst unterschieden. Drei Werkzeuge stehen zur Verfügung: abstrakte Morphologie (die Muster), Lane's Lexikon (die Wurzelbedeutungen), und der Kontext des Konsonantentextes selbst.

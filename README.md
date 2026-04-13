# Lerne Quran Arabisch

**Sprachwissenschaftlicher Sprachkurs für quranisches Arabisch**

Ein sprachwissenschaftlicher Zugang zum Arabisch des Quran. Der Kurs behandelt Morphologie, Syntax, Semantik und Rhetorik auf Basis arabischer Lexikographie (Lane's Lexicon) und klassischer Grammatik (Wright's Grammar). Der Schwerpunkt liegt auf dem sprachlichen Verständnis des Textes.

**Disclaimer:** Alle Inhalte — grammatische Analysen, Übersetzungen, morphologische Zuordnungen — sollten vom Lernenden eigenständig überprüft werden. Die angegebenen Quellen (Lane's Lexicon, Wright's Grammar, Quranic Arabic Corpus) dienen als Ausgangspunkt für diese Überprüfung.

## Überblick

Die Anwendung arbeitet vom Konsonantentext (Rasm) aus und deckt den vollständigen quranischen Wortschatz ab: ca. 1.800 Wurzeln und 77.000 Wörter. Als sprachwissenschaftliche Quellen dienen Lane's Lexicon und Wright's Grammar.

## Module

| Nr. | Modul | Beschreibung |
|-----|-------|-------------|
| 1 | Schrift-Trainer | Vom Rasm zum vokalisierten Text |
| 2 | Morphologie-Dojo | Wurzeln, Muster, Formen |
| 3 | Vers-Werkstatt | Syntaktische Analyse quranischer Verse |
| 4 | Wurzel-Notizbuch | Persönliches Wurzelverzeichnis |
| 5 | SRS | Spaced Repetition für nachhaltiges Lernen |
| 6 | Dashboard | Fortschritt und Statistiken |
| 7 | Fortgeschrittene Stufen | Rhetorik, Ellipse, Rektion |
| 8 | Werkzeuge | Nachschlagewerke und Referenzen |

## Technische Merkmale

- Vollständig offline-fähig, keine Backend-Abhängigkeiten
- IndexedDB für lokale Fortschrittsspeicherung (via localforage)
- SHA-256 Integritätsprüfung des Qurantextes

## Tech Stack

- React 19
- Vite 8
- Vitest (Unit Tests)
- Playwright (E2E Tests)
- localforage (IndexedDB)

## Erste Schritte

```bash
cd app
npm install
npm run dev
```

Die Anwendung ist dann unter `http://localhost:5173` erreichbar.

## Tests

```bash
npm run test        # Unit Tests
npm run test:e2e    # E2E Tests
```

## Lizenz

[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — frei nutzbar, nicht kommerziell.

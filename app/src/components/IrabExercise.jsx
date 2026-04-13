import { useState } from 'react'
import irabExtension from '../data/irab-exercises-extension.json'

const ROLES = [
  'Mubtada', 'Khabar', "Faʿil", "Mafʿul bihi", 'Majrur', 'Mudaf', 'Mudaf ilayhi',
  'Sifa/Na\'t', 'Badal', 'Hal', 'Tamyiz', 'Munada', "Naʿib al-Faʿil",
  'Harf (Partikel)', "Fi'l (Verb)", 'Ẓarf', "Mafʿul mutlaq", "'Atf (Koordination)",
  'Ism inna', 'Khabar inna', 'Ism kana', 'Khabar kana', 'Jawab shart',
  "Mafʿul li-Ajlihi", "Mafʿul Maʿahu", 'Ẓarf Zaman', 'Ẓarf Makan',
  'Mustathna (Ausgenommenes)', 'Harf + Ism'
]

const CASES = ['Nominativ (Raf\')', 'Akkusativ (Nasb)', 'Genitiv (Jarr)', 'Indeklinabel']

const INLINE_EXERCISES = [
  {
    ref: '1:2',
    arabic: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F \u0644\u0650\u0644\u0651\u064E\u0647\u0650 \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E',
    words: [
      { word: '\u0627\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F', role: 'Mubtada', case: 'Nominativ (Raf\')', explanation: 'Thema des Nominalsatzes, trägt Damma' },
      { word: '\u0644\u0650\u0644\u0651\u064E\u0647\u0650', role: 'Khabar', case: 'Genitiv (Jarr)', explanation: 'Prädikat als Jarr wa-Majrur. \u0644\u0650 ist Präposition, \u0627\u0644\u0644\u0651\u064E\u0647 steht im Genitiv' },
      { word: '\u0631\u064E\u0628\u0651\u0650', role: 'Badal', case: 'Genitiv (Jarr)', explanation: 'Apposition zu \u0627\u0644\u0644\u0651\u064E\u0647 — kongruiert im Kasus (Genitiv)' },
      { word: '\u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Zweites Glied der Iḍāfa \u0631\u064E\u0628\u0651\u0650 \u0627\u0644\u0652\u0639\u064E\u0627\u0644\u064E\u0645\u0650\u064A\u0646\u064E. Genitiv-Markierung: -\u064A\u0646 (gesunder mask. Plural)' }
    ]
  },
  {
    ref: '1:5',
    arabic: '\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E \u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F \u0648\u064E\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E \u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F',
    words: [
      { word: '\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Vorangestelltes Objekt (Taqdim). Emphatische Akkusativform des Pronomens 2ms' },
      { word: '\u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 1. Person Plural, Indikativ (Damma). Verb ist nicht kasusflektiert' },
      { word: '\u0648\u064E\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: '\u0648\u064E (Konjunktion) + vorangestelltes Objekt. Parallele Struktur zum ersten Halbvers' },
      { word: '\u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 1pl, Form X (istaf\u02BFala), Wurzel \u0639-\u0648-\u0646. Indikativ' }
    ]
  },
  {
    ref: '1:6',
    arabic: '\u0627\u0647\u0652\u062F\u0650\u0646\u064E\u0627 \u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064E \u0627\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E',
    words: [
      { word: '\u0627\u0647\u0652\u062F\u0650\u0646\u064E\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2ms + Objektsuffix \u0646\u064E\u0627 (uns). Wurzel \u0647-\u062F-\u064A' },
      { word: '\u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064E', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt von \u0627\u0647\u0652\u062F\u0650. Fatha als Kasuszeichen' },
      { word: '\u0627\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E', role: "Sifa/Na't", case: 'Akkusativ (Nasb)', explanation: 'Attribut zu \u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064E. Kongruenz: definit, mask., Sg., Akkusativ' }
    ]
  },
  {
    ref: '2:2',
    arabic: '\u0630\u064E\u0670\u0644\u0650\u0643\u064E \u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F \u0644\u064E\u0627 \u0631\u064E\u064A\u0652\u0628\u064E \u0641\u0650\u064A\u0647\u0650',
    words: [
      { word: '\u0630\u064E\u0670\u0644\u0650\u0643\u064E', role: 'Mubtada', case: 'Indeklinabel', explanation: 'Demonstrativpronomen als Thema. Indeklinabel, syntaktisch Nominativ' },
      { word: '\u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u064F', role: 'Khabar', case: 'Nominativ (Raf\')', explanation: 'Prädikat zum Mubtada \u0630\u064E\u0670\u0644\u0650\u0643\u064E. Damma als Kasuszeichen' },
      { word: '\u0644\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 \u0644\u0644\u062C\u0646\u0633 — generische Negation' },
      { word: '\u0631\u064E\u064A\u0652\u0628\u064E', role: 'Ism inna', case: 'Akkusativ (Nasb)', explanation: 'Ism von \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 \u0644\u0644\u062C\u0646\u0633 — Akkusativ ohne Tanwin (mabni ala l-fath)' },
      { word: '\u0641\u0650\u064A\u0647\u0650', role: 'Khabar inna', case: 'Indeklinabel', explanation: 'Khabar von \u0644\u064E\u0627 als Jarr wa-Majrur (\u0641\u0650\u064A + Suffix \u0647\u0650)' }
    ]
  },
  {
    ref: '2:6',
    arabic: '\u0625\u0650\u0646\u0651\u064E \u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E \u0643\u064E\u0641\u064E\u0631\u064F\u0648\u0627',
    words: [
      { word: '\u0625\u0650\u0646\u0651\u064E', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Bekräftigungspartikel. Setzt das Ism in den Akkusativ' },
      { word: '\u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E', role: 'Ism inna', case: 'Akkusativ (Nasb)', explanation: 'Ism von \u0625\u0650\u0646\u0651\u064E. Relativpronomen, -\u064A\u0646\u064E signalisiert Akk/Gen' },
      { word: '\u0643\u064E\u0641\u064E\u0631\u064F\u0648\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3mp, Wurzel \u0643-\u0641-\u0631. Relativsatz (\u0635\u0650\u0644\u0629)' }
    ]
  },
  {
    ref: '2:7',
    arabic: '\u062E\u064E\u062A\u064E\u0645\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0639\u064E\u0644\u064E\u0649\u0670 \u0642\u064F\u0644\u064F\u0648\u0628\u0650\u0647\u0650\u0645\u0652',
    words: [
      { word: '\u062E\u064E\u062A\u064E\u0645\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3ms, Wurzel \u062E-\u062A-\u0645, Form I' },
      { word: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F', role: "Faʿil", case: 'Nominativ (Raf\')', explanation: 'Subjekt des Verbs. Damma als Kasuszeichen' },
      { word: '\u0639\u064E\u0644\u064E\u0649\u0670', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Präposition. Regiert Genitiv' },
      { word: '\u0642\u064F\u0644\u064F\u0648\u0628\u0650\u0647\u0650\u0645\u0652', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Nach \u0639\u064E\u0644\u064E\u0649\u0670 im Genitiv. Kasra + Possessivsuffix \u0647\u0650\u0645\u0652' }
    ]
  },
  {
    ref: '2:21',
    arabic: '\u064A\u064E\u0627 \u0623\u064E\u064A\u0651\u064F\u0647\u064E\u0627 \u0627\u0644\u0646\u0651\u064E\u0627\u0633\u064F \u0627\u0639\u0652\u0628\u064F\u062F\u064F\u0648\u0627 \u0631\u064E\u0628\u0651\u064E\u0643\u064F\u0645\u064F',
    words: [
      { word: '\u064A\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Vokativpartikel' },
      { word: '\u0623\u064E\u064A\u0651\u064F\u0647\u064E\u0627', role: 'Munada', case: 'Indeklinabel', explanation: 'Angerufener. Mabni ala d-Damm (indeklinabel, syntaktisch Nominativ)' },
      { word: '\u0627\u0644\u0646\u0651\u064E\u0627\u0633\u064F', role: "Sifa/Na't", case: 'Nominativ (Raf\')', explanation: 'Attribut zum Munada. Nominativ in Kongruenz mit dem syntaktischen Kasus' },
      { word: '\u0627\u0639\u0652\u0628\u064F\u062F\u064F\u0648\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2mp, Wurzel \u0639-\u0628-\u062F' },
      { word: '\u0631\u064E\u0628\u0651\u064E\u0643\u064F\u0645\u064F', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt. Fatha + Possessivsuffix \u0643\u064F\u0645\u064F' }
    ]
  },
  {
    ref: '112:1',
    arabic: '\u0642\u064F\u0644\u0652 \u0647\u064F\u0648\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0623\u064E\u062D\u064E\u062F\u064C',
    words: [
      { word: '\u0642\u064F\u0644\u0652', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2ms, Wurzel \u0642-\u0648-\u0644 (hohl)' },
      { word: '\u0647\u064F\u0648\u064E', role: 'Mubtada', case: 'Indeklinabel', explanation: 'Pronomen 3ms — syntaktische Funktion umstritten: eigenständiges Mubtadaʼ oder vorausweisend auf den folgenden Satz' },
      { word: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F', role: 'Mubtada', case: 'Nominativ (Raf\')', explanation: 'Zweites Mubtada (oder Khabar zu \u0647\u064F\u0648\u064E). Damma' },
      { word: '\u0623\u064E\u062D\u064E\u062F\u064C', role: 'Khabar', case: 'Nominativ (Raf\')', explanation: 'Prädikat. Nominativ mit Tanwin' }
    ]
  },
  {
    ref: '112:3',
    arabic: '\u0644\u064E\u0645\u0652 \u064A\u064E\u0644\u0650\u062F\u0652 \u0648\u064E\u0644\u064E\u0645\u0652 \u064A\u064F\u0648\u0644\u064E\u062F\u0652',
    words: [
      { word: '\u0644\u064E\u0645\u0652', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Negation der Vergangenheit, löst Jussiv aus' },
      { word: '\u064A\u064E\u0644\u0650\u062F\u0652', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 3ms Jussiv (Sukun), Wurzel \u0648-\u0644-\u062F. Er zeugte nicht' },
      { word: '\u0648\u064E\u0644\u064E\u0645\u0652', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: '\u0648\u064E (Konjunktion) + \u0644\u064E\u0645\u0652 (Negation + Jussiv)' },
      { word: '\u064A\u064F\u0648\u0644\u064E\u062F\u0652', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt Passiv 3ms Jussiv, Wurzel \u0648-\u0644-\u062F. Er wurde nicht gezeugt' }
    ]
  },
  {
    ref: '96:1',
    arabic: '\u0627\u0642\u0652\u0631\u064E\u0623\u0652 \u0628\u0650\u0627\u0633\u0652\u0645\u0650 \u0631\u064E\u0628\u0651\u0650\u0643\u064E \u0627\u0644\u0651\u064E\u0630\u0650\u064A \u062E\u064E\u0644\u064E\u0642\u064E',
    words: [
      { word: '\u0627\u0642\u0652\u0631\u064E\u0623\u0652', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2ms, Wurzel \u0642-\u0631-\u0623, Form I. Trag vor!' },
      { word: '\u0628\u0650\u0627\u0633\u0652\u0645\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: '\u0628\u0650 (Präposition) + \u0627\u0633\u0652\u0645 im Genitiv' },
      { word: '\u0631\u064E\u0628\u0651\u0650\u0643\u064E', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Zweites Glied der Iḍāfa \u0627\u0633\u0652\u0645 \u0631\u064E\u0628\u0651\u0650\u0643\u064E. Kasra + Suffix' },
      { word: '\u0627\u0644\u0651\u064E\u0630\u0650\u064A', role: "Sifa/Na't", case: 'Genitiv (Jarr)', explanation: 'Relativpronomen als Attribut zu \u0631\u064E\u0628\u0651\u0650\u0643\u064E' },
      { word: '\u062E\u064E\u0644\u064E\u0642\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3ms, Wurzel \u062E-\u0644-\u0642. Relativsatz (Sila)' }
    ]
  },
  {
    ref: '2:255',
    arabic: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u0651\u064E\u0627 \u0647\u064F\u0648\u064E',
    words: [
      { word: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F', role: 'Mubtada', case: 'Nominativ (Raf\')', explanation: 'Thema des Satzes. Damma' },
      { word: '\u0644\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 \u0644\u0644\u062C\u0646\u0633 — generische Negation' },
      { word: '\u0625\u0650\u0644\u064E\u0670\u0647\u064E', role: 'Ism inna', case: 'Akkusativ (Nasb)', explanation: 'Ism von \u0644\u064E\u0627 — Fatha ohne Tanwin (mabni)' },
      { word: '\u0625\u0650\u0644\u0651\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Ausnahmepartikel' },
      { word: '\u0647\u064F\u0648\u064E', role: 'Badal', case: 'Nominativ (Raf\')', explanation: 'Badal — syntaktische Ersetzung im Kontext des Nominalsatzes. Oder: Khabar' }
    ]
  },
  {
    ref: '3:18',
    arabic: '\u0634\u064E\u0647\u0650\u062F\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0623\u064E\u0646\u0651\u064E\u0647\u064F \u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u0651\u064E\u0627 \u0647\u064F\u0648\u064E',
    words: [
      { word: '\u0634\u064E\u0647\u0650\u062F\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3ms, Wurzel \u0634-\u0647-\u062F' },
      { word: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F', role: "Faʿil", case: 'Nominativ (Raf\')', explanation: 'Subjekt des Verbs. Damma' },
      { word: '\u0623\u064E\u0646\u0651\u064E\u0647\u064F', role: "Mafʿul bihi", case: 'Indeklinabel', explanation: '\u0623\u064E\u0646\u0651\u064E + Pronominalsuffix. Masdar-Satz als Objekt des Bezeugens' },
      { word: '\u0644\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Generische Negation innerhalb des Masdar-Satzes' },
      { word: '\u0625\u0650\u0644\u064E\u0670\u0647\u064E', role: 'Ism inna', case: 'Akkusativ (Nasb)', explanation: 'Ism von \u0644\u064E\u0627' },
      { word: '\u0625\u0650\u0644\u0651\u064E\u0627 \u0647\u064F\u0648\u064E', role: 'Badal', case: 'Nominativ (Raf\')', explanation: 'Ausnahme + Pronomen als Ersetzung' }
    ]
  },
  // === NEUE ÜBUNGEN: Mafʿul mutlaq (absoluter Akkusativ) ===
  {
    ref: '4:164',
    arabic: '\u0648\u064E\u0643\u064E\u0644\u0651\u064E\u0645\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0645\u064F\u0648\u0633\u064E\u0649\u0670 \u062A\u064E\u0643\u0652\u0644\u0650\u064A\u0645\u064B\u0627',
    words: [
      { word: '\u0648\u064E\u0643\u064E\u0644\u0651\u064E\u0645\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3ms, Form II, Wurzel \u0643-\u0644-\u0645' },
      { word: '\u0627\u0644\u0644\u0651\u064E\u0647\u064F', role: "Faʿil", case: 'Nominativ (Raf\')', explanation: 'Subjekt des Verbs. Damma als Kasuszeichen' },
      { word: '\u0645\u064F\u0648\u0633\u064E\u0649\u0670', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt. Akkusativ (geschätzt, da Name auf Alif maqsura)' },
      { word: '\u062A\u064E\u0643\u0652\u0644\u0650\u064A\u0645\u064B\u0627', role: "Mafʿul mutlaq", case: 'Akkusativ (Nasb)', explanation: 'Absoluter Akkusativ (Masdar von Form II). Verstärkt das Verb \u0643\u064E\u0644\u0651\u064E\u0645\u064E. Tanwin-Fatha' }
    ]
  },
  {
    ref: '33:56',
    arabic: '\u0635\u064E\u0644\u0651\u064F\u0648\u0627 \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650 \u0648\u064E\u0633\u064E\u0644\u0651\u0650\u0645\u064F\u0648\u0627 \u062A\u064E\u0633\u0652\u0644\u0650\u064A\u0645\u064B\u0627',
    words: [
      { word: '\u0635\u064E\u0644\u0651\u064F\u0648\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2mp, Form II, Wurzel \u0635-\u0644-\u0648' },
      { word: '\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition \u0639\u064E\u0644\u064E\u0649 + Suffix \u0647\u0650 im Genitiv' },
      { word: '\u0648\u064E\u0633\u064E\u0644\u0651\u0650\u0645\u064F\u0648\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2mp, Form II, Wurzel \u0633-\u0644-\u0645' },
      { word: '\u062A\u064E\u0633\u0652\u0644\u0650\u064A\u0645\u064B\u0627', role: "Mafʿul mutlaq", case: 'Akkusativ (Nasb)', explanation: 'Absoluter Akkusativ. Masdar II verstärkt das Verb \u0633\u064E\u0644\u0651\u0650\u0645\u064F\u0648\u0627. Tanwin-Fatha' }
    ]
  },
  {
    ref: '76:26',
    arabic: '\u0648\u064E\u0633\u064E\u0628\u0651\u0650\u062D\u0652\u0647\u064F \u0644\u064E\u064A\u0652\u0644\u064B\u0627 \u0637\u064E\u0648\u0650\u064A\u0644\u064B\u0627',
    words: [
      { word: '\u0648\u064E\u0633\u064E\u0628\u0651\u0650\u062D\u0652\u0647\u064F', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2ms, Form II + Suffix \u0647\u064F als Objekt' },
      { word: '\u0644\u064E\u064A\u0652\u0644\u064B\u0627', role: 'Ẓarf Zaman', case: 'Akkusativ (Nasb)', explanation: 'Zeitadverbial (Ẓarf zaman). Akkusativ mit Tanwin-Fatha' },
      { word: '\u0637\u064E\u0648\u0650\u064A\u0644\u064B\u0627', role: "Sifa/Na't", case: 'Akkusativ (Nasb)', explanation: 'Attribut zu \u0644\u064E\u064A\u0652\u0644\u064B\u0627. Kongruenz: indefinit, mask., Sg., Akkusativ' }
    ]
  },
  {
    ref: '48:1',
    arabic: '\u0625\u0650\u0646\u0651\u064E\u0627 \u0641\u064E\u062A\u064E\u062D\u0652\u0646\u064E\u0627 \u0644\u064E\u0643\u064E \u0641\u064E\u062A\u0652\u062D\u064B\u0627 \u0645\u064F\u0628\u0650\u064A\u0646\u064B\u0627',
    words: [
      { word: '\u0625\u0650\u0646\u0651\u064E\u0627', role: 'Harf + Ism', case: 'Indeklinabel', explanation: 'Kombinierte Form: \u0625\u0650\u0646\u0651\u064E (Bekräftigungspartikel) + \u0646\u064E\u0627 (Pronomen 1pl als Ism von \u0625\u0650\u0646\u0651\u064E im Akkusativ)' },
      { word: '\u0641\u064E\u062A\u064E\u062D\u0652\u0646\u064E\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 1pl, Wurzel \u0641-\u062A-\u062D' },
      { word: '\u0644\u064E\u0643\u064E', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition \u0644\u064E\u0640 + Suffix \u0643\u064E' },
      { word: '\u0641\u064E\u062A\u0652\u062D\u064B\u0627', role: "Mafʿul mutlaq", case: 'Akkusativ (Nasb)', explanation: 'Absoluter Akkusativ. Masdar von \u0641\u064E\u062A\u064E\u062D\u064E. Verstärkt das Verb. Tanwin-Fatha' },
      { word: '\u0645\u064F\u0628\u0650\u064A\u0646\u064B\u0627', role: "Sifa/Na't", case: 'Akkusativ (Nasb)', explanation: 'Attribut zu \u0641\u064E\u062A\u0652\u062D\u064B\u0627. Kongruenz im Akkusativ' }
    ]
  },
  {
    ref: '73:8',
    arabic: '\u0648\u064E\u062A\u064E\u0628\u064E\u062A\u0651\u064E\u0644\u0652 \u0625\u0650\u0644\u064E\u064A\u0652\u0647\u0650 \u062A\u064E\u0628\u0652\u062A\u0650\u064A\u0644\u064B\u0627',
    words: [
      { word: '\u0648\u064E\u062A\u064E\u0628\u064E\u062A\u0651\u064E\u0644\u0652', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2ms, Form V, Wurzel \u0628-\u062A-\u0644' },
      { word: '\u0625\u0650\u0644\u064E\u064A\u0652\u0647\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition \u0625\u0650\u0644\u064E\u0649 + Suffix \u0647\u0650' },
      { word: '\u062A\u064E\u0628\u0652\u062A\u0650\u064A\u0644\u064B\u0627', role: "Mafʿul mutlaq", case: 'Akkusativ (Nasb)', explanation: 'Absoluter Akkusativ. Masdar II von \u0628-\u062A-\u0644. Verstärkt das Verb. Tanwin-Fatha' }
    ]
  },
  {
    ref: '2:45',
    arabic: '\u0648\u064E\u0625\u0650\u0646\u0651\u064E\u0647\u064E\u0627 \u0644\u064E\u0643\u064E\u0628\u0650\u064A\u0631\u064E\u0629\u064C',
    words: [
      { word: '\u0648\u064E\u0625\u0650\u0646\u0651\u064E\u0647\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: '\u0648\u064E + \u0625\u0650\u0646\u0651\u064E + Suffix \u0647\u064E\u0627 als Ism' },
      { word: '\u0644\u064E\u0643\u064E\u0628\u0650\u064A\u0631\u064E\u0629\u064C', role: 'Khabar inna', case: 'Nominativ (Raf\')', explanation: 'Khabar von \u0625\u0650\u0646\u0651\u064E. Das \u0644\u064E\u0640 ist Lam al-Mubtada (bekräftigend). Damma mit Tanwin' }
    ]
  },
  // === NEUE ÜBUNGEN: Mafʿul li-ajlihi (Akkusativ des Grundes) ===
  {
    ref: '2:19',
    arabic: '\u064A\u064E\u062C\u0652\u0639\u064E\u0644\u064F\u0648\u0646\u064E \u0623\u064E\u0635\u064E\u0627\u0628\u0650\u0639\u064E\u0647\u064F\u0645\u0652 \u0641\u0650\u064A \u0622\u0630\u064E\u0627\u0646\u0650\u0647\u0650\u0645\u0652 \u062D\u064E\u0630\u064E\u0631\u064E \u0627\u0644\u0652\u0645\u064E\u0648\u0652\u062A\u0650',
    words: [
      { word: '\u064A\u064E\u062C\u0652\u0639\u064E\u0644\u064F\u0648\u0646\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 3mp, Indikativ. \u0648\u0646\u064E = Raf\u02BF-Marker' },
      { word: '\u0623\u064E\u0635\u064E\u0627\u0628\u0650\u0639\u064E\u0647\u064F\u0645\u0652', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt. Fatha + Possessivsuffix' },
      { word: '\u0641\u0650\u064A \u0622\u0630\u064E\u0627\u0646\u0650\u0647\u0650\u0645\u0652', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Genitiv. In ihren Ohren' },
      { word: '\u062D\u064E\u0630\u064E\u0631\u064E', role: "Mafʿul li-Ajlihi", case: 'Akkusativ (Nasb)', explanation: 'Akkusativ des Grundes (Maf\u02BFul li-ajlihi). Aus Angst vor. Fatha ohne Tanwin (Mudaf)' },
      { word: '\u0627\u0644\u0652\u0645\u064E\u0648\u0652\u062A\u0650', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Zweites Glied der Iḍāfa. Kasra' }
    ]
  },
  {
    ref: '2:207',
    arabic: '\u0648\u064E\u0645\u0650\u0646\u064E \u0627\u0644\u0646\u0651\u064E\u0627\u0633\u0650 \u0645\u064E\u0646 \u064A\u064E\u0634\u0652\u0631\u0650\u064A \u0646\u064E\u0641\u0652\u0633\u064E\u0647\u064F \u0627\u0628\u0652\u062A\u0650\u063A\u064E\u0627\u0621\u064E \u0645\u064E\u0631\u0652\u0636\u064E\u0627\u062A\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650',
    words: [
      { word: '\u0648\u064E\u0645\u0650\u0646\u064E \u0627\u0644\u0646\u0651\u064E\u0627\u0633\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition \u0645\u0650\u0646\u0652 + Genitiv. Vorangestelltes Khabar' },
      { word: '\u0645\u064E\u0646', role: 'Mubtada', case: 'Indeklinabel', explanation: 'Relativpronomen als Mubtada. Indeklinabel' },
      { word: '\u064A\u064E\u0634\u0652\u0631\u0650\u064A', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 3ms, Wurzel \u0634-\u0631-\u064A. Relativsatz' },
      { word: '\u0646\u064E\u0641\u0652\u0633\u064E\u0647\u064F', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt von \u064A\u064E\u0634\u0652\u0631\u0650\u064A. Fatha + Suffix' },
      { word: '\u0627\u0628\u0652\u062A\u0650\u063A\u064E\u0627\u0621\u064E', role: "Mafʿul li-Ajlihi", case: 'Akkusativ (Nasb)', explanation: 'Akkusativ des Grundes: um das Wohlgefallen zu suchen. Fatha (Mudaf)' },
      { word: '\u0645\u064E\u0631\u0652\u0636\u064E\u0627\u062A\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Iḍāfa. \u0627\u0644\u0644\u0651\u064E\u0647\u0650 im Genitiv' }
    ]
  },
  {
    ref: '28:20',
    arabic: '\u0625\u0650\u0646\u0651\u064E \u0627\u0644\u0652\u0645\u064E\u0644\u064E\u0623\u064E \u064A\u064E\u0623\u0652\u062A\u064E\u0645\u0650\u0631\u064F\u0648\u0646\u064E \u0628\u0650\u0643\u064E \u0644\u0650\u064A\u064E\u0642\u0652\u062A\u064F\u0644\u064F\u0648\u0643\u064E',
    words: [
      { word: '\u0625\u0650\u0646\u0651\u064E', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Bekräftigungspartikel' },
      { word: '\u0627\u0644\u0652\u0645\u064E\u0644\u064E\u0623\u064E', role: 'Ism inna', case: 'Akkusativ (Nasb)', explanation: 'Ism von \u0625\u0650\u0646\u0651\u064E. Akkusativ mit Fatha' },
      { word: '\u064A\u064E\u0623\u0652\u062A\u064E\u0645\u0650\u0631\u064F\u0648\u0646\u064E', role: 'Khabar inna', case: 'Indeklinabel', explanation: 'Khabar von \u0625\u0650\u0646\u0651\u064E als Verbalsatz' },
      { word: '\u0628\u0650\u0643\u064E', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Suffix \u0643\u064E' },
      { word: '\u0644\u0650\u064A\u064E\u0642\u0652\u062A\u064F\u0644\u064F\u0648\u0643\u064E', role: "Mafʿul li-Ajlihi", case: 'Indeklinabel', explanation: '\u0644\u0650\u0640 Finalpartikel + Subjunktiv. Gibt den Grund an: um dich zu töten' }
    ]
  },
  {
    ref: '2:265',
    arabic: '\u064A\u064F\u0646\u0641\u0650\u0642\u064F\u0648\u0646\u064E \u0623\u064E\u0645\u0652\u0648\u064E\u0627\u0644\u064E\u0647\u064F\u0645\u064F \u0627\u0628\u0652\u062A\u0650\u063A\u064E\u0627\u0621\u064E \u0645\u064E\u0631\u0652\u0636\u064E\u0627\u062A\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650',
    words: [
      { word: '\u064A\u064F\u0646\u0641\u0650\u0642\u064F\u0648\u0646\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 3mp, Form IV, Indikativ' },
      { word: '\u0623\u064E\u0645\u0652\u0648\u064E\u0627\u0644\u064E\u0647\u064F\u0645\u064F', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt. Fatha + Possessivsuffix' },
      { word: '\u0627\u0628\u0652\u062A\u0650\u063A\u064E\u0627\u0621\u064E', role: "Mafʿul li-Ajlihi", case: 'Akkusativ (Nasb)', explanation: 'Akkusativ des Grundes. Masdar VIII. Um das Wohlgefallen zu suchen' },
      { word: '\u0645\u064E\u0631\u0652\u0636\u064E\u0627\u062A\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Iḍāfa-Konstruktion. Genitiv' }
    ]
  },
  {
    ref: '5:2',
    arabic: '\u0648\u064E\u0644\u064E\u0627 \u064A\u064E\u062C\u0652\u0631\u0650\u0645\u064E\u0646\u0651\u064E\u0643\u064F\u0645\u0652 \u0634\u064E\u0646\u064E\u0622\u0646\u064F \u0642\u064E\u0648\u0652\u0645\u064D',
    words: [
      { word: '\u0648\u064E\u0644\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: '\u0648\u064E + \u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 (Verbot)' },
      { word: '\u064A\u064E\u062C\u0652\u0631\u0650\u0645\u064E\u0646\u0651\u064E\u0643\u064F\u0645\u0652', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 3ms Jussiv + Energetisches Nun + Suffix \u0643\u064F\u0645\u0652 als Objekt' },
      { word: '\u0634\u064E\u0646\u064E\u0622\u0646\u064F', role: "Faʿil", case: 'Nominativ (Raf\')', explanation: 'Subjekt des Verbs. Damma (Mudaf)' },
      { word: '\u0642\u064E\u0648\u0652\u0645\u064D', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Zweites Glied der Iḍāfa. Kasra mit Tanwin' }
    ]
  },
  {
    ref: '4:77',
    arabic: '\u0643\u064F\u062A\u0650\u0628\u064E \u0639\u064E\u0644\u064E\u064A\u0652\u0643\u064F\u0645\u064F \u0627\u0644\u0652\u0642\u0650\u062A\u064E\u0627\u0644\u064F',
    words: [
      { word: '\u0643\u064F\u062A\u0650\u0628\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Passiv Perfekt 3ms, Wurzel \u0643-\u062A-\u0628' },
      { word: '\u0639\u064E\u0644\u064E\u064A\u0652\u0643\u064F\u0645\u064F', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition \u0639\u064E\u0644\u064E\u0649 + Suffix \u0643\u064F\u0645\u064F' },
      { word: '\u0627\u0644\u0652\u0642\u0650\u062A\u064E\u0627\u0644\u064F', role: "Naʿib al-Faʿil", case: 'Nominativ (Raf\')', explanation: 'Stellvertreter des Subjekts (Passivsubjekt). Damma als Kasuszeichen' }
    ]
  },
  // === NEUE ÜBUNGEN: Ẓarf (Zeit-/Ortsadverbial) ===
  {
    ref: '2:274',
    arabic: '\u064A\u064F\u0646\u0641\u0650\u0642\u064F\u0648\u0646\u064E \u0623\u064E\u0645\u0652\u0648\u064E\u0627\u0644\u064E\u0647\u064F\u0645 \u0628\u0650\u0627\u0644\u0644\u0651\u064E\u064A\u0652\u0644\u0650 \u0648\u064E\u0627\u0644\u0646\u0651\u064E\u0647\u064E\u0627\u0631\u0650',
    words: [
      { word: '\u064A\u064F\u0646\u0641\u0650\u0642\u064F\u0648\u0646\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 3mp, Form IV, Indikativ' },
      { word: '\u0623\u064E\u0645\u0652\u0648\u064E\u0627\u0644\u064E\u0647\u064F\u0645', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt. Fatha + Suffix' },
      { word: '\u0628\u0650\u0627\u0644\u0644\u0651\u064E\u064A\u0652\u0644\u0650', role: 'Ẓarf Zaman', case: 'Genitiv (Jarr)', explanation: 'Zeitadverbial mit Präposition \u0628\u0650. Bei Nacht' },
      { word: '\u0648\u064E\u0627\u0644\u0646\u0651\u064E\u0647\u064E\u0627\u0631\u0650', role: 'Ẓarf Zaman', case: 'Genitiv (Jarr)', explanation: 'Koordiniertes Zeitadverbial. Und bei Tag. Kasra nach \u0628\u0650' }
    ]
  },
  {
    ref: '17:78',
    arabic: '\u0623\u064E\u0642\u0650\u0645\u0650 \u0627\u0644\u0635\u0651\u064E\u0644\u064E\u0627\u0629\u064E \u0644\u0650\u062F\u064F\u0644\u064F\u0648\u0643\u0650 \u0627\u0644\u0634\u0651\u064E\u0645\u0652\u0633\u0650',
    words: [
      { word: '\u0623\u064E\u0642\u0650\u0645\u0650', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2ms, Form IV, Wurzel \u0642-\u0648-\u0645' },
      { word: '\u0627\u0644\u0635\u0651\u064E\u0644\u064E\u0627\u0629\u064E', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt. Fatha' },
      { word: '\u0644\u0650\u062F\u064F\u0644\u064F\u0648\u0643\u0650', role: 'Ẓarf Zaman', case: 'Genitiv (Jarr)', explanation: 'Zeitadverbial mit \u0644\u0650\u0640: beim Neigen. Genitiv (Iḍāfa mit \u0627\u0644\u0634\u0651\u064E\u0645\u0652\u0633)' },
      { word: '\u0627\u0644\u0634\u0651\u064E\u0645\u0652\u0633\u0650', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Zweites Glied der Iḍāfa. Kasra' }
    ]
  },
  {
    ref: '19:62',
    arabic: '\u0644\u064E\u0647\u064F\u0645\u0652 \u0631\u0650\u0632\u0652\u0642\u064F\u0647\u064F\u0645\u0652 \u0641\u0650\u064A\u0647\u064E\u0627 \u0628\u064F\u0643\u0652\u0631\u064E\u0629\u064B \u0648\u064E\u0639\u064E\u0634\u0650\u064A\u0651\u064B\u0627',
    words: [
      { word: '\u0644\u064E\u0647\u064F\u0645\u0652', role: 'Khabar', case: 'Indeklinabel', explanation: 'Vorangestelltes Khabar als Jarr wa-Majrur' },
      { word: '\u0631\u0650\u0632\u0652\u0642\u064F\u0647\u064F\u0645\u0652', role: 'Mubtada', case: 'Nominativ (Raf\')', explanation: 'Mubtada (nachgestellt). Damma + Possessivsuffix' },
      { word: '\u0641\u0650\u064A\u0647\u064E\u0627', role: 'Ẓarf Makan', case: 'Genitiv (Jarr)', explanation: 'Ortsadverbial mit Präposition \u0641\u0650\u064A. Darin' },
      { word: '\u0628\u064F\u0643\u0652\u0631\u064E\u0629\u064B', role: 'Ẓarf Zaman', case: 'Akkusativ (Nasb)', explanation: 'Zeitadverbial: am Morgen. Akkusativ mit Tanwin-Fatha' },
      { word: '\u0648\u064E\u0639\u064E\u0634\u0650\u064A\u0651\u064B\u0627', role: 'Ẓarf Zaman', case: 'Akkusativ (Nasb)', explanation: 'Koordiniertes Zeitadverbial: und am Abend. Tanwin-Fatha' }
    ]
  },
  {
    ref: '7:54',
    arabic: '\u062B\u064F\u0645\u0651\u064E \u0627\u0633\u0652\u062A\u064E\u0648\u064E\u0649\u0670 \u0639\u064E\u0644\u064E\u0649 \u0627\u0644\u0652\u0639\u064E\u0631\u0652\u0634\u0650',
    words: [
      { word: '\u062B\u064F\u0645\u0651\u064E', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Konjunktion (dann/hierauf). Zeigt zeitliche Abfolge' },
      { word: '\u0627\u0633\u0652\u062A\u064E\u0648\u064E\u0649\u0670', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3ms, Form VIII/X, Wurzel \u0633-\u0648-\u064A' },
      { word: '\u0639\u064E\u0644\u064E\u0649', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Präposition, regiert Genitiv' },
      { word: '\u0627\u0644\u0652\u0639\u064E\u0631\u0652\u0634\u0650', role: 'Ẓarf Makan', case: 'Genitiv (Jarr)', explanation: 'Ort/Gegenstand nach \u0639\u064E\u0644\u064E\u0649. Genitiv mit Kasra' }
    ]
  },
  {
    ref: '33:10',
    arabic: '\u0625\u0650\u0630\u0652 \u062C\u064E\u0627\u0621\u064F\u0648\u0643\u064F\u0645 \u0645\u0650\u0646 \u0641\u064E\u0648\u0652\u0642\u0650\u0643\u064F\u0645\u0652',
    words: [
      { word: '\u0625\u0650\u0630\u0652', role: 'Ẓarf Zaman', case: 'Indeklinabel', explanation: 'Zeitpartikel: als/wenn. Indeklinabel, syntaktisch Akkusativ (Ẓarf)' },
      { word: '\u062C\u064E\u0627\u0621\u064F\u0648\u0643\u064F\u0645', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3mp + Suffix \u0643\u064F\u0645 als Objekt' },
      { word: '\u0645\u0650\u0646 \u0641\u064E\u0648\u0652\u0642\u0650\u0643\u064F\u0645\u0652', role: 'Ẓarf Makan', case: 'Genitiv (Jarr)', explanation: 'Ortsangabe: von oberhalb von euch. \u0641\u064E\u0648\u0652\u0642 ist Ẓarf makan im Genitiv nach \u0645\u0650\u0646' }
    ]
  },
  // === NEUE ÜBUNGEN: Badal (Apposition) ===
  {
    ref: '1:7',
    arabic: '\u0635\u0650\u0631\u064E\u0627\u0637\u064E \u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E \u0623\u064E\u0646\u0652\u0639\u064E\u0645\u0652\u062A\u064E \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652',
    words: [
      { word: '\u0635\u0650\u0631\u064E\u0627\u0637\u064E', role: 'Badal', case: 'Akkusativ (Nasb)', explanation: 'Badal (Apposition) zu \u0627\u0644\u0635\u0651\u0650\u0631\u064E\u0627\u0637\u064E im vorhergehenden Vers. Akkusativ' },
      { word: '\u0627\u0644\u0651\u064E\u0630\u0650\u064A\u0646\u064E', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Zweites Glied der Iḍāfa. Relativpronomen im Genitiv' },
      { word: '\u0623\u064E\u0646\u0652\u0639\u064E\u0645\u0652\u062A\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 2ms, Form IV, Wurzel \u0646-\u0639-\u0645. Relativsatz' },
      { word: '\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Suffix. Auf sie (ihnen)' }
    ]
  },
  {
    ref: '14:35',
    arabic: '\u0631\u064E\u0628\u0651\u0650 \u0627\u062C\u0652\u0639\u064E\u0644\u0652 \u0647\u064E\u0670\u0630\u064E\u0627 \u0627\u0644\u0652\u0628\u064E\u0644\u064E\u062F\u064E \u0622\u0645\u0650\u0646\u064B\u0627',
    words: [
      { word: '\u0631\u064E\u0628\u0651\u0650', role: 'Munada', case: 'Indeklinabel', explanation: 'Munada (Angerufener) — Mudaf, daher bleibt Kasra (Genitiv)' },
      { word: '\u0627\u062C\u0652\u0639\u064E\u0644\u0652', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2ms, Wurzel \u062C-\u0639-\u0644' },
      { word: '\u0647\u064E\u0670\u0630\u064E\u0627', role: "Mafʿul bihi", case: 'Indeklinabel', explanation: 'Demonstrativpronomen als erstes Objekt. Indeklinabel' },
      { word: '\u0627\u0644\u0652\u0628\u064E\u0644\u064E\u062F\u064E', role: 'Badal', case: 'Akkusativ (Nasb)', explanation: 'Badal (Apposition) zu \u0647\u064E\u0670\u0630\u064E\u0627. Fatha als Akkusativzeichen' },
      { word: '\u0622\u0645\u0650\u0646\u064B\u0627', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Zweites Objekt von \u0627\u062C\u0652\u0639\u064E\u0644\u0652 (doppelter Akkusativ). Tanwin-Fatha' }
    ]
  },
  {
    ref: '2:37',
    arabic: '\u0641\u064E\u062A\u064E\u0644\u064E\u0642\u0651\u064E\u0649\u0670 \u0622\u062F\u064E\u0645\u064F \u0645\u0650\u0646 \u0631\u064E\u0628\u0651\u0650\u0647\u0650 \u0643\u064E\u0644\u0650\u0645\u064E\u0627\u062A\u064D',
    words: [
      { word: '\u0641\u064E\u062A\u064E\u0644\u064E\u0642\u0651\u064E\u0649\u0670', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3ms, Form V, Wurzel \u0644-\u0642-\u064A' },
      { word: '\u0622\u062F\u064E\u0645\u064F', role: "Faʿil", case: 'Nominativ (Raf\')', explanation: 'Subjekt. Damma (Name, triptotisch)' },
      { word: '\u0645\u0650\u0646 \u0631\u064E\u0628\u0651\u0650\u0647\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Genitiv' },
      { word: '\u0643\u064E\u0644\u0650\u0645\u064E\u0627\u062A\u064D', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt. Kasra als Akkusativzeichen (gesunder fem. Plural!)' }
    ]
  },
  {
    ref: '5:119',
    arabic: '\u0647\u064E\u0670\u0630\u064E\u0627 \u064A\u064E\u0648\u0652\u0645\u064F \u064A\u064E\u0646\u0641\u064E\u0639\u064F \u0627\u0644\u0635\u0651\u064E\u0627\u062F\u0650\u0642\u0650\u064A\u0646\u064E \u0635\u0650\u062F\u0652\u0642\u064F\u0647\u064F\u0645\u0652',
    words: [
      { word: '\u0647\u064E\u0670\u0630\u064E\u0627', role: 'Mubtada', case: 'Indeklinabel', explanation: 'Demonstrativpronomen als Thema' },
      { word: '\u064A\u064E\u0648\u0652\u0645\u064F', role: 'Khabar', case: 'Nominativ (Raf\')', explanation: 'Prädikat. Damma als Kasuszeichen (Mudaf)' },
      { word: '\u064A\u064E\u0646\u0641\u064E\u0639\u064F', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 3ms, Indikativ' },
      { word: '\u0627\u0644\u0635\u0651\u064E\u0627\u062F\u0650\u0642\u0650\u064A\u0646\u064E', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Objekt. Ya\u02BF als Akkusativzeichen (gesunder mask. Plural)' },
      { word: '\u0635\u0650\u062F\u0652\u0642\u064F\u0647\u064F\u0645\u0652', role: "Faʿil", case: 'Nominativ (Raf\')', explanation: 'Subjekt (nachgestellt). Damma + Suffix' }
    ]
  },
  {
    ref: '59:7',
    arabic: '\u0648\u064E\u0645\u064E\u0627 \u0622\u062A\u064E\u0627\u0643\u064F\u0645\u064F \u0627\u0644\u0631\u0651\u064E\u0633\u064F\u0648\u0644\u064F \u0641\u064E\u062E\u064F\u0630\u064F\u0648\u0647\u064F',
    words: [
      { word: '\u0648\u064E\u0645\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: '\u0648\u064E + \u0645\u064E\u0627 als Relativpronomen (was auch immer)' },
      { word: '\u0622\u062A\u064E\u0627\u0643\u064F\u0645\u064F', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3ms, Form IV, Wurzel \u0623-\u062A-\u064A + Suffix \u0643\u064F\u0645' },
      { word: '\u0627\u0644\u0631\u0651\u064E\u0633\u064F\u0648\u0644\u064F', role: "Faʿil", case: 'Nominativ (Raf\')', explanation: 'Subjekt. Damma als Kasuszeichen' },
      { word: '\u0641\u064E\u062E\u064F\u0630\u064F\u0648\u0647\u064F', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2mp + Suffix \u0647\u064F als Objekt. Jawab ash-Shart' }
    ]
  },
  // === NEUE ÜBUNGEN: Atf (Koordination) ===
  {
    ref: '2:3',
    arabic: '\u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E \u0628\u0650\u0627\u0644\u0652\u063A\u064E\u064A\u0652\u0628\u0650 \u0648\u064E\u064A\u064F\u0642\u0650\u064A\u0645\u064F\u0648\u0646\u064E \u0627\u0644\u0635\u0651\u064E\u0644\u064E\u0627\u0629\u064E',
    words: [
      { word: '\u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 3mp, Form IV, Indikativ. Relativsatz' },
      { word: '\u0628\u0650\u0627\u0644\u0652\u063A\u064E\u064A\u0652\u0628\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Genitiv. An das Verborgene' },
      { word: '\u0648\u064E\u064A\u064F\u0642\u0650\u064A\u0645\u064F\u0648\u0646\u064E', role: "'Atf (Koordination)", case: 'Indeklinabel', explanation: '\u0648\u064E + koordiniertes Verb. Atf auf \u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E. Gleicher Modus (Indikativ)' },
      { word: '\u0627\u0644\u0635\u0651\u064E\u0644\u064E\u0627\u0629\u064E', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt. Fatha' }
    ]
  },
  {
    ref: '2:177',
    arabic: '\u0648\u064E\u0627\u0644\u0646\u0651\u064E\u0628\u0650\u064A\u0651\u0650\u064A\u0646\u064E \u0648\u064E\u0622\u062A\u064E\u0649 \u0627\u0644\u0652\u0645\u064E\u0627\u0644\u064E',
    words: [
      { word: '\u0648\u064E\u0627\u0644\u0646\u0651\u064E\u0628\u0650\u064A\u0651\u0650\u064A\u0646\u064E', role: "'Atf (Koordination)", case: 'Genitiv (Jarr)', explanation: '\u0648\u064E + koordiniertes Nomen. Atf auf vorheriges \u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u0650. Genitiv: -\u064A\u0646\u064E' },
      { word: '\u0648\u064E\u0622\u062A\u064E\u0649', role: "'Atf (Koordination)", case: 'Indeklinabel', explanation: '\u0648\u064E + koordiniertes Verb. Atf auf vorheriges \u0622\u0645\u064E\u0646\u064E' },
      { word: '\u0627\u0644\u0652\u0645\u064E\u0627\u0644\u064E', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt von \u0622\u062A\u064E\u0649. Fatha' }
    ]
  },
  {
    ref: '2:136',
    arabic: '\u0644\u064E\u0627 \u0646\u064F\u0641\u064E\u0631\u0651\u0650\u0642\u064F \u0628\u064E\u064A\u0652\u0646\u064E \u0623\u064E\u062D\u064E\u062F\u064D \u0645\u0650\u0646\u0652\u0647\u064F\u0645\u0652',
    words: [
      { word: '\u0644\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 — einfache Negation' },
      { word: '\u0646\u064F\u0641\u064E\u0631\u0651\u0650\u0642\u064F', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 1pl, Form II, Indikativ mit Damma' },
      { word: '\u0628\u064E\u064A\u0652\u0646\u064E', role: 'Ẓarf Makan', case: 'Akkusativ (Nasb)', explanation: 'Ortsadverb (Ẓarf makan). Akkusativ als Mudaf' },
      { word: '\u0623\u064E\u062D\u064E\u062F\u064D', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Zweites Glied der Iḍāfa. Kasra mit Tanwin' },
      { word: '\u0645\u0650\u0646\u0652\u0647\u064F\u0645\u0652', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Suffix. Von ihnen' }
    ]
  },
  {
    ref: '2:285',
    arabic: '\u0644\u064E\u0627 \u0646\u064F\u0641\u064E\u0631\u0651\u0650\u0642\u064F \u0628\u064E\u064A\u0652\u0646\u064E \u0623\u064E\u062D\u064E\u062F\u064D \u0645\u0650\u0646 \u0631\u064F\u0633\u064F\u0644\u0650\u0647\u0650',
    words: [
      { word: '\u0644\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629' },
      { word: '\u0646\u064F\u0641\u064E\u0631\u0651\u0650\u0642\u064F', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 1pl, Form II, Indikativ' },
      { word: '\u0628\u064E\u064A\u0652\u0646\u064E', role: 'Ẓarf Makan', case: 'Akkusativ (Nasb)', explanation: 'Ẓarf makan im Akkusativ' },
      { word: '\u0623\u064E\u062D\u064E\u062F\u064D', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Iḍāfa. Kasra mit Tanwin' },
      { word: '\u0645\u0650\u0646 \u0631\u064F\u0633\u064F\u0644\u0650\u0647\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: '\u0645\u0650\u0646 + Genitiv. Von seinen Gesandten' }
    ]
  },
  {
    ref: '4:136',
    arabic: '\u0622\u0645\u0650\u0646\u064F\u0648\u0627 \u0628\u0650\u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0648\u064E\u0631\u064E\u0633\u064F\u0648\u0644\u0650\u0647\u0650 \u0648\u064E\u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u0650',
    words: [
      { word: '\u0622\u0645\u0650\u0646\u064F\u0648\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2mp, Form IV, Wurzel \u0623-\u0645-\u0646' },
      { word: '\u0628\u0650\u0627\u0644\u0644\u0651\u064E\u0647\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Genitiv' },
      { word: '\u0648\u064E\u0631\u064E\u0633\u064F\u0648\u0644\u0650\u0647\u0650', role: "'Atf (Koordination)", case: 'Genitiv (Jarr)', explanation: '\u0648\u064E + Atf auf \u0627\u0644\u0644\u0651\u064E\u0647\u0650. Kongruenz im Genitiv (Kasra + Suffix)' },
      { word: '\u0648\u064E\u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u0650', role: "'Atf (Koordination)", case: 'Genitiv (Jarr)', explanation: '\u0648\u064E + Atf auf \u0627\u0644\u0644\u0651\u064E\u0647\u0650. Genitiv mit Kasra' }
    ]
  },
  {
    ref: '2:285',
    arabic: '\u0648\u064E\u0643\u064F\u062A\u064F\u0628\u0650\u0647\u0650 \u0648\u064E\u0631\u064F\u0633\u064F\u0644\u0650\u0647\u0650',
    words: [
      { word: '\u0648\u064E\u0643\u064F\u062A\u064F\u0628\u0650\u0647\u0650', role: "'Atf (Koordination)", case: 'Genitiv (Jarr)', explanation: '\u0648\u064E + koordiniert mit vorherigem Genitiv. Kasra + Suffix' },
      { word: '\u0648\u064E\u0631\u064F\u0633\u064F\u0644\u0650\u0647\u0650', role: "'Atf (Koordination)", case: 'Genitiv (Jarr)', explanation: '\u0648\u064E + koordiniert. Genitiv mit Kasra + Suffix' }
    ]
  },
  // === NEUE ÜBUNGEN: Mustathna (Ausnahme) ===
  {
    ref: '2:249',
    arabic: '\u0641\u064E\u0634\u064E\u0631\u0650\u0628\u064F\u0648\u0627 \u0645\u0650\u0646\u0652\u0647\u064F \u0625\u0650\u0644\u0651\u064E\u0627 \u0642\u064E\u0644\u0650\u064A\u0644\u064B\u0627 \u0645\u0650\u0646\u0652\u0647\u064F\u0645\u0652',
    words: [
      { word: '\u0641\u064E\u0634\u064E\u0631\u0650\u0628\u064F\u0648\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3mp, Wurzel \u0634-\u0631-\u0628' },
      { word: '\u0645\u0650\u0646\u0652\u0647\u064F', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Suffix. Daraus/davon' },
      { word: '\u0625\u0650\u0644\u0651\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Ausnahmepartikel' },
      { word: '\u0642\u064E\u0644\u0650\u064A\u0644\u064B\u0627', role: 'Mustathna (Ausgenommenes)', case: 'Akkusativ (Nasb)', explanation: 'Ausgenommenes (Mustathna). Akkusativ mit Tanwin-Fatha. Vollständige positive Ausnahme' }
    ]
  },
  {
    ref: '4:66',
    arabic: '\u0645\u064E\u0627 \u0641\u064E\u0639\u064E\u0644\u064F\u0648\u0647\u064F \u0625\u0650\u0644\u0651\u064E\u0627 \u0642\u064E\u0644\u0650\u064A\u0644\u064C \u0645\u0650\u0646\u0652\u0647\u064F\u0645\u0652',
    words: [
      { word: '\u0645\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Negationspartikel' },
      { word: '\u0641\u064E\u0639\u064E\u0644\u064F\u0648\u0647\u064F', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3mp + Suffix \u0647\u064F als Objekt' },
      { word: '\u0625\u0650\u0644\u0651\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Ausnahmepartikel' },
      { word: '\u0642\u064E\u0644\u0650\u064A\u0644\u064C', role: 'Mustathna (Ausgenommenes)', case: 'Nominativ (Raf\')', explanation: 'Mustathna in negiertem Satz — Badal-Variante, Nominativ kongruent mit dem Subjekt des Satzes. Damma mit Tanwin' }
    ]
  },
  {
    ref: '17:65',
    arabic: '\u0625\u0650\u0646\u0651\u064E \u0639\u0650\u0628\u064E\u0627\u062F\u0650\u064A \u0644\u064E\u064A\u0652\u0633\u064E \u0644\u064E\u0643\u064E \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652 \u0633\u064F\u0644\u0652\u0637\u064E\u0627\u0646\u064C',
    words: [
      { word: '\u0625\u0650\u0646\u0651\u064E', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Bekräftigungspartikel' },
      { word: '\u0639\u0650\u0628\u064E\u0627\u062F\u0650\u064A', role: 'Ism inna', case: 'Akkusativ (Nasb)', explanation: 'Ism von \u0625\u0650\u0646\u0651\u064E. Fatha (geschätzt, da Mudaf zu \u064A\u0627\u0621 al-Mutakallim)' },
      { word: '\u0644\u064E\u064A\u0652\u0633\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Kopulanegation. Khabar von \u0625\u0650\u0646\u0651\u064E als Satz' },
      { word: '\u0644\u064E\u0643\u064E', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Suffix' },
      { word: '\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Suffix. Über sie' },
      { word: '\u0633\u064F\u0644\u0652\u0637\u064E\u0627\u0646\u064C', role: "Ism kana", case: 'Nominativ (Raf\')', explanation: 'Ism von \u0644\u064E\u064A\u0652\u0633\u064E. Damma mit Tanwin' }
    ]
  },
  {
    ref: '2:83',
    arabic: '\u0644\u064E\u0627 \u062A\u064E\u0639\u0652\u0628\u064F\u062F\u064F\u0648\u0646\u064E \u0625\u0650\u0644\u0651\u064E\u0627 \u0627\u0644\u0644\u0651\u064E\u0647\u064E',
    words: [
      { word: '\u0644\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Negationspartikel' },
      { word: '\u062A\u064E\u0639\u0652\u0628\u064F\u062F\u064F\u0648\u0646\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt 2mp, Indikativ (mit \u0648\u0646\u064E)' },
      { word: '\u0625\u0650\u0644\u0651\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Ausnahmepartikel' },
      { word: '\u0627\u0644\u0644\u0651\u064E\u0647\u064E', role: 'Mustathna (Ausgenommenes)', case: 'Akkusativ (Nasb)', explanation: 'Mustathna nach negiertem Satz. Akkusativ als Mustathna (Ausnahme-Akkusativ). Fatha' }
    ]
  },
  {
    ref: '2:162',
    arabic: '\u062E\u064E\u0627\u0644\u0650\u062F\u0650\u064A\u0646\u064E \u0641\u0650\u064A\u0647\u064E\u0627 \u0644\u064E\u0627 \u064A\u064F\u062E\u064E\u0641\u0651\u064E\u0641\u064F \u0639\u064E\u0646\u0652\u0647\u064F\u0645\u064F \u0627\u0644\u0652\u0639\u064E\u0630\u064E\u0627\u0628\u064F',
    words: [
      { word: '\u062E\u064E\u0627\u0644\u0650\u062F\u0650\u064A\u0646\u064E', role: 'Hal', case: 'Akkusativ (Nasb)', explanation: 'Hal (Zustandsakkusativ). -\u064A\u0646\u064E als Akkusativzeichen (gesunder mask. Plural)' },
      { word: '\u0641\u0650\u064A\u0647\u064E\u0627', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Suffix. Darin' },
      { word: '\u0644\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629' },
      { word: '\u064A\u064F\u062E\u064E\u0641\u0651\u064E\u0641\u064F', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperfekt Passiv 3ms, Form II' },
      { word: '\u0639\u064E\u0646\u0652\u0647\u064F\u0645\u064F', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Suffix' },
      { word: '\u0627\u0644\u0652\u0639\u064E\u0630\u064E\u0627\u0628\u064F', role: "Naʿib al-Faʿil", case: 'Nominativ (Raf\')', explanation: 'Stellvertreter des Subjekts (Passivsubjekt). Damma' }
    ]
  },
  {
    ref: '11:116',
    arabic: '\u0625\u0650\u0644\u0651\u064E\u0627 \u0642\u064E\u0644\u0650\u064A\u0644\u064B\u0627 \u0645\u0650\u0645\u0651\u064E\u0646 \u0623\u064E\u0646\u062C\u064E\u064A\u0652\u0646\u064E\u0627',
    words: [
      { word: '\u0625\u0650\u0644\u0651\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Ausnahmepartikel' },
      { word: '\u0642\u064E\u0644\u0650\u064A\u0644\u064B\u0627', role: 'Mustathna (Ausgenommenes)', case: 'Akkusativ (Nasb)', explanation: 'Ausgenommenes. Akkusativ mit Tanwin-Fatha' },
      { word: '\u0645\u0650\u0645\u0651\u064E\u0646', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: '\u0645\u0650\u0646\u0652 + \u0645\u064E\u0646\u0652 (Relativpronomen)' },
      { word: '\u0623\u064E\u0646\u062C\u064E\u064A\u0652\u0646\u064E\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 1pl, Form IV. Relativsatz' }
    ]
  },
  // === NEUE ÜBUNGEN: Munada (Vokativ) ===
  {
    ref: '7:59',
    arabic: '\u064A\u064E\u0627 \u0642\u064E\u0648\u0652\u0645\u0650 \u0627\u0639\u0652\u0628\u064F\u062F\u064F\u0648\u0627 \u0627\u0644\u0644\u0651\u064E\u0647\u064E',
    words: [
      { word: '\u064A\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Vokativpartikel' },
      { word: '\u0642\u064E\u0648\u0652\u0645\u0650', role: 'Munada', case: 'Akkusativ (Nasb)', explanation: 'Munada Mudaf — Akkusativ. Kasra hier wegen Iḍāfa mit \u064A\u0627\u0621 al-Mutakallim (mein Volk)' },
      { word: '\u0627\u0639\u0652\u0628\u064F\u062F\u064F\u0648\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2mp' },
      { word: '\u0627\u0644\u0644\u0651\u064E\u0647\u064E', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt. Fatha' }
    ]
  },
  {
    ref: '12:29',
    arabic: '\u064A\u064E\u0627 \u064A\u064F\u0648\u0633\u064F\u0641\u064F \u0623\u064E\u0639\u0652\u0631\u0650\u0636\u0652 \u0639\u064E\u0646\u0652 \u0647\u064E\u0670\u0630\u064E\u0627',
    words: [
      { word: '\u064A\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Vokativpartikel' },
      { word: '\u064A\u064F\u0648\u0633\u064F\u0641\u064F', role: 'Munada', case: 'Indeklinabel', explanation: 'Munada Mufrad Ma\u02BFrifa — mabni ala d-Damm. Einzelner bestimmter Name' },
      { word: '\u0623\u064E\u0639\u0652\u0631\u0650\u0636\u0652', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2ms, Form IV, Wurzel \u0639-\u0631-\u0636' },
      { word: '\u0639\u064E\u0646\u0652 \u0647\u064E\u0670\u0630\u064E\u0627', role: 'Majrur', case: 'Indeklinabel', explanation: 'Präposition + Demonstrativpronomen' }
    ]
  },
  {
    ref: '20:92',
    arabic: '\u064A\u064E\u0627 \u0647\u064E\u0627\u0631\u064F\u0648\u0646\u064F \u0645\u064E\u0627 \u0645\u064E\u0646\u064E\u0639\u064E\u0643\u064E',
    words: [
      { word: '\u064A\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Vokativpartikel' },
      { word: '\u0647\u064E\u0627\u0631\u064F\u0648\u0646\u064F', role: 'Munada', case: 'Indeklinabel', explanation: 'Munada Mufrad Ma\u02BFrifa — mabni ala d-Damm' },
      { word: '\u0645\u064E\u0627', role: 'Mubtada', case: 'Indeklinabel', explanation: 'Interrogativpronomen (was). Indeklinabel' },
      { word: '\u0645\u064E\u0646\u064E\u0639\u064E\u0643\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Perfekt 3ms + Suffix \u0643\u064E als Objekt' }
    ]
  },
  {
    ref: '36:20',
    arabic: '\u064A\u064E\u0627 \u0642\u064E\u0648\u0652\u0645\u0650 \u0627\u062A\u0651\u064E\u0628\u0650\u0639\u064F\u0648\u0627 \u0627\u0644\u0652\u0645\u064F\u0631\u0652\u0633\u064E\u0644\u0650\u064A\u0646\u064E',
    words: [
      { word: '\u064A\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Vokativpartikel' },
      { word: '\u0642\u064E\u0648\u0652\u0645\u0650', role: 'Munada', case: 'Akkusativ (Nasb)', explanation: 'Munada Mudaf — Akkusativ (mit Kasra wegen Iḍāfa mit \u064A\u0627\u0621 al-Mutakallim)' },
      { word: '\u0627\u062A\u0651\u064E\u0628\u0650\u0639\u064F\u0648\u0627', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Imperativ 2mp, Form VIII, Wurzel \u062A-\u0628-\u0639' },
      { word: '\u0627\u0644\u0652\u0645\u064F\u0631\u0652\u0633\u064E\u0644\u0650\u064A\u0646\u064E', role: "Mafʿul bihi", case: 'Akkusativ (Nasb)', explanation: 'Direktes Objekt. -\u064A\u0646\u064E als Akkusativzeichen (gesunder mask. Plural)' }
    ]
  },
  {
    ref: '5:116',
    arabic: '\u064A\u064E\u0627 \u0639\u0650\u064A\u0633\u064E\u0649 \u0627\u0628\u0652\u0646\u064E \u0645\u064E\u0631\u0652\u064A\u064E\u0645\u064E',
    words: [
      { word: '\u064A\u064E\u0627', role: 'Harf (Partikel)', case: 'Indeklinabel', explanation: 'Vokativpartikel' },
      { word: '\u0639\u0650\u064A\u0633\u064E\u0649', role: 'Munada', case: 'Indeklinabel', explanation: 'Munada Mufrad Ma\u02BFrifa — mabni ala d-Damm (geschätzt auf Alif Maqsura)' },
      { word: '\u0627\u0628\u0652\u0646\u064E', role: 'Badal', case: 'Akkusativ (Nasb)', explanation: 'Badal (Apposition) oder Na\u02BFt zu \u0639\u0650\u064A\u0633\u064E\u0649. Fatha (dem Lautplatz des Munada folgend)' },
      { word: '\u0645\u064E\u0631\u0652\u064A\u064E\u0645\u064E', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Iḍāfa. Genitiv (Fatha statt Kasra, da diptotisch — fem. Eigenname)' }
    ]
  },
  {
    ref: '11:41',
    arabic: '\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0645\u064E\u062C\u0652\u0631\u064E\u0627\u0647\u064E\u0627 \u0648\u064E\u0645\u064F\u0631\u0652\u0633\u064E\u0627\u0647\u064E\u0627',
    words: [
      { word: '\u0628\u0650\u0633\u0652\u0645\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: '\u0628\u0650 + \u0627\u0633\u0652\u0645 im Genitiv' },
      { word: '\u0627\u0644\u0644\u0651\u064E\u0647\u0650', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Iḍāfa-Konstruktion. Kasra' },
      { word: '\u0645\u064E\u062C\u0652\u0631\u064E\u0627\u0647\u064E\u0627', role: 'Ẓarf', case: 'Akkusativ (Nasb)', explanation: 'Ẓarf (Umstandsangabe): ihr Fahren/Laufen. Akkusativ (Fatha + Suffix)' },
      { word: '\u0648\u064E\u0645\u064F\u0631\u0652\u0633\u064E\u0627\u0647\u064E\u0627', role: "'Atf (Koordination)", case: 'Akkusativ (Nasb)', explanation: '\u0648\u064E + Atf auf \u0645\u064E\u062C\u0652\u0631\u064E\u0627\u0647\u064E\u0627. Koordiniert im Akkusativ' }
    ]
  },
  // === NEUE ÜBUNGEN: Naʿib al-Faʿil (Passivsubjekt) ===
  {
    ref: '2:87',
    arabic: '\u0623\u064F\u064A\u0651\u0650\u062F\u064E \u0628\u0650\u0631\u064F\u0648\u062D\u0650 \u0627\u0644\u0652\u0642\u064F\u062F\u064F\u0633\u0650',
    words: [
      { word: '\u0623\u064F\u064A\u0651\u0650\u062F\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Passiv Perfekt 3ms, Form II, Wurzel \u0623-\u064A-\u062F' },
      { word: '\u0628\u0650\u0631\u064F\u0648\u062D\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Genitiv (Iḍāfa)' },
      { word: '\u0627\u0644\u0652\u0642\u064F\u062F\u064F\u0633\u0650', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Zweites Glied der Iḍāfa. Kasra' }
    ]
  },
  {
    ref: '3:110',
    arabic: '\u0643\u064F\u0646\u062A\u064F\u0645\u0652 \u062E\u064E\u064A\u0652\u0631\u064E \u0623\u064F\u0645\u0651\u064E\u0629\u064D \u0623\u064F\u062E\u0652\u0631\u0650\u062C\u064E\u062A\u0652 \u0644\u0650\u0644\u0646\u0651\u064E\u0627\u0633\u0650',
    words: [
      { word: '\u0643\u064F\u0646\u062A\u064F\u0645\u0652', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: '\u0643\u064E\u0627\u0646\u064E + Suffix \u062A\u064F\u0645\u0652 als Ism (Nominativ)' },
      { word: '\u062E\u064E\u064A\u0652\u0631\u064E', role: 'Khabar kana', case: 'Akkusativ (Nasb)', explanation: 'Khabar von \u0643\u064E\u0627\u0646\u064E. Akkusativ, Fatha (Mudaf)' },
      { word: '\u0623\u064F\u0645\u0651\u064E\u0629\u064D', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Iḍāfa. Kasra mit Tanwin' },
      { word: '\u0623\u064F\u062E\u0652\u0631\u0650\u062C\u064E\u062A\u0652', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Passiv Perfekt 3fs, Form IV' },
      { word: '\u0644\u0650\u0644\u0646\u0651\u064E\u0627\u0633\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Genitiv. Für die Menschen' }
    ]
  },
  {
    ref: '2:185',
    arabic: '\u0623\u064F\u0646\u0632\u0650\u0644\u064E \u0641\u0650\u064A\u0647\u0650 \u0627\u0644\u0652\u0642\u064F\u0631\u0652\u0622\u0646\u064F',
    words: [
      { word: '\u0623\u064F\u0646\u0632\u0650\u0644\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Passiv Perfekt 3ms, Form IV, Wurzel \u0646-\u0632-\u0644' },
      { word: '\u0641\u0650\u064A\u0647\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Suffix. Darin' },
      { word: '\u0627\u0644\u0652\u0642\u064F\u0631\u0652\u0622\u0646\u064F', role: "Naʿib al-Faʿil", case: 'Nominativ (Raf\')', explanation: 'Stellvertreter des Subjekts. Damma als Kasuszeichen. Der Quran wurde herabgesandt' }
    ]
  },
  {
    ref: '3:14',
    arabic: '\u0632\u064F\u064A\u0651\u0650\u0646\u064E \u0644\u0650\u0644\u0646\u0651\u064E\u0627\u0633\u0650 \u062D\u064F\u0628\u0651\u064F \u0627\u0644\u0634\u0651\u064E\u0647\u064E\u0648\u064E\u0627\u062A\u0650',
    words: [
      { word: '\u0632\u064F\u064A\u0651\u0650\u0646\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Passiv Perfekt 3ms, Form II, Wurzel \u0632-\u064A-\u0646' },
      { word: '\u0644\u0650\u0644\u0646\u0651\u064E\u0627\u0633\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Genitiv. Für die Menschen' },
      { word: '\u062D\u064F\u0628\u0651\u064F', role: "Naʿib al-Faʿil", case: 'Nominativ (Raf\')', explanation: 'Stellvertreter des Subjekts. Damma (Mudaf)' },
      { word: '\u0627\u0644\u0634\u0651\u064E\u0647\u064E\u0648\u064E\u0627\u062A\u0650', role: 'Mudaf ilayhi', case: 'Genitiv (Jarr)', explanation: 'Iḍāfa. Kasra' }
    ]
  },
  {
    ref: '39:69',
    arabic: '\u0648\u064E\u0642\u064F\u0636\u0650\u064A\u064E \u0628\u064E\u064A\u0652\u0646\u064E\u0647\u064F\u0645 \u0628\u0650\u0627\u0644\u0652\u062D\u064E\u0642\u0651\u0650',
    words: [
      { word: '\u0648\u064E\u0642\u064F\u0636\u0650\u064A\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Passiv Perfekt 3ms, Wurzel \u0642-\u0636-\u064A' },
      { word: '\u0628\u064E\u064A\u0652\u0646\u064E\u0647\u064F\u0645', role: 'Ẓarf Makan', case: 'Akkusativ (Nasb)', explanation: 'Ortsadverb (Ẓarf makan). Fatha + Suffix. Zwischen ihnen' },
      { word: '\u0628\u0650\u0627\u0644\u0652\u062D\u064E\u0642\u0651\u0650', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Genitiv. Mit der Wahrheit' }
    ]
  },
  {
    ref: '6:93',
    arabic: '\u0623\u064F\u0648\u062D\u0650\u064A\u064E \u0625\u0650\u0644\u064E\u064A\u0651\u064E',
    words: [
      { word: '\u0623\u064F\u0648\u062D\u0650\u064A\u064E', role: "Fi'l (Verb)", case: 'Indeklinabel', explanation: 'Passiv Perfekt 3ms, Form IV, Wurzel \u0648-\u062D-\u064A' },
      { word: '\u0625\u0650\u0644\u064E\u064A\u0651\u064E', role: 'Majrur', case: 'Genitiv (Jarr)', explanation: 'Präposition + Suffix \u064A\u064E (mir). Jar-Majrur als Adverbiale zum passiven Verb' }
    ]
  }
]

const EXERCISES = INLINE_EXERCISES.concat(Array.isArray(irabExtension) ? irabExtension : [])

export default function IrabExercise() {
  const [exIdx, setExIdx] = useState(0)
  const [answers, setAnswers] = useState({})
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [globalScore, setGlobalScore] = useState({ correct: 0, total: 0 })

  const ex = EXERCISES[exIdx]

  function handleSelect(wordIdx, field, value) {
    if (revealed) return
    setAnswers(a => ({ ...a, [`${wordIdx}_${field}`]: value }))
  }

  function check() {
    setRevealed(true)
    let correct = 0
    let total = 0
    ex.words.forEach((w, i) => {
      total += 2
      if (answers[`${i}_role`] === w.role) correct++
      if (answers[`${i}_case`] === w.case) correct++
    })
    setScore({ correct, total })
    setGlobalScore(g => ({ correct: g.correct + correct, total: g.total + total }))
  }

  function next() {
    setExIdx((exIdx + 1) % EXERCISES.length)
    setAnswers({})
    setRevealed(false)
    setScore({ correct: 0, total: 0 })
  }

  if (!ex) return null
  const allAnswered = ex.words.every((_, i) => answers[`${i}_role`] && answers[`${i}_case`])

  return (
    <div style={{ maxWidth: 750, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Vollständiges Irab</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
        Bestimme für jedes Wort die syntaktische Rolle und den Kasus.
      </p>
      {globalScore.total > 0 && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
          Gesamt: {globalScore.correct}/{globalScore.total} korrekt ({Math.round(globalScore.correct / globalScore.total * 100)}%)
        </div>
      )}

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-arabic)', fontSize: '1.8rem', direction: 'rtl', lineHeight: 2.2, marginBottom: 8, color: 'var(--accent-gold)' }}>
          {ex.arabic}
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>{ex.ref}</div>

        {ex.words.map((w, i) => {
          const roleCorrect = revealed && answers[`${i}_role`] === w.role
          const roleFalse = revealed && answers[`${i}_role`] && answers[`${i}_role`] !== w.role
          const caseCorrect = revealed && answers[`${i}_case`] === w.case
          const caseFalse = revealed && answers[`${i}_case`] && answers[`${i}_case`] !== w.case

          return (
            <div key={i} style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, marginBottom: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--accent-teal)', direction: 'rtl', marginBottom: 8 }}>
                {w.word}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Syntaktische Rolle</label>
                  <select
                    value={answers[`${i}_role`] || ''}
                    onChange={e => handleSelect(i, 'role', e.target.value)}
                    disabled={revealed}
                    style={{
                      width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: '0.85rem',
                      border: `1px solid ${roleCorrect ? '#22c55e' : roleFalse ? '#ef4444' : 'var(--border)'}`,
                      background: roleCorrect ? 'rgba(34,197,94,0.1)' : roleFalse ? 'rgba(239,68,68,0.1)' : 'var(--bg)',
                      color: 'var(--text)'
                    }}
                  >
                    <option value="">-- Wähle --</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 2 }}>Kasus</label>
                  <select
                    value={answers[`${i}_case`] || ''}
                    onChange={e => handleSelect(i, 'case', e.target.value)}
                    disabled={revealed}
                    style={{
                      width: '100%', padding: '6px 8px', borderRadius: 6, fontSize: '0.85rem',
                      border: `1px solid ${caseCorrect ? '#22c55e' : caseFalse ? '#ef4444' : 'var(--border)'}`,
                      background: caseCorrect ? 'rgba(34,197,94,0.1)' : caseFalse ? 'rgba(239,68,68,0.1)' : 'var(--bg)',
                      color: 'var(--text)'
                    }}
                  >
                    <option value="">-- Wähle --</option>
                    {CASES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {revealed && (
                <div style={{ marginTop: 8, padding: 8, background: 'var(--card-bg)', borderRadius: 6, fontSize: '0.8rem' }}>
                  <div style={{ color: '#22c55e', fontWeight: 600, marginBottom: 2 }}>
                    {w.role} | {w.case}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{w.explanation}</div>
                </div>
              )}
            </div>
          )
        })}

        {!revealed && (
          <button onClick={check} disabled={!allAnswered} style={{
            marginTop: 12, padding: '10px 28px', borderRadius: 8, border: 'none', width: '100%',
            background: allAnswered ? 'var(--accent-teal)' : 'var(--text-muted)', color: '#fff',
            cursor: allAnswered ? 'pointer' : 'default', fontSize: '0.95rem'
          }}>
            Prüfen ({ex.words.length} Wörter)
          </button>
        )}
        {revealed && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: score.correct === score.total ? '#22c55e' : 'var(--accent-gold)', marginBottom: 8 }}>
              {score.correct}/{score.total} korrekt
            </div>
            <button onClick={next} style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>
              Nächster Vers ({exIdx + 1}/{EXERCISES.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

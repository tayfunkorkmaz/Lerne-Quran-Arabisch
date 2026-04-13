import { useState } from 'react'

const NEGATION_TYPES = [
  { id: 'la', arabic: '\u0644\u064E\u0627', name: '\u0644\u064E\u0627 (allgemein)', effect: 'Keine Modusänderung. Negiert Gegenwart/Zukunft bei Imperfekt, allgemeine Negation bei Nomen' },
  { id: 'la_nahiya', arabic: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629', name: '\u0644\u064E\u0627 (prohibitiv)', effect: 'Löst Jussiv aus. Verbot (2. Person)' },
  { id: 'la_nafiya_jins', arabic: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 \u0644\u0644\u062C\u0646\u0633', name: '\u0644\u064E\u0627 (generisch)', effect: 'Ism im Akkusativ ohne Tanwin (mabni ala l-fath)' },
  { id: 'lam', arabic: '\u0644\u064E\u0645\u0652', name: '\u0644\u064E\u0645\u0652', effect: 'Negiert Vergangenheit, löst Jussiv aus' },
  { id: 'lan', arabic: '\u0644\u064E\u0646\u0652', name: '\u0644\u064E\u0646\u0652', effect: 'Negiert Zukunft, löst Subjunktiv aus' },
  { id: 'ma', arabic: '\u0645\u064E\u0627', name: '\u0645\u064E\u0627', effect: 'Kein Modus-Effekt. Negiert Vergangenheit (mit Perfekt) oder Gegenwart (mit Imperfekt)' },
  { id: 'laysa', arabic: '\u0644\u064E\u064A\u0652\u0633\u064E', name: '\u0644\u064E\u064A\u0652\u0633\u064E', effect: 'Wie kana: Ism Nominativ, Khabar Akkusativ. Negiert Nominalsatz' },
  { id: 'lamma', arabic: '\u0644\u064E\u0645\u0651\u064E\u0627', name: '\u0644\u064E\u0645\u0651\u064E\u0627', effect: '"Noch nicht". Wie \u0644\u064E\u0645\u0652: Jussiv. Impliziert Erwartung' },
  { id: 'in', arabic: '\u0625\u0650\u0646\u0652', name: '\u0625\u0650\u0646\u0652 (negierend)', effect: 'Schwache Negation ("nicht"). Kein Modus-Effekt' },
]

const EXERCISES = [
  { ref: '1:7', arabic: '\u063A\u064E\u064A\u0652\u0631\u0650 \u0627\u0644\u0652\u0645\u064E\u063A\u0652\u0636\u064F\u0648\u0628\u0650 \u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652 \u0648\u064E\u0644\u064E\u0627 \u0627\u0644\u0636\u0651\u064E\u0627\u0644\u0651\u0650\u064A\u0646\u064E', particle: '\u0648\u064E\u0644\u064E\u0627', type: 'la', grammaticalEffect: 'Keine Modusänderung. \u0644\u064E\u0627 negiert das Nomen \u0627\u0644\u0636\u0651\u064E\u0627\u0644\u0651\u0650\u064A\u0646\u064E als Atf (Koordination) zu \u0627\u0644\u0652\u0645\u064E\u063A\u0652\u0636\u064F\u0648\u0628\u0650', explanation: '\u0644\u064E\u0627 hier negiert einfach das koordinierte Nomen. Kein Verb, daher kein Modus-Effekt.' },
  { ref: '2:2', arabic: '\u0644\u064E\u0627 \u0631\u064E\u064A\u0652\u0628\u064E \u0641\u0650\u064A\u0647\u0650', particle: '\u0644\u064E\u0627', type: 'la_nafiya_jins', grammaticalEffect: '\u0631\u064E\u064A\u0652\u0628\u064E ist Ism von \u0644\u064E\u0627 — Akkusativ ohne Tanwin (mabni ala l-fath)', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 \u0644\u0644\u062C\u0646\u0633 — negiert die gesamte Gattung. Das Ism steht im Akkusativ ohne Nunation.' },
  { ref: '2:255', arabic: '\u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E \u0625\u0650\u0644\u0651\u064E\u0627 \u0647\u064F\u0648\u064E', particle: '\u0644\u064E\u0627', type: 'la_nafiya_jins', grammaticalEffect: '\u0625\u0650\u0644\u064E\u0670\u0647\u064E ist Ism — Akkusativ ohne Tanwin', explanation: '\u0644\u064E\u0627 \u0625\u0650\u0644\u064E\u0670\u0647\u064E — generische Negation. Keine Gottheit (als Gattung). Fatha ohne Tanwin.' },
  { ref: '112:3', arabic: '\u0644\u064E\u0645\u0652 \u064A\u064E\u0644\u0650\u062F\u0652 \u0648\u064E\u0644\u064E\u0645\u0652 \u064A\u064F\u0648\u0644\u064E\u062F\u0652', particle: '\u0644\u064E\u0645\u0652', type: 'lam', grammaticalEffect: 'Jussiv: \u064A\u064E\u0644\u0650\u062F\u0652 (Sukun), \u064A\u064F\u0648\u0644\u064E\u062F\u0652 (Sukun)', explanation: '\u0644\u064E\u0645\u0652 negiert die Vergangenheit und löst Jussiv aus. Beide Verben enden auf Sukun.' },
  { ref: '2:24', arabic: '\u0641\u064E\u0625\u0650\u0646 \u0644\u064E\u0645\u0652 \u062A\u064E\u0641\u0652\u0639\u064E\u0644\u064F\u0648\u0627 \u0648\u064E\u0644\u064E\u0646 \u062A\u064E\u0641\u0652\u0639\u064E\u0644\u064F\u0648\u0627', particle: '\u0644\u064E\u0645\u0652', type: 'lam', grammaticalEffect: '\u0644\u064E\u0645\u0652: Jussiv (Nun fällt weg)', explanation: '\u0644\u064E\u0645\u0652 negiert die Vergangenheit und löst Jussiv aus. Beachte: Derselbe Vers enthält auch \u0644\u064E\u0646\u0652 (Zukunft, Subjunktiv). Beide bewirken Nun-Wegfall bei den fünf Verben, aber aus verschiedenen Gründen.' },
  { ref: '3:169', arabic: '\u0648\u064E\u0644\u064E\u0627 \u062A\u064E\u062D\u0652\u0633\u064E\u0628\u064E\u0646\u0651\u064E', particle: '\u0644\u064E\u0627', type: 'la_nahiya', grammaticalEffect: 'Jussiv (Verbot). Die Form ist hier unklar wegen des Energetischen Nun', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 — Verbot. Eigentlich Jussiv, aber durch das Energetische Nun (\u0646\u0651\u064E) sieht die Form anders aus.' },
  { ref: '6:151', arabic: '\u0644\u064E\u0627 \u062A\u064E\u0642\u0652\u062A\u064F\u0644\u064F\u0648\u0627 \u0623\u064E\u0648\u0652\u0644\u064E\u0627\u062F\u064E\u0643\u064F\u0645\u0652', particle: '\u0644\u064E\u0627', type: 'la_nahiya', grammaticalEffect: 'Jussiv: \u062A\u064E\u0642\u0652\u062A\u064F\u0644\u064F\u0648\u0627 (Nun fällt weg = Jussiv)', explanation: '\u0644\u064E\u0627 + 2. Person = Verbot. Jussiv bei den fünf Verben: Nun fällt weg.' },
  { ref: '2:120', arabic: '\u0648\u064E\u0644\u064E\u0646 \u062A\u064E\u0631\u0652\u0636\u064E\u0649', particle: '\u0644\u064E\u0646\u0652', type: 'lan', grammaticalEffect: 'Subjunktiv: \u062A\u064E\u0631\u0652\u0636\u064E\u0649 (defektes Verb — Alif maqsura in Pausalform)', explanation: '\u0644\u064E\u0646\u0652 negiert die Zukunft und löst Subjunktiv aus. Bei defekten Verben: Alif verschwindet im Subjunktiv (theoretisch), aber in Pausalform bleibt es.' },
  { ref: '2:17', arabic: '\u0645\u064E\u0627 \u0643\u064E\u0627\u0646\u064F\u0648\u0627 \u064A\u064F\u0628\u0652\u0635\u0650\u0631\u064F\u0648\u0646\u064E', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Kein Modus-Effekt. \u0643\u064E\u0627\u0646\u064F\u0648\u0627 im Perfekt, \u064A\u064F\u0628\u0652\u0635\u0650\u0631\u064F\u0648\u0646\u064E im Indikativ', explanation: '\u0645\u064E\u0627 negiert ohne Modusänderung. Das Imperfekt \u064A\u064F\u0628\u0652\u0635\u0650\u0631\u064F\u0648\u0646\u064E bleibt im Indikativ (\u0648\u0646\u064E).' },
  { ref: '2:8', arabic: '\u0648\u064E\u0645\u064E\u0627 \u0647\u064F\u0645 \u0628\u0650\u0645\u064F\u0624\u0652\u0645\u0650\u0646\u0650\u064A\u0646\u064E', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert den Nominalsatz. Kein Kasus-Effekt (\u0645\u064E\u0627 \u0627\u0644\u062D\u062C\u0627\u0632\u064A\u0629 würde Akkusativ am Khabar auslösen)', explanation: '\u0645\u064E\u0627 hier als einfache Negation des Nominalsatzes. In der Hijazi-Variante könnte \u0645\u064E\u0627 wie \u0644\u064E\u064A\u0652\u0633\u064E wirken (Khabar im Akkusativ).' },
  { ref: '36:7', arabic: '\u0644\u064E\u0642\u064E\u062F\u0652 \u062D\u064E\u0642\u0651\u064E \u0627\u0644\u0652\u0642\u064E\u0648\u0652\u0644\u064F \u0639\u064E\u0644\u064E\u0649\u0670 \u0623\u064E\u0643\u0652\u062B\u064E\u0631\u0650\u0647\u0650\u0645\u0652 \u0641\u064E\u0647\u064F\u0645\u0652 \u0644\u064E\u0627 \u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E', particle: '\u0644\u064E\u0627', type: 'la', grammaticalEffect: '\u0644\u064E\u0627 negiert einfach. Indikativ bleibt: \u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E (\u0648\u0646\u064E)', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 (einfache Negation). Das Verb bleibt im Indikativ.' },
  { ref: '36:10', arabic: '\u0644\u064E\u0627 \u064A\u064F\u0624\u0652\u0645\u0650\u0646\u064F\u0648\u0646\u064E', particle: '\u0644\u064E\u0627', type: 'la', grammaticalEffect: 'Einfache Negation, Indikativ', explanation: '\u0644\u064E\u0627 + Indikativ = einfache Feststellung. Keine Modusänderung.' },
  { ref: '3:78', arabic: '\u0648\u064E\u0645\u064E\u0627 \u0647\u064F\u0648\u064E \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u0650', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert den Nominalsatz. Kein Kasus-Effekt', explanation: '\u0645\u064E\u0627 als einfache Negation eines Nominalsatzes.' },
  { ref: '2:102', arabic: '\u0648\u064E\u0645\u064E\u0627 \u0643\u064E\u0641\u064E\u0631\u064E \u0633\u064F\u0644\u064E\u064A\u0652\u0645\u064E\u0627\u0646\u064F', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert Perfekt — kein Modus-Effekt', explanation: '\u0645\u064E\u0627 negiert ein Perfektverb. Keine Modusänderung (Perfekt hat keinen Modus).' },
  { ref: '3:182', arabic: '\u0648\u064E\u0645\u064E\u0627 \u0627\u0644\u0644\u0651\u064E\u0647\u064F \u0628\u0650\u0638\u064E\u0644\u0651\u064E\u0627\u0645\u064D \u0644\u0650\u0644\u0652\u0639\u064E\u0628\u0650\u064A\u062F\u0650', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert Nominalsatz. \u0628\u0650\u0638\u064E\u0644\u0651\u064E\u0627\u0645\u064D bleibt im Genitiv (nach \u0628\u0650)', explanation: 'Hier ist \u0645\u064E\u0627 einfache Negation, nicht \u0645\u064E\u0627 \u0627\u0644\u062D\u062C\u0627\u0632\u064A\u0629. Daher kein Akkusativ am Khabar.' },
  { ref: '2:96', arabic: '\u0648\u064E\u0645\u064E\u0627 \u0647\u064F\u0648\u064E \u0628\u0650\u0645\u064F\u0632\u064E\u062D\u0652\u0632\u0650\u062D\u0650\u0647\u0650', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert Nominalsatz', explanation: '\u0645\u064E\u0627 negiert. Das \u0628\u0650 vor dem Khabar ist zaaid (expletiv/verstärkend).' },
  // === NEUE ÜBUNGEN: لا (einfache Negation) ===
  { ref: '2:48', arabic: '\u0644\u064E\u0627 \u062A\u064E\u062C\u0652\u0632\u0650\u064A \u0646\u064E\u0641\u0652\u0633\u064C \u0639\u064E\u0646 \u0646\u064E\u0641\u0652\u0633\u064D \u0634\u064E\u064A\u0652\u0626\u064B\u0627', particle: '\u0644\u064E\u0627', type: 'la', grammaticalEffect: 'Einfache Negation. Indikativ: \u062A\u064E\u062C\u0652\u0632\u0650\u064A (\u064A als Indikativ-Marker bei defektem Verb)', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 — einfache Negation. Das Verb bleibt im Indikativ.' },
  { ref: '2:123', arabic: '\u0644\u064E\u0627 \u062A\u064E\u062C\u0652\u0632\u0650\u064A \u0646\u064E\u0641\u0652\u0633\u064C \u0639\u064E\u0646 \u0646\u064E\u0641\u0652\u0633\u064D \u0634\u064E\u064A\u0652\u0626\u064B\u0627', particle: '\u0644\u064E\u0627', type: 'la', grammaticalEffect: 'Einfache Negation des Imperfekts', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 — negiert die Zukunft/Gegenwart. Kein Modus-Effekt.' },
  { ref: '2:254', arabic: '\u0644\u064E\u0627 \u0628\u064E\u064A\u0652\u0639\u064E \u0641\u0650\u064A\u0647\u0650 \u0648\u064E\u0644\u064E\u0627 \u062E\u064F\u0644\u0651\u064E\u0629\u064E', particle: '\u0644\u064E\u0627', type: 'la_nafiya_jins', grammaticalEffect: '\u0628\u064E\u064A\u0652\u0639\u064E ist Ism von \u0644\u064E\u0627 — Akkusativ ohne Tanwin (mabni ala l-fath)', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 \u0644\u0644\u062C\u0646\u0633 — negiert die gesamte Gattung: kein Handel.' },
  { ref: '14:42', arabic: '\u0648\u064E\u0644\u064E\u0627 \u062A\u064E\u062D\u0652\u0633\u064E\u0628\u064E\u0646\u0651\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064E \u063A\u064E\u0627\u0641\u0650\u0644\u064B\u0627', particle: '\u0644\u064E\u0627', type: 'la_nahiya', grammaticalEffect: 'Jussiv (Verbot). Mit Energetischem Nun', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 — Verbot an 2. Person. Das \u0646\u0651\u064E am Ende ist Energetisches Nun.' },
  { ref: '31:13', arabic: '\u064A\u064E\u0627 \u0628\u064F\u0646\u064E\u064A\u0651\u064E \u0644\u064E\u0627 \u062A\u064F\u0634\u0652\u0631\u0650\u0643\u0652', particle: '\u0644\u064E\u0627', type: 'la_nahiya', grammaticalEffect: 'Jussiv: \u062A\u064F\u0634\u0652\u0631\u0650\u0643\u0652 (Sukun als Jussiv-Marker)', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 — Verbot. Jussiv mit Sukun am Ende.' },
  { ref: '4:36', arabic: '\u0648\u064E\u0644\u064E\u0627 \u062A\u064F\u0634\u0652\u0631\u0650\u0643\u064F\u0648\u0627 \u0628\u0650\u0647\u0650 \u0634\u064E\u064A\u0652\u0626\u064B\u0627', particle: '\u0644\u064E\u0627', type: 'la_nahiya', grammaticalEffect: 'Jussiv: \u062A\u064F\u0634\u0652\u0631\u0650\u0643\u064F\u0648\u0627 (Nun-Wegfall als Jussiv-Marker)', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0647\u064A\u0629 — Verbot. Bei den fünf Verben: Nun fällt weg.' },
  // === NEUE ÜBUNGEN: ما (Negation) ===
  { ref: '3:161', arabic: '\u0648\u064E\u0645\u064E\u0627 \u0643\u064E\u0627\u0646\u064E \u0644\u0650\u0646\u064E\u0628\u0650\u064A\u0651\u064D \u0623\u064E\u0646 \u064A\u064E\u063A\u064F\u0644\u0651\u064E', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert Perfekt — kein Modus-Effekt', explanation: '\u0645\u064E\u0627 negiert das Perfektverb \u0643\u064E\u0627\u0646\u064E. Keine Modusänderung.' },
  { ref: '5:75', arabic: '\u0645\u064E\u0627 \u0627\u0644\u0652\u0645\u064E\u0633\u0650\u064A\u062D\u064F \u0627\u0628\u0652\u0646\u064F \u0645\u064E\u0631\u0652\u064A\u064E\u0645\u064E \u0625\u0650\u0644\u0651\u064E\u0627 \u0631\u064E\u0633\u064F\u0648\u0644\u064C', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert Nominalsatz. Kein Kasus-Effekt', explanation: '\u0645\u064E\u0627 als einfache Negation eines Nominalsatzes. Al-Masih ist nichts als ein Gesandter.' },
  { ref: '4:79', arabic: '\u0645\u064E\u0627 \u0623\u064E\u0635\u064E\u0627\u0628\u064E\u0643\u064E \u0645\u0650\u0646\u0652 \u062D\u064E\u0633\u064E\u0646\u064E\u0629\u064D', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert Perfekt — kein Modus-Effekt', explanation: '\u0645\u064E\u0627 negiert ein Perfektverb. \u0645\u064E\u0627 hier ist Bedingungspartikel oder Negation, je nach Lesart.' },
  { ref: '59:9', arabic: '\u0648\u064E\u0644\u064E\u0627 \u064A\u064E\u062C\u0650\u062F\u064F\u0648\u0646\u064E \u0641\u0650\u064A \u0635\u064F\u062F\u064F\u0648\u0631\u0650\u0647\u0650\u0645\u0652 \u062D\u064E\u0627\u062C\u064E\u0629\u064B', particle: '\u0644\u064E\u0627', type: 'la', grammaticalEffect: 'Einfache Negation. Indikativ: \u064A\u064E\u062C\u0650\u062F\u064F\u0648\u0646\u064E (\u0648\u0646\u064E)', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 — einfache Negation. Indikativ mit \u0648\u0646\u064E.' },
  { ref: '18:49', arabic: '\u0648\u064E\u0645\u064E\u0627 \u064A\u064E\u0638\u0652\u0644\u0650\u0645\u064F \u0631\u064E\u0628\u0651\u064F\u0643\u064E \u0623\u064E\u062D\u064E\u062F\u064B\u0627', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert Imperfekt. Kein Modus-Effekt. Indikativ: \u064A\u064E\u0638\u0652\u0644\u0650\u0645\u064F', explanation: '\u0645\u064E\u0627 negiert ohne Modusänderung. Das Imperfekt bleibt im Indikativ.' },
  { ref: '41:46', arabic: '\u0648\u064E\u0645\u064E\u0627 \u0631\u064E\u0628\u0651\u064F\u0643\u064E \u0628\u0650\u0638\u064E\u0644\u0651\u064E\u0627\u0645\u064D \u0644\u0650\u0644\u0652\u0639\u064E\u0628\u0650\u064A\u062F\u0650', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert Nominalsatz. \u0628\u0650\u0638\u064E\u0644\u0651\u064E\u0627\u0645\u064D bleibt im Genitiv (nach \u0628\u0650)', explanation: '\u0645\u064E\u0627 als einfache Negation des Nominalsatzes. Das \u0628\u0650 ist expletiv/verstärkend.' },
  // === NEUE ÜBUNGEN: لم (Vergangenheitsnegation + Jussiv) ===
  { ref: '19:20', arabic: '\u0648\u064E\u0644\u064E\u0645\u0652 \u0623\u064E\u0643\u064F \u0628\u064E\u063A\u0650\u064A\u0651\u064B\u0627', particle: '\u0644\u064E\u0645\u0652', type: 'lam', grammaticalEffect: 'Jussiv: \u0623\u064E\u0643\u064F (hohles Verb, Kurzform)', explanation: '\u0644\u064E\u0645\u0652 + Jussiv. Hohles Verb \u0643\u064E\u0627\u0646\u064E — im Jussiv wird der Langvokal getilgt: \u0623\u064E\u0643\u064F.' },
  { ref: '93:3', arabic: '\u0645\u064E\u0627 \u0648\u064E\u062F\u0651\u064E\u0639\u064E\u0643\u064E \u0631\u064E\u0628\u0651\u064F\u0643\u064E \u0648\u064E\u0645\u064E\u0627 \u0642\u064E\u0644\u064E\u0649', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert Perfekt — kein Modus-Effekt', explanation: '\u0645\u064E\u0627 negiert Perfektverb \u0648\u064E\u062F\u0651\u064E\u0639\u064E\u0643\u064E. Keine Modusänderung.' },
  { ref: '18:60', arabic: '\u0644\u064E\u0627 \u0623\u064E\u0628\u0652\u0631\u064E\u062D\u064F \u062D\u064E\u062A\u0651\u064E\u0649\u0670 \u0623\u064E\u0628\u0652\u0644\u064F\u063A\u064E', particle: '\u0644\u064E\u0627', type: 'la', grammaticalEffect: 'Einfache Negation. Indikativ: \u0623\u064E\u0628\u0652\u0631\u064E\u062D\u064F (Damma)', explanation: '\u0644\u064E\u0627 hier ist einfache Negation (ich höre nicht auf). Indikativ bleibt.' },
  { ref: '19:26', arabic: '\u0644\u064E\u0646\u0652 \u0623\u064F\u0643\u064E\u0644\u0651\u0650\u0645\u064E \u0627\u0644\u0652\u064A\u064E\u0648\u0652\u0645\u064E \u0625\u0650\u0646\u0633\u0650\u064A\u0651\u064B\u0627', particle: '\u0644\u064E\u0646\u0652', type: 'lan', grammaticalEffect: 'Subjunktiv: \u0623\u064F\u0643\u064E\u0644\u0651\u0650\u0645\u064E (Fatha)', explanation: '\u0644\u064E\u0646\u0652 löst Subjunktiv aus. Fatha am Ende des Verbs.' },
  // === NEUE ÜBUNGEN: لن (Zukunftsnegation + Subjunktiv) ===
  { ref: '7:143', arabic: '\u0644\u064E\u0646 \u062A\u064E\u0631\u064E\u0627\u0646\u0650\u064A', particle: '\u0644\u064E\u0646\u0652', type: 'lan', grammaticalEffect: 'Subjunktiv: \u062A\u064E\u0631\u064E\u0627\u0646\u0650\u064A (defektes Verb)', explanation: '\u0644\u064E\u0646\u0652 negiert die Zukunft. Subjunktiv bei defektem Verb.' },
  { ref: '18:48', arabic: '\u0644\u064E\u0646 \u0646\u064F\u063A\u064E\u0627\u062F\u0650\u0631\u064E \u0645\u0650\u0646\u0652\u0647\u064F\u0645\u0652 \u0623\u064E\u062D\u064E\u062F\u064B\u0627', particle: '\u0644\u064E\u0646\u0652', type: 'lan', grammaticalEffect: 'Subjunktiv: \u0646\u064F\u063A\u064E\u0627\u062F\u0650\u0631\u064E (Fatha)', explanation: '\u0644\u064E\u0646\u0652 + Subjunktiv. Form III mit Fatha.' },
  { ref: '3:92', arabic: '\u0644\u064E\u0646 \u062A\u064E\u0646\u064E\u0627\u0644\u064F\u0648\u0627 \u0627\u0644\u0652\u0628\u0650\u0631\u0651\u064E', particle: '\u0644\u064E\u0646\u0652', type: 'lan', grammaticalEffect: 'Subjunktiv: \u062A\u064E\u0646\u064E\u0627\u0644\u064F\u0648\u0627 (Nun-Wegfall)', explanation: '\u0644\u064E\u0646\u0652 + Subjunktiv. Bei den fünf Verben: Nun fällt weg.' },
  // === NEUE ÜBUNGEN: ليس (kopulare Negation) ===
  { ref: '2:177', arabic: '\u0644\u064E\u064A\u0652\u0633\u064E \u0627\u0644\u0652\u0628\u0650\u0631\u0651\u064E \u0623\u064E\u0646 \u062A\u064F\u0648\u064E\u0644\u0651\u064F\u0648\u0627 \u0648\u064F\u062C\u064F\u0648\u0647\u064E\u0643\u064F\u0645\u0652', particle: '\u0644\u064E\u064A\u0652\u0633\u064E', type: 'laysa', grammaticalEffect: 'Ism Nominativ, Khabar Akkusativ. \u0627\u0644\u0652\u0628\u0650\u0631\u0651\u064E Khabar (Akkusativ) oder Ism (je nach Lesart)', explanation: '\u0644\u064E\u064A\u0652\u0633\u064E negiert den Nominalsatz. Ism im Nominativ, Khabar im Akkusativ.' },
  { ref: '4:78', arabic: '\u0648\u064E\u0645\u064E\u0627 \u0647\u064F\u0648\u064E \u0645\u0650\u0646\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u0650', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Negiert Nominalsatz', explanation: '\u0645\u064E\u0627 negiert den Nominalsatz. Hier funktioniert \u0645\u064E\u0627 ohne Kasus-Effekt (nicht hijazisch).' },
  { ref: '3:78', arabic: '\u0648\u064E\u0645\u064E\u0627 \u0647\u064F\u0648\u064E \u0645\u0650\u0646\u064E \u0627\u0644\u0652\u0643\u0650\u062A\u064E\u0627\u0628\u0650 \u0648\u064E\u0645\u064E\u0627 \u0647\u064F\u0648\u064E \u0645\u0650\u0646\u0652 \u0639\u0650\u0646\u062F\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650', particle: '\u0645\u064E\u0627', type: 'ma', grammaticalEffect: 'Zweifache Negation des Nominalsatzes', explanation: '\u0645\u064E\u0627 negiert zweimal: nicht aus dem Buch und nicht von Gott.' },
  { ref: '2:197', arabic: '\u0641\u064E\u0644\u064E\u0627 \u0631\u064E\u0641\u064E\u062B\u064E \u0648\u064E\u0644\u064E\u0627 \u0641\u064F\u0633\u064F\u0648\u0642\u064E', particle: '\u0644\u064E\u0627', type: 'la_nafiya_jins', grammaticalEffect: '\u0631\u064E\u0641\u064E\u062B\u064E ist Ism von \u0644\u064E\u0627 — Akkusativ ohne Tanwin', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 \u0644\u0644\u062C\u0646\u0633 — kein rafath, kein fusuq.' },
  { ref: '31:18', arabic: '\u0625\u0650\u0646\u0651\u064E \u0627\u0644\u0644\u0651\u064E\u0647\u064E \u0644\u064E\u0627 \u064A\u064F\u062D\u0650\u0628\u0651\u064F \u0643\u064F\u0644\u0651\u064E \u0645\u064F\u062E\u0652\u062A\u064E\u0627\u0644\u064D', particle: '\u0644\u064E\u0627', type: 'la', grammaticalEffect: 'Einfache Negation. Indikativ: \u064A\u064F\u062D\u0650\u0628\u0651\u064F (Damma)', explanation: '\u0644\u064E\u0627 \u0627\u0644\u0646\u0627\u0641\u064A\u0629 — einfache Negation im Khabar von \u0625\u0650\u0646\u0651\u064E.' },
]

export default function NegationDrill() {
  const [idx, setIdx] = useState(0)
  const [mode, setMode] = useState('learn') // 'learn' | 'drill'
  const [selectedType, setSelectedType] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const ex = EXERCISES[idx]
  if (!ex) return null

  function check() {
    setRevealed(true)
    setScore(s => ({ correct: s.correct + (selectedType === ex.type ? 1 : 0), total: s.total + 1 }))
  }

  function next() {
    setIdx((idx + 1) % EXERCISES.length)
    setSelectedType('')
    setRevealed(false)
  }

  if (mode === 'learn') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Negations-Drill</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setMode('learn')} style={{ padding: '6px 16px', borderRadius: 6, border: '2px solid var(--accent-teal)', background: 'rgba(45,212,191,0.1)', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }}>Lernen</button>
          <button onClick={() => setMode('drill')} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Drill</button>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>Die Negationspartikeln des Arabischen und ihre syntaktischen Auswirkungen.</p>
        {NEGATION_TYPES.map(n => (
          <div key={n.id} style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 16, marginBottom: 8, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.4rem', color: 'var(--accent-gold)', direction: 'rtl' }}>{n.arabic}</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{n.name}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{n.effect}</div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Negations-Drill</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setMode('learn')} style={{ padding: '6px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Lernen</button>
        <button onClick={() => setMode('drill')} style={{ padding: '6px 16px', borderRadius: 6, border: '2px solid var(--accent-teal)', background: 'rgba(45,212,191,0.1)', color: 'var(--accent-teal)', cursor: 'pointer', fontWeight: 600 }}>Drill</button>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>Bestimme den Typ der Negationspartikel und ihren grammatischen Effekt.</p>
      {score.total > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{score.correct}/{score.total} korrekt</div>}

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{ex.ref}</div>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.5rem', color: 'var(--text)', direction: 'rtl', lineHeight: 2 }}>{ex.arabic}</div>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '1.3rem', color: 'var(--accent-gold)', direction: 'rtl', marginTop: 8 }}>
            Partikel: {ex.particle}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Welcher Negationstyp?</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {NEGATION_TYPES.map(n => (
              <button key={n.id} onClick={() => !revealed && setSelectedType(n.id)} style={{
                padding: '10px 14px', borderRadius: 8, textAlign: 'left', cursor: revealed ? 'default' : 'pointer',
                border: selectedType === n.id ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
                background: revealed ? (n.id === ex.type ? 'rgba(34,197,94,0.15)' : selectedType === n.id ? 'rgba(239,68,68,0.15)' : 'var(--bg)') : (selectedType === n.id ? 'rgba(45,212,191,0.1)' : 'var(--bg)'),
                color: 'var(--text)', fontSize: '0.9rem'
              }}>
                <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl', marginRight: 8 }}>{n.arabic}</span>
                {n.name}
              </button>
            ))}
          </div>
        </div>

        {!revealed && <button onClick={check} disabled={!selectedType} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: selectedType ? 'var(--accent-teal)' : 'var(--text-muted)', color: '#fff', cursor: selectedType ? 'pointer' : 'default', width: '100%' }}>Prüfen</button>}

        {revealed && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>{NEGATION_TYPES.find(n => n.id === ex.type)?.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', marginBottom: 4 }}>{ex.grammaticalEffect}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</div>
            <button onClick={next} style={{ marginTop: 12, padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>Weiter ({idx + 1}/{EXERCISES.length})</button>
          </div>
        )}
      </div>
    </div>
  )
}

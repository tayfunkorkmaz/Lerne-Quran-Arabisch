import { useState } from 'react'

const EXERCISES = [
  // Am Verb
  { word: '\u0623\u064E\u0646\u0632\u064E\u0644\u0652\u0646\u064E\u0627\u0647\u064F', suffix: '\u0647\u064F', person: '3ms', function: 'Objekt am Verb', base: '\u0623\u064E\u0646\u0632\u064E\u0644\u0652\u0646\u064E\u0627 (wir sandten herab)', ref: '12:2', explanation: 'Suffix \u0647\u064F (ihn/es) als direktes Objekt. Wir sandten es herab.' },
  { word: '\u062E\u064E\u0644\u064E\u0642\u064E\u0643\u064F\u0645\u0652', suffix: '\u0643\u064F\u0645\u0652', person: '2mp', function: 'Objekt am Verb', base: '\u062E\u064E\u0644\u064E\u0642\u064E (er erschuf)', ref: '2:21', explanation: 'Suffix \u0643\u064F\u0645\u0652 (euch) als Objekt. Er erschuf euch.' },
  { word: '\u064A\u064E\u0639\u0652\u0628\u064F\u062F\u064F\u0648\u0646\u064E\u0647\u064F', suffix: '\u0647\u064F', person: '3ms', function: 'Objekt am Verb', base: '\u064A\u064E\u0639\u0652\u0628\u064F\u062F\u064F\u0648\u0646\u064E (sie dienen)', ref: '106:3', explanation: 'Suffix \u0647\u064F (ihm) als Objekt. Sie dienen ihm.' },
  { word: '\u0647\u064E\u062F\u064E\u0627\u0646\u064E\u0627', suffix: '\u0646\u064E\u0627', person: '1p', function: 'Objekt am Verb', base: '\u0647\u064E\u062F\u064E\u0649 (er leitete recht)', ref: '7:43', explanation: 'Suffix \u0646\u064E\u0627 (uns) als Objekt. Er leitete uns recht.' },
  { word: '\u0623\u064E\u0631\u0652\u0633\u064E\u0644\u0652\u0646\u064E\u0627\u0643\u064E', suffix: '\u0643\u064E', person: '2ms', function: 'Objekt am Verb', base: '\u0623\u064E\u0631\u0652\u0633\u064E\u0644\u0652\u0646\u064E\u0627 (wir sandten)', ref: '33:45', explanation: 'Suffix \u0643\u064E (dich) als Objekt. Wir sandten dich.' },
  { word: '\u064A\u064E\u0647\u0652\u062F\u0650\u064A\u0647\u0650\u0645\u0652', suffix: '\u0647\u0650\u0645\u0652', person: '3mp', function: 'Objekt am Verb', base: '\u064A\u064E\u0647\u0652\u062F\u0650\u064A (er leitet recht)', ref: '10:9', explanation: 'Suffix \u0647\u0650\u0645\u0652 (sie/ihnen) als Objekt. Er leitet sie recht.' },
  // Am Nomen (Possessiv)
  { word: '\u0631\u064E\u0628\u0651\u0650\u0647\u0650\u0645\u0652', suffix: '\u0647\u0650\u0645\u0652', person: '3mp', function: 'Possessiv am Nomen', base: '\u0631\u064E\u0628\u0651 (Herr)', ref: '2:5', explanation: 'Suffix \u0647\u0650\u0645\u0652 (ihr) als Besitzer. Ihr Herr.' },
  { word: '\u0643\u0650\u062A\u064E\u0627\u0628\u064E\u0647\u064F', suffix: '\u0647\u064F', person: '3ms', function: 'Possessiv am Nomen', base: '\u0643\u0650\u062A\u064E\u0627\u0628 (Buch/Schrift)', ref: '69:19', explanation: 'Suffix \u0647\u064F (sein) als Besitzer. Sein Buch.' },
  { word: '\u0623\u064E\u064A\u0652\u062F\u0650\u064A\u0643\u064F\u0645\u0652', suffix: '\u0643\u064F\u0645\u0652', person: '2mp', function: 'Possessiv am Nomen', base: '\u0623\u064E\u064A\u0652\u062F\u0650\u064A (Hände)', ref: '5:11', explanation: 'Suffix \u0643\u064F\u0645\u0652 (eure) als Besitzer. Eure Hände.' },
  { word: '\u0642\u064E\u0644\u0652\u0628\u0650\u064A', suffix: '\u064A', person: '1s', function: 'Possessiv am Nomen', base: '\u0642\u064E\u0644\u0652\u0628 (Herz)', ref: '26:89', explanation: 'Suffix \u064A (mein) als Besitzer. Mein Herz.' },
  { word: '\u0631\u064E\u0628\u0651\u064E\u0646\u064E\u0627', suffix: '\u0646\u064E\u0627', person: '1p', function: 'Possessiv am Nomen', base: '\u0631\u064E\u0628\u0651 (Herr)', ref: '2:127', explanation: 'Suffix \u0646\u064E\u0627 (unser) als Besitzer. Unser Herr.' },
  { word: '\u0623\u064E\u0647\u0652\u0644\u0650\u0647\u064E\u0627', suffix: '\u0647\u064E\u0627', person: '3fs', function: 'Possessiv am Nomen', base: '\u0623\u064E\u0647\u0652\u0644 (Leute/Familie)', ref: '2:126', explanation: 'Suffix \u0647\u064E\u0627 (ihre/deren, fem.) als Besitzer. Ihre Leute.' },
  // An Präposition
  { word: '\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652', suffix: '\u0647\u0650\u0645\u0652', person: '3mp', function: 'Komplement der Präposition', base: '\u0639\u064E\u0644\u064E\u0649 (auf/über)', ref: '1:7', explanation: 'Suffix \u0647\u0650\u0645\u0652 als Komplement der Präposition. Auf ihnen.' },
  { word: '\u0644\u064E\u0643\u064F\u0645\u0652', suffix: '\u0643\u064F\u0645\u0652', person: '2mp', function: 'Komplement der Präposition', base: '\u0644\u064E\u0640 (für)', ref: '2:22', explanation: 'Suffix \u0643\u064F\u0645\u0652 als Komplement. Für euch.' },
  { word: '\u0641\u0650\u064A\u0647\u064E\u0627', suffix: '\u0647\u064E\u0627', person: '3fs', function: 'Komplement der Präposition', base: '\u0641\u0650\u064A (in)', ref: '2:25', explanation: 'Suffix \u0647\u064E\u0627 (ihr, fem.) als Komplement. In ihr/darin.' },
  { word: '\u0645\u0650\u0646\u0652\u0647\u064F', suffix: '\u0647\u064F', person: '3ms', function: 'Komplement der Präposition', base: '\u0645\u0650\u0646\u0652 (von/aus)', ref: '2:60', explanation: 'Suffix \u0647\u064F (ihm) als Komplement. Von ihm / daraus.' },
  { word: '\u0625\u0650\u0644\u064E\u064A\u0652\u0643\u064E', suffix: '\u0643\u064E', person: '2ms', function: 'Komplement der Präposition', base: '\u0625\u0650\u0644\u064E\u0649 (zu/hin)', ref: '2:4', explanation: 'Suffix \u0643\u064E (dir) als Komplement. Zu dir.' },
  { word: '\u0628\u0650\u0647\u0650\u0645\u0652', suffix: '\u0647\u0650\u0645\u0652', person: '3mp', function: 'Komplement der Präposition', base: '\u0628\u0650\u0640 (mit/durch)', ref: '2:17', explanation: 'Suffix \u0647\u0650\u0645\u0652 als Komplement. Mit ihnen / durch sie.' },
  // Doppelsuffix
  { word: '\u0623\u064E\u0646\u0632\u064E\u0644\u0652\u0646\u064E\u0627\u0647\u064F', suffix: '\u0646\u064E\u0627 + \u0647\u064F', person: '1p + 3ms', function: 'Subjekt-Suffix + Objekt-Suffix', base: '\u0623\u064E\u0646\u0632\u064E\u0644\u064E (sandte herab)', ref: '12:2', explanation: 'Doppelsuffix: \u0646\u064E\u0627 (wir, Subjekt) und \u0647\u064F (es, Objekt). Wir sandten es herab.' },
  { word: '\u0631\u064E\u0632\u064E\u0642\u0652\u0646\u064E\u0627\u0647\u064F\u0645\u0652', suffix: '\u0646\u064E\u0627 + \u0647\u064F\u0645\u0652', person: '1p + 3mp', function: 'Subjekt-Suffix + Objekt-Suffix', base: '\u0631\u064E\u0632\u064E\u0642\u064E (versorgte)', ref: '2:3', explanation: 'Doppelsuffix: \u0646\u064E\u0627 (wir) + \u0647\u064F\u0645\u0652 (sie). Wir versorgten sie (womit wir sie versorgten).' },
  // === NEUE ÜBUNGEN: ه/ها (3ms/3fs) ===
  { word: '\u0639\u064E\u0644\u0651\u064E\u0645\u064E\u0647\u064F', suffix: '\u0647\u064F', person: '3ms', function: 'Objekt am Verb', base: '\u0639\u064E\u0644\u0651\u064E\u0645\u064E (er lehrte)', ref: '2:31', explanation: 'Suffix \u0647\u064F (ihn/es) als direktes Objekt. Er lehrte ihn.' },
  { word: '\u062E\u064E\u0644\u064E\u0642\u064E\u0647\u064E\u0627', suffix: '\u0647\u064E\u0627', person: '3fs', function: 'Objekt am Verb', base: '\u062E\u064E\u0644\u064E\u0642\u064E (er erschuf)', ref: '7:54', explanation: 'Suffix \u0647\u064E\u0627 (sie, fem.) als Objekt. Er erschuf sie (die Erde).' },
  { word: '\u0623\u064E\u0645\u0652\u0631\u064F\u0647\u064F', suffix: '\u0647\u064F', person: '3ms', function: 'Possessiv am Nomen', base: '\u0623\u064E\u0645\u0652\u0631 (Befehl/Angelegenheit)', ref: '65:5', explanation: 'Suffix \u0647\u064F (sein) als Besitzer. Sein Befehl.' },
  { word: '\u0641\u064E\u0648\u0652\u0642\u064E\u0647\u064E\u0627', suffix: '\u0647\u064E\u0627', person: '3fs', function: 'Komplement der Präposition', base: '\u0641\u064E\u0648\u0652\u0642\u064E (über)', ref: '2:26', explanation: 'Suffix \u0647\u064E\u0627 (ihr, fem.) als Komplement. Über ihr/darüber.' },
  { word: '\u0631\u064E\u0628\u0651\u064F\u0647\u064F', suffix: '\u0647\u064F', person: '3ms', function: 'Possessiv am Nomen', base: '\u0631\u064E\u0628\u0651 (Herr)', ref: '12:23', explanation: 'Suffix \u0647\u064F (sein) als Besitzer. Sein Herr.' },
  { word: '\u062E\u0644\u0651\u064E\u0641\u064E\u0647\u064E\u0627', suffix: '\u0647\u064E\u0627', person: '3fs', function: 'Objekt am Verb', base: '\u062E\u0644\u0651\u064E\u0641\u064E (er nachfolgte)', ref: '7:142', explanation: 'Suffix \u0647\u064E\u0627 (sie, fem.) als Objekt. Er folgte ihr nach.' },
  // === NEUE ÜBUNGEN: هم/هن (3mp/3fp) ===
  { word: '\u0623\u064E\u0646\u0652\u0641\u064F\u0633\u064E\u0647\u064F\u0645\u0652', suffix: '\u0647\u064F\u0645\u0652', person: '3mp', function: 'Possessiv am Nomen', base: '\u0623\u064E\u0646\u0652\u0641\u064F\u0633 (Seelen)', ref: '2:9', explanation: 'Suffix \u0647\u064F\u0645\u0652 (ihre, mask.) als Besitzer. Ihre Seelen.' },
  { word: '\u0623\u064E\u0639\u0652\u0645\u064E\u0627\u0644\u064E\u0647\u064F\u0645\u0652', suffix: '\u0647\u064F\u0645\u0652', person: '3mp', function: 'Possessiv am Nomen', base: '\u0623\u064E\u0639\u0652\u0645\u064E\u0627\u0644 (Taten)', ref: '47:1', explanation: 'Suffix \u0647\u064F\u0645\u0652 (ihre) als Besitzer. Ihre Taten.' },
  { word: '\u064A\u064E\u0639\u0650\u062F\u064F\u0647\u064F\u0645\u064F', suffix: '\u0647\u064F\u0645\u064F', person: '3mp', function: 'Objekt am Verb', base: '\u064A\u064E\u0639\u0650\u062F\u064F (er verspricht)', ref: '4:120', explanation: 'Suffix \u0647\u064F\u0645\u064F (ihnen) als Objekt. Er verspricht ihnen.' },
  { word: '\u0628\u064F\u064A\u064F\u0648\u062A\u0650\u0647\u0650\u0646\u0651\u064E', suffix: '\u0647\u0650\u0646\u0651\u064E', person: '3fp', function: 'Possessiv am Nomen', base: '\u0628\u064F\u064A\u064F\u0648\u062A (Häuser)', ref: '33:33', explanation: 'Suffix \u0647\u0650\u0646\u0651\u064E (ihre, fem. Pl.) als Besitzer. Ihre Häuser.' },
  { word: '\u0623\u064E\u062C\u0652\u0631\u064E\u0647\u064F\u0646\u0651\u064E', suffix: '\u0647\u064F\u0646\u0651\u064E', person: '3fp', function: 'Possessiv am Nomen', base: '\u0623\u064E\u062C\u0652\u0631 (Lohn)', ref: '33:50', explanation: 'Suffix \u0647\u064F\u0646\u0651\u064E (ihren, fem. Pl.) als Besitzer. Ihren Lohn.' },
  { word: '\u064A\u064E\u0647\u0652\u062F\u0650\u064A\u0647\u0650\u0645\u0652', suffix: '\u0647\u0650\u0645\u0652', person: '3mp', function: 'Objekt am Verb', base: '\u064A\u064E\u0647\u0652\u062F\u0650\u064A (er leitet)', ref: '6:87', explanation: 'Suffix \u0647\u0650\u0645\u0652 (sie, mask.) als Objekt. Er leitet sie.' },
  // === NEUE ÜBUNGEN: ك/كم (2ms/2mp) ===
  { word: '\u0631\u064E\u0628\u0651\u064E\u0643\u064E', suffix: '\u0643\u064E', person: '2ms', function: 'Possessiv am Nomen', base: '\u0631\u064E\u0628\u0651 (Herr)', ref: '96:1', explanation: 'Suffix \u0643\u064E (dein, mask.) als Besitzer. Dein Herr.' },
  { word: '\u0623\u064E\u0639\u0652\u0637\u064E\u064A\u0652\u0646\u064E\u0627\u0643\u064E', suffix: '\u0643\u064E', person: '2ms', function: 'Objekt am Verb', base: '\u0623\u064E\u0639\u0652\u0637\u064E\u064A\u0652\u0646\u064E\u0627 (wir gaben)', ref: '108:1', explanation: 'Suffix \u0643\u064E (dir) als Objekt. Wir gaben dir.' },
  { word: '\u062F\u0650\u064A\u0646\u064E\u0643\u064F\u0645\u0652', suffix: '\u0643\u064F\u0645\u0652', person: '2mp', function: 'Possessiv am Nomen', base: '\u062F\u0650\u064A\u0646 (Religion/Lebensweise)', ref: '109:6', explanation: 'Suffix \u0643\u064F\u0645\u0652 (euer) als Besitzer. Eure Lebensweise.' },
  { word: '\u064A\u064E\u0623\u0652\u0645\u064F\u0631\u064F\u0643\u064F\u0645\u0652', suffix: '\u0643\u064F\u0645\u0652', person: '2mp', function: 'Objekt am Verb', base: '\u064A\u064E\u0623\u0652\u0645\u064F\u0631\u064F (er befiehlt)', ref: '2:67', explanation: 'Suffix \u0643\u064F\u0645\u0652 (euch) als Objekt. Er befiehlt euch.' },
  { word: '\u0628\u064E\u064A\u0652\u0646\u064E\u0643\u064F\u0645\u0652', suffix: '\u0643\u064F\u0645\u0652', person: '2mp', function: 'Komplement der Präposition', base: '\u0628\u064E\u064A\u0652\u0646\u064E (zwischen)', ref: '4:129', explanation: 'Suffix \u0643\u064F\u0645\u0652 als Komplement. Zwischen euch.' },
  { word: '\u0645\u0650\u0646\u0652\u0643\u064E', suffix: '\u0643\u064E', person: '2ms', function: 'Komplement der Präposition', base: '\u0645\u0650\u0646\u0652 (von)', ref: '3:26', explanation: 'Suffix \u0643\u064E (dir) als Komplement. Von dir.' },
  // === NEUE ÜBUNGEN: ي/نا (1s/1p) ===
  { word: '\u062E\u064E\u0644\u064E\u0642\u064E\u0646\u0650\u064A', suffix: '\u0646\u0650\u064A', person: '1s', function: 'Objekt am Verb', base: '\u062E\u064E\u0644\u064E\u0642\u064E (er erschuf)', ref: '36:22', explanation: 'Suffix \u0646\u0650\u064A (mich) als Objekt. Er erschuf mich.' },
  { word: '\u0631\u064E\u0628\u0651\u0650\u064A', suffix: '\u064A', person: '1s', function: 'Possessiv am Nomen', base: '\u0631\u064E\u0628\u0651 (Herr)', ref: '6:162', explanation: 'Suffix \u064A (mein) als Besitzer. Mein Herr.' },
  { word: '\u0625\u0650\u0644\u064E\u064A\u0651\u064E', suffix: '\u064A\u064E', person: '1s', function: 'Komplement der Präposition', base: '\u0625\u0650\u0644\u064E\u0649 (zu)', ref: '11:88', explanation: 'Suffix \u064A\u064E (mir) als Komplement. Zu mir.' },
  { word: '\u0623\u064E\u0646\u0652\u062C\u064E\u064A\u0652\u0646\u064E\u0627', suffix: '\u0646\u064E\u0627', person: '1p', function: 'Objekt am Verb', base: '\u0623\u064E\u0646\u0652\u062C\u064E\u0649 (er rettete, Form IV)', ref: '7:64', explanation: 'Suffix \u0646\u064E\u0627 (uns) als Objekt. Er rettete uns.' },
  { word: '\u0642\u064E\u0648\u0652\u0645\u0650\u0646\u064E\u0627', suffix: '\u0646\u064E\u0627', person: '1p', function: 'Possessiv am Nomen', base: '\u0642\u064E\u0648\u0652\u0645 (Volk)', ref: '7:47', explanation: 'Suffix \u0646\u064E\u0627 (unser) als Besitzer. Unser Volk.' },
  { word: '\u0639\u064E\u0644\u064E\u064A\u0652\u0646\u064E\u0627', suffix: '\u0646\u064E\u0627', person: '1p', function: 'Komplement der Präposition', base: '\u0639\u064E\u0644\u064E\u0649 (auf)', ref: '7:89', explanation: 'Suffix \u0646\u064E\u0627 (uns) als Komplement. Auf uns.' },
  // === NEUE ÜBUNGEN: Dualformen ===
  { word: '\u0623\u064E\u0628\u064E\u0648\u064E\u064A\u0652\u0647\u0650\u0645\u064E\u0627', suffix: '\u0647\u0650\u0645\u064E\u0627', person: '3md', function: 'Possessiv am Nomen', base: '\u0623\u064E\u0628\u064E\u0648\u064E\u064A\u0652 (Eltern, Dual)', ref: '18:82', explanation: 'Suffix \u0647\u0650\u0645\u064E\u0627 (ihrer beider) als Besitzer. Dual-Possessiv.' },
  { word: '\u0641\u0650\u064A\u0647\u0650\u0645\u064E\u0627', suffix: '\u0647\u0650\u0645\u064E\u0627', person: '3md', function: 'Komplement der Präposition', base: '\u0641\u0650\u064A (in)', ref: '55:68', explanation: 'Suffix \u0647\u0650\u0645\u064E\u0627 (ihnen beiden, Dual) als Komplement. In ihnen beiden.' },
  { word: '\u0623\u064E\u062D\u064E\u062F\u064F\u0647\u064F\u0645\u064E\u0627', suffix: '\u0647\u064F\u0645\u064E\u0627', person: '3md', function: 'Possessiv am Nomen', base: '\u0623\u064E\u062D\u064E\u062F (einer)', ref: '17:23', explanation: 'Suffix \u0647\u064F\u0645\u064E\u0627 (ihrer beider) als Besitzer. Einer von ihnen beiden.' },
  { word: '\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u064E\u0627', suffix: '\u0647\u0650\u0645\u064E\u0627', person: '3md', function: 'Komplement der Präposition', base: '\u0639\u064E\u0644\u064E\u0649 (auf)', ref: '20:121', explanation: 'Suffix \u0647\u0650\u0645\u064E\u0627 (ihnen beiden) als Komplement. Auf ihnen beiden.' },
  { word: '\u0642\u064E\u0627\u0644\u064E\u062A\u064E\u0627', suffix: '\u062A\u064E\u0627', person: '3fd', function: 'Verbale Konjugationsendung', base: '\u0642\u064E\u0627\u0644\u064E (er sagte)', ref: '28:25', explanation: 'Endung \u062A\u064E\u0627 ist eine Konjugationsendung (Dual feminin), kein abtrennbares Pronomen-Suffix. Sie beide sagten.' },
  { word: '\u0623\u064E\u064A\u0652\u062F\u0650\u064A\u0647\u0650\u0645\u064E\u0627', suffix: '\u0647\u0650\u0645\u064E\u0627', person: '3md', function: 'Possessiv am Nomen', base: '\u0623\u064E\u064A\u0652\u062F\u0650\u064A (Hände, Dual)', ref: '5:38', explanation: 'Suffix \u0647\u0650\u0645\u064E\u0627 (ihrer beider) als Besitzer. Ihrer beider Hände.' },
]

const PERSONS = ['1s', '1p', '2ms', '2fs', '2mp', '2fp', '3ms', '3fs', '3md', '3fd', '3mp', '3fp', '1p + 3ms', '1p + 3mp']
const FUNCTIONS = ['Objekt am Verb', 'Possessiv am Nomen', 'Komplement der Präposition', 'Subjekt-Suffix + Objekt-Suffix', 'Verbale Konjugationsendung']

export default function PronounSuffixDrill() {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState({ suffix: '', person: '', function: '' })
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const ex = EXERCISES[idx]
  if (!ex) return null

  function check() {
    setRevealed(true)
    let correct = 0
    if (answers.person === ex.person) correct++
    if (answers.function === ex.function) correct++
    setScore(s => ({ correct: s.correct + correct, total: s.total + 2 }))
  }

  function next() {
    setIdx((idx + 1) % EXERCISES.length)
    setAnswers({ suffix: '', person: '', function: '' })
    setRevealed(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Pronominalsuffix-Drill</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: 20 }}>
        Erkenne das angehängte Pronomen, bestimme Person/Genus/Numerus und die syntaktische Funktion.
      </p>
      {score.total > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{score.correct}/{score.total} korrekt</div>}

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{ex.ref}</div>
          <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '2.5rem', color: 'var(--accent-gold)', direction: 'rtl' }}>{ex.word}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Person / Genus / Numerus</label>
            <select value={answers.person} onChange={e => !revealed && setAnswers(a => ({ ...a, person: e.target.value }))} disabled={revealed}
              style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
              <option value="">-- Wähle --</option>
              {PERSONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Syntaktische Funktion</label>
            <select value={answers.function} onChange={e => !revealed && setAnswers(a => ({ ...a, function: e.target.value }))} disabled={revealed}
              style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
              <option value="">-- Wähle --</option>
              {FUNCTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {!revealed && <button onClick={check} disabled={!answers.person || !answers.function} style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: answers.person && answers.function ? 'var(--accent-teal)' : 'var(--text-muted)', color: '#fff', cursor: answers.person && answers.function ? 'pointer' : 'default', width: '100%' }}>Prüfen</button>}

        {revealed && (
          <div style={{ padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>
              Suffix: <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}>{ex.suffix}</span> | {ex.person} | {ex.function}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
              Basis: <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}>{ex.base}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{ex.explanation}</div>
            <button onClick={next} style={{ marginTop: 12, padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>Weiter ({idx + 1}/{EXERCISES.length})</button>
          </div>
        )}
      </div>
    </div>
  )
}

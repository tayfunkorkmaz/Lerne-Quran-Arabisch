import { useState } from 'react'
import patternGenerated from '../data/pattern-recognition-generated.json'

const WORD_TO_PATTERN_INLINE = [
  { word: '\u0643\u064E\u0627\u062A\u0650\u0628', pattern: '\u0641\u064E\u0627\u0639\u0650\u0644', name: 'Aktives Partizip I', ref: '2:282' },
  { word: '\u0645\u064E\u0643\u0652\u062A\u064F\u0648\u0628', pattern: '\u0645\u064E\u0641\u0652\u0639\u064F\u0648\u0644', name: 'Passives Partizip I', ref: '7:157' },
  { word: '\u0643\u0650\u062A\u064E\u0627\u0628', pattern: '\u0641\u0650\u0639\u064E\u0627\u0644', name: 'Nomen', ref: '2:2' },
  { word: '\u0639\u064E\u0644\u0650\u064A\u0645', pattern: '\u0641\u064E\u0639\u0650\u064A\u0644', name: 'Intensivadjektiv', ref: '2:32' },
  { word: '\u0639\u064E\u0638\u0650\u064A\u0645', pattern: '\u0641\u064E\u0639\u0650\u064A\u0644', name: 'Intensivadjektiv', ref: '2:7' },
  { word: '\u0631\u064E\u062D\u0650\u064A\u0645', pattern: '\u0641\u064E\u0639\u0650\u064A\u0644', name: 'Dauerhafte Eigenschaft', ref: '1:1' },
  { word: '\u0631\u064E\u062D\u0652\u0645\u064E\u0627\u0646', pattern: '\u0641\u064E\u0639\u0652\u0644\u064E\u0627\u0646', name: 'Intensivform', ref: '1:1' },
  { word: '\u0645\u064F\u0633\u0652\u0644\u0650\u0645', pattern: '\u0645\u064F\u0641\u0652\u0639\u0650\u0644', name: 'Aktives Partizip IV', ref: '2:132' },
  { word: '\u0645\u064F\u0624\u0652\u0645\u0650\u0646', pattern: '\u0645\u064F\u0641\u0652\u0639\u0650\u0644', name: 'Aktives Partizip IV', ref: '2:8' },
  { word: '\u0645\u064F\u0646\u064E\u0627\u0641\u0650\u0642', pattern: '\u0645\u064F\u0641\u064E\u0627\u0639\u0650\u0644', name: 'Aktives Partizip III', ref: '4:138' },
  { word: '\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645', pattern: '\u0645\u064F\u0633\u0652\u062A\u064E\u0641\u0652\u0639\u0650\u0644', name: 'Aktives Partizip X', ref: '1:6' },
  { word: '\u0645\u064F\u0641\u0652\u0644\u0650\u062D', pattern: '\u0645\u064F\u0641\u0652\u0639\u0650\u0644', name: 'Aktives Partizip IV', ref: '2:5' },
  { word: '\u0643\u064E\u0641\u0651\u064E\u0627\u0631', pattern: '\u0641\u064E\u0639\u0651\u064E\u0627\u0644', name: 'Intensivplural', ref: '2:276' },
  { word: '\u0639\u064E\u0630\u064E\u0627\u0628', pattern: '\u0641\u064E\u0639\u064E\u0627\u0644', name: 'Masdar I', ref: '2:7' },
  { word: '\u062D\u0650\u0633\u064E\u0627\u0628', pattern: '\u0641\u0650\u0639\u064E\u0627\u0644', name: 'Masdar I', ref: '2:202' },
  { word: '\u0623\u064E\u0643\u0652\u0628\u064E\u0631', pattern: '\u0623\u064E\u0641\u0652\u0639\u064E\u0644', name: 'Elativ', ref: '29:45' },
  { word: '\u0623\u064E\u062D\u0652\u0633\u064E\u0646', pattern: '\u0623\u064E\u0641\u0652\u0639\u064E\u0644', name: 'Elativ', ref: '12:3' },
  { word: '\u0645\u064E\u0633\u0652\u062C\u0650\u062F', pattern: '\u0645\u064E\u0641\u0652\u0639\u0650\u0644', name: 'Ortsnomen', ref: '2:114' },
  { word: '\u0645\u064E\u063A\u0652\u0641\u0650\u0631\u064E\u0629', pattern: '\u0645\u064E\u0641\u0652\u0639\u0650\u0644\u064E\u0629', name: 'Masdar/Nomen', ref: '2:268' },
  { word: '\u062A\u064E\u0639\u0652\u0644\u0650\u064A\u0645', pattern: '\u062A\u064E\u0641\u0652\u0639\u0650\u064A\u0644', name: 'Masdar II', ref: '2:31' },
  { word: '\u0625\u0650\u0633\u0652\u0644\u064E\u0627\u0645', pattern: '\u0625\u0650\u0641\u0652\u0639\u064E\u0627\u0644', name: 'Masdar IV', ref: '3:19' },
  { word: '\u0642\u064E\u0648\u0652\u0644', pattern: '\u0641\u064E\u0639\u0652\u0644', name: 'Masdar I', ref: '2:235' },
  { word: '\u0639\u0650\u0644\u0652\u0645', pattern: '\u0641\u0650\u0639\u0652\u0644', name: 'Masdar I', ref: '2:120' },
  { word: '\u062D\u064F\u0643\u0652\u0645', pattern: '\u0641\u064F\u0639\u0652\u0644', name: 'Masdar I', ref: '12:40' },
  { word: '\u0645\u064F\u062A\u064E\u0642\u064E\u0628\u0651\u0650\u0644', pattern: '\u0645\u064F\u062A\u064E\u0641\u064E\u0639\u0651\u0650\u0644', name: 'Aktives Partizip V', ref: '5:27' },
  { word: '\u0645\u064F\u0646\u0652\u0632\u064E\u0644', pattern: '\u0645\u064F\u0641\u0652\u0639\u064E\u0644', name: 'Passives Partizip IV', ref: '6:114' },
  { word: '\u0633\u064E\u0645\u0650\u064A\u0639', pattern: '\u0641\u064E\u0639\u0650\u064A\u0644', name: 'Intensivadjektiv', ref: '2:127' },
  { word: '\u0628\u064E\u0635\u0650\u064A\u0631', pattern: '\u0641\u064E\u0639\u0650\u064A\u0644', name: 'Intensivadjektiv', ref: '2:96' },
  { word: '\u0642\u064E\u062F\u0650\u064A\u0631', pattern: '\u0641\u064E\u0639\u0650\u064A\u0644', name: 'Intensivadjektiv', ref: '2:20' },
  { word: '\u0645\u064F\u0641\u0652\u062A\u064E\u0631\u064D', pattern: '\u0645\u064F\u0641\u0652\u062A\u064E\u0639\u0650\u0644', name: 'Aktives Partizip VIII', ref: '16:101' },
  { word: '\u0645\u064F\u0646\u0652\u0641\u0650\u0642', pattern: '\u0645\u064F\u0641\u0652\u0639\u0650\u0644', name: 'Aktives Partizip IV', ref: '2:3' },
  { word: '\u0645\u064E\u0639\u0652\u0631\u064F\u0648\u0641', pattern: '\u0645\u064E\u0641\u0652\u0639\u064F\u0648\u0644', name: 'Passives Partizip I', ref: '2:178' },
  { word: '\u0645\u064E\u062C\u0652\u0646\u064F\u0648\u0646', pattern: '\u0645\u064E\u0641\u0652\u0639\u064F\u0648\u0644', name: 'Passives Partizip I', ref: '15:6' },
  { word: '\u0635\u064E\u0628\u0651\u064E\u0627\u0631', pattern: '\u0641\u064E\u0639\u0651\u064E\u0627\u0644', name: 'Intensivform', ref: '34:19' },
  { word: '\u063A\u064E\u0641\u0651\u064E\u0627\u0631', pattern: '\u0641\u064E\u0639\u0651\u064E\u0627\u0644', name: 'Intensivform', ref: '20:82' },
  { word: '\u062C\u064E\u0628\u0651\u064E\u0627\u0631', pattern: '\u0641\u064E\u0639\u0651\u064E\u0627\u0644', name: 'Intensivform', ref: '59:23' },
  { word: '\u0635\u064E\u0645\u064E\u062F', pattern: '\u0641\u064E\u0639\u064E\u0644', name: 'Adjektiv-Nomen', ref: '112:2' },
  { word: '\u0641\u064E\u0644\u064E\u0642', pattern: '\u0641\u064E\u0639\u064E\u0644', name: 'Nomen', ref: '113:1' },
  { word: '\u0645\u064E\u0644\u064E\u0643', pattern: '\u0641\u064E\u0639\u064E\u0644', name: 'Nomen/Titel', ref: '12:43' },
  { word: '\u062D\u064E\u0633\u064E\u0646\u064E\u0629', pattern: '\u0641\u064E\u0639\u064E\u0644\u064E\u0629', name: 'Nomen des einmaligen Geschehens', ref: '4:78' },
  // === NEUE ÜBUNGEN: Form II-X Masdars ===
  { word: '\u062A\u064E\u0630\u0652\u0643\u0650\u064A\u0631', pattern: '\u062A\u064E\u0641\u0652\u0639\u0650\u064A\u0644', name: 'Masdar II', ref: '50:8' },
  { word: '\u062A\u064E\u0648\u0652\u0628\u064E\u0629', pattern: '\u062A\u064E\u0641\u0652\u0639\u0650\u0644\u064E\u0629', name: 'Masdar II (mit Ta-Marbuta)', ref: '9:104' },
  { word: '\u0645\u064F\u062C\u064E\u0627\u0647\u064E\u062F\u064E\u0629', pattern: '\u0645\u064F\u0641\u064E\u0627\u0639\u064E\u0644\u064E\u0629', name: 'Masdar III', ref: '22:78' },
  { word: '\u0642\u0650\u062A\u064E\u0627\u0644', pattern: '\u0641\u0650\u0639\u064E\u0627\u0644', name: 'Masdar III', ref: '2:216' },
  { word: '\u0625\u0650\u0646\u0632\u064E\u0627\u0644', pattern: '\u0625\u0650\u0641\u0652\u0639\u064E\u0627\u0644', name: 'Masdar IV', ref: '3:124' },
  { word: '\u062A\u064E\u0639\u064E\u0627\u0648\u064F\u0646', pattern: '\u062A\u064E\u0641\u064E\u0627\u0639\u064F\u0644', name: 'Masdar VI', ref: '5:2' },
  { word: '\u0627\u0646\u0641\u0650\u0637\u064E\u0627\u0631', pattern: '\u0627\u0646\u0641\u0650\u0639\u064E\u0627\u0644', name: 'Masdar VII', ref: '82:1' },
  { word: '\u0627\u062E\u0652\u062A\u0650\u0644\u064E\u0627\u0641', pattern: '\u0627\u0641\u0652\u062A\u0650\u0639\u064E\u0627\u0644', name: 'Masdar VIII', ref: '2:176' },
  { word: '\u0627\u0633\u0652\u062A\u0650\u063A\u0652\u0641\u064E\u0627\u0631', pattern: '\u0627\u0633\u0652\u062A\u0650\u0641\u0652\u0639\u064E\u0627\u0644', name: 'Masdar X', ref: '71:10' },
  { word: '\u0627\u0633\u0652\u062A\u0650\u0643\u0652\u0628\u064E\u0627\u0631', pattern: '\u0627\u0633\u0652\u062A\u0650\u0641\u0652\u0639\u064E\u0627\u0644', name: 'Masdar X', ref: '40:56' },
  // === NEUE ÜBUNGEN: Broken Plurals ===
  { word: '\u0643\u064F\u062A\u064F\u0628', pattern: '\u0641\u064F\u0639\u064F\u0644', name: 'Gebrochener Plural', ref: '98:3' },
  { word: '\u0631\u064F\u0633\u064F\u0644', pattern: '\u0641\u064F\u0639\u064F\u0644', name: 'Gebrochener Plural', ref: '2:253' },
  { word: '\u0639\u064F\u0644\u064E\u0645\u064E\u0627\u0621', pattern: '\u0641\u064F\u0639\u064E\u0644\u064E\u0627\u0621', name: 'Gebrochener Plural', ref: '35:28' },
  { word: '\u0634\u064F\u0647\u064E\u062F\u064E\u0627\u0621', pattern: '\u0641\u064F\u0639\u064E\u0644\u064E\u0627\u0621', name: 'Gebrochener Plural', ref: '2:282' },
  { word: '\u0623\u064E\u0646\u0652\u0628\u0650\u064A\u064E\u0627\u0621', pattern: '\u0623\u064E\u0641\u0652\u0639\u0650\u0644\u064E\u0627\u0621', name: 'Gebrochener Plural', ref: '2:61' },
  // === NEUE ÜBUNGEN: Instrument Nouns ===
  { word: '\u0645\u0650\u0641\u0652\u062A\u064E\u0627\u062D', pattern: '\u0645\u0650\u0641\u0652\u0639\u064E\u0627\u0644', name: 'Instrumentalnomen', ref: '6:59' },
  { word: '\u0645\u0650\u064A\u0632\u064E\u0627\u0646', pattern: '\u0645\u0650\u0641\u0652\u0639\u064E\u0627\u0644', name: 'Instrumentalnomen', ref: '55:7' },
  { word: '\u0645\u0650\u0646\u0652\u0647\u064E\u0627\u062C', pattern: '\u0645\u0650\u0641\u0652\u0639\u064E\u0627\u0644', name: 'Instrumentalnomen', ref: '5:48' },
  { word: '\u0645\u0650\u0635\u0652\u0628\u064E\u0627\u062D', pattern: '\u0645\u0650\u0641\u0652\u0639\u064E\u0627\u0644', name: 'Instrumentalnomen', ref: '24:35' },
  { word: '\u0645\u0650\u062D\u0652\u0631\u064E\u0627\u0628', pattern: '\u0645\u0650\u0641\u0652\u0639\u064E\u0627\u0644', name: 'Orts-/Instrumentalnomen', ref: '3:37' },
]

const PATTERN_TO_WORDS = [
  { pattern: '\u0641\u064E\u0627\u0639\u0650\u0644', name: 'Aktives Partizip I', words: ['\u0643\u064E\u0627\u062A\u0650\u0628', '\u0639\u064E\u0627\u0644\u0650\u0645', '\u0643\u064E\u0627\u0641\u0650\u0631', '\u0635\u064E\u0627\u0628\u0650\u0631', '\u0642\u064E\u0627\u062F\u0650\u0631'] },
  { pattern: '\u0641\u064E\u0639\u0650\u064A\u0644', name: 'Intensivadjektiv', words: ['\u0639\u064E\u0644\u0650\u064A\u0645', '\u0631\u064E\u062D\u0650\u064A\u0645', '\u0633\u064E\u0645\u0650\u064A\u0639', '\u0628\u064E\u0635\u0650\u064A\u0631', '\u0642\u064E\u062F\u0650\u064A\u0631'] },
  { pattern: '\u0645\u064E\u0641\u0652\u0639\u064F\u0648\u0644', name: 'Passives Partizip I', words: ['\u0645\u064E\u0643\u0652\u062A\u064F\u0648\u0628', '\u0645\u064E\u0639\u0652\u0631\u064F\u0648\u0641', '\u0645\u064E\u0639\u0652\u0644\u064F\u0648\u0645', '\u0645\u064E\u062C\u0652\u0646\u064F\u0648\u0646', '\u0645\u064E\u062D\u0652\u0641\u064F\u0648\u0638'] },
  { pattern: '\u0645\u064F\u0641\u0652\u0639\u0650\u0644', name: 'Aktives Partizip IV', words: ['\u0645\u064F\u0633\u0652\u0644\u0650\u0645', '\u0645\u064F\u0624\u0652\u0645\u0650\u0646', '\u0645\u064F\u0646\u0652\u0641\u0650\u0642', '\u0645\u064F\u062D\u0652\u0633\u0650\u0646', '\u0645\u064F\u0641\u0652\u0644\u0650\u062D'] },
  { pattern: '\u0641\u064E\u0639\u0651\u064E\u0627\u0644', name: 'Intensivform', words: ['\u0643\u064E\u0641\u0651\u064E\u0627\u0631', '\u063A\u064E\u0641\u0651\u064E\u0627\u0631', '\u062C\u064E\u0628\u0651\u064E\u0627\u0631', '\u0635\u064E\u0628\u0651\u064E\u0627\u0631', '\u0642\u064E\u0647\u0651\u064E\u0627\u0631'] },
  { pattern: '\u0623\u064E\u0641\u0652\u0639\u064E\u0644', name: 'Elativ/Komparativ', words: ['\u0623\u064E\u0643\u0652\u0628\u064E\u0631', '\u0623\u064E\u062D\u0652\u0633\u064E\u0646', '\u0623\u064E\u0639\u0652\u0644\u064E\u0645', '\u0623\u064E\u0642\u0652\u0631\u064E\u0628', '\u0623\u064E\u0643\u0652\u062B\u064E\u0631'] },
  { pattern: '\u0641\u0650\u0639\u064E\u0627\u0644', name: 'Nomen / Masdar', words: ['\u0643\u0650\u062A\u064E\u0627\u0628', '\u062D\u0650\u0633\u064E\u0627\u0628', '\u062C\u0650\u0647\u064E\u0627\u062F', '\u0634\u0650\u0641\u064E\u0627\u0621', '\u0639\u0650\u0628\u064E\u0627\u062F'] },
  { pattern: '\u0641\u064F\u0639\u064F\u0648\u0644', name: 'Nomen (Agentiv)', words: ['\u0631\u064E\u0633\u064F\u0648\u0644', '\u0634\u064E\u0643\u064F\u0648\u0631', '\u063A\u064E\u0641\u064F\u0648\u0631', '\u0635\u064E\u0628\u064F\u0648\u0631', '\u0643\u064E\u0641\u064F\u0648\u0631'] },
  { pattern: '\u0645\u064E\u0641\u0652\u0639\u0650\u0644', name: 'Ortsnomen', words: ['\u0645\u064E\u0633\u0652\u062C\u0650\u062F', '\u0645\u064E\u0634\u0652\u0631\u0650\u0642', '\u0645\u064E\u063A\u0652\u0631\u0650\u0628', '\u0645\u064E\u0646\u0652\u0632\u0650\u0644', '\u0645\u064E\u062C\u0652\u0644\u0650\u0633'] },
  { pattern: '\u062A\u064E\u0641\u0652\u0639\u0650\u064A\u0644', name: 'Masdar II', words: ['\u062A\u064E\u0639\u0652\u0644\u0650\u064A\u0645', '\u062A\u064E\u0646\u0652\u0632\u0650\u064A\u0644', '\u062A\u064E\u0641\u0652\u0633\u0650\u064A\u0631', '\u062A\u064E\u0643\u0652\u0628\u0650\u064A\u0631', '\u062A\u064E\u0633\u0652\u0628\u0650\u064A\u062D'] },
  // === NEUE PATTERN_TO_WORDS ===
  { pattern: '\u0645\u064F\u062A\u064E\u0641\u064E\u0639\u0651\u0650\u0644', name: 'Aktives Partizip V', words: ['\u0645\u064F\u062A\u064E\u0642\u064E\u0628\u0651\u0650\u0644', '\u0645\u064F\u062A\u064E\u0648\u064E\u0643\u0651\u0650\u0644', '\u0645\u064F\u062A\u064E\u0643\u064E\u0628\u0651\u0650\u0631', '\u0645\u064F\u062A\u064E\u0637\u064E\u0647\u0651\u0650\u0631', '\u0645\u064F\u062A\u064E\u0635\u064E\u062F\u0651\u0650\u0642'] },
  { pattern: '\u0627\u0641\u0652\u062A\u0650\u0639\u064E\u0627\u0644', name: 'Masdar VIII', words: ['\u0627\u062E\u0652\u062A\u0650\u0644\u064E\u0627\u0641', '\u0627\u0641\u0652\u062A\u0650\u0631\u064E\u0627\u0621', '\u0627\u0628\u0652\u062A\u0650\u0644\u064E\u0627\u0621', '\u0627\u0642\u0652\u062A\u0650\u0631\u064E\u0627\u0628', '\u0627\u062C\u0652\u062A\u0650\u0645\u064E\u0627\u0639'] },
  { pattern: '\u062A\u064E\u0641\u064E\u0627\u0639\u064F\u0644', name: 'Masdar VI', words: ['\u062A\u064E\u0639\u064E\u0627\u0648\u064F\u0646', '\u062A\u064E\u0648\u064E\u0627\u0635\u064F\u0644', '\u062A\u064E\u062F\u064E\u0627\u0639\u064F\u064A', '\u062A\u064E\u0641\u064E\u0627\u0624\u064F\u0644', '\u062A\u064E\u0648\u064E\u0627\u0635\u064F\u0648'] },
  { pattern: '\u0641\u064F\u0639\u064E\u0644', name: 'Pluralform (fu\u02BFal)', words: ['\u0643\u064F\u062A\u064E\u0628', '\u063A\u064F\u0631\u064E\u0641', '\u0635\u064F\u062D\u064F\u0641', '\u0646\u064F\u0637\u064E\u0641', '\u062D\u064F\u062C\u064E\u0628'] },
  { pattern: '\u0641\u064E\u0639\u064E\u0627\u0626\u0650\u0644', name: 'Gebrochener Plural (fawa\u02BFil)', words: ['\u0631\u064E\u0633\u064E\u0627\u0626\u0650\u0644', '\u0641\u064E\u0636\u064E\u0627\u0626\u0650\u0644', '\u0634\u064E\u0645\u064E\u0627\u0626\u0650\u0644', '\u0642\u064E\u0628\u064E\u0627\u0626\u0650\u0644', '\u0648\u064E\u0633\u064E\u0627\u0626\u0650\u0644'] },
]

// Merge inline data with generated data
const WORD_TO_PATTERN = [...WORD_TO_PATTERN_INLINE, ...(patternGenerated.word2pattern || [])]
const PATTERN_TO_WORDS_MERGED = [...PATTERN_TO_WORDS, ...(patternGenerated.pattern2word || [])]

export default function PatternRecognitionDrill() {
  const [mode, setMode] = useState('word2pattern') // 'word2pattern' | 'pattern2word'
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const data = mode === 'word2pattern' ? WORD_TO_PATTERN : PATTERN_TO_WORDS_MERGED
  if (!data || data.length === 0) return <div style={{ maxWidth: 700, margin: '0 auto', padding: 24, color: 'var(--text-secondary)' }}>Keine Daten verfügbar.</div>
  const item = data[idx % data.length]
  if (!item) return null

  const strip = s => s.replace(/[\u064B-\u065F\u0670\s]/g, '').trim()

  function check() {
    setRevealed(true)
    if (mode === 'word2pattern') {
      const ok = strip(input) === strip(item.pattern) || input.toLowerCase().includes(item.name.toLowerCase().substring(0, 6))
      setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
    } else {
      // pattern2word: check if user input matches any expected word for this pattern
      const userWords = input.split(/[,\n\s]+/).map(w => strip(w)).filter(Boolean)
      const ok = userWords.some(uw => item.words.some(w => strip(w) === uw))
      setScore(s => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
    }
  }

  function next() {
    setIdx(i => (i + 1) % data.length)
    setInput('')
    setRevealed(false)
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 style={{ color: 'var(--accent-gold)', marginBottom: 4 }}>Muster-Erkennung (Wazn)</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => { setMode('word2pattern'); setIdx(0); setRevealed(false); setInput(''); }} style={{
          padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
          border: mode === 'word2pattern' ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
          background: mode === 'word2pattern' ? 'rgba(45,212,191,0.1)' : 'var(--bg)',
          color: mode === 'word2pattern' ? 'var(--accent-teal)' : 'var(--text-secondary)',
        }}>Wort → Muster</button>
        <button onClick={() => { setMode('pattern2word'); setIdx(0); setRevealed(false); setInput(''); }} style={{
          padding: '6px 16px', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
          border: mode === 'pattern2word' ? '2px solid var(--accent-teal)' : '1px solid var(--border)',
          background: mode === 'pattern2word' ? 'rgba(45,212,191,0.1)' : 'var(--bg)',
          color: mode === 'pattern2word' ? 'var(--accent-teal)' : 'var(--text-secondary)',
        }}>Muster → Wörter</button>
      </div>

      {score.total > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>{score.correct}/{score.total} korrekt</div>}

      <div style={{ background: 'var(--card-bg)', borderRadius: 12, padding: 24 }}>
        {mode === 'word2pattern' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '2.5rem', color: 'var(--accent-gold)', direction: 'rtl' }}>{item.word}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{item.ref}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Welches Muster (Wazn)?</label>
              <input value={input} onChange={e => setInput(e.target.value)} disabled={revealed}
                placeholder="\u0641\u064E\u0639\u0650\u064A\u0644 / \u0645\u064E\u0641\u0652\u0639\u064F\u0648\u0644 / ..."
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-arabic)', fontSize: '1.3rem', direction: 'rtl', boxSizing: 'border-box' }} />
            </div>
          </>
        )}

        {mode === 'pattern2word' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-arabic)', fontSize: '2rem', color: 'var(--accent-teal)', direction: 'rtl' }}>{item.pattern}</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: 4 }}>{item.name}</div>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
              Nenne Quranwörter die diesem Muster folgen. Klicke auf "Auflösen" um die Beispiele zu sehen.
            </p>
            <textarea value={input} onChange={e => setInput(e.target.value)} disabled={revealed} rows={3}
              placeholder="Gib Wörter ein (eines pro Zeile oder mit Komma getrennt)"
              style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-arabic)', fontSize: '1.1rem', direction: 'rtl', boxSizing: 'border-box', resize: 'vertical' }} />
          </>
        )}

        {!revealed && <button onClick={check} style={{ marginTop: 12, padding: '10px 28px', borderRadius: 8, border: 'none', background: 'var(--accent-teal)', color: '#fff', cursor: 'pointer', width: '100%' }}>
          {mode === 'word2pattern' ? 'Prüfen' : 'Auflösen'}
        </button>}

        {revealed && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
            {mode === 'word2pattern' ? (
              <div>
                <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: 4, fontSize: '1.2rem' }}>
                  <span style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}>{item.pattern}</span>
                  <span style={{ fontSize: '0.9rem', marginLeft: 8 }}>({item.name})</span>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontWeight: 600, color: '#22c55e', marginBottom: 8 }}>Beispielwörter:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {item.words.map((w, i) => (
                    <span key={i} style={{ padding: '4px 12px', borderRadius: 6, background: 'rgba(34,197,94,0.1)', fontFamily: 'var(--font-arabic)', fontSize: '1.2rem', direction: 'rtl', color: '#22c55e' }}>{w}</span>
                  ))}
                </div>
              </div>
            )}
            <button onClick={next} style={{ marginTop: 12, padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--accent-gold)', color: '#000', cursor: 'pointer' }}>
              Weiter ({(idx + 1) % data.length + 1}/{data.length})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

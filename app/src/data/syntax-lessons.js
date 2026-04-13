/**
 * Syntax-Lektionen Loader
 * Kombiniert alle Chunk-Dateien zu einem einzigen Lektionsobjekt.
 * Stufe 3: Syntax (Nahw) — 44 Lektionen
 * Stufe 4: Partikeln — 15 Lektionen
 * Stufe 5: Vers-Analysen — Sure 1, 2, 3, 4, 12
 */
import chunk1 from './syntax-3-01-10.json'
import chunk2 from './syntax-3-11-20.json'
import chunk3 from './syntax-3-21-30.json'
import chunk4 from './syntax-3-31-38.json'
import chunk5 from './syntax-4-01-07.json'
import chunk6 from './syntax-4-08-15.json'
import chunk7 from './syntax-3-39-41.json'
import chunk8 from './syntax-3-42-44.json'
import fatiha from './syntax-1-01-07.json'
import baqara1 from './syntax-2-01-25.json'
import baqara2 from './syntax-2-26-50.json'
import baqara3 from './syntax-2-51-75.json'
import baqara4 from './syntax-2-76-141.json'
import baqara5 from './syntax-2-142-213.json'
import baqara6 from './syntax-2-214-286.json'
import yusuf1 from './syntax-12-01-30.json'
import yusuf2 from './syntax-12-31-111.json'

const syntaxLessons = {
  meta: {
    module: 3,
    title: "Syntax (Nahw) und Partikeln",
    description: "44 Syntax-Lektionen zur arabischen Satzlehre und 15 Partikel-Lektionen — von der Kasusbestimmung über Ism al-Fi'l und Tanazu' bis zur Mehrdeutigkeit von Funktionswörtern im Quran. Dazu Vers-für-Vers-Analysen der Suren 1, 2 und 12.",
    passingScore: 80,
    warningMessage: "Ab jetzt wird es konkret. Jede Regel die du hier lernst, wirst du in jedem einzelnen Vers des Quran anwenden. Syntax ist das Werkzeug das dir sagt WARUM ein Wort in einem bestimmten Kasus steht, WELCHE Rolle es im Satz spielt, und WIE sich Satzteile zueinander verhalten. Ohne Syntax kannst du Wörter erkennen — mit Syntax verstehst du Sätze."
  },
  lessons: [
    ...chunk1,
    ...chunk2,
    ...chunk3,
    ...chunk4,
    ...chunk7,
    ...chunk8,
    ...chunk5,
    ...chunk6,
    ...fatiha,
    ...baqara1,
    ...baqara2,
    ...baqara3,
    ...baqara4,
    ...baqara5,
    ...baqara6,
    ...yusuf1,
    ...yusuf2
  ]
}

export default syntaxLessons

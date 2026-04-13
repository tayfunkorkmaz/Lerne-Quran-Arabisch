/**
 * Comprehensive validation of ALL JSON data files in the project.
 * Tests structural integrity, required fields, array sizes, and cross-references.
 */
import { describe, it, expect } from 'vitest'

// ── Core text layers ──
import quranSimpleClean from '../quran-simple-clean.json'
import quranUthmani from '../quran-uthmani.json'
import quranRasm from '../quran-rasm.json'
import quranVocalized from '../quran-vocalized.json'

// ── Morphology & lexicon ──
import quranMorphologyDb from '../quran-morphology-db.json'
import particles from '../particles.json'
import pronouns from '../pronouns.json'
import alphabet from '../alphabet.json'
import morphologyLessons from '../morphology-lessons.json'
import morphologyTables from '../morphology-tables.json'

// ── Ambiguity & special categories ──
import ambiguities from '../ambiguities.json'
import diptoteData from '../diptote-data.json'
import idafaSubtypes from '../idafa-subtypes.json'
import ellipsisHints from '../ellipsis-hints.json'
import hapaxLegomena from '../hapax-legomena.json'

// ── Root & frequency data ──
import rootFrequency from '../root-frequency.json'
import rootFrequencyComplete from '../root-frequency-complete.json'
import rootMeanings from '../root-meanings.json'

// ── Collocations & thematic ──
import collocations from '../collocations.json'
import thematicFields from '../thematic-fields.json'

// ── Exercises & lessons ──
import syntaxExercises from '../syntax-exercises.json'
import advancedStages from '../advanced-stages.json'
import balaghaLessons from '../balagha-lessons.json'
import discourseStructure from '../discourse-structure.json'

// ── Reference & config ──
import suraIndex from '../sura-index.json'
import lanesLexiconUrls from '../lanes-lexicon-urls.json'
import quranChecksum from '../quran-checksum.json'
import audioConfig from '../audio-config.json'

// ── Helper: collect verse counts per surah from a text-layer file ──
function verseCountsFromTextLayer(data) {
  return data.surahs.map(s => s.verses.length)
}

// ===================================================================
//  1. quran-simple-clean.json
// ===================================================================
describe('quran-simple-clean.json', () => {
  it('loads and has a surahs array', () => {
    expect(quranSimpleClean).toHaveProperty('surahs')
    expect(Array.isArray(quranSimpleClean.surahs)).toBe(true)
  })

  it('contains exactly 114 surahs', () => {
    expect(quranSimpleClean.surahs).toHaveLength(114)
  })

  it('contains exactly 6236 total verses', () => {
    const total = quranSimpleClean.surahs.reduce((sum, s) => sum + s.verses.length, 0)
    expect(total).toBe(6236)
  })

  it('surah numbers are sequential 1..114', () => {
    quranSimpleClean.surahs.forEach((s, i) => {
      expect(s.number).toBe(i + 1)
    })
  })

  it('every verse has number (int) and text (non-empty string)', () => {
    for (const surah of quranSimpleClean.surahs) {
      for (const v of surah.verses) {
        expect(typeof v.number).toBe('number')
        expect(typeof v.text).toBe('string')
        expect(v.text.length).toBeGreaterThan(0)
      }
    }
  })

  it('verse numbers within each surah are sequential starting from 1', () => {
    for (const surah of quranSimpleClean.surahs) {
      surah.verses.forEach((v, i) => {
        expect(v.number).toBe(i + 1)
      })
    }
  })
})

// ===================================================================
//  2. quran-uthmani.json
// ===================================================================
describe('quran-uthmani.json', () => {
  it('loads and has a surahs array', () => {
    expect(quranUthmani).toHaveProperty('surahs')
    expect(Array.isArray(quranUthmani.surahs)).toBe(true)
  })

  it('contains exactly 114 surahs', () => {
    expect(quranUthmani.surahs).toHaveLength(114)
  })

  it('verse counts match quran-simple-clean exactly', () => {
    const simpleCounts = verseCountsFromTextLayer(quranSimpleClean)
    const uthmaniCounts = verseCountsFromTextLayer(quranUthmani)
    expect(uthmaniCounts).toEqual(simpleCounts)
  })

  it('every verse has number and text', () => {
    for (const surah of quranUthmani.surahs) {
      for (const v of surah.verses) {
        expect(typeof v.number).toBe('number')
        expect(typeof v.text).toBe('string')
        expect(v.text.length).toBeGreaterThan(0)
      }
    }
  })
})

// ===================================================================
//  3. quran-rasm.json
// ===================================================================
describe('quran-rasm.json', () => {
  it('loads and has a surahs array', () => {
    expect(quranRasm).toHaveProperty('surahs')
    expect(Array.isArray(quranRasm.surahs)).toBe(true)
  })

  it('contains exactly 114 surahs', () => {
    expect(quranRasm.surahs).toHaveLength(114)
  })

  it('verse counts match quran-simple-clean', () => {
    const simpleCounts = verseCountsFromTextLayer(quranSimpleClean)
    const rasmCounts = verseCountsFromTextLayer(quranRasm)
    expect(rasmCounts).toEqual(simpleCounts)
  })

  it('every verse has number and text', () => {
    for (const surah of quranRasm.surahs) {
      for (const v of surah.verses) {
        expect(typeof v.number).toBe('number')
        expect(typeof v.text).toBe('string')
        expect(v.text.length).toBeGreaterThan(0)
      }
    }
  })
})

// ===================================================================
//  4. quran-vocalized.json
// ===================================================================
describe('quran-vocalized.json', () => {
  it('loads and has a surahs array', () => {
    expect(quranVocalized).toHaveProperty('surahs')
    expect(Array.isArray(quranVocalized.surahs)).toBe(true)
  })

  it('contains exactly 114 surahs', () => {
    expect(quranVocalized.surahs).toHaveLength(114)
  })

  it('verse counts match quran-simple-clean', () => {
    const simpleCounts = verseCountsFromTextLayer(quranSimpleClean)
    const vocalizedCounts = verseCountsFromTextLayer(quranVocalized)
    expect(vocalizedCounts).toEqual(simpleCounts)
  })

  it('every verse has number and text', () => {
    for (const surah of quranVocalized.surahs) {
      for (const v of surah.verses) {
        expect(typeof v.number).toBe('number')
        expect(typeof v.text).toBe('string')
        expect(v.text.length).toBeGreaterThan(0)
      }
    }
  })
})

// ===================================================================
//  5. quran-morphology-db.json
// ===================================================================
describe('quran-morphology-db.json', () => {
  it('loads and has a words array', () => {
    expect(quranMorphologyDb).toHaveProperty('words')
    expect(Array.isArray(quranMorphologyDb.words)).toBe(true)
  })

  it('words array is non-empty (77k+ entries expected)', () => {
    expect(quranMorphologyDb.words.length).toBeGreaterThan(70000)
  })

  it('has a meta object', () => {
    expect(quranMorphologyDb).toHaveProperty('meta')
  })

  it('every word has l (location), p (POS), v (vocalized)', () => {
    // check first 100 and last 100 to avoid slow full-scan
    const sample = [
      ...quranMorphologyDb.words.slice(0, 100),
      ...quranMorphologyDb.words.slice(-100),
    ]
    for (const w of sample) {
      expect(w).toHaveProperty('l')
      expect(w).toHaveProperty('p')
      expect(w).toHaveProperty('v')
      expect(typeof w.l).toBe('string')
      expect(typeof w.p).toBe('string')
      expect(typeof w.v).toBe('string')
    }
  })

  it('location format is surah:ayah:word (colon-separated numbers)', () => {
    const sample = quranMorphologyDb.words.slice(0, 50)
    for (const w of sample) {
      expect(w.l).toMatch(/^\d+:\d+:\d+$/)
    }
  })

  it('first word is 1:1:1', () => {
    expect(quranMorphologyDb.words[0].l).toBe('1:1:1')
  })
})

// ===================================================================
//  6. particles.json
// ===================================================================
describe('particles.json', () => {
  it('loads and has a particles array', () => {
    expect(particles).toHaveProperty('particles')
    expect(Array.isArray(particles.particles)).toBe(true)
  })

  it('particles array is non-empty', () => {
    expect(particles.particles.length).toBeGreaterThan(0)
  })

  it('has meta with totalCount matching array length', () => {
    expect(particles).toHaveProperty('meta')
    expect(particles.meta.totalCount).toBe(particles.particles.length)
  })

  it('every particle has id, arabic, consonantal, transliteration, german, function, category', () => {
    for (const p of particles.particles) {
      expect(p).toHaveProperty('id')
      expect(p).toHaveProperty('arabic')
      expect(p).toHaveProperty('consonantal')
      expect(p).toHaveProperty('transliteration')
      expect(p).toHaveProperty('german')
      expect(p).toHaveProperty('function')
      expect(p).toHaveProperty('category')
    }
  })

  it('particle IDs are unique', () => {
    const ids = particles.particles.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

// ===================================================================
//  7. pronouns.json
// ===================================================================
describe('pronouns.json', () => {
  it('has independent section with pronouns array', () => {
    expect(pronouns).toHaveProperty('independent')
    expect(pronouns.independent).toHaveProperty('pronouns')
    expect(Array.isArray(pronouns.independent.pronouns)).toBe(true)
    expect(pronouns.independent.pronouns.length).toBeGreaterThan(0)
  })

  it('has suffix section with pronouns array', () => {
    expect(pronouns).toHaveProperty('suffix')
    expect(pronouns.suffix).toHaveProperty('pronouns')
    expect(Array.isArray(pronouns.suffix.pronouns)).toBe(true)
    expect(pronouns.suffix.pronouns.length).toBeGreaterThan(0)
  })

  it('has demonstrative section with nested pronouns', () => {
    expect(pronouns).toHaveProperty('demonstrative')
    // demonstrative has near/far sub-sections each with pronouns
    if (pronouns.demonstrative.near) {
      expect(Array.isArray(pronouns.demonstrative.near.pronouns)).toBe(true)
      expect(pronouns.demonstrative.near.pronouns.length).toBeGreaterThan(0)
    }
    if (pronouns.demonstrative.far) {
      expect(Array.isArray(pronouns.demonstrative.far.pronouns)).toBe(true)
      expect(pronouns.demonstrative.far.pronouns.length).toBeGreaterThan(0)
    }
  })

  it('has relative section with pronouns array', () => {
    expect(pronouns).toHaveProperty('relative')
    expect(pronouns.relative).toHaveProperty('pronouns')
    expect(Array.isArray(pronouns.relative.pronouns)).toBe(true)
    expect(pronouns.relative.pronouns.length).toBeGreaterThan(0)
  })

  it('independent pronouns have id, arabic, transliteration, german', () => {
    for (const p of pronouns.independent.pronouns) {
      expect(p).toHaveProperty('id')
      expect(p).toHaveProperty('arabic')
      expect(p).toHaveProperty('transliteration')
      expect(p).toHaveProperty('german')
    }
  })
})

// ===================================================================
//  8. alphabet.json
// ===================================================================
describe('alphabet.json', () => {
  it('has a letters array', () => {
    expect(alphabet).toHaveProperty('letters')
    expect(Array.isArray(alphabet.letters)).toBe(true)
  })

  it('has 28 letters', () => {
    expect(alphabet.letters).toHaveLength(28)
  })

  it('every letter has name, transliteration, and forms.isolated', () => {
    for (const l of alphabet.letters) {
      expect(l).toHaveProperty('name')
      expect(typeof l.name).toBe('string')
      expect(l).toHaveProperty('transliteration')
      expect(l).toHaveProperty('forms')
      expect(l.forms).toHaveProperty('isolated')
      expect(l.forms.isolated.length).toBeGreaterThan(0)
    }
  })

  it('letter IDs are sequential 1..28', () => {
    alphabet.letters.forEach((l, i) => {
      expect(l.id).toBe(i + 1)
    })
  })

  it('first letter is Alif', () => {
    expect(alphabet.letters[0].name).toBe('Alif')
  })
})

// ===================================================================
//  9. morphology-lessons.json
// ===================================================================
describe('morphology-lessons.json', () => {
  it('has a lessons array', () => {
    expect(morphologyLessons).toHaveProperty('lessons')
    expect(Array.isArray(morphologyLessons.lessons)).toBe(true)
  })

  it('lessons array is non-empty', () => {
    expect(morphologyLessons.lessons.length).toBeGreaterThan(0)
  })

  it('every lesson has id and title', () => {
    for (const lesson of morphologyLessons.lessons) {
      expect(lesson).toHaveProperty('id')
      expect(lesson).toHaveProperty('title')
      expect(typeof lesson.title).toBe('string')
      expect(lesson.title.length).toBeGreaterThan(0)
    }
  })

  it('has meta with module number', () => {
    expect(morphologyLessons).toHaveProperty('meta')
    expect(morphologyLessons.meta).toHaveProperty('module')
  })
})

// ===================================================================
// 10. morphology-tables.json
// ===================================================================
describe('morphology-tables.json', () => {
  it('has a verbForms array', () => {
    expect(morphologyTables).toHaveProperty('verbForms')
    expect(Array.isArray(morphologyTables.verbForms)).toBe(true)
  })

  it('verbForms array is non-empty', () => {
    expect(morphologyTables.verbForms.length).toBeGreaterThan(0)
  })

  it('first verbForm has a form identifier', () => {
    expect(morphologyTables.verbForms[0]).toHaveProperty('form')
  })

  it('has meta with conjugation person order', () => {
    expect(morphologyTables).toHaveProperty('meta')
    expect(morphologyTables.meta).toHaveProperty('conjugationPersonOrder')
    expect(Array.isArray(morphologyTables.meta.conjugationPersonOrder)).toBe(true)
  })
})

// ===================================================================
// 11. ambiguities.json
// ===================================================================
describe('ambiguities.json', () => {
  it('has an entries array', () => {
    expect(ambiguities).toHaveProperty('entries')
    expect(Array.isArray(ambiguities.entries)).toBe(true)
  })

  it('entries array is non-empty', () => {
    expect(ambiguities.entries.length).toBeGreaterThan(0)
  })

  it('every entry has consonants and options array', () => {
    for (const entry of ambiguities.entries) {
      expect(entry).toHaveProperty('consonants')
      expect(entry).toHaveProperty('options')
      expect(Array.isArray(entry.options)).toBe(true)
      expect(entry.options.length).toBeGreaterThan(0)
    }
  })

  it('first entry has id and location', () => {
    const first = ambiguities.entries[0]
    expect(first).toHaveProperty('id')
    expect(first).toHaveProperty('location')
  })

  it('has _meta with categories', () => {
    expect(ambiguities).toHaveProperty('_meta')
    expect(ambiguities._meta).toHaveProperty('categories')
  })
})

// ===================================================================
// 12. root-frequency.json
// ===================================================================
describe('root-frequency.json', () => {
  it('has a roots array', () => {
    expect(rootFrequency).toHaveProperty('roots')
    expect(Array.isArray(rootFrequency.roots)).toBe(true)
  })

  it('roots array is non-empty', () => {
    expect(rootFrequency.roots.length).toBeGreaterThan(0)
  })

  it('every root has root, count, rank', () => {
    for (const r of rootFrequency.roots) {
      expect(r).toHaveProperty('root')
      expect(r).toHaveProperty('count')
      expect(r).toHaveProperty('rank')
      expect(typeof r.rank).toBe('number')
      expect(typeof r.count).toBe('number')
    }
  })

  it('has meta with totalRoots', () => {
    expect(rootFrequency).toHaveProperty('meta')
    expect(rootFrequency.meta).toHaveProperty('totalRoots')
    expect(rootFrequency.meta.totalRoots).toBeGreaterThan(0)
  })

  it('roots are sorted by rank ascending', () => {
    for (let i = 1; i < rootFrequency.roots.length; i++) {
      expect(rootFrequency.roots[i].rank).toBeGreaterThanOrEqual(rootFrequency.roots[i - 1].rank)
    }
  })
})

// ===================================================================
// 13. root-frequency-complete.json
// ===================================================================
describe('root-frequency-complete.json', () => {
  it('has a roots array', () => {
    expect(rootFrequencyComplete).toHaveProperty('roots')
    expect(Array.isArray(rootFrequencyComplete.roots)).toBe(true)
  })

  it('roots array is non-empty', () => {
    expect(rootFrequencyComplete.roots.length).toBeGreaterThan(0)
  })

  it('every root has rootArabic, rank, count', () => {
    for (const r of rootFrequencyComplete.roots) {
      expect(r).toHaveProperty('rootArabic')
      expect(r).toHaveProperty('rank')
      expect(r).toHaveProperty('count')
      expect(typeof r.rank).toBe('number')
      expect(typeof r.count).toBe('number')
    }
  })

  it('has meta with totalRoots matching meta in root-frequency', () => {
    expect(rootFrequencyComplete).toHaveProperty('meta')
    expect(rootFrequencyComplete.meta.totalRoots).toBe(rootFrequency.meta.totalRoots)
  })

  it('contains at least as many roots as root-frequency.json', () => {
    expect(rootFrequencyComplete.roots.length).toBeGreaterThanOrEqual(rootFrequency.roots.length)
  })
})

// ===================================================================
// 14. root-meanings.json
// ===================================================================
describe('root-meanings.json', () => {
  it('has a roots array', () => {
    expect(rootMeanings).toHaveProperty('roots')
    expect(Array.isArray(rootMeanings.roots)).toBe(true)
  })

  it('roots array is non-empty', () => {
    expect(rootMeanings.roots.length).toBeGreaterThan(0)
  })

  it('every root has root and meaning', () => {
    for (const r of rootMeanings.roots) {
      expect(r).toHaveProperty('root')
      expect(r).toHaveProperty('meaning')
      expect(typeof r.root).toBe('string')
      expect(typeof r.meaning).toBe('string')
    }
  })

  it('has meta with totalRoots', () => {
    expect(rootMeanings).toHaveProperty('meta')
    expect(rootMeanings.meta).toHaveProperty('totalRoots')
    expect(rootMeanings.meta.totalRoots).toBeGreaterThan(0)
  })
})

// ===================================================================
// 15. audio-config.json
// ===================================================================
describe('audio-config.json', () => {
  it('has reciters array', () => {
    expect(audioConfig).toHaveProperty('reciters')
    expect(Array.isArray(audioConfig.reciters)).toBe(true)
    expect(audioConfig.reciters.length).toBeGreaterThan(0)
  })

  it('has defaultReciter string', () => {
    expect(audioConfig).toHaveProperty('defaultReciter')
    expect(typeof audioConfig.defaultReciter).toBe('string')
  })

  it('has surahAyahCounts with counts array of 114 entries', () => {
    expect(audioConfig).toHaveProperty('surahAyahCounts')
    expect(audioConfig.surahAyahCounts).toHaveProperty('counts')
    expect(Array.isArray(audioConfig.surahAyahCounts.counts)).toBe(true)
    expect(audioConfig.surahAyahCounts.counts).toHaveLength(114)
  })

  it('surahAyahCounts.counts match quran-simple-clean verse counts', () => {
    const simpleCounts = quranSimpleClean.surahs.map(s => s.verses.length)
    expect(audioConfig.surahAyahCounts.counts).toEqual(simpleCounts)
  })

  it('every reciter has id, name, folder', () => {
    for (const r of audioConfig.reciters) {
      expect(r).toHaveProperty('id')
      expect(r).toHaveProperty('name')
      expect(r).toHaveProperty('folder')
    }
  })
})

// ===================================================================
// 16. collocations.json
// ===================================================================
describe('collocations.json', () => {
  it('has rootCollocations or wordBigrams arrays', () => {
    const hasRootCollocations = collocations.rootCollocations && Array.isArray(collocations.rootCollocations)
    const hasWordBigrams = collocations.wordBigrams && Array.isArray(collocations.wordBigrams)
    expect(hasRootCollocations || hasWordBigrams).toBe(true)
  })

  it('rootCollocations is a non-empty array', () => {
    expect(collocations).toHaveProperty('rootCollocations')
    expect(Array.isArray(collocations.rootCollocations)).toBe(true)
    expect(collocations.rootCollocations.length).toBeGreaterThan(0)
  })

  it('rootCollocations entries have root1, root2, coOccurrences', () => {
    const first = collocations.rootCollocations[0]
    expect(first).toHaveProperty('root1')
    expect(first).toHaveProperty('root2')
    expect(first).toHaveProperty('coOccurrences')
  })

  it('wordBigrams is a non-empty array', () => {
    expect(collocations).toHaveProperty('wordBigrams')
    expect(Array.isArray(collocations.wordBigrams)).toBe(true)
    expect(collocations.wordBigrams.length).toBeGreaterThan(0)
  })

  it('has meta with totalRootPairs and totalBigrams', () => {
    expect(collocations).toHaveProperty('meta')
    expect(collocations.meta).toHaveProperty('totalRootPairs')
    expect(collocations.meta).toHaveProperty('totalBigrams')
  })
})

// ===================================================================
// 17. thematic-fields.json
// ===================================================================
describe('thematic-fields.json', () => {
  it('has a fields array', () => {
    expect(thematicFields).toHaveProperty('fields')
    expect(Array.isArray(thematicFields.fields)).toBe(true)
  })

  it('fields array is non-empty', () => {
    expect(thematicFields.fields.length).toBeGreaterThan(0)
  })

  it('every field has id and title', () => {
    for (const field of thematicFields.fields) {
      expect(field).toHaveProperty('id')
      expect(field).toHaveProperty('title')
      expect(typeof field.id).toBe('string')
      expect(typeof field.title).toBe('string')
    }
  })

  it('field IDs are unique', () => {
    const ids = thematicFields.fields.map(f => f.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has meta with totalFields', () => {
    expect(thematicFields).toHaveProperty('meta')
    expect(thematicFields.meta).toHaveProperty('totalFields')
  })
})

// ===================================================================
// 19. sura-index.json
// ===================================================================
describe('sura-index.json', () => {
  it('has a surahs array', () => {
    expect(suraIndex).toHaveProperty('surahs')
    expect(Array.isArray(suraIndex.surahs)).toBe(true)
  })

  it('has 114 surah entries', () => {
    expect(suraIndex.surahs).toHaveLength(114)
  })

  it('every surah has number, nameArabic, verseCount', () => {
    for (const s of suraIndex.surahs) {
      expect(s).toHaveProperty('number')
      expect(s).toHaveProperty('nameArabic')
      expect(s).toHaveProperty('verseCount')
      expect(typeof s.number).toBe('number')
      expect(typeof s.verseCount).toBe('number')
    }
  })

  it('verse counts in sura-index match quran-simple-clean', () => {
    for (let i = 0; i < 114; i++) {
      expect(
        suraIndex.surahs[i].verseCount,
        `Surah ${i + 1} verse count mismatch`
      ).toBe(quranSimpleClean.surahs[i].verses.length)
    }
  })

  it('has meta with totalSurahs = 114', () => {
    expect(suraIndex).toHaveProperty('meta')
    expect(suraIndex.meta.totalSurahs).toBe(114)
  })
})

// ===================================================================
// 20. syntax-exercises.json
// ===================================================================
describe('syntax-exercises.json', () => {
  it('has an exercises array', () => {
    expect(syntaxExercises).toHaveProperty('exercises')
    expect(Array.isArray(syntaxExercises.exercises)).toBe(true)
  })

  it('exercises array is non-empty', () => {
    expect(syntaxExercises.exercises.length).toBeGreaterThan(0)
  })

  it('every exercise has id and type', () => {
    for (const ex of syntaxExercises.exercises) {
      expect(ex).toHaveProperty('id')
      expect(ex).toHaveProperty('type')
    }
  })

  it('has meta with totalExercises matching array length', () => {
    expect(syntaxExercises).toHaveProperty('meta')
    expect(syntaxExercises.meta.totalExercises).toBe(syntaxExercises.exercises.length)
  })
})

// ===================================================================
// 21. advanced-stages.json
// ===================================================================
describe('advanced-stages.json', () => {
  it('has a stages array', () => {
    expect(advancedStages).toHaveProperty('stages')
    expect(Array.isArray(advancedStages.stages)).toBe(true)
  })

  it('stages array is non-empty', () => {
    expect(advancedStages.stages.length).toBeGreaterThan(0)
  })

  it('every stage has id and title', () => {
    for (const stage of advancedStages.stages) {
      expect(stage).toHaveProperty('id')
      expect(stage).toHaveProperty('title')
      expect(typeof stage.title).toBe('string')
    }
  })

  it('has meta with module number', () => {
    expect(advancedStages).toHaveProperty('meta')
    expect(advancedStages.meta).toHaveProperty('module')
  })
})

// ===================================================================
// 22. balagha-lessons.json
// ===================================================================
describe('balagha-lessons.json', () => {
  it('has a lessons array', () => {
    expect(balaghaLessons).toHaveProperty('lessons')
    expect(Array.isArray(balaghaLessons.lessons)).toBe(true)
  })

  it('lessons array is non-empty', () => {
    expect(balaghaLessons.lessons.length).toBeGreaterThan(0)
  })

  it('every lesson has id and title', () => {
    for (const lesson of balaghaLessons.lessons) {
      expect(lesson).toHaveProperty('id')
      expect(lesson).toHaveProperty('title')
      expect(typeof lesson.title).toBe('string')
    }
  })

  it('has meta with title', () => {
    expect(balaghaLessons).toHaveProperty('meta')
    expect(balaghaLessons.meta).toHaveProperty('title')
  })
})

// ===================================================================
// 23. discourse-structure.json
// ===================================================================
describe('discourse-structure.json', () => {
  it('has a stages array', () => {
    expect(discourseStructure).toHaveProperty('stages')
    expect(Array.isArray(discourseStructure.stages)).toBe(true)
  })

  it('stages array is non-empty', () => {
    expect(discourseStructure.stages.length).toBeGreaterThan(0)
  })

  it('every stage has id and title', () => {
    for (const stage of discourseStructure.stages) {
      expect(stage).toHaveProperty('id')
      expect(stage).toHaveProperty('title')
      expect(typeof stage.title).toBe('string')
    }
  })

  it('has meta with title', () => {
    expect(discourseStructure).toHaveProperty('meta')
    expect(discourseStructure.meta).toHaveProperty('title')
  })
})

// ===================================================================
// 24. hapax-legomena.json
// ===================================================================
describe('hapax-legomena.json', () => {
  it('loads and has entries', () => {
    expect(hapaxLegomena).toBeDefined()
    expect(typeof hapaxLegomena).toBe('object')
  })

  it('has byVocalizedForm array', () => {
    expect(hapaxLegomena).toHaveProperty('byVocalizedForm')
    expect(Array.isArray(hapaxLegomena.byVocalizedForm)).toBe(true)
    expect(hapaxLegomena.byVocalizedForm.length).toBeGreaterThan(0)
  })

  it('byVocalizedForm entries have vocalized, consonantal, location', () => {
    const sample = hapaxLegomena.byVocalizedForm.slice(0, 20)
    for (const entry of sample) {
      expect(entry).toHaveProperty('vocalized')
      expect(entry).toHaveProperty('consonantal')
      expect(entry).toHaveProperty('location')
    }
  })

  it('has meta with hapaxByVocalizedForm count', () => {
    expect(hapaxLegomena).toHaveProperty('meta')
    expect(hapaxLegomena.meta).toHaveProperty('hapaxByVocalizedForm')
    expect(hapaxLegomena.meta.hapaxByVocalizedForm).toBeGreaterThan(0)
  })
})

// ===================================================================
// 25. diptote-data.json
// ===================================================================
describe('diptote-data.json', () => {
  it('has a categories array', () => {
    expect(diptoteData).toHaveProperty('categories')
    expect(Array.isArray(diptoteData.categories)).toBe(true)
  })

  it('categories array is non-empty', () => {
    expect(diptoteData.categories.length).toBeGreaterThan(0)
  })

  it('every category has id and title', () => {
    for (const cat of diptoteData.categories) {
      expect(cat).toHaveProperty('id')
      expect(cat).toHaveProperty('title')
      expect(typeof cat.title).toBe('string')
    }
  })

  it('has explanation section', () => {
    expect(diptoteData).toHaveProperty('explanation')
    expect(diptoteData.explanation).toHaveProperty('triptote')
    expect(diptoteData.explanation).toHaveProperty('diptote')
  })
})

// ===================================================================
// 26. idafa-subtypes.json
// ===================================================================
describe('idafa-subtypes.json', () => {
  it('has a subtypes array', () => {
    expect(idafaSubtypes).toHaveProperty('subtypes')
    expect(Array.isArray(idafaSubtypes.subtypes)).toBe(true)
  })

  it('subtypes array is non-empty', () => {
    expect(idafaSubtypes.subtypes.length).toBeGreaterThan(0)
  })

  it('every subtype has id, name, examples', () => {
    for (const sub of idafaSubtypes.subtypes) {
      expect(sub).toHaveProperty('id')
      expect(sub).toHaveProperty('name')
      expect(sub).toHaveProperty('examples')
      expect(Array.isArray(sub.examples)).toBe(true)
    }
  })

  it('has meta with title', () => {
    expect(idafaSubtypes).toHaveProperty('meta')
    expect(idafaSubtypes.meta).toHaveProperty('title')
  })
})

// ===================================================================
// 27. ellipsis-hints.json
// ===================================================================
describe('ellipsis-hints.json', () => {
  it('loads and has content', () => {
    expect(ellipsisHints).toBeDefined()
    expect(typeof ellipsisHints).toBe('object')
  })

  it('has transitiveVerbs array', () => {
    expect(ellipsisHints).toHaveProperty('transitiveVerbs')
    expect(Array.isArray(ellipsisHints.transitiveVerbs)).toBe(true)
    expect(ellipsisHints.transitiveVerbs.length).toBeGreaterThan(0)
  })

  it('has hints object with known hint types', () => {
    expect(ellipsisHints).toHaveProperty('hints')
    expect(typeof ellipsisHints.hints).toBe('object')
    expect(ellipsisHints.hints).toHaveProperty('missing_object')
  })

  it('has concreteExamples array', () => {
    expect(ellipsisHints).toHaveProperty('concreteExamples')
    expect(Array.isArray(ellipsisHints.concreteExamples)).toBe(true)
    expect(ellipsisHints.concreteExamples.length).toBeGreaterThan(0)
  })

  it('has meta with title', () => {
    expect(ellipsisHints).toHaveProperty('meta')
    expect(ellipsisHints.meta).toHaveProperty('title')
  })
})

// ===================================================================
// 28. lanes-lexicon-urls.json
// ===================================================================
describe('lanes-lexicon-urls.json', () => {
  it('has frequentRootsWithLaneReferences', () => {
    expect(lanesLexiconUrls).toHaveProperty('frequentRootsWithLaneReferences')
    expect(typeof lanesLexiconUrls.frequentRootsWithLaneReferences).toBe('object')
  })

  it('frequentRootsWithLaneReferences has a roots array', () => {
    const section = lanesLexiconUrls.frequentRootsWithLaneReferences
    expect(section).toHaveProperty('roots')
    expect(Array.isArray(section.roots)).toBe(true)
    expect(section.roots.length).toBeGreaterThan(0)
  })

  it('roots entries have root, lanesUrl, corpusUrl', () => {
    const sample = lanesLexiconUrls.frequentRootsWithLaneReferences.roots.slice(0, 10)
    for (const r of sample) {
      expect(r).toHaveProperty('root')
      expect(r).toHaveProperty('lanesUrl')
      expect(r).toHaveProperty('corpusUrl')
      expect(r.lanesUrl).toMatch(/^https?:\/\//)
      expect(r.corpusUrl).toMatch(/^https?:\/\//)
    }
  })

  it('has primarySource with baseUrl', () => {
    expect(lanesLexiconUrls).toHaveProperty('primarySource')
    expect(lanesLexiconUrls.primarySource).toHaveProperty('baseUrl')
  })

  it('has meta', () => {
    expect(lanesLexiconUrls).toHaveProperty('meta')
  })
})

// ===================================================================
// 29. quran-checksum.json
// ===================================================================
describe('quran-checksum.json', () => {
  it('has hash string', () => {
    expect(quranChecksum).toHaveProperty('hash')
    expect(typeof quranChecksum.hash).toBe('string')
    expect(quranChecksum.hash.length).toBeGreaterThan(0)
  })

  it('has totalSurahs = 114', () => {
    expect(quranChecksum).toHaveProperty('totalSurahs')
    expect(quranChecksum.totalSurahs).toBe(114)
  })

  it('has totalVerses = 6236', () => {
    expect(quranChecksum).toHaveProperty('totalVerses')
    expect(quranChecksum.totalVerses).toBe(6236)
  })

  it('has algorithm field', () => {
    expect(quranChecksum).toHaveProperty('algorithm')
    expect(typeof quranChecksum.algorithm).toBe('string')
  })

  it('totalSurahs matches actual quran-simple-clean surah count', () => {
    expect(quranChecksum.totalSurahs).toBe(quranSimpleClean.surahs.length)
  })

  it('totalVerses matches actual quran-simple-clean verse count', () => {
    const total = quranSimpleClean.surahs.reduce((sum, s) => sum + s.verses.length, 0)
    expect(quranChecksum.totalVerses).toBe(total)
  })
})

// ===================================================================
//  Cross-reference checks across files
// ===================================================================
describe('Cross-file integrity', () => {
  it('quran-uthmani verse counts match quran-simple-clean for all 114 surahs', () => {
    for (let i = 0; i < 114; i++) {
      expect(
        quranUthmani.surahs[i].verses.length,
        `Surah ${i + 1}: uthmani vs simple-clean verse count mismatch`
      ).toBe(quranSimpleClean.surahs[i].verses.length)
    }
  })

  it('quran-rasm verse counts match quran-simple-clean for all 114 surahs', () => {
    for (let i = 0; i < 114; i++) {
      expect(
        quranRasm.surahs[i].verses.length,
        `Surah ${i + 1}: rasm vs simple-clean verse count mismatch`
      ).toBe(quranSimpleClean.surahs[i].verses.length)
    }
  })

  it('quran-vocalized verse counts match quran-simple-clean for all 114 surahs', () => {
    for (let i = 0; i < 114; i++) {
      expect(
        quranVocalized.surahs[i].verses.length,
        `Surah ${i + 1}: vocalized vs simple-clean verse count mismatch`
      ).toBe(quranSimpleClean.surahs[i].verses.length)
    }
  })

  it('root-frequency and root-frequency-complete agree on top root', () => {
    expect(rootFrequency.roots[0].root).toBe(rootFrequencyComplete.roots[0].root)
  })

  it('root-frequency and root-meanings share the same first root', () => {
    expect(rootFrequency.roots[0].root).toBe(rootMeanings.roots[0].root)
  })

  it('sura-index surah count equals quran-simple-clean surah count', () => {
    expect(suraIndex.surahs.length).toBe(quranSimpleClean.surahs.length)
  })

  it('quran-checksum totals are consistent with actual data', () => {
    expect(quranChecksum.totalSurahs).toBe(quranSimpleClean.surahs.length)
    const actualVerses = quranSimpleClean.surahs.reduce((s, su) => s + su.verses.length, 0)
    expect(quranChecksum.totalVerses).toBe(actualVerses)
  })

  it('morphology-db word count matches meta if present', () => {
    if (quranMorphologyDb.meta && quranMorphologyDb.meta.totalWords) {
      expect(quranMorphologyDb.words.length).toBe(quranMorphologyDb.meta.totalWords)
    }
  })

  it('root-meanings totalRoots matches root-frequency-complete totalRoots', () => {
    expect(rootMeanings.meta.totalRoots).toBe(rootFrequencyComplete.meta.totalRoots)
  })

  it('lanes-lexicon-urls totalRoots matches root-frequency totalRoots', () => {
    expect(lanesLexiconUrls.frequentRootsWithLaneReferences.totalRoots).toBe(
      rootFrequency.meta.totalRoots
    )
  })
})

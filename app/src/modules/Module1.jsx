import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { saveModuleProgress, loadModuleProgress } from '../utils/storage.js';
import alphabetData from '../data/alphabet.json';
import phonologieData from '../data/phonologie-lesson.json';
import ijamData from '../data/ijam-lesson.json';
import ArabicKeyboard from '../components/ArabicKeyboard.jsx';

import hamzaSeatData from '../data/hamza-seat-rules.json';
import readingProgressionData from '../data/reading-progression.json';
import minimalPairsData from '../data/minimal-pairs-drill.json';
import shaddaLessonData from '../data/shadda-lesson.json';
import vowelLengthData from '../data/vowel-length-drill.json';

/* ───────────────────────────────────────────────────────────
   Modul 1: Schrift-Trainer (Script Trainer)

   Teil A: Lernmodus — Lektionen 1.1 bis 1.5
   Teil B: Prüfmodus — Übungen und Tests
   ─────────────────────────────────────────────────────────── */

const { letters, tashkil, minimalPairs, hurufMuqattaat, sunLetters, moonLetters, surah1 } =
  alphabetData;

// ─── Hilfsfunktionen ───

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Audio-Hilfsfunktionen für Buchstaben-Audio ───

// Mapping von Buchstaben-Name zu Audio-Dateiname (echte Aufnahmen)
const LETTER_AUDIO_MAP = {
  'Alif': 'alif', 'Bāʾ': 'ba', 'Tāʾ': 'ta', 'Thāʾ': 'tha',
  'Jīm': 'jiim', 'Ḥāʾ': 'hha', 'Khāʾ': 'kha', 'Dāl': 'daal',
  'Dhāl': 'thaal', 'Rāʾ': 'ra', 'Zāy': 'zay', 'Sīn': 'siin',
  'Shīn': 'shiin', 'Ṣād': 'saad', 'Ḍād': 'daad', 'Ṭāʾ': 'taa',
  'Ẓāʾ': 'thaa', 'ʿAyn': 'ayn', 'Ghayn': 'ghayn', 'Fāʾ': 'fa',
  'Qāf': 'qaf', 'Kāf': 'kaf', 'Lām': 'lam', 'Mīm': 'miim',
  'Nūn': 'nuun', 'Hāʾ': 'ha', 'Wāw': 'waw', 'Yāʾ': 'ya',
};

/**
 * Spielt die echte Audio-Aufnahme eines Buchstaben ab.
 * Quelle: arabicreadingcourse.com (isolierte Buchstabenlaute, native Sprecher).
 */
function playLetterAudio(letter, onUnavailable) {
  const audioFile = LETTER_AUDIO_MAP[letter.name];
  if (!audioFile) {
    if (onUnavailable) onUnavailable();
    return false;
  }
  const audio = new Audio(`/audio/letters/${audioFile}.mp3`);
  audio.play().catch(() => {
    if (onUnavailable) onUnavailable();
  });
  return true;
}

// ─── Sub-Components für Lernmodus ───

/* ────────────────────────────────────────────────────────
   Lesson 1.1: Das Alphabet (28 Buchstaben)
   ──────────────────────────────────────────────────────── */
function Lesson11({ onBack }) {
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [groupFilter, setGroupFilter] = useState('all');
  const [audioStatus, setAudioStatus] = useState(null); // null | 'playing' | 'unavailable'

  const groups = useMemo(() => {
    const g = {};
    letters.forEach((l) => {
      if (!g[l.group]) g[l.group] = [];
      g[l.group].push(l);
    });
    return g;
  }, []);

  const groupNames = useMemo(() => Object.keys(groups), [groups]);

  const filteredLetters =
    groupFilter === 'all' ? letters : groups[groupFilter] || [];

  const detail = selectedLetter;

  return (
    <div className="m1-lesson">
      <button className="m1-back-btn" onClick={onBack}>
        Zurück zur Übersicht
      </button>
      <h2 className="m1-lesson-title">Lektion 1.1 — Das Alphabet (28 Buchstaben)</h2>
      <p className="m1-lesson-intro">
        Das arabische Alphabet besteht aus 28 Buchstaben. Jeder Buchstabe hat bis zu
        vier Formen, abhängig von seiner Position im Wort: isoliert, am Anfang, in der
        Mitte und am Ende. Einige Buchstaben verbinden sich nur nach rechts (zum
        vorhergehenden Buchstaben), nicht nach links.
      </p>
      <p className="m1-lesson-intro">
        Klicke auf einen Buchstaben um alle Details zu sehen — Name, Laut,
        Artikulationsstelle und alle vier Positionen.
      </p>

      {/* Group filter */}
      <div className="m1-filter-bar">
        <button
          className={`m1-filter-btn${groupFilter === 'all' ? ' m1-filter-active' : ''}`}
          onClick={() => setGroupFilter('all')}
        >
          Alle
        </button>
        {groupNames.map((gn) => (
          <button
            key={gn}
            className={`m1-filter-btn${groupFilter === gn ? ' m1-filter-active' : ''}`}
            onClick={() => setGroupFilter(gn)}
          >
            {gn}
          </button>
        ))}
      </div>

      {/* Letter grid */}
      <div className="m1-letter-grid">
        {filteredLetters.map((l) => (
          <button
            key={l.id}
            className={`m1-letter-card${
              selectedLetter?.id === l.id ? ' m1-letter-card--active' : ''
            }`}
            onClick={() => setSelectedLetter(l)}
          >
            <span className="m1-letter-card__arabic arabic" dir="rtl">
              {l.forms.isolated}
            </span>
            <span className="m1-letter-card__name">{l.name}</span>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      {detail && (
        <div className="m1-letter-detail" id="letter-detail">
          <h3 className="m1-letter-detail__title">
            <span className="arabic m1-letter-detail__arabic" dir="rtl">
              {detail.forms.isolated}
            </span>{' '}
            — {detail.name}
          </h3>

          <div className="m1-detail-grid">
            <div className="m1-detail-cell">
              <h4>Transliteration</h4>
              <p>{detail.transliteration}</p>
            </div>
            <div className="m1-detail-cell">
              <h4>Laut</h4>
              <p>{detail.sound}</p>
            </div>
            <div className="m1-detail-cell">
              <h4>Artikulationsstelle</h4>
              <p>{detail.articulationPoint}</p>
              <p className="m1-detail-small">{detail.articulationDetail}</p>
            </div>
            <div className="m1-detail-cell">
              <h4>Verbindung</h4>
              <p>{detail.connectable ? 'Verbindet in beide Richtungen' : 'Verbindet nur nach rechts — trennt nach links'}</p>
            </div>
          </div>

          {/* Audio-Wiedergabe für Buchstaben-Laut */}
          <div className="m1-audio-section">
            <h4>Laut anhören</h4>
            <button
              className="m1-btn m1-btn--audio"
              onClick={() => {
                setAudioStatus('playing');
                const played = playLetterAudio(detail, () => setAudioStatus('unavailable'));
                if (played) {
                  setTimeout(() => setAudioStatus(null), 2000);
                }
              }}
            >
              {audioStatus === 'playing'
                ? 'Wird abgespielt...'
                : audioStatus === 'unavailable'
                ? 'Audio nicht verfügbar'
                : `Laut abspielen: ${detail.name}`}
            </button>
            {audioStatus === 'unavailable' && (
              <p className="m1-detail-small m1-audio-note">
                Audio-Datei konnte nicht geladen werden. Prüfe deine Internetverbindung.
              </p>
            )}
            <p className="m1-detail-small">
              Echte Aufnahmen arabischer Buchstabenlaute (native Sprecher).
            </p>
          </div>

          <div className="m1-forms-display">
            <h4>Die vier Positionen</h4>
            <div className="m1-forms-grid" dir="rtl">
              <div className="m1-form-box">
                <span className="m1-form-label">Isoliert</span>
                <span className="m1-form-arabic arabic">{detail.forms.isolated}</span>
              </div>
              <div className="m1-form-box">
                <span className="m1-form-label">Anfang</span>
                <span className="m1-form-arabic arabic">{detail.forms.initial}</span>
              </div>
              <div className="m1-form-box">
                <span className="m1-form-label">Mitte</span>
                <span className="m1-form-arabic arabic">{detail.forms.medial}</span>
              </div>
              <div className="m1-form-box">
                <span className="m1-form-label">Ende</span>
                <span className="m1-form-arabic arabic">{detail.forms.final}</span>
              </div>
            </div>
          </div>

          <div className="m1-example-section">
            <h4>Beispiel aus dem Quran</h4>
            <p>
              <span className="arabic" dir="rtl">{detail.exampleWord}</span>{' '}
              ({detail.exampleTransliteration}) — {detail.exampleMeaning}{' '}
              <span className="m1-ref">({detail.exampleLocation})</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Lesson 1.2: Vokalzeichen (Tashkil)
   ──────────────────────────────────────────────────────── */
function Lesson12({ onBack }) {
  const [selectedSign, setSelectedSign] = useState(null);

  return (
    <div className="m1-lesson">
      <button className="m1-back-btn" onClick={onBack}>
        Zurück zur Übersicht
      </button>
      <h2 className="m1-lesson-title">Lektion 1.2 — Vokalzeichen (Tashkil)</h2>

      <div className="m1-info-box">
        <h3>Warum wir die Vokalzeichen kennen müssen</h3>
        <p>
          Arabische Schrift schreibt nur Konsonanten und Langvokale. Die drei Kurzvokale
          (a, i, u) werden in der Konsonantenschrift nicht geschrieben. Sie wurden
          als Zeichen über und unter den Buchstaben entwickelt, um eine mögliche
          Aussprache schriftlich zu dokumentieren.
        </p>
        <p>
          <strong>Wie wurden sie eingeführt?</strong> Im 7. Jh. entstand in Basra ein erstes
          System mit farbigen Punkten. Im 8. Jh. wurden diese durch die heute
          verwendeten Formen (kleine Striche und Zeichen) ersetzt.
        </p>
        <p>
          <strong>Unser Arbeitstext (Simple Clean) zeigt den Konsonantentext ohne Vokalzeichen.</strong> Wir
          müssen sie trotzdem kennen, aus drei Gründen:
        </p>
        <ol>
          <li>
            <strong>Lane's Lexikon</strong> verwendet sie — und Lane's ist unser
            primäres Kontrollwerkzeug.
          </li>
          <li>
            <strong>Andere arabische Texte</strong> verwenden sie — wer Arabisch lernt,
            begegnet ihnen überall.
          </li>
          <li>
            <strong>Unsere eigene Analyse führt uns zu Vokalisierungen.</strong> Wenn wir
            durch Morphologie-Analyse bestimmen, dass ein Konsonantengerüst z.B. als
            „kataba" zu lesen ist, gelangen wir zu demselben Ergebnis, das die Vokalzeichen anzeigen.
            Wir müssen das System kennen, um zu verstehen was wir selbst tun.
          </li>
        </ol>
      </div>

      {/* Tashkil grid */}
      <div className="m1-tashkil-grid">
        {tashkil.map((t) => (
          <button
            key={t.id}
            className={`m1-tashkil-card${
              selectedSign?.id === t.id ? ' m1-tashkil-card--active' : ''
            }`}
            onClick={() => setSelectedSign(t)}
          >
            <span className="m1-tashkil-card__arabic arabic" dir="rtl">
              {t.example}
            </span>
            <span className="m1-tashkil-card__name">{t.name}</span>
            <span className="m1-tashkil-card__sound">{t.sound}</span>
          </button>
        ))}
      </div>

      {/* Detail */}
      {selectedSign && (
        <div className="m1-tashkil-detail">
          <h3>
            <span className="arabic" dir="rtl">{selectedSign.example}</span>{' '}
            — {selectedSign.name}
          </h3>
          <div className="m1-detail-grid">
            <div className="m1-detail-cell">
              <h4>Zeichen</h4>
              <span className="arabic m1-tashkil-symbol" dir="rtl">{selectedSign.example}</span>
            </div>
            <div className="m1-detail-cell">
              <h4>Laut</h4>
              <p>{selectedSign.sound}</p>
            </div>
            <div className="m1-detail-cell">
              <h4>Position</h4>
              <p>{selectedSign.position}</p>
            </div>
            <div className="m1-detail-cell">
              <h4>Beschreibung</h4>
              <p>{selectedSign.description}</p>
            </div>
          </div>
        </div>
      )}

      <div className="m1-note-box">
        <p>
          <strong>Merke:</strong> Die Vokalzeichen notieren eine mögliche Aussprache.
          In der Mehrzahl der Fälle ergibt die Grammatik eine
          eindeutige Vokalisierung. In manchen Fällen lässt das Konsonantengerüst
          mehrere grammatisch korrekte Vokalisierungen zu. Wer die Grammatik
          beherrscht, kann alle Optionen eigenständig ableiten.
        </p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Lesson 1.3: Besonderheiten der Schrift
   ──────────────────────────────────────────────────────── */
function Lesson13({ onBack }) {
  const [activeSection, setActiveSection] = useState(0);

  const sections = [
    {
      title: 'Hamza und seine Träger',
      content: (
        <>
          <p>
            Hamza (<span className="arabic" dir="rtl">ء</span>) ist der
            Stimmritzenverschluss — ein Laut der entsteht wenn die Stimmritze kurz
            geschlossen und wieder geöffnet wird (wie das deutsche Knack-a in „Auge").
          </p>
          <p>
            Das Besondere an Hamza: Es hat keinen festen „Sitz" im Wort. Je nach
            Position und umgebendem Vokal sitzt es auf einem von drei <strong>Trägern</strong>:
          </p>
          <div className="m1-feature-grid" dir="rtl">
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">أ</span>
              <span className="m1-feature-label">Hamza auf Alif</span>
              <span className="m1-feature-info">Am Wortanfang und bei a-Vokal</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ؤ</span>
              <span className="m1-feature-label">Hamza auf Waw</span>
              <span className="m1-feature-info">Bei u-Vokal-Umgebung</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ئ</span>
              <span className="m1-feature-label">Hamza auf Ya' (ohne Punkte)</span>
              <span className="m1-feature-info">Bei i-Vokal-Umgebung</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">إ</span>
              <span className="m1-feature-label">Hamza unter Alif</span>
              <span className="m1-feature-info">Am Wortanfang bei i-Vokal (z.B. إسلام, إبراهيم)</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ء</span>
              <span className="m1-feature-label">Hamza allein (auf der Linie)</span>
              <span className="m1-feature-info">In bestimmten Positionen</span>
            </div>
          </div>
          <p>
            Die Regeln welcher Träger verwendet wird, hängen von den umgebenden Vokalen
            ab. In unserem konsonantischen Text (Simple Clean) erscheint Hamza in seiner
            jeweiligen Schreibform — die Träger sind Teil der Konsonantenschrift, nicht
            der Vokalzeichen.
          </p>
        </>
      ),
    },
    {
      title: 'Ta Marbuta vs. Ta Maftuha',
      content: (
        <>
          <p>Zwei Formen des Buchstabens Ta':</p>
          <div className="m1-feature-grid" dir="rtl">
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ة</span>
              <span className="m1-feature-label">Ta' Marbuta („gebundenes T")</span>
              <span className="m1-feature-info">
                Steht am Wortende. Sieht aus wie Ha' (ه) mit zwei Punkten darüber.
                Wird in Pausa (am Satzende) als H gesprochen, in Verbindung als T.
              </span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ت</span>
              <span className="m1-feature-label">Ta' Maftuha („offenes T")</span>
              <span className="m1-feature-info">
                Das normale Ta'. Wird immer als T gesprochen, unabhängig von der Position.
              </span>
            </div>
          </div>
          <p>
            <strong>Wichtig:</strong> Ta' Marbuta markiert häufig das feminine Geschlecht
            bei Nomen. Beispiel: <span className="arabic" dir="rtl">رحمة</span> (rahma
            = Barmherzigkeit). In unserem konsonantischen Text ist der Unterschied klar
            sichtbar: ة vs. ت.
          </p>
        </>
      ),
    },
    {
      title: 'Alif Maqsura vs. Ya',
      content: (
        <>
          <div className="m1-feature-grid" dir="rtl">
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ى</span>
              <span className="m1-feature-label">Alif Maqsura („verkürztes Alif")</span>
              <span className="m1-feature-info">
                Sieht aus wie Ya' ohne Punkte. Steht am Wortende und repräsentiert
                einen langen a-Vokal (a). Zeigt an, dass die Wurzel auf einen
                schwachen Konsonanten (w oder y) endet.
              </span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ي</span>
              <span className="m1-feature-label">Ya'</span>
              <span className="m1-feature-info">
                Hat Punkte darunter. Repräsentiert den Konsonanten Y oder den
                Langvokal i.
              </span>
            </div>
          </div>
          <p>
            Beispiel: <span className="arabic" dir="rtl">على</span> ('ala = auf)
            — das <span className="arabic" dir="rtl">ى</span> am Ende ist ein Alif Maqsura, kein Ya'. Es zeigt den langen
            a-Vokal an. Im konsonantischen Text ohne Punkte wäre der Unterschied nicht
            sichtbar — ein weiterer Grund warum die Buchstabenpunkte (Schicht 2) so
            wichtig sind.
          </p>
        </>
      ),
    },
    {
      title: 'Lam-Alif-Ligatur',
      content: (
        <>
          <p>
            Wenn Lam (<span className="arabic" dir="rtl">ل</span>) direkt vor
            Alif (<span className="arabic" dir="rtl">ا</span>) steht, verschmelzen
            sie zu einer speziellen Form:
          </p>
          <div className="m1-feature-grid" dir="rtl">
            <div className="m1-feature-box m1-feature-box--large">
              <span className="m1-feature-arabic arabic" style={{ fontSize: '3rem' }}>لا</span>
              <span className="m1-feature-label">Lam-Alif-Ligatur</span>
              <span className="m1-feature-info">
                Zwei Buchstaben, eine Form. Kommt extrem häufig vor — z.B. im
                Negationswort لا (la = nein/nicht) und im Artikel ال (al-).
              </span>
            </div>
          </div>
          <p>
            Man muss diese Ligatur erkennen und wissen, dass sie <strong>zwei
            Buchstaben</strong> repräsentiert, nicht einen.
          </p>
        </>
      ),
    },
    {
      title: 'Sonnen- und Mondbuchstaben',
      content: (
        <>
          <p>
            Der bestimmte Artikel im Arabischen ist <span className="arabic" dir="rtl">ال</span> (al-).
            Was passiert wenn er vor bestimmten Buchstaben steht?
          </p>
          <div className="m1-sun-moon">
            <div className="m1-sun-box">
              <h4>Sonnenbuchstaben (al-Huruf al-Shamsiyya)</h4>
              <p>
                Das Lam des Artikels <strong>assimiliert</strong> sich an den folgenden
                Buchstaben — es wird nicht gesprochen, stattdessen wird der folgende
                Buchstabe verdoppelt.
              </p>
              <p>
                Beispiel: <span className="arabic" dir="rtl">الشمس</span> wird
                gesprochen als „ash-shams" (nicht „al-shams") — die Sonne.
              </p>
              <div className="m1-sun-moon-letters" dir="rtl">
                {sunLetters.map((l) => (
                  <span key={l} className="m1-sun-moon-letter arabic">{l}</span>
                ))}
              </div>
              <p className="m1-detail-small">
                14 Buchstaben. Merkhilfe: Alle koronalen Konsonanten (Zungenspitze und Zungenblatt am Zahndamm oder dahinter) sind Sonnenbuchstaben — das Lam des Artikels assimiliert sich an diese.
              </p>
            </div>
            <div className="m1-moon-box">
              <h4>Mondbuchstaben (al-Huruf al-Qamariyya)</h4>
              <p>
                Das Lam des Artikels wird <strong>normal ausgesprochen</strong>.
              </p>
              <p>
                Beispiel: <span className="arabic" dir="rtl">القمر</span> wird
                gesprochen als „al-qamar" — der Mond.
              </p>
              <div className="m1-sun-moon-letters" dir="rtl">
                {moonLetters.map((l) => (
                  <span key={l} className="m1-sun-moon-letter arabic">{l}</span>
                ))}
              </div>
              <p className="m1-detail-small">
                14 Buchstaben. Alle die weiter hinten im Mund oder an den Lippen
                artikuliert werden.
              </p>
            </div>
          </div>
          <p>
            <strong>Im Konsonantentext</strong> ändert sich die Schreibung nicht — der
            Artikel ist immer <span className="arabic" dir="rtl">ال</span>. Der
            Unterschied liegt in der Aussprache. Aber man muss ihn kennen um den Text
            korrekt lesen (vorlesen) zu können.
          </p>
        </>
      ),
    },
    {
      title: 'Alif Wasla',
      content: (
        <>
          <p>
            Alif Wasla (<span className="arabic" dir="rtl">ٱ</span>) ist ein
            „Verbindungs-Alif". Das Hamza (der Stimmritzenverschluss) fällt weg wenn
            das Wort mit dem vorhergehenden Wort verbunden gesprochen wird.
          </p>
          <div className="m1-feature-grid" dir="rtl">
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ٱ</span>
              <span className="m1-feature-label">Alif Wasla</span>
              <span className="m1-feature-info">
                Erkennbar am kleinen Sad-Zeichen über dem Alif (in vokalisierten Texten).
                In Simple Clean sieht es aus wie ein normales Alif.
              </span>
            </div>
          </div>
          <p>
            <strong>Wo kommt es vor?</strong>
          </p>
          <ul>
            <li>Im bestimmten Artikel <span className="arabic" dir="rtl">ال</span> (al-) — das häufigste Vorkommen</li>
            <li>Bei bestimmten Verbformen wie <span className="arabic" dir="rtl">انفعل</span>, <span className="arabic" dir="rtl">افتعل</span> und <span className="arabic" dir="rtl">استفعل</span> (werden in der Morphologie-Stufe behandelt)</li>
            <li>Bei einigen Nomen wie <span className="arabic" dir="rtl">ابن</span> (ibn = Sohn) und <span className="arabic" dir="rtl">اسم</span> (ism = Name)</li>
          </ul>
          <p>
            In der Praxis: Am Satzanfang wird das Alif Wasla mit Stimmritzenverschluss
            gesprochen (weil es nichts gibt womit es sich verbinden könnte). Mitten im
            Redefluss fällt der Stimmritzenverschluss weg und es wird durchgebunden.
          </p>
        </>
      ),
    },
    {
      title: 'Hamza-Algorithmus',
      content: (
        <>
          <h3>Hamza-Sitzregeln — Der Algorithmus</h3>
          <div className="m1-info-box">
            <p>
              Die Position des Hamza (<span className="arabic" dir="rtl">ء</span>) auf
              seinem Träger (Alif <span className="arabic" dir="rtl">أ/إ</span>,
              Waw <span className="arabic" dir="rtl">ؤ</span>,
              Ya <span className="arabic" dir="rtl">ئ</span>, oder
              allein <span className="arabic" dir="rtl">ء</span>) folgt einem klaren
              Algorithmus. Man vergleicht den Vokal VOR dem Hamza mit dem Vokal NACH dem
              Hamza und wählt den stärkeren.
            </p>
          </div>

          <h4>Vokal-Hierarchie</h4>
          <div className="m1-feature-grid" dir="rtl">
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ئ</span>
              <span className="m1-feature-label">Kasra (i)</span>
              <span className="m1-feature-info">Stärkster Vokal → Ya-Träger</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ؤ</span>
              <span className="m1-feature-label">Damma (u)</span>
              <span className="m1-feature-info">Zweitstärkster → Waw-Träger</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">أ</span>
              <span className="m1-feature-label">Fatha (a)</span>
              <span className="m1-feature-info">Drittstärkster → Alif-Träger</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">ء</span>
              <span className="m1-feature-label">Sukun (kein Vokal)</span>
              <span className="m1-feature-info">Schwächster → Hamza allein</span>
            </div>
          </div>

          <h4>Regeln</h4>
          <ol>
            <li>Bestimme den Vokal VOR dem Hamza</li>
            <li>Bestimme den Vokal NACH dem Hamza (= auf dem Hamza)</li>
            <li>Der STÄRKERE Vokal bestimmt den Träger</li>
            <li>Bei Kasra → Ya-Träger (<span className="arabic" dir="rtl">ئ</span>)</li>
            <li>Bei Damma → Waw-Träger (<span className="arabic" dir="rtl">ؤ</span>)</li>
            <li>Bei Fatha → Alif-Träger (<span className="arabic" dir="rtl">أ</span>)</li>
            <li>Bei Sukun (kein Vokal) → Hamza steht allein auf der Linie (<span className="arabic" dir="rtl">ء</span>)</li>
          </ol>

          <div className="m1-merke-box">
            <h4>Sonderfälle</h4>
            <ul>
              <li>Am Wortanfang: Hamza sitzt IMMER auf Alif (<span className="arabic" dir="rtl">أ</span> mit Fatha/Damma, <span className="arabic" dir="rtl">إ</span> mit Kasra)</li>
              <li>Am Wortende nach Langvokal: Hamza steht allein (<span className="arabic" dir="rtl">ء</span>) — z.B. <span className="arabic" dir="rtl">سماء</span>, <span className="arabic" dir="rtl">ماء</span></li>
              <li>Am Wortende nach Sukun: Hamza steht allein (<span className="arabic" dir="rtl">ء</span>) — z.B. <span className="arabic" dir="rtl">شيء</span>, <span className="arabic" dir="rtl">جزء</span></li>
            </ul>
          </div>

          <h4>Beispiele</h4>
          <div className="m1-feature-grid" dir="rtl">
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">يَسْأَلُ</span>
              <span className="m1-feature-label">Alif-Träger (أ)</span>
              <span className="m1-feature-info">Vor Hamza: Sukun, Nach/Auf Hamza: Fatha. Stärker = Fatha → Alif</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">سُئِلَ</span>
              <span className="m1-feature-label">Ya-Träger (ئ)</span>
              <span className="m1-feature-info">Vor Hamza: Damma, Nach/Auf Hamza: Kasra. Stärker = Kasra → Ya</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">يَقْرَؤُونَ</span>
              <span className="m1-feature-label">Waw-Träger (ؤ)</span>
              <span className="m1-feature-info">Vor Hamza: Fatha, Nach/Auf Hamza: Damma. Stärker = Damma → Waw</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">سَمَاء</span>
              <span className="m1-feature-label">Allein (ء)</span>
              <span className="m1-feature-info">Vor Hamza: Langvokal aa, Nach/Auf Hamza: nichts → Allein</span>
            </div>
            <div className="m1-feature-box">
              <span className="m1-feature-arabic arabic">مَسْؤُول</span>
              <span className="m1-feature-label">Waw-Träger (ؤ)</span>
              <span className="m1-feature-info">Vor Hamza: Sukun, Nach/Auf Hamza: Damma. Stärker = Damma → Waw</span>
            </div>
          </div>
        </>
      ),
    },
  ];

  return (
    <div className="m1-lesson">
      <button className="m1-back-btn" onClick={onBack}>
        Zurück zur Übersicht
      </button>
      <h2 className="m1-lesson-title">Lektion 1.3 — Besonderheiten der Schrift</h2>
      <p className="m1-lesson-intro">
        Die arabische Schrift hat einige Besonderheiten die über das einfache Alphabet
        hinausgehen. Klicke dich durch die Themen.
      </p>

      <div className="m1-section-tabs">
        {sections.map((s, i) => (
          <button
            key={i}
            className={`m1-section-tab${activeSection === i ? ' m1-section-tab--active' : ''}`}
            onClick={() => setActiveSection(i)}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="m1-section-content">{sections[activeSection].content}</div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Lesson 1.4: Artikulationsstellen und Lautunterscheidung
   ──────────────────────────────────────────────────────── */
function Lesson14({ onBack }) {
  const [selectedPair, setSelectedPair] = useState(0);

  const pair = minimalPairs[selectedPair];

  return (
    <div className="m1-lesson">
      <button className="m1-back-btn" onClick={onBack}>
        Zurück zur Übersicht
      </button>
      <h2 className="m1-lesson-title">Lektion 1.4 — Artikulationsstellen und Lautunterscheidung</h2>
      <p className="m1-lesson-intro">
        Arabisch hat Laute die es im Deutschen nicht gibt. Verwechslung ändert die
        Bedeutung. Hier lernst du die <strong>Minimalpaare</strong> — Buchstabenpaare
        die ähnlich klingen, aber grundverschieden sind.
      </p>

      {/* Pair selector */}
      <div className="m1-pair-selector">
        {minimalPairs.map((p, i) => (
          <button
            key={i}
            className={`m1-pair-btn${selectedPair === i ? ' m1-pair-btn--active' : ''}`}
            onClick={() => setSelectedPair(i)}
          >
            <span className="arabic" dir="rtl">{p.letter1}</span>
            {' / '}
            <span className="arabic" dir="rtl">{p.letter2}</span>
          </button>
        ))}
      </div>

      {/* Pair detail */}
      <div className="m1-pair-detail">
        <div className="m1-pair-comparison">
          <div className="m1-pair-side">
            <span className="m1-pair-letter arabic" dir="rtl">{pair.letter1}</span>
            <span className="m1-pair-name">{pair.letter1Name}</span>
            <span className="m1-pair-sound">{pair.letter1Sound}</span>
          </div>
          <div className="m1-pair-vs">vs.</div>
          <div className="m1-pair-side">
            <span className="m1-pair-letter arabic" dir="rtl">{pair.letter2}</span>
            <span className="m1-pair-name">{pair.letter2Name}</span>
            <span className="m1-pair-sound">{pair.letter2Sound}</span>
          </div>
        </div>

        <div className="m1-pair-examples">
          <div className="m1-pair-example">
            <span className="m1-pair-example-arabic arabic" dir="rtl">{pair.example1Word}</span>
            <span className="m1-pair-example-cons" dir="rtl">({pair.example1Consonantal})</span>
            <span className="m1-pair-example-meaning">= {pair.example1Meaning}</span>
          </div>
          <div className="m1-pair-example">
            <span className="m1-pair-example-arabic arabic" dir="rtl">{pair.example2Word}</span>
            <span className="m1-pair-example-cons" dir="rtl">({pair.example2Consonantal})</span>
            <span className="m1-pair-example-meaning">= {pair.example2Meaning}</span>
          </div>
        </div>

        <div className="m1-pair-explanation">
          <p>{pair.explanation}</p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Lesson 1.5: Getrennte Buchstaben (Huruf Muqattaʿat)
   ──────────────────────────────────────────────────────── */
function Lesson15({ onBack }) {
  return (
    <div className="m1-lesson">
      <button className="m1-back-btn" onClick={onBack}>
        Zurück zur Übersicht
      </button>
      <h2 className="m1-lesson-title">Lektion 1.5 — Getrennte Buchstaben (Huruf Muqattaʿat)</h2>

      <div className="m1-info-box">
        <p>
          <strong>29 Suren</strong> beginnen mit Buchstaben die einzeln ausgesprochen
          werden — nicht als Wort gelesen, sondern buchstabiert. Beispiel:
          <span className="arabic" dir="rtl"> الم</span> wird nicht als ein Wort
          gelesen, sondern als <strong>Alif-Lam-Mim</strong> — drei einzelne
          Buchstabennamen.
        </p>
        <p>
          Sie stehen im Konsonantentext. Sie sind Teil dessen was geschrieben wurde.
        </p>
        <p>
          <strong>Ihre Bedeutung ist sprachwissenschaftlich nicht geklärt.</strong> Es gibt zahlreiche
          Theorien (Initialen, Abkürzungen, mystische Bedeutungen, phonetische Marker),
          die unterschiedlich bewertet werden. Für unseren Zweck genügt es, sie
          zuverlässig erkennen und korrekt aussprechen zu können.
        </p>
      </div>

      <h3>Die 29 Suren mit getrennten Buchstaben</h3>
      <div className="m1-muqattaat-table">
        <div className="m1-muqattaat-header">
          <span>Sure</span>
          <span>Buchstaben</span>
          <span>Ausgesprochen als</span>
        </div>
        {hurufMuqattaat.map((h) => (
          <div key={h.surah} className="m1-muqattaat-row">
            <span className="m1-muqattaat-surah">{h.surah}</span>
            <span className="m1-muqattaat-letters arabic" dir="rtl">{h.letters}</span>
            <span className="m1-muqattaat-spelled">{h.spelled}</span>
          </div>
        ))}
      </div>

      <div className="m1-note-box">
        <p>
          <strong>Muster:</strong> Einige Kombinationen wiederholen sich.
          <span className="arabic" dir="rtl"> الم</span> (Alif-Lam-Mim) kommt
          in 6 Suren vor. <span className="arabic" dir="rtl">حم</span> (Ha-Mim)
          in 7 Suren. <span className="arabic" dir="rtl">الر</span> (Alif-Lam-Ra')
          in 5 Suren. Insgesamt werden 14 der 28 Buchstaben verwendet — genau die Hälfte
          des Alphabets. Ob dieses Muster linguistisch, strukturell oder auf andere Weise
          zu deuten ist, bleibt offen.
        </p>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   PRÜFMODUS — Tests
   ═══════════════════════════════════════════════════════════ */

/* ────────────────────────────────────────────────────────
   Test: Buchstabenerkennung
   ──────────────────────────────────────────────────────── */
function TestLetterRecognition({ onBack }) {
  const [queue, setQueue] = useState(() => shuffleArray(letters));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [kbVisible, setKbVisible] = useState(false);
  const inputRef = useRef(null);

  const current = queue[currentIndex];
  const isFinished = currentIndex >= queue.length;

  const checkAnswer = useCallback(() => {
    if (!userAnswer.trim()) return;
    const answer = userAnswer.trim().toLowerCase();
    const name = current.name.toLowerCase();
    const transliteration = current.transliteration.toLowerCase();
    const isCorrect =
      answer === name ||
      answer === transliteration ||
      name.startsWith(answer) ||
      transliteration.includes(answer);

    setFeedback({
      correct: isCorrect,
      letter: current,
    });
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
  }, [userAnswer, current]);

  const next = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setUserAnswer('');
    setFeedback(null);
  }, []);

  const restart = useCallback(() => {
    setQueue(shuffleArray(letters));
    setCurrentIndex(0);
    setUserAnswer('');
    setFeedback(null);
    setScore({ correct: 0, total: 0 });
  }, []);

  if (isFinished) {
    return (
      <div className="m1-test">
        <button className="m1-back-btn" onClick={onBack}>
          Zurück zur Übersicht
        </button>
        <h2 className="m1-lesson-title">Ergebnis — Buchstabenerkennung</h2>
        <div className="m1-test-result">
          <div className="m1-test-score">
            {score.correct} / {score.total}
          </div>
          <p>
            {score.correct === score.total
              ? 'Ausgezeichnet! Alle Buchstaben korrekt erkannt.'
              : score.correct >= score.total * 0.8
              ? 'Gut! Wiederhole die schwierigen Buchstaben.'
              : 'Weiter üben. Gehe zurück in den Lernmodus und wiederhole das Alphabet.'}
          </p>
          <button className="m1-btn m1-btn--primary" onClick={restart}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="m1-test">
      <button className="m1-back-btn" onClick={onBack}>
        Zurück zur Übersicht
      </button>
      <h2 className="m1-lesson-title">Prüfung — Buchstabenerkennung</h2>
      <p className="m1-lesson-intro">
        Ein Buchstabe wird gezeigt. Gib den <strong>Namen</strong> oder die
        <strong> Transliteration</strong> ein.
      </p>

      <div className="m1-test-progress">
        {currentIndex + 1} / {queue.length}
      </div>

      <div className="m1-test-question">
        <span className="m1-test-letter arabic" dir="rtl">
          {current.forms.isolated}
        </span>
      </div>

      {!feedback ? (
        <div className="m1-test-input-area">
          <input
            ref={inputRef}
            type="text"
            className="m1-test-input"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            onFocus={() => setKbVisible(true)}
            placeholder="Name oder Transliteration..."
            autoFocus
          />
          <button className="m1-btn m1-btn--primary" onClick={checkAnswer}>
            Prüfen
          </button>
          <ArabicKeyboard
            visible={kbVisible}
            onToggle={() => setKbVisible((v) => !v)}
            inputRef={inputRef}
            onInput={(char) => setUserAnswer((prev) => prev + char)}
            onBackspace={() => setUserAnswer((prev) => prev.slice(0, -1))}
            onClear={() => setUserAnswer('')}
          />
        </div>
      ) : (
        <div
          className={`m1-test-feedback ${
            feedback.correct ? 'm1-test-feedback--correct' : 'm1-test-feedback--wrong'
          }`}
        >
          <p className="m1-test-feedback__verdict">
            {feedback.correct ? 'Richtig!' : 'Nicht ganz.'}
          </p>
          <p>
            <span className="arabic" dir="rtl">
              {feedback.letter.forms.isolated}
            </span>{' '}
            = <strong>{feedback.letter.name}</strong> ({feedback.letter.transliteration})
            — {feedback.letter.sound}
          </p>
          <button className="m1-btn m1-btn--primary" onClick={next}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Test: Positionserkennung
   ──────────────────────────────────────────────────────── */
function TestPositionRecognition({ onBack }) {
  const connectableLetters = useMemo(
    () => letters.filter((l) => l.connectable),
    []
  );
  const [queue, setQueue] = useState(() => shuffleArray(connectableLetters));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTarget, setCurrentTarget] = useState(() => {
    const positions = ['initial', 'medial', 'final'];
    return positions[Math.floor(Math.random() * positions.length)];
  });
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = queue[currentIndex];
  const isFinished = currentIndex >= queue.length;

  const positionLabels = {
    isolated: 'Isoliert',
    initial: 'Anfang',
    medial: 'Mitte',
    final: 'Ende',
  };

  const checkAnswer = useCallback(
    (pos) => {
      const isCorrect = pos === currentTarget;
      setFeedback({ correct: isCorrect });
      setScore((s) => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        total: s.total + 1,
      }));
    },
    [currentTarget]
  );

  const next = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setFeedback(null);
    const positions = ['initial', 'medial', 'final'];
    setCurrentTarget(positions[Math.floor(Math.random() * positions.length)]);
  }, []);

  const restart = useCallback(() => {
    setQueue(shuffleArray(connectableLetters));
    setCurrentIndex(0);
    setFeedback(null);
    setScore({ correct: 0, total: 0 });
    const positions = ['initial', 'medial', 'final'];
    setCurrentTarget(positions[Math.floor(Math.random() * positions.length)]);
  }, [connectableLetters]);

  if (isFinished) {
    return (
      <div className="m1-test">
        <button className="m1-back-btn" onClick={onBack}>
          Zurück zur Übersicht
        </button>
        <h2 className="m1-lesson-title">Ergebnis — Positionserkennung</h2>
        <div className="m1-test-result">
          <div className="m1-test-score">
            {score.correct} / {score.total}
          </div>
          <p>
            {score.correct >= score.total * 0.8
              ? 'Gut gemacht! Du erkennst die Positionen zuverlässig.'
              : 'Wiederhole Lektion 1.1 und achte besonders auf die vier Formen.'}
          </p>
          <button className="m1-btn m1-btn--primary" onClick={restart}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="m1-test">
      <button className="m1-back-btn" onClick={onBack}>
        Zurück zur Übersicht
      </button>
      <h2 className="m1-lesson-title">Prüfung — Positionserkennung</h2>
      <p className="m1-lesson-intro">
        Der Buchstabe <strong>{current.name}</strong> wird in einer bestimmten Form
        gezeigt. In welcher Position steht er?
      </p>

      <div className="m1-test-progress">
        {currentIndex + 1} / {queue.length}
      </div>

      <div className="m1-test-question">
        <span className="m1-test-letter arabic" dir="rtl">
          {current.forms[currentTarget]}
        </span>
        <span className="m1-test-hint">
          ({current.name} — welche Position?)
        </span>
      </div>

      {!feedback ? (
        <div className="m1-test-options">
          {['initial', 'medial', 'final'].map((pos) => (
            <button
              key={pos}
              className="m1-btn m1-btn--option"
              onClick={() => checkAnswer(pos)}
            >
              {positionLabels[pos]}
            </button>
          ))}
        </div>
      ) : (
        <div
          className={`m1-test-feedback ${
            feedback.correct ? 'm1-test-feedback--correct' : 'm1-test-feedback--wrong'
          }`}
        >
          <p className="m1-test-feedback__verdict">
            {feedback.correct
              ? 'Richtig!'
              : `Nicht ganz. Die gezeigte Form war: ${positionLabels[currentTarget]}`}
          </p>
          <div className="m1-test-all-forms" dir="rtl">
            {['isolated', 'initial', 'medial', 'final'].map((pos) => (
              <div
                key={pos}
                className={`m1-test-form${
                  pos === currentTarget ? ' m1-test-form--highlight' : ''
                }`}
              >
                <span className="m1-test-form__arabic arabic">{current.forms[pos]}</span>
                <span className="m1-test-form__label">{positionLabels[pos]}</span>
              </div>
            ))}
          </div>
          <button className="m1-btn m1-btn--primary" onClick={next}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Test: Minimalpaare
   ──────────────────────────────────────────────────────── */
function TestMinimalPairs({ onBack }) {
  const [queue, setQueue] = useState(() => shuffleArray(minimalPairs));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showFirst, setShowFirst] = useState(() => Math.random() < 0.5);

  const current = queue[currentIndex];
  const isFinished = currentIndex >= queue.length;

  const shownWord = showFirst ? current?.example1Consonantal : current?.example2Consonantal;
  const shownMeaning = showFirst ? current?.example1Meaning : current?.example2Meaning;
  const correctLetter = showFirst ? current?.letter1 : current?.letter2;

  const checkAnswer = useCallback(
    (chosenLetter) => {
      const isCorrect = chosenLetter === correctLetter;
      setFeedback({ correct: isCorrect, correctLetter });
      setScore((s) => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        total: s.total + 1,
      }));
    },
    [correctLetter]
  );

  const next = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setFeedback(null);
    setShowFirst(Math.random() < 0.5);
  }, []);

  const restart = useCallback(() => {
    setQueue(shuffleArray(minimalPairs));
    setCurrentIndex(0);
    setFeedback(null);
    setScore({ correct: 0, total: 0 });
    setShowFirst(Math.random() < 0.5);
  }, []);

  if (isFinished) {
    return (
      <div className="m1-test">
        <button className="m1-back-btn" onClick={onBack}>
          Zurück zur Übersicht
        </button>
        <h2 className="m1-lesson-title">Ergebnis — Minimalpaare</h2>
        <div className="m1-test-result">
          <div className="m1-test-score">
            {score.correct} / {score.total}
          </div>
          <p>
            {score.correct >= score.total * 0.8
              ? 'Gut! Du unterscheidest die ähnlichen Laute zuverlässig.'
              : 'Wiederhole Lektion 1.4 und höre dir die Lautunterschiede nochmal an.'}
          </p>
          <button className="m1-btn m1-btn--primary" onClick={restart}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="m1-test">
      <button className="m1-back-btn" onClick={onBack}>
        Zurück zur Übersicht
      </button>
      <h2 className="m1-lesson-title">Prüfung — Minimalpaare</h2>
      <p className="m1-lesson-intro">
        Ein Wort wird gezeigt. Welcher der beiden ähnlichen Buchstaben kommt
        in diesem Wort vor?
      </p>

      <div className="m1-test-progress">
        {currentIndex + 1} / {queue.length}
      </div>

      <div className="m1-test-question">
        <span className="m1-test-letter arabic" dir="rtl">
          {shownWord}
        </span>
        <span className="m1-test-hint">= {shownMeaning}</span>
      </div>

      {!feedback ? (
        <div className="m1-test-options">
          <button className="m1-btn m1-btn--option" onClick={() => checkAnswer(current.letter1)}>
            <span className="arabic" dir="rtl">{current.letter1}</span> ({current.letter1Name})
          </button>
          <button className="m1-btn m1-btn--option" onClick={() => checkAnswer(current.letter2)}>
            <span className="arabic" dir="rtl">{current.letter2}</span> ({current.letter2Name})
          </button>
        </div>
      ) : (
        <div
          className={`m1-test-feedback ${
            feedback.correct ? 'm1-test-feedback--correct' : 'm1-test-feedback--wrong'
          }`}
        >
          <p className="m1-test-feedback__verdict">
            {feedback.correct
              ? 'Richtig!'
              : `Nicht ganz. Das Wort enthält: ${feedback.correctLetter}`}
          </p>
          <p>{current.explanation}</p>
          <button className="m1-btn m1-btn--primary" onClick={next}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Test: Sure 1 Buchstabe für Buchstabe (Abschlusstest)
   ──────────────────────────────────────────────────────── */
function TestSurah1({ onBack }) {
  const allLettersFlat = useMemo(() => {
    const result = [];
    surah1.verses.forEach((verse) => {
      const chars = [...verse.text].filter((ch) => ch.trim() && ch !== ' ');
      chars.forEach((ch) => {
        result.push({ char: ch, verse: verse.number });
      });
    });
    return result;
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showVerse, setShowVerse] = useState(true);
  const [kbVisible, setKbVisible] = useState(false);
  const inputRef = useRef(null);

  const current = allLettersFlat[currentIndex];
  const isFinished = currentIndex >= allLettersFlat.length;

  // Find matching letter in our data
  const matchedLetter = useMemo(() => {
    if (!current) return null;
    return letters.find(
      (l) =>
        l.forms.isolated === current.char ||
        l.forms.initial === current.char ||
        l.forms.medial === current.char ||
        l.forms.final === current.char ||
        Object.values(l.forms).some((f) => [...f].some((c) => c === current.char))
    );
  }, [current]);

  const checkAnswer = useCallback(() => {
    if (!userAnswer.trim()) return;
    const answer = userAnswer.trim().toLowerCase();
    let isCorrect = false;
    if (matchedLetter) {
      const name = matchedLetter.name.toLowerCase();
      const trans = matchedLetter.transliteration.toLowerCase();
      isCorrect = answer === name || answer === trans || name.startsWith(answer);
    }
    setFeedback({ correct: isCorrect, letter: matchedLetter });
    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
  }, [userAnswer, matchedLetter]);

  const next = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setUserAnswer('');
    setFeedback(null);
  }, []);

  if (isFinished) {
    return (
      <div className="m1-test">
        <button className="m1-back-btn" onClick={onBack}>
          Zurück zur Übersicht
        </button>
        <h2 className="m1-lesson-title">Abschlusstest — Sure 1 komplett!</h2>
        <div className="m1-test-result">
          <div className="m1-test-score">
            {score.correct} / {score.total}
          </div>
          <p>
            {score.correct >= score.total * 0.9
              ? 'Hervorragend! Du kannst Sure 1 Buchstabe für Buchstabe lesen. Bereit für den nächsten Schritt.'
              : 'Wiederhole die Lektionen und versuche es erneut.'}
          </p>
          <button className="m1-btn m1-btn--primary" onClick={onBack}>
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  const currentVerse = surah1.verses.find((v) => v.number === current.verse);

  return (
    <div className="m1-test">
      <button className="m1-back-btn" onClick={onBack}>
        Zurück zur Übersicht
      </button>
      <h2 className="m1-lesson-title">Abschlusstest — Sure 1, Buchstabe für Buchstabe</h2>
      <p className="m1-lesson-intro">
        Der gesamte Text von Sure 1, ein Buchstabe nach dem anderen. Identifiziere
        jeden einzelnen.
      </p>

      <div className="m1-test-progress">
        Buchstabe {currentIndex + 1} / {allLettersFlat.length} (Vers {current.verse})
      </div>

      {showVerse && currentVerse && (
        <div className="m1-test-verse-context">
          <p className="arabic m1-test-verse-text" dir="rtl">{currentVerse.text}</p>
          <button
            className="m1-btn m1-btn--secondary m1-btn--small"
            onClick={() => setShowVerse(false)}
          >
            Vers ausblenden
          </button>
        </div>
      )}
      {!showVerse && (
        <button
          className="m1-btn m1-btn--secondary m1-btn--small"
          onClick={() => setShowVerse(true)}
        >
          Vers einblenden
        </button>
      )}

      <div className="m1-test-question">
        <span className="m1-test-letter m1-test-letter--large arabic" dir="rtl">
          {current.char}
        </span>
      </div>

      {!feedback ? (
        <div className="m1-test-input-area">
          <input
            ref={inputRef}
            type="text"
            className="m1-test-input"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            onFocus={() => setKbVisible(true)}
            placeholder="Name des Buchstabens..."
            autoFocus
          />
          <button className="m1-btn m1-btn--primary" onClick={checkAnswer}>
            Prüfen
          </button>
          <ArabicKeyboard
            visible={kbVisible}
            onToggle={() => setKbVisible((v) => !v)}
            inputRef={inputRef}
            onInput={(char) => setUserAnswer((prev) => prev + char)}
            onBackspace={() => setUserAnswer((prev) => prev.slice(0, -1))}
            onClear={() => setUserAnswer('')}
          />
        </div>
      ) : (
        <div
          className={`m1-test-feedback ${
            feedback.correct ? 'm1-test-feedback--correct' : 'm1-test-feedback--wrong'
          }`}
        >
          <p className="m1-test-feedback__verdict">
            {feedback.correct ? 'Richtig!' : 'Nicht ganz.'}
          </p>
          {feedback.letter && (
            <p>
              <span className="arabic" dir="rtl">
                {feedback.letter.forms.isolated}
              </span>{' '}
              = <strong>{feedback.letter.name}</strong> ({feedback.letter.transliteration})
            </p>
          )}
          <button className="m1-btn m1-btn--primary" onClick={next}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}


/* ────────────────────────────────────────────────────────
   Test: Audio-Erkennung — Ein Laut wird abgespielt,
   der Lernende identifiziert den Buchstaben
   ──────────────────────────────────────────────────────── */
function TestAudioRecognition({ onBack }) {
  const [queue, setQueue] = useState(() => shuffleArray(letters));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [hasPlayed, setHasPlayed] = useState(false);

  const current = queue[currentIndex];
  const isFinished = currentIndex >= queue.length;

  // Generiere 4 Antwortmöglichkeiten (1 richtig + 3 falsch)
  const options = useMemo(() => {
    if (!current) return [];
    const wrong = shuffleArray(letters.filter((l) => l.id !== current.id)).slice(0, 3);
    return shuffleArray([current, ...wrong]);
  }, [current]);

  const playCurrentSound = useCallback(() => {
    if (!current) return;
    const played = playLetterAudio(current, () => setAudioAvailable(false));
    if (played) {
      setHasPlayed(true);
    }
  }, [current]);

  const checkAnswer = useCallback(
    (chosenLetter) => {
      const isCorrect = chosenLetter.id === current.id;
      setFeedback({ correct: isCorrect, correctLetter: current });
      setScore((s) => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        total: s.total + 1,
      }));
    },
    [current]
  );

  const next = useCallback(() => {
    setCurrentIndex((i) => i + 1);
    setFeedback(null);
    setHasPlayed(false);
  }, []);

  const restart = useCallback(() => {
    setQueue(shuffleArray(letters));
    setCurrentIndex(0);
    setFeedback(null);
    setScore({ correct: 0, total: 0 });
    setHasPlayed(false);
  }, []);

  if (!audioAvailable) {
    return (
      <div className="m1-test">
        <button className="m1-back-btn" onClick={onBack}>
          Zurück zur Übersicht
        </button>
        <h2 className="m1-lesson-title">Audio-Erkennung</h2>
        <div className="m1-info-box">
          <h3>Audio nicht verfügbar</h3>
          <p>
            Audio-Dateien konnten nicht geladen werden. Prüfe deine Internetverbindung
            oder stelle sicher, dass die Audio-Dateien unter /audio/letters/ verfügbar sind.
          </p>
          <button className="m1-btn m1-btn--primary" onClick={onBack}>
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="m1-test">
        <button className="m1-back-btn" onClick={onBack}>
          Zurück zur Übersicht
        </button>
        <h2 className="m1-lesson-title">Ergebnis — Audio-Erkennung</h2>
        <div className="m1-test-result">
          <div className="m1-test-score">
            {score.correct} / {score.total}
          </div>
          <p>
            {score.correct >= score.total * 0.8
              ? 'Gut! Du erkennst die Buchstaben am Klang zuverlässig.'
              : 'Wiederhole Lektion 1.1 und höre dir die Laute einzeln an (Laut-abspielen-Button).'}
          </p>
          <button className="m1-btn m1-btn--primary" onClick={restart}>
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="m1-test">
      <button className="m1-back-btn" onClick={onBack}>
        Zurück zur Übersicht
      </button>
      <h2 className="m1-lesson-title">Prüfung — Audio-Erkennung</h2>
      <p className="m1-lesson-intro">
        Ein Buchstaben-Laut wird abgespielt. Wähle den richtigen Buchstaben aus
        den vier Optionen. Klicke zuerst auf &quot;Laut abspielen&quot;.
      </p>

      <div className="m1-test-progress">
        {currentIndex + 1} / {queue.length}
      </div>

      <div className="m1-test-question m1-test-audio-question">
        <button
          className="m1-btn m1-btn--audio m1-btn--audio-large"
          onClick={playCurrentSound}
        >
          {hasPlayed ? 'Nochmal abspielen' : 'Laut abspielen'}
        </button>
        {hasPlayed && (
          <p className="m1-detail-small">Welcher Buchstabe war das?</p>
        )}
      </div>

      {hasPlayed && !feedback && (
        <div className="m1-test-options m1-test-options--audio">
          {options.map((opt) => (
            <button
              key={opt.id}
              className="m1-btn m1-btn--option m1-btn--option-audio"
              onClick={() => checkAnswer(opt)}
            >
              <span className="arabic m1-audio-option-letter" dir="rtl">
                {opt.forms.isolated}
              </span>
              <span className="m1-audio-option-name">{opt.name}</span>
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <div
          className={`m1-test-feedback ${
            feedback.correct ? 'm1-test-feedback--correct' : 'm1-test-feedback--wrong'
          }`}
        >
          <p className="m1-test-feedback__verdict">
            {feedback.correct
              ? 'Richtig!'
              : `Nicht ganz. Der abgespielte Buchstabe war:`}
          </p>
          <p>
            <span className="arabic" dir="rtl">
              {feedback.correctLetter.forms.isolated}
            </span>{' '}
            = <strong>{feedback.correctLetter.name}</strong> (
            {feedback.correctLetter.transliteration}) — {feedback.correctLetter.sound}
          </p>
          <button className="m1-btn m1-btn--primary" onClick={next}>
            Weiter
          </button>
        </div>
      )}
    </div>
  );
}


/* ────────────────────────────────────────────────────────
   Test: Tashkil-Erkennung (L1.02)
   ──────────────────────────────────────────────────────── */

const TASHKIL_QUESTIONS = [
  { word: 'بِسْمِ', answer: 'Kasra', explanation: 'Das Zeichen unter dem ب ist eine Kasra (ـِ) — kurzes i.' },
  { word: 'الرَّحْمَنِ', answer: 'Shadda', explanation: 'Das Zeichen über dem ر ist eine Shadda (ـّ) — Verdopplung des Konsonanten.' },
  { word: 'كِتَابٌ', answer: 'Tanwin Damma', explanation: 'Das Zeichen am Ende (ـٌ) ist Tanwin Damma — unbestimmte Nominativ-Endung -un.' },
  { word: 'عَلِيمًا', answer: 'Tanwin Fatha', explanation: 'Das Zeichen am Ende (ـًا) ist Tanwin Fatha — unbestimmte Akkusativ-Endung -an.' },
  { word: 'رَبُّ', answer: 'Damma', explanation: 'Das Zeichen über dem ب (ـُ) ist eine Damma — kurzes u.' },
  { word: 'قُلْ', answer: 'Sukun', explanation: 'Das Zeichen über dem ل (ـْ) ist ein Sukun — kein Vokal, der Konsonant wird ohne Vokal gesprochen.' },
  { word: 'خَلَقَ', answer: 'Fatha', explanation: 'Das Zeichen über dem خ (ـَ) ist eine Fatha — kurzes a.' },
  { word: 'قُرْآنٌ', answer: 'Madda', explanation: 'Das Zeichen über dem Alif (ـٓ) ist eine Madda — Langvokal aa mit Hamza.' },
  { word: 'رَحِيمٍ', answer: 'Tanwin Kasra', explanation: 'Das Zeichen am Ende (ـٍ) ist Tanwin Kasra — unbestimmte Genitiv-Endung -in.' },
];

function TestTashkilRecognition({ onBack }) {
  const [queue] = useState(() => shuffleArray(TASHKIL_QUESTIONS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = queue[currentIndex];
  const isFinished = currentIndex >= queue.length;

  const options = ['Fatha', 'Damma', 'Kasra', 'Sukun', 'Shadda', 'Tanwin Fatha', 'Tanwin Damma', 'Tanwin Kasra', 'Madda'];

  const checkAnswer = useCallback((chosen) => {
    const isCorrect = chosen === current.answer;
    setFeedback({ correct: isCorrect, correctAnswer: current.answer, explanation: current.explanation });
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  }, [current]);

  const next = useCallback(() => {
    setCurrentIndex(i => i + 1);
    setFeedback(null);
  }, []);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setFeedback(null);
    setScore({ correct: 0, total: 0 });
  }, []);

  if (isFinished) {
    return (
      <div className="m1-test">
        <button className="m1-back-btn" onClick={onBack}>Zurück zur Übersicht</button>
        <h2 className="m1-lesson-title">Ergebnis — Tashkil-Erkennung</h2>
        <div className="m1-test-result">
          <div className="m1-test-score">{score.correct} / {score.total}</div>
          <p>{score.correct >= score.total * 0.8
            ? 'Gut! Du erkennst die Vokalzeichen zuverlässig.'
            : 'Wiederhole Lektion 1.2 und präge dir die Zeichen nochmal ein.'}</p>
          <button className="m1-btn m1-btn--primary" onClick={restart}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="m1-test">
      <button className="m1-back-btn" onClick={onBack}>Zurück zur Übersicht</button>
      <h2 className="m1-lesson-title">Prüfung — Tashkil-Erkennung</h2>
      <p className="m1-lesson-intro">Ein Wort mit Vokalzeichen wird gezeigt. Welches Tashkil-Zeichen ist hervorgehoben?</p>
      <div className="m1-test-progress">{currentIndex + 1} / {queue.length}</div>
      <div className="m1-test-question">
        <span className="m1-test-letter arabic" dir="rtl" style={{ fontSize: '3rem' }}>{current.word}</span>
      </div>
      {!feedback ? (
        <div className="m1-test-options" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {options.map(opt => (
            <button key={opt} className="m1-btn m1-btn--option" onClick={() => checkAnswer(opt)}>{opt}</button>
          ))}
        </div>
      ) : (
        <div className={`m1-test-feedback ${feedback.correct ? 'm1-test-feedback--correct' : 'm1-test-feedback--wrong'}`}>
          <p className="m1-test-feedback__verdict">
            {feedback.correct ? 'Richtig!' : `Nicht ganz. Die richtige Antwort ist: ${feedback.correctAnswer}`}
          </p>
          <p>{feedback.explanation}</p>
          <button className="m1-btn m1-btn--primary" onClick={next}>Weiter</button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Test: Schriftbesonderheiten (L1.03)
   ──────────────────────────────────────────────────────── */

const SCRIPT_FEATURES_QUESTIONS = [
  { question: 'Auf welchem Träger sitzt das Hamza in ؤ?', options: ['Alif', 'Waw', 'Ya', 'Kein Träger (auf der Zeile)'], answer: 'Waw', explanation: 'In ؤ sitzt das Hamza auf einem Waw — das geschieht wenn der umgebende Vokal eine Damma ist.' },
  { question: 'Was unterscheidet ة (Ta Marbuta) von ه (Ha)?', options: ['Nichts, sie sind identisch', 'Ta Marbuta hat zwei Punkte oben', 'Ha hat zwei Punkte oben', 'Ta Marbuta ist größer'], answer: 'Ta Marbuta hat zwei Punkte oben', explanation: 'Ta Marbuta (ة) hat zwei Punkte über dem Kreis, Ha (ه) nicht. In der Pause wird ة wie ه ausgesprochen.' },
  { question: 'Was ist ى (Alif Maqsura)?', options: ['Ein Ya mit Punkten', 'Ein Alif in der Form eines Ya ohne Punkte', 'Ein Hamza-Träger', 'Eine Shadda'], answer: 'Ein Alif in der Form eines Ya ohne Punkte', explanation: 'Alif Maqsura sieht aus wie Ya, hat aber keine Punkte. Es repräsentiert einen langen a-Vokal am Wortende.' },
  { question: 'Wie viele Buchstaben repräsentiert die Ligatur لا?', options: ['Einen', 'Zwei', 'Drei', 'Vier'], answer: 'Zwei', explanation: 'لا ist eine Ligatur (Verbindung) aus Lam (ل) und Alif (ا) — zwei Buchstaben die als eine Form geschrieben werden.' },
  { question: 'Was passiert mit Alif Wasla (ٱ) mitten im Satz?', options: ['Es wird normal gesprochen', 'Der Stimmritzenverschluss fällt weg', 'Es wird verdoppelt', 'Es wird zu Ha'], answer: 'Der Stimmritzenverschluss fällt weg', explanation: 'Alif Wasla verbindet sich mit dem vorherigen Wort — der Stimmritzenverschluss wird nicht gesprochen, das Alif dient nur als Verbindung.' },
  { question: 'Welches ist ein Sonnenbuchstabe?', options: ['ب', 'ن', 'ك', 'ع'], answer: 'ن', explanation: 'Nun (ن) ist ein Sonnenbuchstabe — das Lam des Artikels ال assimiliert sich: الناس wird an-naas gesprochen, nicht al-naas.' },
  { question: 'In welcher Form erscheint Hamza in إبراهيم?', options: ['Auf Alif oben (أ)', 'Auf Alif unten (إ)', 'Auf Waw (ؤ)', 'Auf der Zeile (ء)'], answer: 'Auf Alif unten (إ)', explanation: 'Am Wortanfang mit Kasra sitzt das Hamza unter dem Alif: إ (Hamza mit Kasra darunter).' },
  { question: 'Was ist der Unterschied zwischen ي (Ya) und ى (Alif Maqsura)?', options: ['Kein Unterschied', 'Ya hat Punkte, Alif Maqsura nicht', 'Alif Maqsura hat Punkte, Ya nicht', 'Ya ist größer'], answer: 'Ya hat Punkte, Alif Maqsura nicht', explanation: 'Ya (ي) hat zwei Punkte unter dem Buchstaben, Alif Maqsura (ى) hat keine Punkte. Beispiel: على endet auf Alif Maqsura.' },
];

function TestScriptFeatures({ onBack }) {
  const [queue] = useState(() => shuffleArray(SCRIPT_FEATURES_QUESTIONS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = queue[currentIndex];
  const isFinished = currentIndex >= queue.length;

  const checkAnswer = useCallback((chosen) => {
    const isCorrect = chosen === current.answer;
    setFeedback({ correct: isCorrect, correctAnswer: current.answer, explanation: current.explanation });
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  }, [current]);

  const next = useCallback(() => {
    setCurrentIndex(i => i + 1);
    setFeedback(null);
  }, []);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setFeedback(null);
    setScore({ correct: 0, total: 0 });
  }, []);

  if (isFinished) {
    return (
      <div className="m1-test">
        <button className="m1-back-btn" onClick={onBack}>Zurück zur Übersicht</button>
        <h2 className="m1-lesson-title">Ergebnis — Schriftbesonderheiten</h2>
        <div className="m1-test-result">
          <div className="m1-test-score">{score.correct} / {score.total}</div>
          <p>{score.correct >= score.total * 0.8
            ? 'Gut! Du kennst die Besonderheiten der arabischen Schrift.'
            : 'Wiederhole Lektion 1.3 und präge dir die Unterschiede nochmal ein.'}</p>
          <button className="m1-btn m1-btn--primary" onClick={restart}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="m1-test">
      <button className="m1-back-btn" onClick={onBack}>Zurück zur Übersicht</button>
      <h2 className="m1-lesson-title">Prüfung — Schriftbesonderheiten</h2>
      <p className="m1-lesson-intro">Fragen zu Hamza-Trägern, Ta Marbuta, Alif Maqsura, Lam-Alif und Alif Wasla.</p>
      <div className="m1-test-progress">{currentIndex + 1} / {queue.length}</div>
      <div className="m1-test-question">
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{current.question}</p>
      </div>
      {!feedback ? (
        <div className="m1-test-options">
          {current.options.map(opt => (
            <button key={opt} className="m1-btn m1-btn--option" onClick={() => checkAnswer(opt)}>{opt}</button>
          ))}
        </div>
      ) : (
        <div className={`m1-test-feedback ${feedback.correct ? 'm1-test-feedback--correct' : 'm1-test-feedback--wrong'}`}>
          <p className="m1-test-feedback__verdict">
            {feedback.correct ? 'Richtig!' : `Nicht ganz. Die richtige Antwort ist: ${feedback.correctAnswer}`}
          </p>
          <p>{feedback.explanation}</p>
          <button className="m1-btn m1-btn--primary" onClick={next}>Weiter</button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Test: Huruf Muqattaat (L1.05)
   ──────────────────────────────────────────────────────── */

const MUQATTAAT_QUESTIONS = [
  { question: 'Welche Buchstaben stehen am Anfang von Sure 19 (Maryam)?', options: ['الم', 'كهيعص', 'حم', 'طه'], answer: 'كهيعص', explanation: 'Sure 19 beginnt mit كهيعص (Kaf-Ha-Ya-ʿAyn-Sad) — die längste Muqattaat-Kombination im Quran.' },
  { question: 'In wie vielen Suren kommt الم (Alif-Lam-Mim) vor?', options: ['3', '5', '6', '7'], answer: '6', explanation: 'الم steht am Anfang von 6 Suren: 2, 3, 29, 30, 31, 32.' },
  { question: 'Wie viele der 28 arabischen Buchstaben werden als Muqattaat verwendet?', options: ['10', '12', '14', '28'], answer: '14', explanation: '14 Buchstaben — genau die Hälfte des Alphabets. Diese 14 Buchstaben bilden die verschiedenen Kombinationen.' },
  { question: 'Welche Buchstaben stehen am Anfang von Sure 36?', options: ['طه', 'يس', 'حم', 'الم'], answer: 'يس', explanation: 'Sure 36 beginnt mit يس (Ya-Sin).' },
  { question: 'Ist die Bedeutung der Huruf Muqattaat geklärt?', options: ['Ja, sie bedeuten Gottes Namen', 'Ja, sie sind Abkürzungen für Suren', 'Nein, ihre Bedeutung ist nicht gesichert', 'Ja, sie sind Zahlenwerte'], answer: 'Nein, ihre Bedeutung ist nicht gesichert', explanation: 'Die Bedeutung der Muqattaat ist sprachwissenschaftlich nicht geklärt. Es existieren zahlreiche Deutungsansätze, aber keine hat sich als überzeugend erwiesen.' },
  { question: 'Wie viele Suren beginnen mit Huruf Muqattaat?', options: ['14', '21', '29', '36'], answer: '29', explanation: '29 Suren beginnen mit getrennten Buchstaben — aus 14 verschiedenen Buchstaben in verschiedenen Kombinationen.' },
  { question: 'Welcher einzelne Buchstabe steht am Anfang von Sure 50?', options: ['ن', 'ق', 'ص', 'ط'], answer: 'ق', explanation: 'Sure 50 beginnt mit dem einzelnen Buchstaben ق (Qaf).' },
  { question: 'Welche Buchstaben stehen am Anfang von Sure 20?', options: ['يس', 'طه', 'حم', 'طس'], answer: 'طه', explanation: 'Sure 20 beginnt mit طه (Ta-Ha).' },
  { question: 'Werden die Muqattaat als Wörter oder als einzelne Buchstaben gelesen?', options: ['Als Wörter', 'Als einzelne Buchstabennamen', 'Mal so, mal so', 'Sie werden nicht gelesen'], answer: 'Als einzelne Buchstabennamen', explanation: 'Die Muqattaat werden einzeln buchstabiert: الم wird als "Alif-Lam-Mim" gesprochen, nicht als ein Wort "alm".' },
  { question: 'Welche Buchstaben stehen am Anfang von Sure 42?', options: ['حم', 'حم عسق', 'الم', 'كهيعص'], answer: 'حم عسق', explanation: 'Sure 42 ist einzigartig: Sie hat zwei Muqattaat-Gruppen — حم in Vers 1 und عسق in Vers 2.' },
];

function TestMuqattaat({ onBack }) {
  const [queue] = useState(() => shuffleArray(MUQATTAAT_QUESTIONS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const current = queue[currentIndex];
  const isFinished = currentIndex >= queue.length;

  const checkAnswer = useCallback((chosen) => {
    const isCorrect = chosen === current.answer;
    setFeedback({ correct: isCorrect, correctAnswer: current.answer, explanation: current.explanation });
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  }, [current]);

  const next = useCallback(() => {
    setCurrentIndex(i => i + 1);
    setFeedback(null);
  }, []);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setFeedback(null);
    setScore({ correct: 0, total: 0 });
  }, []);

  if (isFinished) {
    return (
      <div className="m1-test">
        <button className="m1-back-btn" onClick={onBack}>Zurück zur Übersicht</button>
        <h2 className="m1-lesson-title">Ergebnis — Huruf Muqattaat</h2>
        <div className="m1-test-result">
          <div className="m1-test-score">{score.correct} / {score.total}</div>
          <p>{score.correct >= score.total * 0.8
            ? 'Gut! Du kennst die getrennten Buchstaben und ihre Suren.'
            : 'Wiederhole Lektion 1.5 und präge dir die Kombinationen nochmal ein.'}</p>
          <button className="m1-btn m1-btn--primary" onClick={restart}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="m1-test">
      <button className="m1-back-btn" onClick={onBack}>Zurück zur Übersicht</button>
      <h2 className="m1-lesson-title">Prüfung — Huruf Muqattaat</h2>
      <p className="m1-lesson-intro">Fragen zu den getrennten Buchstaben am Surenanfang.</p>
      <div className="m1-test-progress">{currentIndex + 1} / {queue.length}</div>
      <div className="m1-test-question">
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{current.question}</p>
      </div>
      {!feedback ? (
        <div className="m1-test-options">
          {current.options.map(opt => (
            <button key={opt} className="m1-btn m1-btn--option" onClick={() => checkAnswer(opt)}>
              <span dir="rtl">{opt}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className={`m1-test-feedback ${feedback.correct ? 'm1-test-feedback--correct' : 'm1-test-feedback--wrong'}`}>
          <p className="m1-test-feedback__verdict">
            {feedback.correct ? 'Richtig!' : `Nicht ganz. Die richtige Antwort ist: ${feedback.correctAnswer}`}
          </p>
          <p>{feedback.explanation}</p>
          <button className="m1-btn m1-btn--primary" onClick={next}>Weiter</button>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   MAIN: Module1 Overview Component
   ═══════════════════════════════════════════════════════════ */

/* ────────────────────────────────────────────────────────
   Test: Wort-Lesen — verbundene Buchstaben als Wörter erkennen
   ──────────────────────────────────────────────────────── */
function TestWordReading({ onBack }) {
  const quranWords = useMemo(() => {
    // Short, common Quran words for reading practice
    return [
      { word: 'بسم', letters: 'ب-س-م', meaning: 'im Namen', ref: '1:1' },
      { word: 'الله', letters: 'ا-ل-ل-ه', meaning: 'Gott', ref: '1:1' },
      { word: 'رب', letters: 'ر-ب', meaning: 'Herr', ref: '1:2' },
      { word: 'ملك', letters: 'م-ل-ك', meaning: 'König', ref: '1:4' },
      { word: 'يوم', letters: 'ي-و-م', meaning: 'Tag', ref: '1:4' },
      { word: 'نعبد', letters: 'ن-ع-ب-د', meaning: 'wir dienen', ref: '1:5' },
      { word: 'صرط', letters: 'ص-ر-ط', meaning: 'Weg', ref: '1:6' },
      { word: 'كتب', letters: 'ك-ت-ب', meaning: 'Buch/schreiben', ref: '2:2' },
      { word: 'هدى', letters: 'ه-د-ى', meaning: 'Führung/Wegweisung', ref: '2:2' },
      { word: 'غيب', letters: 'غ-ي-ب', meaning: 'Verborgenes', ref: '2:3' },
      { word: 'قلب', letters: 'ق-ل-ب', meaning: 'Herz', ref: '2:7' },
      { word: 'سمع', letters: 'س-م-ع', meaning: 'Gehör', ref: '2:7' },
      { word: 'بصر', letters: 'ب-ص-ر', meaning: 'Sehen', ref: '2:7' },
      { word: 'ارض', letters: 'ا-ر-ض', meaning: 'Erde', ref: '2:11' },
      { word: 'نور', letters: 'ن-و-ر', meaning: 'Licht', ref: '2:17' },
      { word: 'سماء', letters: 'س-م-ا-ء', meaning: 'Himmel', ref: '2:19' },
      { word: 'حق', letters: 'ح-ق', meaning: 'Wahrheit', ref: '2:26' },
      { word: 'علم', letters: 'ع-ل-م', meaning: 'Wissen', ref: '2:32' },
      { word: 'جنت', letters: 'ج-ن-ت', meaning: 'Gärten', ref: '2:25' },
      { word: 'نار', letters: 'ن-ا-ر', meaning: 'Feuer', ref: '2:17' },
    ];
  }, []);

  const [queue] = useState(() => shuffleArray(quranWords));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const inputRef = useRef(null);

  const current = queue[currentIndex];
  const isFinished = currentIndex >= queue.length;

  const checkAnswer = useCallback(() => {
    if (!userAnswer.trim()) return;
    const answer = userAnswer.trim().toLowerCase().replace(/[-\s]/g, '');
    const expected = current.letters.replace(/-/g, '').toLowerCase();
    const letterNames = current.letters.split('-').map(l => {
      const found = letters.find(lt => lt.forms.isolated === l || Object.values(lt.forms).some(f => f === l));
      return found ? found.name.toLowerCase() : l;
    });
    const isCorrect = answer === expected ||
      letterNames.join('').includes(answer) ||
      letterNames.some(n => n.startsWith(answer)) ||
      current.letters.toLowerCase().replace(/-/g, '') === answer;

    setFeedback({ correct: isCorrect });
    setScore(s => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  }, [userAnswer, current]);

  const next = useCallback(() => {
    setCurrentIndex(i => i + 1);
    setUserAnswer('');
    setFeedback(null);
  }, []);

  if (isFinished) {
    return (
      <div className="m1-test">
        <button className="m1-back-btn" onClick={onBack}>Zurück zur Übersicht</button>
        <h2 className="m1-lesson-title">Ergebnis — Wort-Lesen</h2>
        <div className="m1-test-result">
          <div className="m1-test-score">{score.correct} / {score.total}</div>
          <p>{score.correct >= score.total * 0.8
            ? 'Gut! Du kannst verbundene Buchstaben als Wörter lesen.'
            : 'Wiederhole die Alphabet-Lektion und achte auf die Verbindungsformen.'}</p>
          <button className="m1-btn m1-btn--primary" onClick={() => { setCurrentIndex(0); setScore({ correct: 0, total: 0 }); setFeedback(null); }}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className="m1-test">
      <button className="m1-back-btn" onClick={onBack}>Zurück zur Übersicht</button>
      <h2 className="m1-lesson-title">Wort-Lesen — Verbundene Buchstaben erkennen</h2>
      <p className="m1-lesson-intro">
        Ein arabisches Wort aus dem Quran wird gezeigt. Identifiziere die einzelnen Buchstaben
        (gib die Buchstabennamen oder Transliteration ein, z.B. "ba-sin-mim" oder "bsm").
      </p>
      <div className="m1-test-progress">{currentIndex + 1} / {queue.length}</div>
      <div className="m1-test-question">
        <span className="m1-test-letter arabic" dir="rtl" style={{ fontSize: '3.5rem' }}>{current.word}</span>
        <span className="m1-test-hint" style={{ marginTop: '8px' }}>{current.ref} — {current.meaning}</span>
      </div>
      {!feedback ? (
        <div className="m1-test-input-area">
          <input ref={inputRef} type="text" className="m1-test-input" value={userAnswer}
            onChange={e => setUserAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkAnswer()}
            placeholder="Buchstaben (z.B. ba-sin-mim oder bsm)..." autoFocus />
          <button className="m1-btn m1-btn--primary" onClick={checkAnswer}>Prüfen</button>
        </div>
      ) : (
        <div className={`m1-test-feedback ${feedback.correct ? 'm1-test-feedback--correct' : 'm1-test-feedback--wrong'}`}>
          <p className="m1-test-feedback__verdict">{feedback.correct ? 'Richtig!' : 'Nicht ganz.'}</p>
          <p>
            <span className="arabic" dir="rtl" style={{ fontSize: '2rem' }}>{current.word}</span>
            {' = '}<strong>{current.letters}</strong> ({current.meaning})
          </p>
          <button className="m1-btn m1-btn--primary" onClick={next}>Weiter</button>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────
   Collect all data-driven lessons from phonologie + ijam JSON
   ──────────────────────────────────────────────────────── */
const DATA_DRIVEN_LESSONS = [
  ...(phonologieData.lessons || []),
  ...(ijamData.lessons || []),
  ...(hamzaSeatData?.rules ? [{
    id: '1.13',
    title: 'Hamza-Sitzregeln (كرسي الهمزة)',
    description: hamzaSeatData.meta?.description || 'Systematisches Regelsystem für die Platzierung der Hamza im Schriftbild.',
    learnContent: {
      sections: [
        { type: 'explanation', title: hamzaSeatData.rules.hierarchy?.title || 'Vokal-Hierarchie', content: hamzaSeatData.rules.hierarchy?.content || '' },
        ...(hamzaSeatData.rules.positions || []).map(p => ({
          type: 'explanation',
          title: p.title,
          content: p.rule,
          arabicExamples: (p.examples || []).map(ex => ({
            arabic: ex.word,
            transliteration: ex.ref,
            meaning: ex.explanation,
          })),
        })),
        ...(hamzaSeatData.rules.specialCases || []).map(sc => ({
          type: 'explanation',
          title: sc.title,
          content: sc.rule,
          arabicExamples: sc.example ? [{ arabic: sc.example.word, transliteration: sc.example.ref, meaning: sc.example.explanation }] : [],
        })),
      ],
    },
    testContent: {
      exercises: (hamzaSeatData.exercises || []).map(ex => ({
        type: 'multiple_choice',
        question: `Wo sitzt die Hamza in ${ex.word} (${ex.ref})?`,
        options: ['Auf der Zeile (ء)', 'Auf Alif (أ/إ)', 'Auf Waw (ؤ)', 'Auf Ya (ئ)'],
        correct: ex.answer,
        explanation: ex.explanation,
      })),
    },
  }] : []),
  ...(readingProgressionData?.stages || []).map((stage, i) => ({
    id: `1.${14 + i}`,
    title: `Leseprogression: ${stage.title}`,
    description: stage.description,
    learnContent: {
      sections: (stage.exercises || []).map((ex, j) => ({
        type: 'example',
        title: `${j + 1}. ${ex.meaning || ''}`,
        examples: [{
          arabic: ex.arabic,
          transliteration: ex.transliteration,
          meaning: ex.meaning,
          ref: ex.ref,
          note: ex.parts ? `Teile: ${ex.partLabels?.join(' + ') || ex.parts.join(' + ')}` : (ex.syllables ? `Silben: ${ex.syllables.join('-')}` : ''),
        }],
      })),
    },
    testContent: {
      exercises: (stage.exercises || []).filter((_, j) => j % 3 === 0).map(ex => {
        const opts = [ex.meaning, 'Barmherzigkeit', 'Gerechtigkeit', 'Schriftstück'].sort(() => Math.random() - 0.5);
        return {
          type: 'multiple_choice',
          question: `Was bedeutet ${ex.arabic}?`,
          options: opts,
          correct: opts.indexOf(ex.meaning),
          explanation: `${ex.arabic} (${ex.transliteration}) = ${ex.meaning} [${ex.ref}]`,
        };
      }),
    },
  })),
  // Minimalpaare als phonetische Übungen
  ...(minimalPairsData?.pairs || []).map((pair, i) => ({
    id: `1.${19 + i}`,
    title: `Minimalpaar: ${pair.pair?.join(' vs. ')} — ${pair.pairName || ''}`,
    description: pair.distinction || '',
    learnContent: {
      sections: [
        { type: 'explanation', title: `Unterscheidung: ${pair.pair?.join(' und ')}`, content: pair.distinction || '' },
        ...(pair.exercises || []).map((ex, j) => ({
          type: 'example', title: `${j + 1}. ${ex.word1} vs. ${ex.word2}`,
          examples: [{ arabic: `${ex.word1} — ${ex.word2}`, transliteration: `${ex.meaning1} vs. ${ex.meaning2}`, meaning: ex.contrastPoint || '', ref: `${ex.ref1}, ${ex.ref2}` }],
        })),
      ],
    },
    testContent: { exercises: (pair.exercises || []).slice(0, 3).map(ex => ({
      type: 'multiple_choice', question: `Welcher Buchstabe steht in dem Wort das "${ex.meaning1}" bedeutet?`,
      options: pair.pair || [], correct: 0, explanation: `${ex.word1} (${ex.meaning1}) enthält ${pair.pair?.[0]}, nicht ${pair.pair?.[1]}.`,
    })) },
  })),
  // Shadda-Lektion
  ...(shaddaLessonData?.lessons || []),
  // Vokallängen-Drill
  ...(vowelLengthData ? [{
    id: '1.28',
    title: 'Vokallängen-Drill',
    description: vowelLengthData.meta?.description || 'Kurze vs. lange Vokale unterscheiden',
    learnContent: {
      sections: (vowelLengthData.pairs || []).slice(0, 15).map((p, i) => ({
        type: 'example', title: `${i + 1}. ${p.short} vs. ${p.long}`,
        examples: [{ arabic: `${p.short} (${p.shortMeaning}) — ${p.long} (${p.longMeaning})`, meaning: p.explanation || '', ref: p.ref || '' }],
      })),
    },
    testContent: { exercises: (vowelLengthData.exercises || []) },
  }] : []),
];

const DATA_DRIVEN_META = {
  phonologie: phonologieData.meta || {},
  ijam: ijamData.meta || {},
  hamzaSeat: hamzaSeatData?.meta || {},
  readingProgression: readingProgressionData?.meta || {},
  minimalPairs: minimalPairsData?.meta || {},
  shadda: shaddaLessonData?.meta || {},
  vowelLength: vowelLengthData?.meta || {},
};

/* ────────────────────────────────────────────────────────
   DataDrivenLesson: Generic renderer for JSON-based lessons
   (same learn/test pattern as Module 2)
   ──────────────────────────────────────────────────────── */

const DD = {
  section: {
    background: 'var(--bg-secondary, #1e1e1e)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '20px 24px', marginBottom: '16px',
  },
  sectionTitle: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-heading, #fff)' },
  prose: { lineHeight: 1.7, whiteSpace: 'pre-line', color: 'var(--text-primary)' },
  exRow: {
    display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
    padding: '8px 12px', marginBottom: '6px', borderRadius: '6px',
    background: 'var(--bg-tertiary, var(--bg-card, #2a2a2a))',
  },
  arabic: { fontFamily: 'var(--font-arabic, "Scheherazade New", serif)', fontSize: '1.3rem', direction: 'rtl', color: 'var(--accent-gold, #e6a817)' },
  translit: { fontSize: '0.85rem', color: 'var(--accent-teal, #4dc9c5)' },
  meaning: { fontSize: '0.85rem', color: 'var(--text-secondary)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' },
  th: { padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid var(--border)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-heading)' },
  td: { padding: '6px 10px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' },
  tdArabic: { fontFamily: 'var(--font-arabic)', direction: 'rtl', fontSize: '1.1rem' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  tab: {
    padding: '8px 20px', borderRadius: '6px', border: '1px solid var(--border)',
    background: 'var(--bg-secondary)', cursor: 'pointer', fontSize: '0.9rem',
    color: 'var(--text-primary)',
  },
  tabActive: {
    padding: '8px 20px', borderRadius: '6px', border: '1px solid var(--accent, #6366f1)',
    background: 'var(--accent, #6366f1)', cursor: 'pointer', fontSize: '0.9rem', color: '#fff', fontWeight: 600,
  },
  optionBtn: (selected, isCorrect, revealed) => ({
    display: 'block', width: '100%', textAlign: 'left',
    background: revealed
      ? (isCorrect ? 'var(--correct-bg, #e8f5e9)' : (selected ? 'var(--incorrect-bg, #fce4ec)' : 'var(--bg-secondary)'))
      : (selected ? 'var(--accent-teal-bg, #e0f7fa)' : 'var(--bg-secondary)'),
    border: `1px solid ${revealed
      ? (isCorrect ? 'var(--correct, #4caf50)' : (selected ? 'var(--incorrect, #e53935)' : 'var(--border)'))
      : (selected ? 'var(--accent-teal, #4dc9c5)' : 'var(--border)')}`,
    borderRadius: '6px', padding: '10px 14px', marginBottom: '6px', cursor: revealed ? 'default' : 'pointer',
    fontSize: '0.9rem', color: 'var(--text-primary)',
  }),
  checkBtn: {
    marginTop: '10px', padding: '10px 24px', borderRadius: '6px',
    background: 'var(--accent, #6366f1)', color: '#fff', border: 'none',
    cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem',
  },
  feedback: (correct) => ({
    marginTop: '10px', padding: '10px 14px', borderRadius: '6px',
    background: correct ? 'var(--correct-bg, #e8f5e9)' : 'var(--incorrect-bg, #fce4ec)',
    color: correct ? 'var(--correct, #2e7d32)' : 'var(--incorrect, #c62828)',
    fontSize: '0.9rem', lineHeight: 1.5,
  }),
  score: { fontSize: '3rem', fontWeight: 700, textAlign: 'center', margin: '24px 0', color: 'var(--accent, #6366f1)' },
};

/* Section renderers for data-driven lessons */
function DDRenderSection({ section }) {
  if (section.type === 'explanation') {
    return (
      <div style={DD.section}>
        <h3 style={DD.sectionTitle}>{section.title}</h3>
        <p style={DD.prose}>{section.content}</p>
        {section.arabicExamples && section.arabicExamples.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {section.arabicExamples.map((ex, i) => (
              <div key={i} style={DD.exRow}>
                <span style={DD.arabic}>{ex.arabic}</span>
                {ex.transliteration && <span style={DD.translit}>{ex.transliteration}</span>}
                <span style={DD.meaning}>{ex.meaning}</span>
              </div>
            ))}
          </div>
        )}
        {/* Inline table inside explanation (i'jam lesson uses this) */}
        {section.table && section.table.headers && (
          <div style={{ overflowX: 'auto', marginTop: 12 }}>
            <table style={DD.table}>
              <thead>
                <tr>
                  {section.table.headers.map((h, i) => <th key={i} style={DD.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {section.table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {/* Handle both array rows and object rows */}
                    {Array.isArray(row) ? (
                      row.map((cell, ci) => (
                        <td key={ci} style={/[\u0600-\u06FF]/.test(String(cell)) ? { ...DD.td, ...DD.tdArabic } : DD.td}>
                          {cell}
                        </td>
                      ))
                    ) : (
                      <>
                        <td style={DD.td}>{row.skeleton}</td>
                        <td style={{ ...DD.td, ...DD.tdArabic }}>
                          {row.letters && row.letters.map((l, li) => (
                            <span key={li} style={{ marginLeft: li > 0 ? 8 : 0 }}>
                              {l.letter} ({l.name}, {l.dots})
                            </span>
                          ))}
                        </td>
                        <td style={DD.td}>{row.examples && row.examples.join('; ')}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (section.type === 'table') {
    if (!section.headers || !section.rows) return null;
    const arabicCols = new Set();
    section.rows.forEach((row) => {
      if (Array.isArray(row)) {
        row.forEach((cell, ci) => { if (/[\u0600-\u06FF]/.test(String(cell))) arabicCols.add(ci); });
      }
    });
    return (
      <div style={DD.section}>
        {section.title && <h3 style={DD.sectionTitle}>{section.title}</h3>}
        <div style={{ overflowX: 'auto' }}>
          <table style={DD.table}>
            <thead>
              <tr>{section.headers.map((h, i) => <th key={i} style={DD.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {section.rows.map((row, ri) => (
                <tr key={ri}>
                  {Array.isArray(row) && row.map((cell, ci) => (
                    <td key={ci} style={arabicCols.has(ci) ? { ...DD.td, ...DD.tdArabic } : DD.td}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (section.type === 'quranExamples' && section.examples) {
    return (
      <div style={DD.section}>
        <h3 style={DD.sectionTitle}>{section.title || 'Quran-Beispiele'}</h3>
        {section.examples.map((ex, i) => (
          <div key={i} style={{ ...DD.exRow, flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {ex.location && <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--accent-teal)' }}>{ex.location}</span>}
              {ex.word && <span style={DD.arabic}>{ex.word}</span>}
              {ex.root && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Wurzel: {ex.root}</span>}
            </div>
            {ex.analysis && <span style={{ ...DD.meaning, marginTop: 4 }}>{ex.analysis}</span>}
          </div>
        ))}
      </div>
    );
  }

  if (section.type === 'walkthrough' && section.steps) {
    return (
      <div style={DD.section}>
        <h3 style={DD.sectionTitle}>{section.title}</h3>
        {section.steps.map((step, i) => (
          <div key={i} style={{ marginBottom: 8, paddingLeft: 16, borderLeft: '2px solid var(--accent-gold, #e6a817)' }}>
            <strong style={{ color: 'var(--accent-gold)', marginRight: 6 }}>{i + 1}.</strong> {step}
          </div>
        ))}
      </div>
    );
  }

  if (section.type === 'comparison' && section.items) {
    return (
      <div style={DD.section}>
        {section.title && <h3 style={DD.sectionTitle}>{section.title}</h3>}
        {section.items.map((item, i) => (
          <div key={i} style={DD.exRow}>
            {item.form && <span style={{ fontWeight: 700, color: 'var(--accent-teal)', minWidth: 50 }}>{item.form}</span>}
            {item.root && <span style={{ ...DD.arabic, minWidth: 60, fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{item.root}</span>}
            <span style={DD.arabic}>{item.arabic}</span>
            {item.transliteration && <span style={DD.translit}>{item.transliteration}</span>}
            <span style={DD.meaning}>{item.meaning}</span>
          </div>
        ))}
      </div>
    );
  }

  // Fallback
  return (
    <div style={DD.section}>
      {section.title && <h3 style={DD.sectionTitle}>{section.title}</h3>}
      {section.content && <p style={DD.prose}>{section.content}</p>}
    </div>
  );
}

/* Exercise renderers for data-driven lessons */
function DDExMultipleChoice({ exercise, onResult }) {
  const [selected, setSelected] = useState([]);
  const [revealed, setRevealed] = useState(false);

  const correctSet = new Set(
    Array.isArray(exercise.answer) ? exercise.answer : [exercise.answer]
  );

  function toggle(opt) {
    if (revealed) return;
    if (correctSet.size > 1) {
      setSelected(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
    } else {
      setSelected([opt]);
    }
  }

  function check() {
    setRevealed(true);
    const correct = selected.length === correctSet.size && selected.every(s => correctSet.has(s));
    onResult(correct);
  }

  const isCorrect = selected.length === correctSet.size && selected.every(s => correctSet.has(s));

  return (
    <div>
      {exercise.options.map((opt, i) => (
        <button key={i} style={DD.optionBtn(selected.includes(opt), correctSet.has(opt), revealed)} onClick={() => toggle(opt)}>
          {opt}
        </button>
      ))}
      {!revealed && (
        <button style={DD.checkBtn} onClick={check} disabled={selected.length === 0}>Prüfen</button>
      )}
      {revealed && (
        <div style={DD.feedback(isCorrect)}>
          {isCorrect ? 'Richtig!' : `Falsch. Richtige Antwort: ${Array.from(correctSet).join(', ')}`}
          {exercise.explanation && <div style={{ marginTop: 4 }}>{exercise.explanation}</div>}
        </div>
      )}
    </div>
  );
}

function DDExFreeText({ exercise, onResult }) {
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(false);

  function check() {
    const answer = typeof exercise.answer === 'string' ? exercise.answer : String(exercise.answer);
    const norm = s => s.replace(/[\u064B-\u065F\u0670]/g, '').replace(/\s+/g, '').trim().toLowerCase();
    const isCorrect = norm(value) === norm(answer);
    setCorrect(isCorrect);
    setRevealed(true);
    onResult(isCorrect);
  }

  return (
    <div>
      <input
        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-input, var(--bg-secondary))', color: 'var(--text-primary)', fontSize: '1rem', direction: 'rtl' }}
        value={value} onChange={e => setValue(e.target.value)} placeholder="Antwort eingeben..." disabled={revealed}
      />
      {exercise.hint && !revealed && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Hinweis: {exercise.hint}</div>}
      {!revealed && <button style={DD.checkBtn} onClick={check} disabled={!value.trim()}>Prüfen</button>}
      {revealed && (
        <div style={DD.feedback(correct)}>
          {correct ? 'Richtig!' : `Falsch. Richtige Antwort: ${exercise.answer}`}
          {exercise.explanation && <div style={{ marginTop: 4 }}>{exercise.explanation}</div>}
        </div>
      )}
    </div>
  );
}

function DDExMatching({ exercise, onResult }) {
  const [assignments, setAssignments] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [dragItem, setDragItem] = useState(null);

  const pairs = exercise.pairs;
  const allKeys = Object.keys(pairs[0]);
  const leftCandidates = ['word', 'suffix', 'singular', 'form', 'particle', 'letter', 'term'];
  const leftKey = allKeys.find(k => leftCandidates.includes(k)) || allKeys[0];
  const rightKey = allKeys.find(k => k !== leftKey) || allKeys[1];
  const lefts = pairs.map(p => p[leftKey]);
  const rights = pairs.map(p => p[rightKey]);
  const [shuffledRights] = useState(() => [...rights].sort(() => Math.random() - 0.5));

  function check() {
    setRevealed(true);
    const correct = pairs.every(p => assignments[p[leftKey]] === p[rightKey]);
    onResult(correct);
  }

  const allAssigned = Object.keys(assignments).length === pairs.length;
  const allCorrect = pairs.every(p => assignments[p[leftKey]] === p[rightKey]);

  return (
    <div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>Klicke links auf ein Element, dann rechts auf die Zuordnung.</div>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px' }}>
          {lefts.map((l, i) => (
            <div key={i} style={{ ...DD.exRow, cursor: revealed ? 'default' : 'pointer', border: dragItem === l ? '2px solid var(--accent-teal)' : '2px solid transparent' }} onClick={() => !revealed && setDragItem(l)}>
              <span style={{ fontWeight: 600 }}>{l}</span>
              {assignments[l] && <span style={{ color: 'var(--accent-gold)', marginLeft: 8 }}> &rarr; {assignments[l]}</span>}
            </div>
          ))}
        </div>
        <div style={{ flex: '1 1 180px' }}>
          {shuffledRights.map((r, i) => {
            const used = Object.values(assignments).includes(r);
            return (
              <button key={i} style={{ ...DD.optionBtn(false, false, false), opacity: used ? 0.4 : 1 }}
                onClick={() => { if (dragItem && !used && !revealed) { setAssignments(prev => ({ ...prev, [dragItem]: r })); setDragItem(null); } }}
                disabled={revealed || used}>{r}</button>
            );
          })}
        </div>
      </div>
      {!revealed && <button style={DD.checkBtn} onClick={check} disabled={!allAssigned}>Prüfen</button>}
      {revealed && (
        <div style={DD.feedback(allCorrect)}>
          {allCorrect ? 'Alle richtig!' : 'Nicht alle Zuordnungen waren korrekt. Richtige Zuordnungen:'}
          {!allCorrect && <ul style={{ marginTop: 4, paddingLeft: 16 }}>{pairs.map((p, i) => <li key={i}>{p[leftKey]} &rarr; {p[rightKey]}</li>)}</ul>}
        </div>
      )}
    </div>
  );
}

function DDExerciseRenderer({ exercise, onResult }) {
  return (
    <div style={{ ...DD.section, marginBottom: 16 }}>
      <div style={{ fontWeight: 600, marginBottom: 10 }}>{exercise.prompt}</div>
      {exercise.word && <div style={DD.arabic}>{exercise.word}</div>}
      {exercise.type === 'multiple_choice' && exercise.options && <DDExMultipleChoice exercise={exercise} onResult={onResult} />}
      {exercise.type === 'free_text' && <DDExFreeText exercise={exercise} onResult={onResult} />}
      {exercise.type === 'matching' && exercise.pairs && <DDExMatching exercise={exercise} onResult={onResult} />}
      {/* Fallback: treat as MC if has options */}
      {!['multiple_choice', 'free_text', 'matching'].includes(exercise.type) && exercise.options && <DDExMultipleChoice exercise={exercise} onResult={onResult} />}
      {!['multiple_choice', 'free_text', 'matching'].includes(exercise.type) && !exercise.options && exercise.answer && <DDExFreeText exercise={exercise} onResult={onResult} />}
    </div>
  );
}

function DataDrivenLesson({ lesson, onBack }) {
  const [mode, setMode] = useState('learn');
  const [testResults, setTestResults] = useState(() => (lesson.testContent?.exercises || []).map(() => null));
  const [testSubmitted, setTestSubmitted] = useState(false);

  const sections = lesson.learnContent?.sections || [];
  const exercises = lesson.testContent?.exercises || [];
  const passingScore = 80;

  function handleTestResult(idx, correct) {
    setTestResults(prev => { const next = [...prev]; next[idx] = correct; return next; });
  }

  const allAnswered = testResults.every(r => r !== null);
  const testScore = testResults.filter(Boolean).length;
  const testTotal = testResults.length;
  const pct = testTotal > 0 ? Math.round((testScore / testTotal) * 100) : 0;

  return (
    <div className="m1-lesson" style={{ maxWidth: 900, margin: '0 auto' }}>
      <button className="m1-back-btn" onClick={onBack}>Zurück zur Übersicht</button>
      <h2 className="m1-lesson-title">Lektion {lesson.id} — {lesson.title}</h2>
      <p className="m1-lesson-intro">{lesson.description}</p>

      <div style={DD.tabs}>
        <button style={mode === 'learn' ? DD.tabActive : DD.tab} onClick={() => setMode('learn')}>Lernmodus</button>
        {exercises.length > 0 && (
          <button style={mode === 'test' ? DD.tabActive : DD.tab} onClick={() => setMode('test')}>
            Prüfmodus ({exercises.length})
          </button>
        )}
      </div>

      {mode === 'learn' && (
        <div>
          {sections.map((sec, i) => <DDRenderSection key={i} section={sec} />)}
          {sections.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Kein Lerninhalt vorhanden.</p>}
        </div>
      )}

      {mode === 'test' && !testSubmitted && (
        <div>
          {exercises.map((ex, i) => (
            <DDExerciseRenderer key={i} exercise={ex} onResult={(correct) => handleTestResult(i, correct)} />
          ))}
          {allAnswered && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button style={DD.checkBtn} onClick={() => setTestSubmitted(true)}>Auswerten</button>
            </div>
          )}
        </div>
      )}

      {mode === 'test' && testSubmitted && (
        <div style={{ textAlign: 'center' }}>
          <h3>Ergebnis — Lektion {lesson.id}</h3>
          <div style={DD.score}>{testScore} / {testTotal}</div>
          <p>{pct >= passingScore ? 'Gut! Du hast diese Lektion bestanden.' : 'Wiederhole den Lernmodus und versuche es erneut.'}</p>
          <button style={DD.checkBtn} onClick={() => { setTestResults(exercises.map(() => null)); setTestSubmitted(false); }}>
            Erneut versuchen
          </button>
        </div>
      )}
    </div>
  );
}

const VIEWS = {
  OVERVIEW: 'overview',
  // Lernmodus
  L11: 'lesson-1.1',
  L12: 'lesson-1.2',
  L13: 'lesson-1.3',
  L14: 'lesson-1.4',
  L15: 'lesson-1.5',
  // Data-driven lessons
  DATA_DRIVEN: 'data-driven',
  // Prüfmodus
  T_LETTER: 'test-letter',
  T_POSITION: 'test-position',
  T_PAIRS: 'test-pairs',
  T_AUDIO: 'test-audio',
  T_SURAH1: 'test-surah1',
  T_TASHKIL: 'test-tashkil',
  T_SCRIPT: 'test-script',
  T_MUQATTAAT: 'test-muqattaat',
  T_WORD_READING: 'test-word-reading',
};

export default function Module1() {
  const [view, setView] = useState(VIEWS.OVERVIEW);
  const [dataDrivenLessonId, setDataDrivenLessonId] = useState(null);
  const [learnVisited, setLearnVisited] = useState({});

  // Load persisted learn-visited state from IndexedDB on mount
  useEffect(() => {
    loadModuleProgress(1).then(p => {
      if (p?.learnVisited) setLearnVisited(p.learnVisited);
    });
  }, []);

  const markLearnVisited = useCallback((lessonId) => {
    setLearnVisited(prev => {
      const next = { ...prev, [lessonId]: true };
      saveModuleProgress(1, { learnVisited: next });
      return next;
    });
  }, []);

  const hasVisitedAnyLesson = Object.keys(learnVisited).length > 0;

  // Track learn-mode visits via effect (deferred to avoid cascading renders)
  useEffect(() => {
    const lessonViews = { [VIEWS.L11]: 'L11', [VIEWS.L12]: 'L12', [VIEWS.L13]: 'L13', [VIEWS.L14]: 'L14', [VIEWS.L15]: 'L15' };
    const lessonId = lessonViews[view];
    const id = requestAnimationFrame(() => {
      if (lessonId && !learnVisited[lessonId]) {
        markLearnVisited(lessonId);
      }
      if (view === VIEWS.DATA_DRIVEN && dataDrivenLessonId && !learnVisited[dataDrivenLessonId]) {
        markLearnVisited(dataDrivenLessonId);
      }
    });
    return () => cancelAnimationFrame(id);
  }, [view, dataDrivenLessonId, learnVisited, markLearnVisited]);

  const goOverview = useCallback(() => {
    setView(VIEWS.OVERVIEW);
    setDataDrivenLessonId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openDataDrivenLesson = useCallback((lessonId) => {
    setDataDrivenLessonId(lessonId);
    setView(VIEWS.DATA_DRIVEN);
  }, []);

  // Render data-driven lesson
  if (view === VIEWS.DATA_DRIVEN && dataDrivenLessonId) {
    const lesson = DATA_DRIVEN_LESSONS.find(l => l.id === dataDrivenLessonId);
    if (lesson) {
      return <DataDrivenLesson lesson={lesson} onBack={goOverview} />;
    }
  }

  // Render current view
  switch (view) {
    case VIEWS.L11:
      return <Lesson11 onBack={goOverview} />;
    case VIEWS.L12:
      return <Lesson12 onBack={goOverview} />;
    case VIEWS.L13:
      return <Lesson13 onBack={goOverview} />;
    case VIEWS.L14:
      return <Lesson14 onBack={goOverview} />;
    case VIEWS.L15:
      return <Lesson15 onBack={goOverview} />;
    case VIEWS.T_LETTER:
      return <TestLetterRecognition onBack={goOverview} />;
    case VIEWS.T_POSITION:
      return <TestPositionRecognition onBack={goOverview} />;
    case VIEWS.T_PAIRS:
      return <TestMinimalPairs onBack={goOverview} />;
    case VIEWS.T_AUDIO:
      return <TestAudioRecognition onBack={goOverview} />;
    case VIEWS.T_SURAH1:
      return <TestSurah1 onBack={goOverview} />;
    case VIEWS.T_TASHKIL:
      return <TestTashkilRecognition onBack={goOverview} />;
    case VIEWS.T_SCRIPT:
      return <TestScriptFeatures onBack={goOverview} />;
    case VIEWS.T_MUQATTAAT:
      return <TestMuqattaat onBack={goOverview} />;
    case VIEWS.T_WORD_READING:
      return <TestWordReading onBack={goOverview} />;
    default:
      break;
  }

  // Overview page
  return (
    <div className="module-page m1-overview">
      <h2>Modul 1 — Schrift-Trainer</h2>
      <p className="m1-subtitle">
        Jeden Buchstaben in jeder Position lesen. Laute unterscheiden. Die
        Besonderheiten der arabischen Schrift kennen.
      </p>

      {/* Lernmodus */}
      <section className="m1-section">
        <h3 className="m1-section-heading">Lernmodus</h3>
        <p className="m1-section-desc">Die App lehrt, erklärt, zeigt. Du liest, verstehst, klickst weiter.</p>

        <div className="m1-card-grid">
          <button className="m1-card" onClick={() => setView(VIEWS.L11)}>
            <span className="m1-card__number">1.1</span>
            <span className="m1-card__title">Das Alphabet</span>
            <span className="m1-card__desc">
              28 Buchstaben — Name, Laut (mit Audio), vier Positionen, Artikulationsstelle
            </span>
          </button>
          <button className="m1-card" onClick={() => setView(VIEWS.L12)}>
            <span className="m1-card__number">1.2</span>
            <span className="m1-card__title">Vokalzeichen (Tashkil)</span>
            <span className="m1-card__desc">
              Fatha, Damma, Kasra, Sukun, Shadda, Tanwin, Madda — warum wir sie
              kennen müssen
            </span>
          </button>
          <button className="m1-card" onClick={() => setView(VIEWS.L13)}>
            <span className="m1-card__number">1.3</span>
            <span className="m1-card__title">Besonderheiten der Schrift</span>
            <span className="m1-card__desc">
              Hamza und Träger, Ta' Marbuta, Alif Maqsura, Lam-Alif, Sonnen-
              und Mondbuchstaben, Alif Wasla
            </span>
          </button>
          <button className="m1-card" onClick={() => setView(VIEWS.L14)}>
            <span className="m1-card__number">1.4</span>
            <span className="m1-card__title">Artikulationsstellen</span>
            <span className="m1-card__desc">
              Minimalpaare: <span className="arabic" dir="rtl">س/ص, ت/ط, د/ض, ذ/ظ, ع/ء, ح/ه, غ/خ, ق/ك</span> —
              mit Quran-Beispielen
            </span>
          </button>
          <button className="m1-card" onClick={() => setView(VIEWS.L15)}>
            <span className="m1-card__number">1.5</span>
            <span className="m1-card__title">Getrennte Buchstaben</span>
            <span className="m1-card__desc">
              Huruf Muqattaʿat — 29 Suren mit Buchstaben deren Bedeutung nicht
              gesichert ist
            </span>
          </button>
        </div>
      </section>

      {/* Phonologie */}
      <section className="m1-section">
        <h3 className="m1-section-heading">Phonologie</h3>
        <p className="m1-section-desc">Lautlehre des klassischen Arabisch — Vokalsystem, Silbenstruktur, Betonung, Assimilation und verbundene Rede.</p>

        <div className="m1-card-grid">
          {DATA_DRIVEN_LESSONS.filter(l => ['1.6', '1.7', '1.8', '1.9', '1.10'].includes(l.id)).map(lesson => (
            <button key={lesson.id} className="m1-card" onClick={() => openDataDrivenLesson(lesson.id)}>
              <span className="m1-card__number">{lesson.id}</span>
              <span className="m1-card__title">{lesson.title}</span>
              <span className="m1-card__desc">{lesson.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* I'jam / Schriftsystem */}
      <section className="m1-section">
        <h3 className="m1-section-heading">Schriftsystem — I'jam und Rasm</h3>
        <p className="m1-section-desc">Das diakritische Punktesystem und der Weg vom punktlosen Konsonantenskelett zum eindeutigen Text.</p>

        <div className="m1-card-grid">
          {DATA_DRIVEN_LESSONS.filter(l => l.id === '1.11' || l.id === '1.12').map(lesson => (
            <button key={lesson.id} className="m1-card" onClick={() => openDataDrivenLesson(lesson.id)}>
              <span className="m1-card__number">{lesson.id}</span>
              <span className="m1-card__title">{lesson.title}</span>
              <span className="m1-card__desc">{lesson.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Prüfmodus */}
      <section className="m1-section">
        <h3 className="m1-section-heading">Prüfmodus</h3>
        <p className="m1-section-desc">Du wirst getestet. Kein Raten — zeig was du gelernt hast.</p>

        {!hasVisitedAnyLesson && (
          <p className="m1-gate-hint" style={{ color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '1rem' }}>
            Bearbeite zuerst mindestens eine Lektion im Lernmodus, bevor du den Prüfmodus starten kannst.
          </p>
        )}
        <div className="m1-card-grid">
          <button className="m1-card m1-card--test" onClick={() => hasVisitedAnyLesson && setView(VIEWS.T_LETTER)} style={!hasVisitedAnyLesson ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <span className="m1-card__number">P1</span>
            <span className="m1-card__title">Buchstabenerkennung</span>
            <span className="m1-card__desc">
              Ein Buchstabe wird gezeigt — identifiziere Name und Laut
            </span>
          </button>
          <button className="m1-card m1-card--test" onClick={() => hasVisitedAnyLesson && setView(VIEWS.T_POSITION)} style={!hasVisitedAnyLesson ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <span className="m1-card__number">P2</span>
            <span className="m1-card__title">Positionserkennung</span>
            <span className="m1-card__desc">
              Derselbe Buchstabe in verschiedenen Positionen — erkenne welche
            </span>
          </button>
          <button className="m1-card m1-card--test" onClick={() => hasVisitedAnyLesson && setView(VIEWS.T_PAIRS)} style={!hasVisitedAnyLesson ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <span className="m1-card__number">P3</span>
            <span className="m1-card__title">Minimalpaare</span>
            <span className="m1-card__desc">
              Ähnliche Buchstaben unterscheiden — welcher kommt im Wort vor?
            </span>
          </button>
          <button className="m1-card m1-card--test" onClick={() => hasVisitedAnyLesson && setView(VIEWS.T_AUDIO)} style={!hasVisitedAnyLesson ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <span className="m1-card__number">P4</span>
            <span className="m1-card__title">Audio-Erkennung</span>
            <span className="m1-card__desc">
              Ein Laut wird abgespielt — identifiziere den Buchstaben nur am Klang
            </span>
          </button>
          <button className="m1-card m1-card--test" onClick={() => hasVisitedAnyLesson && setView(VIEWS.T_TASHKIL)} style={!hasVisitedAnyLesson ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <span className="m1-card__number">P5</span>
            <span className="m1-card__title">Tashkil-Erkennung</span>
            <span className="m1-card__desc">
              Vokalzeichen in arabischen Wörtern erkennen — Fatha, Damma, Kasra und mehr
            </span>
          </button>
          <button className="m1-card m1-card--test" onClick={() => hasVisitedAnyLesson && setView(VIEWS.T_SCRIPT)} style={!hasVisitedAnyLesson ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <span className="m1-card__number">P6</span>
            <span className="m1-card__title">Schriftbesonderheiten</span>
            <span className="m1-card__desc">
              Hamza-Träger, Ta Marbuta, Alif Maqsura, Lam-Alif, Alif Wasla
            </span>
          </button>
          <button className="m1-card m1-card--test" onClick={() => hasVisitedAnyLesson && setView(VIEWS.T_MUQATTAAT)} style={!hasVisitedAnyLesson ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <span className="m1-card__number">P7</span>
            <span className="m1-card__title">Huruf Muqattaat</span>
            <span className="m1-card__desc">
              Getrennte Buchstaben am Surenanfang — welche Buchstaben in welcher Sure?
            </span>
          </button>
          <button className="m1-card m1-card--test" onClick={() => hasVisitedAnyLesson && setView(VIEWS.T_WORD_READING)} style={!hasVisitedAnyLesson ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <span className="m1-card__number">P8</span>
            <span className="m1-card__title">Wort-Lesen</span>
            <span className="m1-card__desc">
              Verbundene Buchstaben als Wörter erkennen — 20 häufige Quran-Wörter
            </span>
          </button>
          <button className="m1-card m1-card--test" onClick={() => hasVisitedAnyLesson && setView(VIEWS.T_SURAH1)} style={!hasVisitedAnyLesson ? { opacity: 0.4, cursor: 'not-allowed' } : {}}>
            <span className="m1-card__number">A</span>
            <span className="m1-card__title">Abschlusstest: Sure 1</span>
            <span className="m1-card__desc">
              Sure 1 Buchstabe für Buchstabe — der finale Test
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

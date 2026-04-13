import { useState, useCallback } from 'react';

/* ───────────────────────────────────────────────────────────
   Einführungssequenz — "Der Text"

   Interaktiver Walkthrough durch das gesamte Kapitel
   "Der Text — Schichten, Quellen, Methodik" des Lehrplans.

   Der Lernende muss die Methodik verstehen, bevor er
   mit dem Lernen beginnt.
   ─────────────────────────────────────────────────────────── */

const STEPS = [
  // ── Step 0: Willkommen ──
  {
    id: 'welcome',
    title: 'Willkommen',
    content: (
      <>
        <p>
          Dieser Lehrplan hat ein einziges Ziel: <strong>Den Quran im arabischen Original
          auf jeder sprachlichen Ebene verstehen</strong> — morphologisch, syntaktisch,
          semantisch, rhetorisch.
        </p>
        <p>
          Dieser Lehrplan stützt das Wortverständnis auf zwei sprachliche Zugänge. Der erste ist <strong>arabische
          Lexikographie</strong>: Wörterbücher die dokumentieren was arabische Wörter
          bedeuten, abgeleitet aus dem Sprachgebrauch. Der zweite ist der
          <strong> quranische Sprachgebrauch</strong>: Ein Wort wird durch alle seine
          Vorkommen im Quran erschlossen. Das Bedeutungsspektrum eines Wortes zeigt sich
          in der Art wie es verwendet wird — über den gesamten Text hinweg.
        </p>
        <p>
          Der Quran enthält ca. 77.000 Wörter, abgeleitet von ca. 1.640 einzigartigen
          Wurzeln. Die 50 häufigsten Wurzeln decken bereits knapp 30% aller Wörter ab —
          zusammen mit den Funktionswörtern (Partikeln, Pronomen) ergibt sich schnell
          ein hoher Abdeckungsgrad.
          Das ist ein geschlossener Textkorpus. <strong>Das Ziel ist erreichbar.</strong>{' '}
          <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>(Datengrundlage: Quranic Arabic Corpus, corpus.quran.com)</span>
        </p>
        <p>
          Bevor eine einzige grammatische Regel gelernt wird, muss eine grundlegende
          Frage geklärt sein: <strong>Was genau lesen wir?</strong> Welche Schichten
          hat der Text und wie sind sie entstanden?
        </p>
      </>
    ),
  },

  // ── Step 1: Die vier Schichten — Überblick ──
  {
    id: 'layers-overview',
    title: 'Die vier Schichten des Textes',
    content: (
      <>
        <p>
          Der Text des Quran wie er heute in gedruckten Ausgaben und digitalen Versionen
          vorliegt, besteht aus <strong>mehreren historischen Schichten</strong>. Diese Schichten
          entstanden zu verschiedenen Zeiten. Sie zu unterscheiden hilft, den Text
          präziser zu verstehen.
        </p>
        <div className="intro-layers-overview">
          <div className="intro-layer-card intro-layer-1">
            <div className="intro-layer-number">1</div>
            <div className="intro-layer-title">Konsonantentext (Rasm)</div>
            <div className="intro-layer-desc">Das Gerüst — die Grundlage</div>
          </div>
          <div className="intro-layer-card intro-layer-2">
            <div className="intro-layer-number">2</div>
            <div className="intro-layer-title">Buchstabenpunkte (Iʿjām)</div>
            <div className="intro-layer-desc">Disambiguierung — Konsonanten unterscheiden</div>
          </div>
          <div className="intro-layer-card intro-layer-3">
            <div className="intro-layer-number">3</div>
            <div className="intro-layer-title">Vokalzeichen (Ḥarakāt)</div>
            <div className="intro-layer-desc">Vokalnotation</div>
          </div>
          <div className="intro-layer-card intro-layer-4">
            <div className="intro-layer-number">4</div>
            <div className="intro-layer-title">Organisatorische Ergänzungen</div>
            <div className="intro-layer-desc">Nummern, Namen, Zeichen</div>
          </div>
        </div>
        <p>Gehen wir jede Schicht einzeln durch.</p>
      </>
    ),
  },

  // ── Step 2: Schicht 1 — Konsonantentext ──
  {
    id: 'layer-1',
    title: 'Schicht 1: Der Konsonantentext (Rasm)',
    content: (
      <>
        <p>
          Das Gerüst aus Konsonanten und Langvokalen. Die Buchstabenfolge wie sie
          geschrieben wurde. <strong>Der Konsonantentext bildet das schriftlich fixierte
          Grundgerüst des Qurantextes.</strong>
        </p>
        <div className="intro-example-box">
          <p className="intro-example-label">Beispiel — Anfang des Textes (Konsonantentext):</p>
          <div className="arabic-display" dir="rtl">
            <p>بسم الله الرحمن الرحيم</p>
            <p>الحمد لله رب العالمين</p>
            <p>الرحمن الرحيم</p>
            <p>مالك يوم الدين</p>
          </div>
        </div>
        <p>
          (In diesem Beispiel sind die Buchstabenpunkte bereits enthalten — die reine
          Schicht 1 ohne Punkte wird in Modul 1 behandelt. Hier zeigen wir den
          konsonantischen Text in seiner heute üblichen Darstellungsform.)
        </p>
        <p>
          Nur Konsonanten mit Buchstabenpunkten. Keine Vokalzeichen. Keine Nummern.
          Keine Überschriften. So sieht der konsonantische Grundtext aus.
        </p>
      </>
    ),
  },

  // ── Step 3: Schicht 2 — Buchstabenpunkte ──
  {
    id: 'layer-2',
    title: 'Schicht 2: Die Buchstabenpunkte (Iʿjām)',
    content: (
      <>
        <p>
          Die Punkte die Buchstaben gleicher Grundform voneinander unterscheiden:
        </p>
        <div className="intro-example-box">
          <div className="arabic-display intro-dots-example" dir="rtl">
            <span className="intro-dot-letter">ب</span>
            <span className="intro-dot-desc">(ein Punkt unten)</span>
            <span className="intro-dot-vs">vs.</span>
            <span className="intro-dot-letter">ت</span>
            <span className="intro-dot-desc">(zwei Punkte oben)</span>
            <span className="intro-dot-vs">vs.</span>
            <span className="intro-dot-letter">ث</span>
            <span className="intro-dot-desc">(drei Punkte oben)</span>
          </div>
        </div>
        <p>
          Ohne diese Punkte sind viele Buchstaben identisch im Schriftbild.
        </p>
        <p>
          Die gängige Erzählung sagt, diese Punkte seien erst Jahrzehnte nach der
          Abfassung des Textes hinzugefügt worden. Die archäologische Evidenz zeigt ein
          anderes Bild: <strong>Punkte zur Buchstabenunterscheidung sind keine islamische
          Erfindung.</strong> Sie sind Teil der Schrifttradition aus der das Arabische
          hervorgegangen ist.
        </p>
        <p>
          Die Nabatäer — deren Schrift der direkte Vorläufer des Arabischen ist —
          verwendeten bereits Punkte um ähnliche Buchstaben zu unterscheiden, nachgewiesen
          bei rāʾ und zāy in nabatäischen Inschriften. In Übergangs-Inschriften
          zwischen Nabatäisch und Arabisch (3.–5. Jahrhundert) wurden diakritische
          Punkte in mindestens 28 Inschriften gefunden.{' '}
          <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>(vgl. Nehmé, L. (2017); Al-Jallad, A. (2020))</span>
        </p>
        <p>
          <strong>Sie interpretieren nicht — sie disambiguieren.</strong> Sie identifizieren
          welcher Konsonant gemeint ist. Wir verwenden sie.
        </p>
      </>
    ),
  },

  // ── Step 4: Schicht 3 — Vokalzeichen ──
  {
    id: 'layer-3-vocalization',
    title: 'Schicht 3: Die Vokalzeichen — Eine wichtige Unterscheidung',
    content: (
      <>
        <p>
          Arabische Schrift schreibt nur Konsonanten und Langvokale. Die drei
          Kurzvokale (a, i, u) stehen nicht im Text. Sie wurden <strong>später als
          Zeichen über und unter den Buchstaben hinzugefügt</strong> — die Fatha,
          Damma, Kasra, Sukun, Shadda und Tanwīn die heute in jeder Quran-Ausgabe stehen.
        </p>
        <p><strong>Wie wurden sie eingeführt?</strong></p>
        <p>
          <strong>Erstes System (7. Jh., Basra):</strong> Farbige Punkte in verschiedenen
          Positionen — ein roter Punkt über dem Buchstaben für Fatha, unter dem
          Buchstaben für Kasra, und neben dem Buchstaben für Damma. Da die Punkte
          mit den Buchstabenpunkten (Iʿjām) verwechselt werden konnten, war das
          System unpraktisch.
        </p>
        <p>
          <strong>Zweites System (8. Jh., Basra):</strong> Die farbigen Punkte wurden
          durch kleine Striche und Zeichen ersetzt — die Formen die bis heute verwendet werden.
        </p>
        <p>
          <strong>Die heute verwendeten Vokalzeichen gehen auf dieses Notationssystem zurück.</strong>
        </p>
      </>
    ),
  },

  // ── Step 5: Schicht 3 — Vokalzeichen und Mehrdeutigkeit ──
  {
    id: 'layer-3-ambiguity',
    title: 'Was die Vokalzeichen zeigen — und wo sie mehrdeutig werden',
    content: (
      <>
        <p>
          Das Konsonantengerüst <span className="arabic-inline" dir="rtl">كتب</span> kann
          je nach Vokalisierung folgendes bedeuten:
        </p>
        <div className="intro-example-box">
          <div className="arabic-display" dir="rtl">
            <div className="intro-vocalization-row">
              <span className="intro-vocalized">كَتَبَ</span>
              <span className="intro-vocalized-info">(kataba) = er schrieb</span>
            </div>
            <div className="intro-vocalization-row">
              <span className="intro-vocalized">كُتِبَ</span>
              <span className="intro-vocalized-info">(kutiba) = es wurde geschrieben</span>
            </div>
            <div className="intro-vocalization-row">
              <span className="intro-vocalized">كُتُب</span>
              <span className="intro-vocalized-info">(kutub) = Bücher</span>
            </div>
          </div>
        </div>
        <p>
          In der großen Mehrheit der Fälle (über 95%) ist die Vokalisierung grammatisch
          zwingend: Es gibt nur eine Möglichkeit die im Kontext Sinn ergibt. In diesen
          Fällen sind die Vokalzeichen unproblematisch.
        </p>
        <p>
          <strong>In den verbleibenden Fällen repräsentieren die Vokalzeichen eine von
          mehreren grammatisch möglichen Lesungen.</strong>
        </p>
      </>
    ),
  },

  // ── Step 6: Konsonantenskelett und Lesungen ──
  {
    id: 'example-malik',
    title: 'Konsonantenskelett und Lesungen — Sure 1:4',
    content: (
      <>
        <p>
          In Sure 1:4 gibt es zwei bekannte Lesungen:
        </p>
        <div className="intro-example-box">
          <div className="arabic-display" dir="rtl">
            <div className="intro-vocalization-row">
              <span className="intro-vocalized intro-vocalized-large">مَلِكِ</span>
              <span className="intro-vocalized-info">(maliki) = König</span>
            </div>
            <div className="intro-vocalization-divider">und</div>
            <div className="intro-vocalization-row">
              <span className="intro-vocalized intro-vocalized-large">مَالِكِ</span>
              <span className="intro-vocalized-info">(māliki) = Besitzer / Eigentümer</span>
            </div>
          </div>
        </div>
        <p>
          Auf den ersten Blick scheint dies ein Fall von Vokalambiguität zu sein —
          aber es ist keiner. <strong>Diese beiden Wörter haben verschiedene
          Konsonantenskelette:</strong>
        </p>
        <div className="intro-example-box">
          <div className="arabic-display" dir="rtl">
            <div className="intro-vocalization-row">
              <span className="intro-vocalized intro-vocalized-large">ملك</span>
              <span className="intro-vocalized-info">= Skelett von مَلِك (malik)</span>
            </div>
            <div className="intro-vocalization-divider">vs.</div>
            <div className="intro-vocalization-row">
              <span className="intro-vocalized intro-vocalized-large">مالك</span>
              <span className="intro-vocalized-info">= Skelett von مَالِك (mālik) — mit Alif</span>
            </div>
          </div>
        </div>
        <p>
          Das Alif in <strong>مَالِكِ</strong> ist kein Vokalzeichen — es ist ein
          Langvokal und damit Teil des Konsonantentextes. Die Unterscheidung ist
          bereits auf Konsonantenebene sichtbar. Dies ist <strong>keine echte
          konsonantische Ambiguität</strong>.
        </p>
        <p>
          Echte Ambiguität zeigt sich bei identischem Konsonantenskelett — wenn
          dasselbe Gerüst durch verschiedene Vokalisierung verschiedene Bedeutungen
          ergibt. Das zeigt das nächste Beispiel.
        </p>
      </>
    ),
  },

  // ── Step 7: Beispiel 2 — يضل ──
  {
    id: 'example-yadillu',
    title: 'Beispiel 2 — يضل',
    content: (
      <>
        <p>
          <span className="arabic-inline" dir="rtl">يضل</span> kann vokalisiert werden als:
        </p>
        <div className="intro-example-box intro-example-critical">
          <div className="arabic-display" dir="rtl">
            <div className="intro-vocalization-row">
              <span className="intro-vocalized intro-vocalized-large">يُضِلُّ</span>
              <span className="intro-vocalized-info">(yuḍillu, Form IV) = Er lässt abirren</span>
            </div>
            <div className="intro-vocalization-divider">oder</div>
            <div className="intro-vocalization-row">
              <span className="intro-vocalized intro-vocalized-large">يَضِلُّ</span>
              <span className="intro-vocalized-info">(yaḍillu, Form I) = er irrt ab</span>
            </div>
          </div>
        </div>
        <p>
          Form IV (<strong>yuḍillu</strong>) ist kausativ: „er lässt abirren".
          Form I (<strong>yaḍillu</strong>) ist Grundstamm: „er irrt ab".
          Ob kausativ oder Grundstamm — das hängt an einem einzigen Vokalzeichen.
          Das Konsonantengerüst ist identisch.
        </p>
        <p>
          Das heißt: <strong>Die Vokalzeichen sind nicht immer eindeutig.</strong> In der
          großen Mehrheit der Fälle sind sie grammatisch zwingend. In den übrigen
          Fällen wählen sie eine von mehreren grammatisch möglichen Lesungen — und
          wer die Grammatik beherrscht, kann diese Stellen grammatisch fundiert analysieren.
        </p>
      </>
    ),
  },

  // ── Step 8: Schicht 4 — Organisatorische Ergänzungen ──
  {
    id: 'layer-4',
    title: 'Schicht 4: Organisatorische Ergänzungen',
    content: (
      <>
        <p>Zwei Kategorien müssen unterschieden werden:</p>
        <div className="intro-two-columns">
          <div className="intro-column intro-column-primary">
            <h4>Navigationswerkzeuge</h4>
            <p>
              Surennummern, Versnummern. Später ergänzt, dienen der Orientierung.
              Sie interpretieren ihn nicht — sie nummerieren ihn nur.
              Ohne sie ist der Text als Arbeitswerkzeug unbrauchbar. Wir verwenden sie
              als Orientierungshilfe.
            </p>
          </div>
          <div className="intro-column intro-column-secondary">
            <h4>Weitere Ergänzungen</h4>
            <p>
              Surennamen.
              Organisatorische Ergänzung.
            </p>
          </div>
        </div>
      </>
    ),
  },

  // ── Step 9: Konsequenz — Was wir lesen ──
  {
    id: 'consequence',
    title: 'Konsequenz: Was wir lesen',
    content: (
      <>
        <p>
          Was wir haben ist der arabische Text in geschriebener Form.
        </p>
        <div className="intro-summary-box">
          <div className="intro-summary-row intro-summary-layer">
            <span className="intro-summary-icon">1</span>
            <span><strong>Konsonantentext</strong> — Das konsonantische Grundgerüst. Unser Arbeitstext.</span>
          </div>
          <div className="intro-summary-row intro-summary-layer">
            <span className="intro-summary-icon">2</span>
            <span><strong>Buchstabenpunkte</strong> — Identifizieren welcher Konsonant
            gemeint ist. Disambiguierung der Konsonanten.</span>
          </div>
          <div className="intro-summary-row intro-summary-layer">
            <span className="intro-summary-icon">3</span>
            <span><strong>Vokalzeichen</strong> — Vokalnotation.
            Wir lernen sie als Referenzwissen und unterscheiden sie vom Konsonantengerüst.</span>
          </div>
          <div className="intro-summary-row intro-summary-layer">
            <span className="intro-summary-icon">4a</span>
            <span><strong>Surennummern / Versnummern</strong> — Organisatorische
            Ergänzung, als Navigationswerkzeug verwendet.</span>
          </div>
          <div className="intro-summary-row intro-summary-layer">
            <span className="intro-summary-icon">4b</span>
            <span><strong>Weitere Ergänzungen</strong> — Surennamen,
            Einteilungen. Organisatorische Ergänzungen.</span>
          </div>
        </div>
        <p>
          Wer die arabische Morphologie und Syntax beherrscht, kann bei jedem Wort
          bestimmen: Welche Vokalisierung ist grammatisch möglich? Gibt es nur
          eine oder mehrere? Was bedeutet jede? <strong>Das ist das Ziel dieses
          Lehrplans: den quranischen Text grammatisch fundiert analysieren zu können.</strong>
        </p>
      </>
    ),
  },

  // ── Step 10: Mission ──
  {
    id: 'mission',
    title: 'Unsere Mission',
    content: (
      <>
        <p>
          Die Mission dieses Lehrplans ist ein <strong>gründlicher
          sprachlicher Zugang</strong> zum quranischen Text — die Fähigkeit, den arabischen Text grammatisch fundiert
          zu lesen, jede Vokalisierung sprachlich zu begründen und Mehrdeutigkeiten zu erkennen.
        </p>
        <div className="intro-quran-quote" dir="rtl">
          <p className="arabic-display">بَلْ هُوَ قُرْآنٌ مَجِيدٌ فِي لَوْحٍ مَحْفُوظٍ</p>
          <p className="intro-quran-ref">(85:21-22)</p>
          <p className="intro-quran-translation">
            Vielmehr, es ist ein herrlicher Quran, in einer geschützten Tafel.
          </p>
        </div>
        <div className="intro-quran-quote" dir="rtl">
          <p className="arabic-display">
            إِنَّا جَعَلْنَاهُ قُرْآنًا عَرَبِيًّا لَعَلَّكُمْ تَعْقِلُونَ وَإِنَّهُ فِي أُمِّ
            الْكِتَابِ لَدَيْنَا لَعَلِيٌّ حَكِيمٌ
          </p>
          <p className="intro-quran-ref">(43:3-4)</p>
          <p className="intro-quran-translation">
            Wir machten ihn zu einem arabischen Quran, damit ihr vielleicht versteht, und er ist
            in der Mutter der Schrift bei Uns, erhaben und weise.
          </p>
        </div>
        <p>
          Das Wort <span className="arabic-inline" dir="rtl">قُرْآن</span> bedeutet
          Rezitation/Vortrag (Wurzel q-r-ʾ). Die Form des Textes ist arabisch.
        </p>
        <p>
          Was wir erarbeiten: Vom konsonantischen Grundtext ausgehen, die verschiedenen
          Textkomponenten unterscheiden, und die Sprache so beherrschen dass man den
          Text versteht.
        </p>
      </>
    ),
  },

  // ── Step 11: Unsere Methodik ──
  {
    id: 'methodology',
    title: 'Unsere Methodik',
    content: (
      <>
        <p>Dieser Lehrplan geht gestuft vor:</p>

        <div className="intro-method-card intro-method-chosen">
          <h4>Gestufter Aufbau</h4>
          <p>
            Zuerst die Morphologie als abstraktes System lernen, dann vom
            Konsonantentext aus arbeiten und die Vokalisierung ableiten.
            Drei sprachbasierte Werkzeuge:
          </p>
          <ul>
            <li><strong>Abstrakte Morphologie</strong> — die Muster</li>
            <li><strong>Lane's Lexikon</strong> — die Wurzelbedeutungen</li>
            <li><strong>Der Kontext</strong> — des Konsonantentextes</li>
          </ul>
          <p>
            Das löst ein grundlegendes Lernproblem: Man braucht
            Morphologie um den Text zu lesen, aber man braucht den Text um Morphologie
            zu lernen. Indem die Morphologie zuerst abstrakt gelernt wird, lässt sich
            dieses Problem <strong>Schicht für Schicht auflösen</strong>.
          </p>
        </div>
      </>
    ),
  },

  // ── Step 12: Das Bootstrapping-Problem ──
  {
    id: 'bootstrapping',
    title: 'Das Bootstrapping-Problem und seine Lösung',
    content: (
      <>
        <p>Das Problem hat drei Schichten:</p>

        <div className="intro-bootstrap-layer">
          <div className="intro-bootstrap-number">1</div>
          <div>
            <p>
              <strong>Ich kann die Konsonanten lesen, aber ich erkenne keine Wurzeln.</strong>
            </p>
            <p>
              Um die Wurzel aus einem Wort zu extrahieren, muss man Präfixe und Suffixe
              abstreifen. Um zu wissen was ein Präfix ist und was Teil der Wurzel, braucht
              man Morphologie.
            </p>
            <p className="intro-bootstrap-solution">
              <strong>Lösbar:</strong> Die Morphologie als abstraktes System lernen, mit
              Transliteration, BEVOR man den Text öffnet. <span className="arabic-inline" dir="rtl">يـ</span> vor
              drei Konsonanten ist ein Imperfekt-Präfix. <span className="arabic-inline" dir="rtl">مـ</span> vor
              drei Konsonanten ist ein Partizip. <span className="arabic-inline" dir="rtl">ال</span> am
              Anfang ist der Artikel. Das sind endliche, lernbare Regeln.
            </p>
          </div>
        </div>

        <div className="intro-bootstrap-layer">
          <div className="intro-bootstrap-number">2</div>
          <div>
            <p>
              <strong>Selbst wenn ich die Wurzel erkenne, weiß ich nicht welche Form
              vorliegt.</strong>
            </p>
            <p>
              <span className="arabic-inline" dir="rtl">كتب</span> könnte kataba, kutiba,
              kutub oder anderes sein.
            </p>
            <p className="intro-bootstrap-solution">
              <strong>Lösbar durch Lane's Lexikon:</strong> Man hat die Wurzel (sagen wir
              k-t-b). Lane's zeigt ALLE existierenden Ableitungen dieser Wurzel. Grammatische
              Regeln und Kontext grenzen ein welche es sein muss.
            </p>
          </div>
        </div>

        <div className="intro-bootstrap-layer">
          <div className="intro-bootstrap-number">3</div>
          <div>
            <p>
              <strong>Um den Kontext zu lesen brauche ich die umgebenden Wörter, für die
              umgebenden Wörter brauche ich den Kontext.</strong> Es ist zirkulär.
            </p>
            <p className="intro-bootstrap-solution">
              <strong>Lösbar durch einen gestuften Einstieg:</strong> Man fängt nicht mit
              beliebigen Versen an, sondern mit Wörtern die im Konsonantentext eindeutig
              sind — Partikeln, Pronomen, hochfrequente Wörter.
            </p>
          </div>
        </div>
      </>
    ),
  },

  // ── Step 13: Die Lösung — Schritte ──
  {
    id: 'bootstrapping-steps',
    title: 'Die Lösung — Schritt für Schritt',
    content: (
      <>
        <div className="intro-step-card">
          <div className="intro-step-number">Schritt 1</div>
          <h4>Partikeln und Pronomen</h4>
          <p>
            40–50 Partikeln als geschlossene Liste lernen, mit Transliteration:
          </p>
          <div className="intro-particles-grid" dir="rtl">
            <span><span className="arabic-inline">من</span> (min)</span>
            <span><span className="arabic-inline">في</span> (fī)</span>
            <span><span className="arabic-inline">على</span> (ʿalā)</span>
            <span><span className="arabic-inline">الى</span> (ilā)</span>
            <span><span className="arabic-inline">ان</span> (an/inna)</span>
            <span><span className="arabic-inline">لا</span> (lā)</span>
            <span><span className="arabic-inline">ما</span> (mā)</span>
            <span><span className="arabic-inline">هل</span> (hal)</span>
            <span><span className="arabic-inline">قل</span> (qul) <em style={{fontSize: '0.8em', opacity: 0.8}}>— Imperativ, kein Partikel</em></span>
          </div>
          <p>
            Damit wird die Satzstruktur jedes Verses sofort sichtbar — BEVOR man ein
            einziges Verb oder Nomen vokalisiert hat.
          </p>
        </div>

        <div className="intro-step-card">
          <div className="intro-step-number">Schritt 2</div>
          <h4>Wurzeln vorbereiten</h4>
          <p>
            Die Wurzeln der häufigsten Verben und Nomen in Lane's nachschlagen. Man baut
            ein Repertoire auf: Wurzel q-w-l hat qāla (sagen), qawl (Wort). Wurzel k-w-n
            hat kāna (sein/war). Wurzel ʿ-l-m hat ʿalima (wissen), ʿilm (Wissen), ʿālim
            (Wissender).
          </p>
        </div>

        <div className="intro-step-card">
          <div className="intro-step-number">Schritt 3</div>
          <h4>Erster Vers</h4>
          <p>
            tanzil.net, Simple Clean. Sure 1:1. Partikeln sofort erkennen (Schritt 1).
            Verben und Nomen: Konsonanten lesen, Wurzel extrahieren, in Lane's nachschlagen,
            anhand von Kontext und Grammatik die Form bestimmen. Vokalisierung ableiten.
          </p>
        </div>

        <div className="intro-step-card">
          <div className="intro-step-number">Schritt 4</div>
          <h4>Fehlerkontrolle durch Grammatik und Lexikon</h4>
          <p>
            Drei sprachbasierte Mechanismen: <strong>Interne Konsistenz</strong> (ergibt
            der Satz grammatisch Sinn?), <strong>Lane's Lexikon</strong> (existiert diese
            Form für diese Wurzel?), und <strong>systematische Alternativprüfung</strong> (könnte
            dieses Konsonantengerüst aus einer anderen Wurzel stammen?).
          </p>
        </div>
      </>
    ),
  },

  // ── Step 14: Arbeitsweise — Die 5 Phasen ──
  {
    id: 'arbeitsweise',
    title: 'Arbeitsweise — Die 5 Phasen des Lehrplans',
    content: (
      <>
        <p>
          Der gesamte Lernweg gliedert sich in <strong>fünf aufeinander aufbauende
          Phasen</strong>. Jede Phase hat ein klares Ziel und definierte Werkzeuge.
        </p>

        <div className="intro-bootstrap-layer">
          <div className="intro-bootstrap-number">1</div>
          <div>
            <p><strong>Phase 1: Schrift (Stufe 1)</strong></p>
            <p>
              Alphabet, Buchstabenpunkte, Artikulationsstellen. Jeder Buchstabe in jeder
              Position — isoliert, initial, medial, final. Die Laute korrekt unterscheiden
              und die Besonderheiten der arabischen Schrift kennen.
            </p>
          </div>
        </div>

        <div className="intro-bootstrap-layer">
          <div className="intro-bootstrap-number">2</div>
          <div>
            <p><strong>Phase 2: Abstrakte Morphologie (Stufe 2)</strong></p>
            <p>
              Verbformen, Konjugation, Nomenmuster — als abstrakte Schablonen, mit
              Transliteration, BEVOR der Quran-Text geöffnet wird. Man lernt die Muster
              als System, nicht an Beispielen aus dem Text.
            </p>
            <p className="intro-bootstrap-solution">
              <strong>Hinweis:</strong> Phase 2 ist <strong>motivatorisch die
              härteste</strong>. Man lernt abstrakte Muster ohne Textarbeit — das fühlt
              sich trocken und ziellos an. Aber genau diese Grundlage macht alles Weitere
              erst möglich. Durchhalten lohnt sich.
            </p>
            <p className="intro-bootstrap-solution">
              <strong>Auswendiglernen (Memorierung) wird empfohlen:</strong> Die
              Verbformen und Nomenmuster sollten auswendig gelernt werden. Wer die
              Schablonen im Kopf hat, erkennt sie im Text sofort wieder. Ohne
              Auswendiglernen bleibt man bei jedem Wort auf Nachschlagen angewiesen.
            </p>
          </div>
        </div>

        <div className="intro-bootstrap-layer">
          <div className="intro-bootstrap-number">3</div>
          <div>
            <p><strong>Phase 3: Erster Kontakt mit dem Text</strong></p>
            <p>
              tanzil.net Simple Clean, Sure 1. Wurzelextraktion am echten Text.
              Vokalisierung aus der Grammatik: Man liest den Konsonantentext und bestimmt
              welche Vokale grammatisch möglich sind. Die Morphologie aus Phase 2 wird
              erstmals am realen Text angewendet.
            </p>
          </div>
        </div>

        <div className="intro-bootstrap-layer">
          <div className="intro-bootstrap-number">4</div>
          <div>
            <p><strong>Phase 4: Syntax und Partikeln (Stufen 3–4)</strong></p>
            <p>
              Kasussystem, Satztypen (Verbal- und Nominalsatz), Partikeln. Die Grammatik
              die nötig ist um ganze Sätze zu verstehen — nicht nur einzelne Wörter.
            </p>
          </div>
        </div>

        <div className="intro-bootstrap-layer">
          <div className="intro-bootstrap-number">5</div>
          <div>
            <p><strong>Phase 5: Vertiefung (Stufen 5–12)</strong></p>
            <p>
              Wurzelfelder, intertextuelle Kohärenz, Rhetorik, Prosodie. Der Text wird
              nicht mehr Wort für Wort erarbeitet sondern als zusammenhängendes Ganzes
              verstanden — Querverbindungen zwischen Suren, rhetorische Strukturen,
              Klangmuster.
            </p>
          </div>
        </div>

        <div className="intro-note-box">
          <p>
            <strong>Zusammenfassung:</strong> Schrift → Morphologie (auswendig lernen!) →
            Textarbeit → Syntax → Vertiefung. Jede Phase baut auf der vorherigen auf.
            Keine Phase kann übersprungen werden.
          </p>
        </div>
      </>
    ),
  },

  // ── Step 15: tanzil.net ──
  {
    id: 'tanzil',
    title: 'Unsere Textquelle: tanzil.net',
    content: (
      <>
        <p>
          <strong>tanzil.net</strong> ist ein Projekt das seit 2007 einen hochverifizierten
          Unicode-Quran-Text bereitstellt. Der Text wurde aus mehreren authentischen Quellen
          zusammengeführt, automatisch und manuell verifiziert. Es ist eine linguistische
          Ressource, kein religiöses Portal.
        </p>
        <p>tanzil.net bietet sechs Textversionen in zwei Kategorien:</p>

        <div className="intro-text-versions">
          <div className="intro-version-group">
            <h4>Uthmani-Schrift (historische Orthographie)</h4>
            <ul>
              <li><strong>Uthmani</strong> — Entspricht der Darstellung des Medina-Mushaf mit allen Textkomponenten.</li>
              <li><strong>Uthmani Minimal</strong> — Selbe Orthographie, bereinigt. Historische Schreibweise.</li>
            </ul>
          </div>
          <div className="intro-version-group">
            <h4>Einfache Schrift (moderne Orthographie)</h4>
            <ul>
              <li><strong>Simple</strong> — Moderner Schreibstil, volle Vokalzeichen.</li>
              <li><strong>Simple Plain</strong> — Ohne Sondermarkierungen.</li>
              <li><strong>Simple Minimal</strong> — Minimale Vokalzeichen.</li>
              <li><strong>Simple Clean</strong> — Nur
              Konsonanten mit Buchstabenpunkten. Schicht 1+2 ohne Schicht 3.
              <strong> Das ist unser Primärtext.</strong></li>
            </ul>
          </div>
        </div>

        <div className="intro-note-box">
          <p>
            <strong>Hinweis:</strong> In diesem Lehrplan wird die Vokalisierung aus der
            Grammatik abgeleitet.
          </p>
        </div>
      </>
    ),
  },

  // ── Step 15: Download-Anleitung von tanzil.net ──
  {
    id: 'tanzil-download',
    title: 'Download-Anleitung: tanzil.net/download/',
    content: (
      <>
        <p>
          So haben wir den Primärtext vorbereitet. Das ist eine <strong>informative
          Dokumentation</strong> — du musst nichts herunterladen, der Text ist bereits in
          der App integriert. Aber du sollst wissen, woher er stammt und wie er aufbereitet wurde.
        </p>

        <div className="intro-download-steps">
          <div className="intro-download-step">
            <div className="intro-download-step-number">1</div>
            <div>
              <strong>Seite öffnen:</strong> tanzil.net/download/
            </div>
          </div>
          <div className="intro-download-step">
            <div className="intro-download-step-number">2</div>
            <div>
              <strong>Texttyp wählen:</strong> Simple (Clean)
              <p className="intro-download-detail">
                Das ist der Konsonantentext mit Buchstabenpunkten — Schicht 1+2 ohne Schicht 3.
                Kein Vokalzeichen, keine Sonderzeichen, keine zusätzlichen Markierungen.
              </p>
            </div>
          </div>
          <div className="intro-download-step">
            <div className="intro-download-step-number">3</div>
            <div>
              <strong>Dateiformat wählen:</strong> Text (with aya numbers)
              <p className="intro-download-detail">
                Einfache Textdatei mit Versnummern zur Navigation. Unicode-kodiert.
              </p>
            </div>
          </div>
          <div className="intro-download-step">
            <div className="intro-download-step-number">4</div>
            <div>
              <strong>Optionen — was abgewählt wird und warum:</strong>
            </div>
          </div>
        </div>

        <div className="intro-checkbox-list">
          <div className="intro-checkbox-item intro-checkbox-unchecked">
            <span className="intro-checkbox-box">&#9744;</span>
            <div>
              <strong>Pausenzeichen (Pause marks): NEIN</strong>
              <p className="intro-checkbox-reason">
                Redaktionelle Pausenmarkierungen.
                Im Simple-Clean-Text nicht enthalten.
              </p>
            </div>
          </div>
          <div className="intro-checkbox-item intro-checkbox-unchecked">
            <span className="intro-checkbox-box">&#9744;</span>
            <div>
              <strong>Sajda-Zeichen: NEIN</strong>
              <p className="intro-checkbox-reason">
                Redaktionelle Markierungen.
                Im Simple-Clean-Text nicht enthalten.
              </p>
            </div>
          </div>
          <div className="intro-checkbox-item intro-checkbox-unchecked">
            <span className="intro-checkbox-box">&#9744;</span>
            <div>
              <strong>Rub-el-Hizb-Zeichen: NEIN</strong>
              <p className="intro-checkbox-reason">
                Redaktionelle Einteilungen.
                Im Simple-Clean-Text nicht enthalten.
              </p>
            </div>
          </div>
          <div className="intro-checkbox-item intro-checkbox-neutral">
            <span className="intro-checkbox-box">&#9744;</span>
            <div>
              <strong>Tatweel: Irrelevant bei Simple Clean</strong>
              <p className="intro-checkbox-reason">
                Tatweel (Kashida) ist eine rein kosmetische Buchstabenstreckung. In der
                Simple-Clean-Version kommt sie nicht vor — die Option ist daher wirkungslos.
              </p>
            </div>
          </div>
          <div className="intro-checkbox-item intro-checkbox-neutral">
            <span className="intro-checkbox-box">&#9744;</span>
            <div>
              <strong>Sequential Tanweens: Irrelevant bei Simple Clean</strong>
              <p className="intro-checkbox-reason">
                Betrifft die Reihenfolge der Tanween-Kodierung in vokalisierten Texten.
                Da Simple Clean keine Vokalzeichen enthält, hat diese Option keine Wirkung.
              </p>
            </div>
          </div>
        </div>

        <div className="intro-note-box">
          <p>
            <strong>Prinzip:</strong> Alles was nicht Konsonantentext (Schicht 1) oder
            Buchstabenpunkte (Schicht 2) ist, wird ausgeblendet. Was bleibt ist der
            konsonantische Grundtext in digitaler Form.
          </p>
        </div>
      </>
    ),
  },

  // ── Step 16: Zwei Textversionen und Sure 9 ──
  {
    id: 'text-versions',
    title: 'Zwei Textversionen: Leseversion und Forschungsversion',
    content: (
      <>
        <p>
          Aus dem heruntergeladenen Simple-Clean-Text erstellen wir <strong>zwei
          Versionen</strong> für unterschiedliche Zwecke:
        </p>

        <div className="intro-two-columns">
          <div className="intro-column intro-column-gain">
            <h4>Leseversion</h4>
            <p>
              <strong>Nur der Konsonantentext.</strong> Keine Surennummern, keine
              Versnummern, keine Überschriften. Nur der Konsonantentext mit Buchstabenpunkten.
              Jede Sure beginnt auf einer neuen Zeile.
            </p>
            <p>
              Zweck: Den Text lesen wie er ist — ohne jede Ablenkung. Wie jemand der das
              Original vor sich hat und nichts anderes sieht als den Text.
            </p>
          </div>
          <div className="intro-column intro-column-primary">
            <h4>Forschungsversion</h4>
            <p>
              <strong>Text mit Nummern-Marginalien.</strong> Surennummern und Versnummern als
              Navigationshilfe. Keine inhaltlichen Ergänzungen — nur Koordinaten.
            </p>
            <p>
              Zweck: Gezielt Verse finden, Querverweise verfolgen, systematisch arbeiten.
              Die Nummern sind Werkzeug, nicht Text.
            </p>
          </div>
        </div>

        <div className="intro-example-box">
          <p className="intro-example-label">Beispiel — Leseversion (Sure 1):</p>
          <div className="arabic-display" dir="rtl" style={{ lineHeight: '2.2' }}>
            <p>بسم الله الرحمن الرحيم</p>
            <p>الحمد لله رب العالمين</p>
            <p>الرحمن الرحيم</p>
            <p>مالك يوم الدين</p>
            <p>اياك نعبد واياك نستعين</p>
            <p>اهدنا الصرط المستقيم</p>
            <p>صرط الذين انعمت عليهم غير المغضوب عليهم ولا الضالين</p>
          </div>
          <p className="intro-example-note">
            Nur der Konsonantentext, ohne zusätzliche Zeichen. Kein Vokalzeichen, keine Nummer,
            kein Name.
          </p>
        </div>

        <div className="intro-example-box">
          <p className="intro-example-label">Beispiel — Forschungsversion (Anfang Sure 2):</p>
          <div className="arabic-display" dir="rtl" style={{ lineHeight: '2.2' }}>
            <p><span style={{ opacity: 0.5, fontSize: '0.8em' }}>2:1</span> الم</p>
            <p><span style={{ opacity: 0.5, fontSize: '0.8em' }}>2:2</span> ذلك الكتاب لا ريب فيه هدى للمتقين</p>
            <p><span style={{ opacity: 0.5, fontSize: '0.8em' }}>2:3</span> الذين يؤمنون بالغيب ويقيمون الصلاة ومما رزقناهم ينفقون</p>
          </div>
          <p className="intro-example-note">
            Die Nummern (2:1, 2:2, ...) stehen am Rand als Orientierungshilfe. Sie sind
            deutlich als Nicht-Text erkennbar.
          </p>
        </div>

        <h4>Das Sonderfall-Problem: Sure 9</h4>
        <div className="intro-note-box">
          <p>
            <strong>Sure 9 ist die einzige Sure ohne Basmala.</strong> Alle anderen 113 Suren
            beginnen mit <span className="arabic-inline" dir="rtl">بسم الله الرحمن الرحيم</span>.
            Sure 9 nicht. Das ist im Konsonantentext so vorhanden.
          </p>
          <p>
            In der Leseversion entsteht dadurch ein Problem: Wenn keine Basmala den Beginn
            einer neuen Sure markiert, ist der Übergang von Sure 8 zu Sure 9 unsichtbar.
          </p>
          <p>
            <strong>Lösung:</strong> Ein Seitenumbruch oder ein sichtbarer Leerraum zwischen
            Sure 8 und Sure 9. Kein hinzugefügter Text — nur Weißraum als visueller
            Separator. Die Forschungsversion hat dieses Problem nicht, da die Surennummern
            den Übergang klar markieren.
          </p>
        </div>
      </>
    ),
  },

  // ── Step 17: Werkzeuge (formerly Step 15) ──
  {
    id: 'tools',
    title: 'Unsere Werkzeuge',
    content: (
      <>
        <div className="intro-tool-card">
          <h4>tanzil.net — Primärtext</h4>
          <p>
            Hochverifizierter Unicode-Quran-Text. Wir arbeiten mit Simple Clean
            (konsonantisch, ohne Vokalzeichen). Frei verfügbar, herunterladbar, in Unicode.
          </p>
        </div>

        <div className="intro-tool-card">
          <h4>Lane's Lexikon — Primäres Kontrollwerkzeug</h4>
          <p>
            Edward William Lane (1863–1893). Über drei Jahrzehnte die großen arabischen
            Wörterbücher ins Englische kompiliert. Das gründlichste arabisch-englische
            Lexikon für klassisches Arabisch. Dokumentiert Wortbedeutungen anhand von
            Sprachgebrauch und Poesie — die Sprache wie sie gesprochen und verstanden
            wurde — die linguistische Rohform. Frei verfügbar online.
          </p>
        </div>

        <div className="intro-tool-card">
          <h4>Lisān al-ʿArab — Für Fortgeschrittene</h4>
          <p>
            Ibn Manẓūr, 13. Jh. Das umfangreichste arabisch-arabische Wörterbuch.
            Kompiliert aus älteren lexikographischen Werken. Wenn Lane's nicht ausreicht
            oder man die arabischen Quellen direkt lesen will.
          </p>
        </div>

        <div className="intro-tool-card">
          <h4>Hans Wehr — Ergänzung</h4>
          <p>
            Arabisch-Englisch, modernes Standardarabisch. Ergänzung, aber modernes
            Arabisch hat Bedeutungsverschiebungen gegenüber dem klassischen Sprachgebrauch.
            Nie als alleinige Quelle für quranische Wörter.
          </p>
        </div>

        <div className="intro-tool-card">
          <h4>Audioaufnahmen — Phonetische Referenz</h4>
          <p>
            Langsame Audioaufnahmen des Qurantextes als Material für Phonetik und
            Prosodie-Analyse — vergleichbar mit einem Muttersprachler der einen Text
            vorliest. Hier eingesetzt als phonetische Referenz für Aussprache und Prosodie.
          </p>
        </div>
      </>
    ),
  },

  // ── Step 16: Der Preis und der Gewinn ──
  {
    id: 'price-gain',
    title: 'Der Preis und der Gewinn',
    content: (
      <>
        <div className="intro-two-columns">
          <div className="intro-column intro-column-price">
            <h4>Der Preis</h4>
            <p>
              Es ist am Anfang <strong>extrem langsam</strong>. Ein Vers pro Stunde oder
              mehr. Jedes Wort muss einzeln erarbeitet werden. Das erfordert Disziplin
              und Geduld.
            </p>
          </div>
          <div className="intro-column intro-column-gain">
            <h4>Der Gewinn</h4>
            <p>
              Er ist nicht linear sondern <strong>exponentiell</strong>. Die ersten 50
              Verse dauern ewig. Aber bei jedem Vers lernt man Wurzeln, Muster und
              Kontext die in den nächsten Versen wieder vorkommen. Der Quran hat ca.
              1.642 Wurzeln und wiederholt sich thematisch und lexikalisch. Ab einem
              bestimmten Punkt kippt es — man erkennt mehr als man nachschlagen muss.
            </p>
          </div>
        </div>
        <p>
          Das Endergebnis ist eine Kompetenz die auf sprachlicher Kompetenz und Bewusstheit
          basiert. Man kennt den Text auf einer Ebene die entsteht wenn man
          ihn sich Buchstabe für Buchstabe, Wurzel für Wurzel, Muster für Muster
          erarbeitet hat.
        </p>
        <p>
          <strong>Das ist Sprachkompetenz:</strong> Die Fähigkeit, den arabischen
          Text fundiert zu lesen — jede Wurzel zu kennen, jede Form zu erkennen,
          jede Mehrdeutigkeit zu sehen.
          <strong> Ein grammatisch fundiertes Verständnis des Textes.</strong>
        </p>
      </>
    ),
  },

  // ── Step 17: Verständnistest (interaktiv) ──
  {
    id: 'quiz',
    title: 'Kurzer Verständnistest',
    content: (
      <>
        <p>
          Bevor wir anfangen — fünf Fragen um sicherzustellen dass die Methodik klar ist.
          <strong> Klicke auf eine Frage um die Antwort zu sehen.</strong>
        </p>
        <div className="intro-quiz">
          <details className="intro-quiz-item">
            <summary><strong>1.</strong> Was ist der Konsonantentext (Schicht 1)?</summary>
            <p className="intro-quiz-answer">
              Das Gerüst aus Konsonanten und Langvokalen — die Buchstabenfolge wie sie
              geschrieben wurde, ohne Vokalzeichen.
            </p>
          </details>
          <details className="intro-quiz-item">
            <summary><strong>2.</strong> Warum arbeiten wir mit Simple Clean statt mit einem vokalisierten Text?</summary>
            <p className="intro-quiz-answer">
              Weil wir die Vokalisierung aus der Grammatik ableiten wollen, nicht aus
              den Vokalzeichen ablesen. Die Vokalzeichen zeigen eine mögliche Lesung —
              wir wollen eigenständig bestimmen können welche Lesungen grammatisch
              möglich sind.
            </p>
          </details>
          <details className="intro-quiz-item">
            <summary><strong>3.</strong> Was ist das Bootstrapping-Problem und wie lösen wir es?</summary>
            <p className="intro-quiz-answer">
              Man braucht Morphologie um den Text zu lesen, und den Text um Morphologie
              zu lernen. Lösung: Morphologie zuerst abstrakt lernen (mit Transliteration),
              dann am Text anwenden.
            </p>
          </details>
          <details className="intro-quiz-item">
            <summary><strong>4.</strong> Was passiert wenn dasselbe Konsonantengerüst mehrere
            grammatisch korrekte Vokalisierungen zulässt?</summary>
            <p className="intro-quiz-answer">
              Dann ist der Text an dieser Stelle mehrdeutig. Wer die Grammatik beherrscht,
              kann alle möglichen Lesungen eigenständig ableiten und bewerten.
            </p>
          </details>
          <details className="intro-quiz-item">
            <summary><strong>5.</strong> Was sind unsere drei Hauptwerkzeuge?</summary>
            <p className="intro-quiz-answer">
              Abstrakte Morphologie (die Muster), Lane's Lexikon (die Wurzelbedeutungen),
              und der Kontext des Konsonantentextes.
            </p>
          </details>
        </div>
        <p>
          Wenn du diese fünf Punkte verstanden hast, bist du bereit für den
          Schrift-Trainer.
        </p>
      </>
    ),
  },

  // ── Step 18: Abschluss ──
  {
    id: 'ready',
    title: 'Bereit?',
    content: (
      <>
        <p>
          Du hast jetzt verstanden was wir lesen, warum wir es so lesen, und wie
          wir dabei vorgehen. Die Methodik ist klar.
        </p>
        <p>
          Der nächste Schritt ist <strong>Modul 1: Schrift-Trainer</strong> — du lernst
          jeden Buchstaben in jeder Position lesen, die Laute korrekt unterscheiden,
          und die Besonderheiten der arabischen Schrift kennen.
        </p>
        <div className="intro-summary-box intro-final-summary">
          <p><strong>Zusammenfassung unseres Weges:</strong></p>
          <ol>
            <li>Schrift und Phonologie beherrschen (Modul 1)</li>
            <li>Morphologie als abstraktes System lernen (Modul 2)</li>
            <li>Am konsonantischen Quran-Text arbeiten (Modul 3)</li>
            <li>Jedes Wort erarbeiten — Wurzel für Wurzel, Muster für Muster</li>
          </ol>
        </div>
        <p>
          Wer diesen Weg geht, hat sich den Text Buchstabe für Buchstabe erarbeitet.
          Und genau das zwingt dazu jede Schicht zu verstehen, jede Vokalisierung zu
          begründen, jede Mehrdeutigkeit zu erkennen.
        </p>
      </>
    ),
  },
];

export default function IntroSequence({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onComplete) {
      onComplete();
    }
  }, [currentStep, onComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  const handleJump = useCallback((index) => {
    setCurrentStep(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div className="intro-sequence">
      {/* Progress bar */}
      <div className="intro-progress">
        <div
          className="intro-progress-fill"
          style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="intro-step-indicator">
        <span className="intro-step-count">
          {currentStep + 1} / {STEPS.length}
        </span>
        <div className="intro-step-dots">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              className={`intro-dot${i === currentStep ? ' intro-dot-active' : ''}${
                i < currentStep ? ' intro-dot-done' : ''
              }`}
              onClick={() => handleJump(i)}
              title={s.title}
              aria-label={`Schritt ${i + 1}: ${s.title}`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="intro-content">
        <h2 className="intro-title">{step.title}</h2>
        <div className="intro-body">{step.content}</div>
      </div>

      {/* Navigation */}
      <div className="intro-nav">
        <button
          className="intro-btn intro-btn-back"
          onClick={handleBack}
          disabled={currentStep === 0}
        >
          Zurück
        </button>
        <button className="intro-btn intro-btn-next" onClick={handleNext}>
          {isLast ? 'Zum Schrift-Trainer' : 'Weiter'}
        </button>
      </div>
    </div>
  );
}

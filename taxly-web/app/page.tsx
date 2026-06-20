'use client'
import { useState, useMemo } from 'react'
import { szamolKATA, szamolAtalany, szamolSZJA, szamolKft, fmt, fmtM, fmtP, JOVOBELI, K } from '@/lib/adokonstansok'
import styles from './page.module.css'

// ── TÍPUSOK ──────────────────────────────────────────────────
type Eredmeny = NonNullable<ReturnType<typeof szamolKATA>>

// ── SLIDER KOMPONENS ─────────────────────────────────────────
function Slider({ label, value, onChange, min, max, step, hint }: {
  label: string; value: number; onChange: (v: number) => void
  min: number; max: number; step: number; hint?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={styles.sliderWrap}>
      <div className={styles.sliderHeader}>
        <span className={styles.sliderLabel}>{label}</span>
        <span className={styles.sliderValue}>{fmtM(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className={styles.slider}
        style={{ '--pct': `${pct}%` } as React.CSSProperties}
      />
      {hint && <div className={styles.sliderHint}>{hint}</div>}
    </div>
  )
}

// ── EREDMÉNY KÁRTYA ───────────────────────────────────────────
function EredmenyKartya({ e, legjobb, onToggle, nyitott }: {
  e: Eredmeny; legjobb: boolean; onToggle: () => void; nyitott: boolean
}) {
  const pct = Math.max(0, Math.min(100, (e.evi_netto / (e.evi_netto + e.evi_adoteher)) * 100))
  return (
    <div className={`${styles.kartya} ${legjobb ? styles.kartyaLegjobb : ''}`}
      style={{ '--szin': e.szin } as React.CSSProperties}>
      <div className={styles.kartyaFejlec} onClick={onToggle}>
        <div className={styles.kartyaFejlecBal}>
          <span className={styles.kartyaEmoji}>{e.emoji}</span>
          <div>
            <div className={styles.kartyaNev}>{e.forma}</div>
            {legjobb && <span className={styles.legjobb}>LEGJOBB</span>}
          </div>
        </div>
        <div className={styles.kartyaFejlecJobb}>
          <div className={styles.kartyaNetto}>{fmtM(e.evi_netto)}</div>
          <div className={styles.kartyaHavi}>{fmt(e.havi_netto)}/hó</div>
        </div>
      </div>

      <div className={styles.progressWrap}>
        <div className={styles.progressBar}
          style={{ width: `${pct}%`, background: e.szin }}/>
      </div>

      <div className={styles.kartyaMeta}>
        <span>Adóteher: {fmt(e.evi_adoteher)}</span>
        <span>Effektív: {fmtP(e.effektiv)}</span>
      </div>

      {nyitott && (
        <div className={styles.kartyaReszlet}>
          {e.tetelek.map((t, i) => (
            <div key={i} className={styles.tetelSor}>
              <span>{t.n}</span>
              <span className={styles.tetelErtek}>{fmt(t.v)}</span>
            </div>
          ))}
          <div className={styles.tetelOsszeg}>
            <span>Évi nettó</span>
            <span style={{ color: e.szin }}>{fmt(e.evi_netto)}</span>
          </div>
          {e.megjegyzes && (
            <div className={styles.megjegyzes}>💡 {e.megjegyzes}</div>
          )}
        </div>
      )}

      <button className={styles.kartyaToggle} onClick={onToggle}
        style={{ color: e.szin }}>
        {nyitott ? '▲ Elrejt' : '▼ Részletek'}
      </button>
    </div>
  )
}

// ── FŐ OLDAL ──────────────────────────────────────────────────
export default function Home() {
  const [bev,    setBev]    = useState(10_000_000)
  const [ktg,    setKtg]    = useState(1_500_000)
  const [tev,    setTev]    = useState('alap')
  const [ho,     setHo]     = useState(12)
  const [kft,    setKft]    = useState(false)
  const [nyitott,setNyitott]= useState<string | null>(null)
  const [email,  setEmail]  = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'err'>('idle')

  const eredmenyek = useMemo<Eredmeny[]>(() => {
    return [
      szamolKATA(bev, ho),
      szamolAtalany(bev, tev, ho),
      szamolSZJA(bev, ktg, ho),
      kft ? szamolKft(bev, ktg, ho) : null,
    ].filter((e): e is Eredmeny => !!e && e.evi_netto > 0)
     .sort((a, b) => b.evi_netto - a.evi_netto)
  }, [bev, ktg, tev, ho, kft])

  const legjobb   = eredmenyek[0]
  const legrosszabb = eredmenyek[eredmenyek.length - 1]
  const megtak    = legjobb && legrosszabb ? legjobb.evi_netto - legrosszabb.evi_netto : 0

  const jovobeli_aktiv = JOVOBELI.filter(v => new Date(v.datum) > new Date())

  async function feliratkozas(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) return
    setStatus('loading')
    try {
      const res = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': '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',
        },
        body: JSON.stringify({
          email,
          listIds: [2],
          updateEnabled: true,
          attributes: { SIGNUP_SOURCE: 'taxly-web' },
        }),
      })
      if (res.status === 201 || res.status === 204 || res.ok) {
        setStatus('ok')
        setTimeout(() => window.open('https://taxly.gumroad.com/l/diojj', '_blank'), 400)
      } else {
        setStatus('err')
      }
    } catch {
      setStatus('err')
    }
  }

  return (
    <main className={styles.main}>

      {/* ── NAV ── */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <div className={styles.logoDot}/>
          taxly
        </div>
        <a href="https://taxly.gumroad.com/l/diojj" target="_blank"
          className={styles.navCta}>
          Early Bird – 9 900 Ft →
        </a>
      </nav>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.eyebrow}>2026-os adószabályok · Ingyenes kalkulátor</div>
          <h1 className={styles.h1}>
            A könyvelőd nem mondja el.<br/>
            <span className={styles.h1Teal}>Mi igen.</span>
          </h1>
          <p className={styles.heroSub}>
            KATA, Átalányadó, SZJA, Kft. – egymás mellett, 2026-os szabályok alapján.
            Látod, melyikkel maradsz a legjobban.
          </p>
        </div>
      </section>

      {/* ── KÖZELGŐ VÁLTOZÁSOK ── */}
      {jovobeli_aktiv.length > 0 && (
        <div className={styles.container}>
          <div className={styles.valtozasBanner}>
            <span className={styles.valtozasTitle}>📅 Közelgő jogszabályi változások</span>
            <div className={styles.valtozasLista}>
              {jovobeli_aktiv.map((v, i) => (
                <div key={i} className={styles.valtozasElem}>
                  <span className={styles.valtozasDatum} style={{ color: v.c }}>
                    {new Date(v.datum).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span className={styles.valtozasSzoveg}>{v.szoveg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── KALKULÁTOR ── */}
      <section className={styles.kalkSection}>
        <div className={styles.container}>
          <div className={styles.kalkGrid}>

            {/* Bal – input */}
            <div className={styles.inputPanel}>
              <div className={styles.panelCim}>Adataid</div>

              <Slider label="Évi bevétel" value={bev} onChange={setBev}
                min={500_000} max={30_000_000} step={100_000}
                hint="Bruttó, ÁFA nélkül"/>

              <Slider label="Igazolt évi költség" value={ktg} onChange={setKtg}
                min={0} max={Math.min(bev * 0.8, 15_000_000)} step={100_000}
                hint="SZJA tételes és Kft. számításhoz"/>

              <div className={styles.panelCim} style={{ marginTop: 20 }}>Tevékenység</div>
              {[
                { v: 'alap',      l: 'Szolgáltatás / szellemi munka', k: '45%' },
                { v: 'kisker',    l: 'Kiskereskedelem',               k: '80%' },
                { v: 'specialis', l: 'Taxi / mezőgazdaság',           k: '90%' },
              ].map(opt => (
                <div key={opt.v} className={`${styles.tevOpt} ${tev === opt.v ? styles.tevOptAktiv : ''}`}
                  onClick={() => setTev(opt.v)}>
                  <div className={`${styles.radio} ${tev === opt.v ? styles.radioAktiv : ''}`}/>
                  <div>
                    <div className={styles.tevLabel}>{opt.l}</div>
                    <div className={styles.tevKtg}>{opt.k} elismert ktg</div>
                  </div>
                </div>
              ))}

              <div className={styles.hoGombok}>
                {[3, 6, 9, 12].map(h => (
                  <button key={h} onClick={() => setHo(h)}
                    className={`${styles.hoGomb} ${ho === h ? styles.hoGombAktiv : ''}`}>
                    {h} hó
                  </button>
                ))}
              </div>

              <div className={styles.kftToggle} onClick={() => setKft(!kft)}>
                <div className={`${styles.toggle} ${kft ? styles.toggleAktiv : ''}`}>
                  <div className={styles.toggleBall}/>
                </div>
                <div>
                  <div className={styles.toggleLabel}>Kft. összehasonlítása</div>
                  <div className={styles.toggleSub}>Magasabb bevételnél érdemes</div>
                </div>
              </div>
            </div>

            {/* Jobb – eredmények */}
            <div className={styles.eredmenyPanel}>

              {/* Megtakarítás banner */}
              {megtak > 0 && (
                <div className={styles.megtak}>
                  <div>
                    <div className={styles.megtakLabel}>Max. évi megtakarítás</div>
                    <div className={styles.megtakSzam}>{fmtM(megtak)}</div>
                  </div>
                  <div className={styles.megtakJobb}>
                    <div className={styles.megtakSubLabel}>Legjobb forma</div>
                    <div className={styles.megtakForma}>
                      {legjobb.emoji} {legjobb.forma}
                    </div>
                    <div className={styles.megtakHavi}>{fmt(legjobb.havi_netto)}/hó</div>
                  </div>
                </div>
              )}

              {/* KATA figyelmeztetés */}
              {bev > K.KATA_HATAR && (
                <div className={styles.kataBanner}>
                  ⚠️ {fmtM(bev)} bevételnél a KATA nem választható (határ: 18 M Ft/év).
                </div>
              )}

              {/* Eredmény kártyák */}
              {eredmenyek.map((e, i) => (
                <EredmenyKartya key={e.forma} e={e} legjobb={i === 0}
                  nyitott={nyitott === e.forma}
                  onToggle={() => setNyitott(nyitott === e.forma ? null : e.forma)}/>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── EARLY BIRD CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaEyebrow}>Az első 100 vállalkozónak</div>
          <h2 className={styles.ctaH2}>Foglald le az Early Bird árat</h2>
          <p className={styles.ctaSub}>
            9 900 Ft · 1 év Prémium · Az ár örökre rögzítve · 14 napos visszautalási garancia
          </p>

          {status === 'ok' ? (
            <div className={styles.siker}>
              🎉 Feliratkoztál! Megnyílik a Gumroad oldal...
            </div>
          ) : (
            <form onSubmit={feliratkozas} className={styles.form}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@cimed.hu"
                className={styles.emailInput}
                required
              />
              <button type="submit" className={styles.ctaGomb}
                disabled={status === 'loading'}>
                {status === 'loading' ? '...' : 'Lefoglalom az Early Bird árat →'}
              </button>
            </form>
          )}

          <div className={styles.ctaNote}>
            Nincs kötöttség · Bármikor lemondható · Early Bird ár: örökre rögzítve
          </div>
        </div>
      </section>

      {/* ── LÁBLÉC ── */}
      <footer className={styles.footer}>
        <div className={styles.footerLogo}>• taxly</div>
        <div className={styles.footerLinks}>
          <a href="https://taxly.gumroad.com/l/diojj" target="_blank">Early Bird 1 év – 9 900 Ft</a>
          <span>·</span>
          <a href="https://taxly.gumroad.com/l/hyhynw" target="_blank">2 év – 16 900 Ft</a>
          <span>·</span>
          <a href="mailto:hello@taxly.hu">hello@taxly.hu</a>
        </div>
        <div className={styles.footerMeta}>
          © 2026 Taxly · 2026-os adószabályok alapján · Tájékoztató jellegű
        </div>
      </footer>

    </main>
  )
}

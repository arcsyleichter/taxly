// lib/adokonstansok.ts
// 2026-os hatályos adókonstansok – forrás: NAV.gov.hu, Magyar Közlöny

export const K = {
  MINBER:              322_800,
  GARANT:              373_200,
  KATA_ADO:            50_000,
  KATA_HATAR:          18_000_000,
  KATA_KULONADÓ:       0.40,
  KTGH_ALAP:           0.45,   // 2026-tól (volt 0.40), 2027-től 0.50
  KTGH_KISKER:         0.80,
  KTGH_SPEC:           0.90,
  SZJA:                0.15,
  TB:                  0.185,
  SZOCHO:              0.13,
  SZJA_MENTES_JOV:     1_936_800,
  ATALANY_HATAR:       38_736_000,
  AFA_HATAR:           20_000_000, // 2027: 22M, 2028: 24M
  HIPA:                0.02,
  TAO:                 0.09,
  OSZ_SZJA:            0.15,
  OSZ_SZOCHO:          0.13,
  SZOCHO_PLAFON:       7_747_200,  // min.bér × 24
} as const

export const JOVOBELI = [
  { datum: '2027-01-01', szoveg: 'Átalányadó alap ktg 45%→50%',     c: '#7c3aed' },
  { datum: '2027-01-01', szoveg: 'ÁFA-mentesség határ 20M→22M Ft',  c: '#ea580c' },
  { datum: '2028-01-01', szoveg: 'ÁFA-mentesség határ 22M→24M Ft',  c: '#ea580c' },
]

const ker = (n: number) => Math.round(n)

export function szamolKATA(bev: number, ho: number) {
  if (bev > K.KATA_HATAR) return null
  const ado  = ker(K.KATA_ADO * ho / 12)
  const hipa = ker(50_000 * ho / 12)
  const t    = ado + hipa
  return {
    forma: 'KATA', szin: '#0891b2', emoji: '⚡',
    evi_netto: bev - t, havi_netto: ker((bev - t) / ho),
    evi_adoteher: t, effektiv: t / bev,
    tetelek: [
      { n: 'KATA fix adó', v: ado },
      { n: 'HIPA (tételes)', v: hipa },
    ],
    megjegyzes: 'Csak magánszemélyeknek számlázható.',
  }
}

export function szamolAtalany(bev: number, tev: string, ho: number) {
  const ktg = tev === 'kisker' ? K.KTGH_KISKER : tev === 'specialis' ? K.KTGH_SPEC : K.KTGH_ALAP
  const jov  = bev * (1 - ktg)
  const szja_alap = Math.max(0, jov - K.SZJA_MENTES_JOV)
  const szja = ker(szja_alap * K.SZJA)
  const tb_alap = Math.max(jov, K.MINBER * 12 * ho / 12)
  const tb   = ker(tb_alap * K.TB)
  const szoch= ker(tb_alap * K.SZOCHO)
  const hipa = ker(jov * K.HIPA)
  const t    = szja + tb + szoch + hipa
  return {
    forma: 'Átalányadó', szin: '#7c3aed', emoji: '📊',
    evi_netto: ker(bev - t), havi_netto: ker((bev - t) / ho),
    evi_adoteher: t, effektiv: t / bev,
    tetelek: [
      { n: `Ktg hányad (${(ktg*100).toFixed(0)}%)`, v: ker(bev * ktg) },
      { n: 'SZJA-mentes jövedelem',                  v: Math.min(ker(jov), K.SZJA_MENTES_JOV) },
      { n: 'SZJA (15%)',                              v: szja },
      { n: 'TB-járulék (18,5%)',                      v: tb   },
      { n: 'Szochó (13%)',                            v: szoch},
      { n: 'HIPA (2%)',                               v: hipa },
    ],
    megjegyzes: '2026-tól 45%-os ktg hányad (volt 40%).',
  }
}

export function szamolSZJA(bev: number, ktg: number, ho: number) {
  const jov  = Math.max(0, bev - ktg)
  const szja = ker(jov * K.SZJA)
  const tb   = ker(K.MINBER * 12 * ho / 12 * K.TB)
  const szoch= ker(K.MINBER * 12 * ho / 12 * K.SZOCHO)
  const hipa = ker(jov * K.HIPA)
  const t    = szja + tb + szoch + hipa
  return {
    forma: 'SZJA (tételes)', szin: '#059669', emoji: '📑',
    evi_netto: ker(jov - t), havi_netto: ker((jov - t) / ho),
    evi_adoteher: t, effektiv: t / bev,
    tetelek: [
      { n: 'Igazolt ktg',              v: ktg  },
      { n: 'SZJA (15%)',               v: szja },
      { n: 'TB – min.bér alapon',      v: tb   },
      { n: 'Szochó – min.bér alapon',  v: szoch},
      { n: 'HIPA (2%)',                v: hipa },
    ],
    megjegyzes: 'TB/szochó minimum alapja a minimálbér.',
  }
}

export function szamolKft(bev: number, ktg: number, ho: number) {
  // Éves minimálbér alapú bérköltség (Kft. fizeti)
  const ev_ho       = 12                                    // mindig éves szinten számolunk
  const berbrutto   = K.MINBER * ev_ho                     // 322 800 × 12 = 3 873 600 Ft
  const szocho_ber  = ker(berbrutto * K.SZOCHO)            // 13% szocho a bérre
  const berkoltseg  = berbrutto + szocho_ber               // teljes bérköltség a Kft.-nek

  // Tulajdonos nettó bér (amit ő kap kézhez)
  const tb_berfiz   = ker(berbrutto * K.TB)                // 18,5% TB amit ő fizet
  const szja_ber    = ker(berbrutto * K.SZJA)              // 15% SZJA a bérre
  const netto_ber   = berbrutto - tb_berfiz - szja_ber     // ~2 530 000 Ft/év

  // Kft. adózás előtti eredmény
  const eredmeny    = Math.max(0, bev - ktg - berkoltseg)
  const tao         = ker(eredmeny * K.TAO)
  const ado_utan    = eredmeny - tao

  // Osztalék adózása
  const osz_szja    = ker(ado_utan * K.OSZ_SZJA)
  const osz_szoch   = ker(Math.min(ado_utan, K.SZOCHO_PLAFON) * K.OSZ_SZOCHO)
  const netto_osztalek = ado_utan - osz_szja - osz_szoch

  // Teljes nettó = nettó bér + nettó osztalék
  const ossz_netto  = netto_ber + netto_osztalek

  const t = tao + osz_szja + osz_szoch + tb_berfiz + szja_ber + szocho_ber
  return {
    forma: 'Kft.', szin: '#ea580c', emoji: '🏢',
    evi_netto:   ossz_netto,
    havi_netto:  ker(ossz_netto / ev_ho),
    evi_adoteher: t,
    effektiv:    t / Math.max(bev, 1),
    tetelek: [
      { n: 'Bérköltség (min.bér + szocho)',  v: berkoltseg   },
      { n: 'TAO (9%)',                        v: tao          },
      { n: 'Nettó bér (tulajdonos)',          v: netto_ber    },
      { n: 'Osztalék SZJA (15%)',             v: osz_szja     },
      { n: 'Osztalék szochó (13%)',           v: osz_szoch    },
      { n: 'Nettó osztalék',                  v: netto_osztalek },
    ],
    megjegyzes: 'Könyvelő kötelező. KIVA alternatív lehet.',
  }
}

export const fmt  = (n: number) => `${Math.round(n).toLocaleString('hu-HU')} Ft`
export const fmtM = (n: number) => `${(n/1_000_000).toFixed(1).replace('.',',')} M Ft`
export const fmtP = (n: number) => `${(n*100).toFixed(1)}%`

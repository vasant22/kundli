// tests/bnn-modules.test.js — BNN module scaffolding (Phase 1: stubs only).
// Each module throws "not implemented yet" until its phase — that is the
// contract the later phases fill in (see docs/bnn-guide.txt).
import { describe, expect, it } from 'vitest'
import * as kp from '../src/bnn/kp.js'
import * as prsss from '../src/bnn/prsss.js'
import * as combos from '../src/bnn/combos.js'
import * as percent from '../src/bnn/percent.js'
import * as special from '../src/bnn/special.js'
import * as dasha from '../src/bnn/dasha.js'
import * as transit from '../src/bnn/transit.js'
import * as render from '../src/bnn/render.js'

describe('BNN Phase 1 — module API surfaces', () => {
  it('exposes the planned functions', () => {
    const fns = [
      kp.computeBhavaChalit,
      kp.setBnnAyanamsa,
      kp.tithiIndexOf,
      kp.yogaIndexOf,
      kp.findExchanges,
      prsss.computePrsss,
      prsss.computeBrsss,
      combos.seatPositions,
      combos.planetCombination,
      combos.planetCombinations,
      combos.bhavaCombinations,
      combos.astronomyPartner,
      combos.aspectPoints,
      combos.labelSuffix,
      combos.bhavaIndexOf,
      percent.planetToPlanetPercent,
      percent.planetToBhavaPercent,
      special.specialTables,
      special.starLordOf,
      special.entryColour,
      dasha.computeDashaTree,
      transit.computeTransitSnapshot,
      transit.computePcpWindows,
      render.buildBnnChart,
      render.planetText,
      render.cuspText,
      render.exchangeLabel,
      render.ageYMD,
      render.buildPlanetTables,
      render.buildBhavaTables,
    ]
    for (const fn of fns) expect(typeof fn).toBe('function')
  })

  it('carries the guide constants in settings', () => {
    expect(percent.PERCENT_SETTINGS).toEqual({ p2pBase: 96.65, p2pPerDegree: 3.147, p2bWidthFactor: 0.942 })
    expect(dasha.DASHA_SETTINGS.bhukthiYearDays).toBe(366)
    expect(dasha.DASHA_SETTINGS.andhiramYearDays).toBe(364)
    expect(kp.BNN_SETTINGS.ayanamsaMode).toBe(44)
    expect(kp.BNN_SETTINGS.housesAtDeltaT).toBe(true)
  })

  it('stubs throw with their phase until implemented', () => {
    expect(() => dasha.computeDashaTree()).toThrow(/Phase 6/)
    expect(() => transit.computeTransitSnapshot()).toThrow(/Phase 7/)
  })
})

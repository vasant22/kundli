// ratna.js — रत्न (gem) सुझाव: जीवन रत्न (लग्नेश), भाग्य रत्न (नवमेश),
// कारक रत्न (पंचमेश), और कमज़ोर ग्रहों की सूची (उपाय के लिए)।
//
// A gem is *not* prescribed blindly: if the graha also owns a dusthana
// (6/8/12) without owning a good house (1/5/9), the line is flagged.

import { GEMS, gemFor, ownsDusthanaOnly, weakPlanetList } from './gems.js'
import { RASHI_LORDS } from '../astro.js'

export { GEMS, gemFor }

function ratnaLine(frame, planet, roleHi, roleKey) {
  const gem = gemFor(planet)
  const houses = frame.housesOwned(planet)
  return {
    role: roleKey,
    roleHi,
    planet,
    houses,
    gem,
    warning: ownsDusthanaOnly(frame, planet),
  }
}

export function ratnaFor(frame, { positions = null, strength = null } = {}) {
  const lagnesh = frame.houseLord[0]
  const ninth = frame.houseLord[8]
  const fifth = frame.houseLord[4]
  return {
    jeevan: ratnaLine(frame, lagnesh, 'जीवन रत्न (लग्नेश)', 'jeevan'),
    bhagya: ratnaLine(frame, ninth, 'भाग्य रत्न (नवमेश)', 'bhagya'),
    karak: ratnaLine(frame, fifth, 'कारक रत्न (पंचमेश)', 'karak'),
    weakPlanets: weakPlanetList({ frame, positions, strength }),
    lagnesh,
    ninthLord: ninth,
    fifthLord: fifth,
    // राशि-स्वामी की एक पंक्ति — रिपोर्ट के "लग्नेश" वाक्य के लिए
    lagnaRashiLord: RASHI_LORDS[frame.lagnaRashi],
  }
}

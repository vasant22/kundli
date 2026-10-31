// transit-bhava.js — राउंड 64 (सुधार-3 के बाद): अब कोई अलग नियम नहीं।
//
// भाव-सीमा का नियम (संधि से पीछे वाला ग्रह अगले भाव में) अब BNN का सामान्य नियम है और
// `combos.js` के `bhavaCombinations()` में `COMBO_SETTINGS.bhavaEdgeRule` के साथ लगता है —
// इसलिए Natal, गोचर और website सब एक ही function से चलते हैं।
//
// यह file सिर्फ़ पुराने नाम को बचाए रखती है (पुराने test/import टूटें नहीं):
import { bhavaCombinations } from './combos.js'

/** @deprecated अब `bhavaCombinations()` ही यह काम करता है। */
export const bhavaCombinationsTransit = bhavaCombinations

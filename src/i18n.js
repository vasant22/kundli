// i18n.js — bilingual strings (Hindi default + English).
// Phase 6 will add the full data lists: 12 rashis, 9 grahas, 27 nakshatras.
// Everything the UI shows should come from here via t(key).

const STRINGS = {
  hi: {
    'app.docTitle': 'कुंडली — जन्मपत्री',
    'app.title': 'कुंडली',
    'app.subtitle': 'वैदिक जन्मपत्री (बर्थ चार्ट)',
    'lang.switchTo': 'English',

    'form.heading': 'जन्म विवरण भरें',
    'form.name': 'नाम (वैकल्पिक)',
    'form.namePh': 'आपका नाम',
    'form.gender': 'लिंग',
    'gender.male': 'पुरुष',
    'gender.female': 'महिला',
    'gender.other': 'अन्य',
    'form.dob': 'जन्म तिथि',
    'date.day': 'दिन',
    'date.month': 'महीना',
    'date.monthPh': '— चुनें —',
    'date.year': 'साल',
    'form.tob': 'जन्म समय',
    'form.tobNote': '(24 घंटे का प्रारूप, जैसे 14 = दोपहर 2 बजे)',
    'time.hour': 'घंटा',
    'time.minute': 'मिनट',
    'time.second': 'सेकंड',
    'form.place': 'जन्म स्थान',
    'form.placePh': 'गाँव / शहर का नाम',
    'form.search': 'खोजें',
    'btn.get': 'कुंडली बनाएँ',

    'search.comingSoon': '🔎 जगह की खोज अगले अपडेट में जुड़ेगी।',

    'err.gender': 'कृपया लिंग चुनें।',
    'err.dateRequired': 'जन्म तिथि पूरी भरें — दिन, महीना और साल।',
    'err.dateInvalid': 'यह तिथि मान्य नहीं है, दिन जाँचें।',
    'err.yearRange': 'साल 1800 से 2400 के बीच होना चाहिए।',
    'err.timeRequired': 'जन्म समय पूरा भरें — घंटा, मिनट और सेकंड।',
    'err.hour': 'घंटा 0 से 23 के बीच होना चाहिए।',
    'err.minute': 'मिनट 0 से 59 के बीच होना चाहिए।',
    'err.second': 'सेकंड 0 से 59 के बीच होना चाहिए।',
    'err.place': 'कृपया जन्म स्थान भरें।',

    'summary.title': '✅ जानकारी सही है',
    'summary.name': 'नाम',
    'summary.gender': 'लिंग',
    'summary.date': 'जन्म तिथि',
    'summary.time': 'जन्म समय',
    'summary.place': 'जन्म स्थान',
    'summary.note': 'कुंडली की गणना और चार्ट आगे के चरणों में जुड़ेंगे — तब पूरा फल यहीं दिखेगा।',

    'month.1': 'जनवरी',
    'month.2': 'फ़रवरी',
    'month.3': 'मार्च',
    'month.4': 'अप्रैल',
    'month.5': 'मई',
    'month.6': 'जून',
    'month.7': 'जुलाई',
    'month.8': 'अगस्त',
    'month.9': 'सितंबर',
    'month.10': 'अक्टूबर',
    'month.11': 'नवंबर',
    'month.12': 'दिसंबर',
  },

  en: {
    'app.docTitle': 'Kundli — Birth Chart',
    'app.title': 'Kundli',
    'app.subtitle': 'Vedic Birth Chart',
    'lang.switchTo': 'हिंदी',

    'form.heading': 'Enter birth details',
    'form.name': 'Name (optional)',
    'form.namePh': 'Your name',
    'form.gender': 'Gender',
    'gender.male': 'Male',
    'gender.female': 'Female',
    'gender.other': 'Other',
    'form.dob': 'Birth date',
    'date.day': 'Day',
    'date.month': 'Month',
    'date.monthPh': '— Select —',
    'date.year': 'Year',
    'form.tob': 'Birth time',
    'form.tobNote': '(24-hour format, e.g. 14 = 2 PM)',
    'time.hour': 'Hour',
    'time.minute': 'Minute',
    'time.second': 'Second',
    'form.place': 'Birth place',
    'form.placePh': 'Village / city name',
    'form.search': 'Search',
    'btn.get': 'Get Kundli',

    'search.comingSoon': '🔎 Place search will be added in the next update.',

    'err.gender': 'Please choose a gender.',
    'err.dateRequired': 'Fill the full birth date — day, month and year.',
    'err.dateInvalid': 'This date is not valid — please check the day.',
    'err.yearRange': 'Year must be between 1800 and 2400.',
    'err.timeRequired': 'Fill the full birth time — hour, minute and second.',
    'err.hour': 'Hour must be between 0 and 23.',
    'err.minute': 'Minute must be between 0 and 59.',
    'err.second': 'Second must be between 0 and 59.',
    'err.place': 'Please enter a birth place.',

    'summary.title': '✅ Details are valid',
    'summary.name': 'Name',
    'summary.gender': 'Gender',
    'summary.date': 'Birth date',
    'summary.time': 'Birth time',
    'summary.place': 'Birth place',
    'summary.note': 'The chart calculation will be added in the coming steps — the full result will appear here.',

    'month.1': 'January',
    'month.2': 'February',
    'month.3': 'March',
    'month.4': 'April',
    'month.5': 'May',
    'month.6': 'June',
    'month.7': 'July',
    'month.8': 'August',
    'month.9': 'September',
    'month.10': 'October',
    'month.11': 'November',
    'month.12': 'December',
  },
}

let lang = 'hi' // Hindi is the default language

export function getLang() {
  return lang
}

export function setLang(next) {
  if (next === 'hi' || next === 'en') lang = next
}

// t('some.key') -> string in the active language
export function t(key) {
  return STRINGS[lang][key] ?? STRINGS.en[key] ?? key
}

// List of the 12 month names in the active language.
export function months() {
  return Array.from({ length: 12 }, (_, i) => t(`month.${i + 1}`))
}

/** Uzbek UI strings. Card and sequence text never goes here: it is stored exactly as the parent typed it. */
export const uz = {
  common: {
    comingSoon: 'Tez orada',
    cancel: 'Bekor qilish',
    openSettings: 'Sozlamalarni ochish',
  },
  child: {
    requestsTab: "So'rovlar",
    pauseGameTab: "O'yin",
    goodbye: 'Xayr!',
  },
  parentGate: {
    label: 'Ota-ona rejimi',
  },
  parent: {
    title: 'Ota-ona rejimi',
    cards: 'Kartalar',
    sequences: 'Ketma-ketliklar',
    settings: 'Sozlamalar',
    log: 'Jurnal',
    backToChild: 'Bola rejimiga qaytish',
    guidedAccessHint:
      "Bola ilovadan chiqib ketmasligi uchun Guided Access'ni yoqing: Settings → Accessibility → Guided Access. Keyin ilova ochiq turganda yon tugmani uch marta bosing.",
  },
  boards: {
    empty: "Hali to'plam yo'q. Masalan, «Ovqat» yoki «O'yin» to'plamini yarating.",
    add: "Yangi to'plam",
    namePrompt: "To'plam nomi",
    rename: "Nomini o'zgartirish",
    active: 'Faol',
    activate: "Bolaga shu to'plamni ko'rsatish",
    activeHint: "Bola shu to'plamni ko'radi.",
  },
  cards: {
    add: "Karta qo'shish",
    starterHint:
      "Bola xohlaydigan narsalarni (suv, sevimli o'yinchoqlar, arg'imchoq) hamma joyda kerak bo'ladigan so'zlar bilan aralashtiring: yana, ber, yo'q, bo'ldi, yordam. Bu so'zlar har bir to'plamda doim bir joyda tursin.",
    moveUp: 'Yuqoriga',
    moveDown: 'Pastga',
  },
  settings: {
    requestsSection: "So'rovlar",
    cardsPerScreen: 'Ekrandagi kartalar',
    debounce: 'Qayta bosish pauzasi',
    seconds: (count: number): string => `${count} soniya`,
    debounceHint: 'Bola bir kartani qayta bossa, karta shuncha vaqt jim turadi.',
  },
  cardEditor: {
    newTitle: 'Yangi karta',
    editTitle: 'Karta',
    photo: 'Surat',
    takePhoto: 'Suratga olish',
    pickPhoto: 'Galereyadan tanlash',
    removePhoto: 'Suratni olib tashlash',
    cameraDenied: "Kameraga ruxsat yo'q.",
    word: "So'z",
    wordPlaceholder: 'suv',
    voice: 'Ovoz',
    holdToRecord: 'Bosib turing va gapiring',
    recording: 'Yozilmoqda…',
    play: 'Tinglash',
    microphoneDenied: "Mikrofonga ruxsat yo'q.",
    board: "To'plam",
    save: 'Saqlash',
    incomplete: "Saqlash uchun so'z va ovoz kerak.",
    archive: 'Arxivga olish',
    archiveConfirm: "Karta arxivga olinsinmi? Bola uni boshqa ko'rmaydi.",
  },
  error: {
    message: "Nimadir noto'g'ri ketdi",
    reload: 'Qayta yuklash',
  },
}

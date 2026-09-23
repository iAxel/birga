/** Uzbek UI strings. Card and sequence text never goes here: it is stored exactly as the parent typed it. */
export const uz = {
  common: {
    comingSoon: 'Tez orada',
    back: 'Orqaga',
    cancel: 'Bekor qilish',
    openSettings: 'Sozlamalarni ochish',
  },
  child: {
    requestsTab: "So'rovlar",
    pauseGameTab: "O'yin",
    wordmark: 'Birga',
    startSubtitle: (name: string): string => `${name} bilan birga o'ynaymiz`,
    startSubtitleNoName: "Birga o'ynaymiz",
    startHint: 'Sessiyani ota-ona boshlaydi',
    goodbye: 'Xayr!',
    goodbyeSubtitle: "Ertaga yana o'ynaymiz",
  },
  parentGate: {
    label: 'Ota-ona rejimi',
  },
  parent: {
    label: 'Ota-ona',
    cards: 'Kartalar',
    sequences: 'Ketma-ketliklar',
    settings: 'Sozlamalar',
    log: 'Kundalik',
    logToday: (count: number): string => `Bugun ${count}`,
    close: 'Yopish',
    logComingSoon: "Tez orada: kunlik xulosa, kartalar bo'yicha bosishlar va eksport.",
    sequencesComingSoon: "Tez orada: pauza o'yini uchun ketma-ketliklar.",
  },
  onboarding: {
    title: 'Boshlaymiz',
    why: "Birga — ota-ona bilan birga o'ynash uchun. Bola ekranni yolg'iz ishlatmaydi.",
    firstBoard: 'Uy',
    cardsStep: (goal: number): string => `${goal} ta karta qo'shing`,
    cardsCount: (count: number, goal: number): string => `${count} / ${goal}`,
    cardsText:
      "Bola hozir xohlaydigan narsalar: suv, sevimli o'yinchoq. Uning o'z buyumini suratga oling. Ovozni bola eng yaxshi biladigan odam yozsin.",
    guidedAccessStep: 'Guided Access yoqing',
    guidedAccessText:
      'Settings → Accessibility → Guided Access. Sessiya oldidan yon tugmani 3 marta bosing: bola ilovadan chiqib keta olmaydi.',
    start: 'Boshlash',
    startHint: (goal: number): string => `${goal} ta karta qo'shilgach faollashadi`,
  },
  boards: {
    title: 'Doskalar',
    empty: "Hali doska yo'q. Masalan, «Uy», «Ovqat» yoki «O'yin» doskasini yarating.",
    add: 'Yangi doska',
    namePrompt: 'Doska nomi',
    rename: "Nomini o'zgartirish",
    active: 'Faol',
    activate: "Bolaga shu doskani ko'rsatish",
    summary: (title: string, count: number): string => `${title} · ${count}`,
  },
  cards: {
    add: "Karta qo'shish",
    starterHint:
      "Bola xohlaydigan narsalarni (suv, sevimli o'yinchoqlar, arg'imchoq) hamma joyda kerak bo'ladigan so'zlar bilan aralashtiring: yana, ber, yo'q, bo'ldi, yordam. Bu so'zlar har bir to'plamda doim bir joyda tursin.",
    moveUp: 'Yuqoriga',
    moveDown: 'Pastga',
    visibleHint: (count: number): string => `Bola birinchi ${count} ta kartani ko'radi. Tartib: ekrandagi kabi.`,
    hiddenDivider: "bola ko'rmaydi",
    noPhoto: 'rasmsiz',
  },
  requests: {
    attempt: "Bola so'zni aytishga harakat qildi",
    modeling: "Ota-ona ko'rsatmoqda",
  },
  settings: {
    childSection: 'Bola',
    childName: 'Ismi',
    childNamePlaceholder: 'Ism',
    childNameHint: "Boshlash ekranida ko'rinadi: «… bilan birga o'ynaymiz».",
    requestsSection: "So'rovlar",
    cardsPerScreen: 'Ekrandagi kartalar',
    cardsPerScreenPhoneHint: "iPhone'da bola doim 2 ta kartani ko'radi.",
    debounce: 'Qayta bosish pauzasi',
    seconds: (count: number): string => `${count} soniya`,
    debounceHint: 'Bola bir kartani qayta bossa, karta shuncha vaqt jim turadi.',
    sessionSection: 'Sessiya',
    sessionLength: 'Davomiyligi',
    minBreak: 'Sessiyalar orasidagi tanaffus',
    minutes: (count: number): string => `${count} daqiqa`,
    noBreak: "Yo'q",
    goodbyeVoice: '«Xayr!» ovozi',
    goodbyeVoiceRecorded: 'yozilgan',
    goodbyeVoiceMissing: "yo'q",
    showOnboarding: "Yo'riqnomani qayta ko'rish",
  },
  session: {
    paused: "Sessiya to'xtatilgan",
    minutesLeft: (minutes: number): string => `${minutes} daqiqa qoldi`,
    resume: 'Davom etish',
    end: 'Tugatish',
    endConfirm: "Sessiya tugatilsinmi? Bola «Xayr!» ekranini ko'radi.",
    none: "Sessiya yo'q",
    lastAgo: (age: string): string => `oxirgisi ${age}`,
    ageNow: 'hozirgina',
    ageMinutes: (count: number): string => `${count} daqiqa oldin`,
    ageHours: (count: number): string => `${count} soat oldin`,
    ageDays: (count: number): string => `${count} kun oldin`,
    breakLeft: (minutes: number): string => `tanaffus: yana ${minutes} daqiqa`,
    start: (minutes: number): string => `Yangi sessiya · ${minutes} daqiqa`,
    board: (title: string, count: number): string => `Doska: ${title} · ${count} ta karta. Boshlagach, ekranni bolaga bering.`,
    noBoard: "Hali faol doska yo'q: avval kartalar qo'shing.",
  },
  tips: {
    title: 'Bugungi maslahat',
  },
  sessionGuide: {
    title: "Sessiya qanday o'tadi",
    /** Приложение не игрушка для ребенка. Это кнопка между ним и вами. Наградой является не звук, а то, что вы даете. Экран только делает просьбу видимой. */
    model:
      "Ilova bola uchun o'yinchoq emas. Bu — u bilan sizning orangizdagi tugma. Mukofot — ovoz emas, balki sizning bergan narsangiz. Ekran faqat iltimosni ko'rinadigan qiladi.",
    steps: [
      {
        /** Момент. Начинайте, когда он чего-то хочет: пить, мультик, качели. Без желания сессии нет. На доске две карточки: это желание и «yana». */
        title: 'Payt',
        text: "Bola nimanidir xohlaganda boshlang: suv, multfilm, arg'imchoq. Xohish bo'lmasa, sessiya ham bo'lmaydi. Doskada ikkita karta bo'lsin: o'sha xohish va «yana».",
      },
      {
        /** Место. iPad на столе между вами, Guided Access включен, сессия запущена из родительского режима. Предмет держите на виду и не давайте. */
        title: 'Joy',
        text: "iPad stolda, ikkovingizning orangizda. Guided Access yoqilgan, sessiya ota-ona rejimidan boshlangan. Narsani ko'rinadigan joyda ushlab turing va hali bermang.",
      },
      {
        /** Сначала вы. Включите «нажимаю я», нажмите карточку, скажите слово и дайте маленькую порцию, чтобы желание вернулось. Повторите 3–5 раз. */
        title: 'Avval siz',
        text: "Qo'l tugmasini yoqing, kartani o'zingiz bosing, so'zni ayting va kichik ulush bering — xohish yana qaytsin. Buni 3–5 marta takrorlang.",
      },
      {
        /** Пауза. Держите предмет, смотрите на него и молчите 5–10 секунд. Когда он потянет вашу руку, мягко доведите ее до карточки. Сыграло — дайте. */
        title: 'Pauza',
        text: "Narsani ushlab turing, unga qarang va 5–10 soniya jim turing. Bola qo'lingizni tortsa, qo'lini kartagacha ohista olib boring. Karta ovoz chiqardi — darhol bering.",
      },
      {
        /** Меньше помощи. День за днем: рука → локоть → указание пальцем → ничего. Первое самостоятельное нажатие может прийти на третий день или на десятый. */
        title: 'Kamroq yordam',
        text: "Kundan-kunga yordamni kamaytiring: qo'l → tirsak → barmoq bilan ko'rsatish → hech narsa. Birinchi mustaqil bosish uchinchi kuni ham, o'ninchi kuni ham kelishi mumkin.",
      },
      {
        /** Звуки. Любой звук рядом с карточкой отметьте уголком «попытка». Ничего не просите: никаких «скажи». */
        title: 'Tovushlar',
        text: "Karta yonida chiqqan har qanday tovushni burchakdagi «urinish» tugmasi bilan belgilang. Hech narsa so'ramang: «ayt-chi» demang.",
      },
      {
        /** Конец. Таймер закончился — все. Не продлевайте, особенно если пошло хорошо. */
        title: 'Tugash',
        text: "Taymer tugadi — sessiya tamom. Uzaytirmang, ayniqsa yaxshi ketayotgan bo'lsa.",
      },
    ],
  },
  goodbyeVoice: {
    title: '«Xayr!» ovozi',
    hint: 'Sessiya oxirida bola sizning «Xayr!» degan ovozingizni eshitadi. Yozish shart emas.',
    remove: "O'chirish",
  },
  cardEditor: {
    newTitle: 'Yangi karta',
    editTitle: 'Karta',
    photo: 'Rasm',
    photoNote: 'ixtiyoriy · kvadrat',
    takePhoto: 'Kamera',
    pickPhoto: 'Galereya',
    removePhoto: 'Rasmni olib tashlash',
    cameraDenied: "Kameraga ruxsat yo'q.",
    word: "So'z",
    wordPlaceholder: 'suv',
    wordHint: "Kartada aynan shunday ko'rinadi. Ovoz bilan bir xil bo'lsin.",
    voice: 'Ovoz',
    voiceMissing: 'hali yozilmagan',
    voiceReady: 'yozilgan',
    voiceLength: (seconds: string): string => `${seconds} s yozildi`,
    holdToRecord: 'Bosib yozing',
    reRecord: 'Qayta yozish',
    recording: 'Yozilmoqda…',
    voiceHint: "Bosib turib gapiring (4 s gacha). Qo'yib yuborsangiz, yozish tugaydi.",
    play: 'Eshitish',
    microphoneDenied: "Mikrofonga ruxsat yo'q.",
    board: 'Doska',
    boardLabel: (title: string): string => `Doska: ${title}`,
    save: 'Saqlash',
    incomplete: "Saqlash uchun so'z va ovoz kerak.",
    archive: 'Arxivga yuborish',
    archiveConfirm: "Karta arxivga olinsinmi? Bola uni boshqa ko'rmaydi.",
  },
  error: {
    message: "Nimadir noto'g'ri ketdi",
    reload: 'Qayta yuklash',
  },
}

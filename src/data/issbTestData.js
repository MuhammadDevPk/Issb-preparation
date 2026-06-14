/**
 * ISSB Test Materials Database
 * Contains high-frequency prompts, words, and scenarios collected from ISSB sources.
 */

// Fisher-Yates Shuffle algorithm
export function shuffleArray(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ---------------------------------------------------------------------------
// Word Association Test (WAT) Pool (150+ Words)
// ---------------------------------------------------------------------------
export const watPool = {
  set_1: [
    'Army', 'Brave', 'Success', 'Failure', 'Fear', 'Trust', 'Enemy', 'Duty', 'Cheat', 'Work',
    'Decide', 'Break', 'Lies', 'Discipline', 'Calamity', 'Snake', 'Love', 'Death', 'Bribe', 'Solitude',
    'Demanding', 'Disease', 'Difficulty', 'Disaster', 'Disagree', 'Crisis', 'Selfishness', 'Mistakes', 'Disputes', 'Confuse',
    'Criticism', 'Burden', 'Cry', 'Alcohol', 'Cannot', 'Blunder', 'Crime', 'Vices', 'Shy', 'Reject',
    'Suicide', 'Bomb', 'Dismiss', 'Knife', 'Blame', 'Assertive', 'Sorrow', 'Hate', 'Fatigue', 'Zero'
  ],
  set_2: [
    'Guilty', 'Trapped', 'Gap', 'Limit', 'Rude', 'Pity', 'Luck', 'Escape', 'Dilemma', 'Temper',
    'Doubts', 'Disturb', 'Injured', 'Oppose', 'Indiscipline', 'Atom', 'Soul', 'Girl', 'Flower', 'Money',
    'Life', 'Youth', 'Faith', 'Risk', 'Award', 'Adventure', 'Impossible', 'Wine', 'Problem', 'Fight',
    'Peace', 'Defeat', 'Country', 'Soldier', 'Injustice', 'Team', 'Lead', 'Goal', 'Pride', 'Sad',
    'Force', 'Clean', 'Care', 'Win', 'Danger', 'Praise', 'System', 'Build', 'Follow', 'Trustworthy'
  ],
  set_3: [
    'Anger', 'Afraid', 'Attack', 'Bad', 'Bitter', 'Clash', 'Coward', 'Cruel', 'Delay', 'Defend',
    'Doubt', 'Duty', 'Effort', 'Error', 'Fight', 'Grave', 'Grief', 'Hard', 'Hurt', 'Ignorant',
    'Illness', 'Jealous', 'Kill', 'Lazy', 'Loss', 'Mad', 'Mistrust', 'Miserable', 'Nervous', 'Obstacle',
    'Pain', 'Panic', 'Poison', 'Poverty', 'Punish', 'Quarrel', 'Regret', 'Revenge', 'Risk', 'Ruin',
    'Shame', 'Sin', 'Steal', 'Struggle', 'Threat', 'Tired', 'Ugly', 'Weak', 'Worry', 'Wrong'
  ]
}

export const watSheets = [
  {
    id: 'repeated_1',
    name: 'Most Repeated Set 1',
    description: '50 highly recurring words in ISSB tests including core professional and personality markers.',
    words: watPool.set_1
  },
  {
    id: 'repeated_2',
    name: 'Most Repeated Set 2',
    description: '50 more high-frequency words assessing social cooperation, teamwork, and reactions to stress.',
    words: watPool.set_2
  },
  {
    id: 'stress_focus',
    name: 'Stress & Obstacles Focus',
    description: '50 words concentrating on stress, ethical challenges, and negative associations to test adaptive resilience.',
    words: watPool.set_3
  },
  {
    id: 'mock_100',
    name: 'Full Mock Test (100 Words)',
    description: 'A comprehensive 100-word mock exam designed to simulate the actual ISSB testing experience under time constraints.',
    words: [...watPool.set_1, ...watPool.set_2]
  }
]

export function getRandomWatWords(count = 50) {
  const allWords = [...watPool.set_1, ...watPool.set_2, ...watPool.set_3]
  const uniqueWords = Array.from(new Set(allWords))
  return shuffleArray(uniqueWords).slice(0, count)
}

// ---------------------------------------------------------------------------
// Sentence Completion Test (SCT) Pool
// ---------------------------------------------------------------------------
export const sctSheets = {
  english: [
    {
      id: 'eng_sheet_a',
      name: 'English Sheet A',
      description: 'First standard sheet assessing primary fears, relationships with parents, and reactions to initial failures.',
      starters: [
        'He was afraid of',
        'My father',
        'At night',
        'The main problem',
        'During crisis',
        'In his opinion',
        'She wanted to',
        'The teacher',
        'It is hard to',
        'A true friend',
        'He failed because',
        'My mother always',
        'If he becomes a commander',
        'In dark rooms',
        'Money is',
        'Under stress he',
        'The officer',
        'To tell the truth',
        'He feels sad when',
        'My team',
        'The decision was',
        'Women are',
        "A soldier's duty",
        'He was upset by',
        'During discussion he',
        'The future is'
      ]
    },
    {
      id: 'eng_sheet_b',
      name: 'English Sheet B',
      description: 'Second sheet focusing on self-awareness, social integration, wealth, and adaptability.',
      starters: [
        'To become rich',
        'He tried but',
        'Our education system',
        'His biggest mistake is',
        'My greatest weakness is',
        'Tears are',
        'Rich boys',
        'Our Army',
        'Beautiful girls are',
        'When I get annoyed',
        'At night we saw',
        'His attitude is always',
        'He cools down when',
        'When he gets power',
        'Man and woman are',
        'In my spare time',
        'Family planning is',
        'On seeing the blood',
        'He is always in a',
        'He dislikes',
        'In the end he',
        'The most valuable',
        'During his childhood',
        'My greatest fear is',
        'You cannot succeed',
        'He is worried'
      ]
    },
    {
      id: 'eng_sheet_c',
      name: 'English Sheet C',
      description: 'Advanced sheet evaluating leadership principles, peer pressures, discipline, and complex group tasks.',
      starters: [
        'A leader is one who',
        'To avoid conflicts',
        'Working in a team',
        'He got angry when',
        'His parents',
        'The principal',
        'He lost the game because',
        'Honesty is',
        'Under pressure he',
        'The country needs',
        'He believes in',
        'My greatest achievement',
        'Success is',
        'When he was insulted',
        'A disciplined person',
        'He is eager to',
        'The path of duty is',
        'My biggest wish',
        'He was shocked to see',
        'In difficult situations',
        'It is a pity that',
        'Most of the people',
        'He was dismissed from',
        'A brave man',
        'He feels lonely when',
        'The task was completed'
      ]
    }
  ],
  urdu: [
    {
      id: 'urdu_sheet_a',
      name: 'Urdu Sheet A (Roman)',
      description: 'First Urdu sheet focusing on raw emotional responses, family hierarchy, and stress tolerances.',
      starters: [
        'Mujhe darr hai',
        'Mere waalid',
        'Raat ke waqt',
        'Asal masla',
        'Mushkil waqt mein',
        'Uss ki nazar mein',
        'Woh chahta tha',
        'Ustaad ne',
        'Yeh mushkil hai',
        'Sacha dost',
        'Woh nakaam hua kyunke',
        'Meri waalida hamesha',
        'Agar woh commander bana',
        'Andheray mein',
        'Paisa',
        'Dabaao mein woh',
        'Officer ne',
        'Sach baat yeh hai',
        'Woh udaas hota hai jab',
        'Meri team',
        'Faisla',
        'Khawateen',
        'Soldier ka farz',
        'Woh pareshan hua',
        'Guftagu ke dauraan',
        'Mustaqbil'
      ]
    },
    {
      id: 'urdu_sheet_b',
      name: 'Urdu Sheet B (Roman)',
      description: 'Second Urdu sheet covering responses to failure, humility in uniform, and altruistic actions.',
      starters: [
        'Imtihan mein nakaam hone par',
        'Wardee mein hone ke bawajood',
        'Bara aadmi banne ke liye',
        'Us ne chupkay se',
        'Woh chahta hai ke',
        'Zindagi ki dor mein',
        'Haqeeqat to yeh hai ke',
        'Jab usay koi rasta na dikha to',
        'Parh likh kar bhi',
        'Us ke beta ne kabhi',
        'Meri mushkil ka hal',
        'Raqam hasil karne ki khatir',
        'Tanhai se tang aa kar',
        'Sach bolne par',
        'Baarish ke shor mein',
        'Woh sochta hai ke',
        'Aksar humsaye',
        'Ek bhai ne sab ko',
        'Chutti ke din',
        'Agar woh bahar chala gaya',
        'Us ke masail ka hal',
        'Be-sabri ki wajah se woh',
        'Woh khush tha ke imtihan mein',
        'Us ke inkaar ne usay',
        'Pyar karna bhi',
        'Kamyaabi ke liye'
      ]
    },
    {
      id: 'urdu_sheet_c',
      name: 'Urdu Sheet C (Roman)',
      description: 'Third Urdu sheet analyzing reactions to errors, authority figures, and environmental stresses.',
      starters: [
        'Ghalti karne par woh',
        'Uss ka maqsad',
        'Logon ki baatein',
        'Fauji zindagi',
        'Apne dushman ko',
        'Khauf ke waqt',
        'Us ka sab se bara aib',
        'Ghareeb log',
        'Walidain ki naseehat',
        'Gussa aane par',
        'Mushkil sawal dekh kar',
        'Buri aadatain',
        'Naye mahol mein woh',
        'Bina soche samjhe',
        'Watan ki mitti',
        'Ghalti ka ehsaas hone par',
        'Larayee jharray mein',
        'Imandaari se kaam',
        'Subah saire ke liye',
        'Mushkil kaam ko',
        'Humsayon ke sath',
        'Bhaag jaane ki bajaye',
        'Sher dekh kar',
        'Umeed ki kiran',
        'Uss ne faisla kiya ke',
        'Aakhri mauqa par'
      ]
    }
  ]
}

export function getRandomSctStarters(language = 'english', count = 26) {
  const sheets = sctSheets[language]
  const allStarters = sheets.reduce((acc, curr) => acc.concat(curr.starters), [])
  const uniqueStarters = Array.from(new Set(allStarters))
  return shuffleArray(uniqueStarters).slice(0, count)
}

// ---------------------------------------------------------------------------
// Situation Reaction Test (SRT) Pool (30 Scenarios)
// ---------------------------------------------------------------------------
export const srtSheets = [
  {
    id: 'srt_crisis',
    name: 'Set A: Emergency & Crisis Response',
    description: '10 critical scenarios evaluating quick reflexes, safety prioritizations, and rescue operations under pressure.',
    situations: [
      {
        id: 1,
        desc: 'He was returning home late at night on a lonely road when he heard cries of help coming from a dark lane... He'
      },
      {
        id: 2,
        desc: 'At midnight, he was driving to the hospital for an emergency. He accidentally hit a young boy crossing the road, who died on the spot. It was dark, late, and there were no witnesses on the scene... He'
      },
      {
        id: 3,
        desc: 'While watching a movie in a crowded cinema hall, he suddenly notices a live snake moving near his feet... He'
      },
      {
        id: 4,
        desc: 'A house in his neighborhood caught fire at midnight, and cries of children were coming from inside... He'
      },
      {
        id: 5,
        desc: 'He was traveling in a bus when a passenger suddenly collapsed and started bleeding from the nose... He'
      },
      {
        id: 6,
        desc: 'He saw a young child slip and fall into a fast-flowing canal, and the child did not know how to swim... He'
      },
      {
        id: 7,
        desc: 'While camping in a remote area, his teammate was bitten by a poisonous snake... He'
      },
      {
        id: 8,
        desc: 'He was in a train when suddenly some armed dacoits entered the compartment and demanded money... He'
      },
      {
        id: 9,
        desc: 'While returning from college, he noticed a suspicious bag lying unattended under a bridge... He'
      },
      {
        id: 10,
        desc: 'He saw an electrical wire spark and fall onto a busy road, blocking the traffic... He'
      }
    ]
  },
  {
    id: 'srt_social',
    name: 'Set B: Professional & Social Conflict',
    description: '10 scenarios analyzing teamwork under mutiny, ethical tests, and interpersonal disputes in military or academic settings.',
    situations: [
      {
        id: 11,
        desc: 'He was appointing a helper for his GTO command task, but his team members rejected his choice and selected his rival... He'
      },
      {
        id: 12,
        desc: 'He was falsely accused by his college teacher of cheating in the final exam, which could lead to suspension... He'
      },
      {
        id: 13,
        desc: 'He was appointed captain of a basketball team, but the other players revolted against his appointment and refused to cooperate... He'
      },
      {
        id: 14,
        desc: 'During a gathering, lifetime friends insist he drink beer/alcohol with them, calling it a test of comradeship... He'
      },
      {
        id: 15,
        desc: 'He is the captain of his team, and his key star player gets severely injured just before a crucial championship match... He'
      },
      {
        id: 16,
        desc: 'His GTO command task team members were arguing and fighting among themselves, wasting precious time... He'
      },
      {
        id: 17,
        desc: 'His father wanted him to join the family business, but he had a strong passion to join the Armed Forces... He'
      },
      {
        id: 18,
        desc: 'A strong, athletic ruffian snatches the purse of a lady. He was passing by empty-handed, with no weapon and no phone... He'
      },
      {
        id: 19,
        desc: 'He was working on a project when his team member took all the credit for his hard work in front of the boss... He'
      },
      {
        id: 20,
        desc: 'His subordinate in a task refused to follow his commands in front of the entire team... He'
      }
    ]
  },
  {
    id: 'srt_survival',
    name: 'Set C: Risk & Survival Scenarios',
    description: '10 scenarios assessing individual resourcefulness, adaptability, and performance in harsh or survival situations.',
    situations: [
      {
        id: 21,
        desc: 'He got separated from his trekking team in a thick forest with no mobile network coverage, and night was falling fast... He'
      },
      {
        id: 22,
        desc: 'His mother fell seriously ill on the night before his final PMA entry test, and there was no one else at home... He'
      },
      {
        id: 23,
        desc: 'He passes his entrance exams for engineering, but his parents cannot afford the program\'s tuition fees... He'
      },
      {
        id: 24,
        desc: 'While traveling to a critical job interview in another city, he discovers that his wallet, money, and identification cards have been stolen... He'
      },
      {
        id: 25,
        desc: 'He boards a train for an important interview but realizes an hour later that he has boarded the wrong train... He'
      },
      {
        id: 26,
        desc: 'He and his team need to cross a damaged bridge to reach the other side. Returning is not an option, and the mission has a tight deadline... He'
      },
      {
        id: 27,
        desc: 'His boat capsized in the middle of a lake during a recreational trip with friends... He'
      },
      {
        id: 28,
        desc: 'He had prepared very well for the exam, but on the exam day, he found the question paper to be entirely out of syllabus... He'
      },
      {
        id: 29,
        desc: 'He was staying in a hotel when an earthquake suddenly shook the building, causing a partial power outage... He'
      },
      {
        id: 30,
        desc: 'He went for an adventure hike, but a sudden blizzard/landslide blocked the only path back down... He'
      }
    ]
  }
]

export function getRandomSrtSituations(count = 10) {
  const allSituations = srtSheets.reduce((acc, curr) => acc.concat(curr.situations), [])
  return shuffleArray(allSituations).slice(0, count)
}

export const watUrduMeanings = {
  'Army': 'فوج',
  'Brave': 'بہادر',
  'Success': 'کامیابی',
  'Failure': 'ناکامی',
  'Fear': 'خوف',
  'Trust': 'اعتماد',
  'Enemy': 'دشمن',
  'Duty': 'فرض',
  'Cheat': 'دھوکہ',
  'Work': 'کام / محنت',
  'Decide': 'فیصلہ کرنا',
  'Break': 'وقفہ / توڑنا',
  'Lies': 'جھوٹ',
  'Discipline': 'نظم و ضبط',
  'Calamity': 'آفت / مصیبت',
  'Snake': 'سانپ',
  'Love': 'محبت',
  'Death': 'موت',
  'Bribe': 'رشوت',
  'Solitude': 'تنہائی',
  'Demanding': 'مطالبہ کرنے والا',
  'Disease': 'بیماری',
  'Difficulty': 'مشکل',
  'Disaster': 'تباہی',
  'Disagree': 'اختلاف کرنا',
  'Crisis': 'بحران',
  'Selfishness': 'خود غرضی',
  'Mistakes': 'غلطیاں',
  'Disputes': 'تنازعات',
  'Confuse': 'الجھن',
  'Criticism': 'تنقید',
  'Burden': 'بوجھ',
  'Cry': 'رونا',
  'Alcohol': 'شراب',
  'Cannot': 'نہیں کر سکتا',
  'Blunder': 'بڑی غلطی',
  'Crime': 'جرم',
  'Vices': 'برائیاں',
  'Shy': 'شرمیلا',
  'Reject': 'مسترد کرنا',
  'Suicide': 'خودکشی',
  'Bomb': 'بم',
  'Dismiss': 'برطرف کرنا',
  'Knife': 'چاقو',
  'Blame': 'الزام',
  'Assertive': 'پراعتماد / پرعزم',
  'Sorrow': 'غم',
  'Hate': 'نفرت',
  'Fatigue': 'تھکن',
  'Zero': 'صفر',
  'Guilty': 'گنہگار / قصوروار',
  'Trapped': 'پھنسا ہوا',
  'Gap': 'فاصلہ / خلا',
  'Limit': 'حد',
  'Rude': 'بدتمیز',
  'Pity': 'ترس',
  'Luck': 'قسمت',
  'Escape': 'بچ نکلنا',
  'Dilemma': 'دوملکی کشمکش / الجھن',
  'Temper': 'مزاج / غصہ',
  'Doubts': 'شکوک و شبہات',
  'Disturb': 'پریشان کرنا',
  'Injured': 'زخمی',
  'Oppose': 'مخالفت کرنا',
  'Indiscipline': 'بے ضابطگی / غیر تعلیمی',
  'Atom': 'ایٹم',
  'Soul': 'روح',
  'Girl': 'لڑکی',
  'Flower': 'پھول',
  'Money': 'پیسہ',
  'Life': 'زندگی',
  'Youth': 'نوجوان',
  'Faith': 'ایمان / یقین',
  'Risk': 'خطرہ',
  'Award': 'انعام',
  'Adventure': 'مہم جوئی',
  'Impossible': 'ناممکن',
  'Wine': 'شراب',
  'Problem': 'مسئلہ',
  'Fight': 'لڑائی',
  'Peace': 'امن',
  'Defeat': 'شکست',
  'Country': 'ملک',
  'Soldier': 'سپاہی',
  'Injustice': 'ناانصافی',
  'Team': 'ٹیم',
  'Lead': 'رہنمائی',
  'Goal': 'مقصد',
  'Pride': 'فخر',
  'Sad': 'اداس',
  'Force': 'قوت / فوج',
  'Clean': 'صاف',
  'Care': 'دیکھ بھال',
  'Win': 'جیتنا',
  'Danger': 'خطرہ',
  'Praise': 'تعریف',
  'System': 'نظام',
  'Build': 'بنانا',
  'Follow': 'پیروی کرنا',
  'Trustworthy': 'قابل اعتماد',
  'Anger': 'غصہ',
  'Afraid': 'خوفزدہ',
  'Attack': 'حملہ',
  'Bad': 'برا',
  'Bitter': 'کڑوا',
  'Clash': 'ٹکراؤ',
  'Coward': 'بزدل',
  'Cruel': 'ظالم',
  'Delay': 'تاخیر',
  'Defend': 'دفاع کرنا',
  'Doubt': 'شک',
  'Effort': 'کوشش',
  'Error': 'غلطی',
  'Grave': 'قبر / سنگین',
  'Grief': 'غم',
  'Hard': 'سخت',
  'Hurt': 'تکلیف پہنچانا',
  'Ignorant': 'جاہل',
  'Illness': 'بیماری',
  'Jealous': 'حاسد',
  'Kill': 'مارنا',
  'Lazy': 'سست',
  'Loss': 'نقصان',
  'Mad': 'پاگل',
  'Mistrust': 'بے اعتمادی',
  'Miserable': 'خستہ حال',
  'Nervous': 'گھبرایا ہوا',
  'Obstacle': 'رکاوٹ',
  'Pain': 'درد',
  'Panic': 'گھبراہٹ',
  'Poison': 'زہر',
  'Poverty': 'غربت',
  'Punish': 'سزا دینا',
  'Quarrel': 'جھگڑا',
  'Regret': 'افسوس',
  'Revenge': 'انتقام',
  'Ruin': 'برباد کرنا',
  'Shame': 'شرمندگی',
  'Sin': 'گناہ',
  'Steal': 'چوری کرنا',
  'Struggle': 'جدوجہد',
  'Threat': 'دھمکی / خطرہ',
  'Tired': 'تھکا ہوا',
  'Ugly': 'بدصورت',
  'Weak': 'کمزور',
  'Worry': 'پریشانی',
  'Wrong': 'غلط'
}

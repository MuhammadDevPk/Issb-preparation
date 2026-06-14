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
  ],
  grok_100: [
    'Atom', 'Country', 'Army', 'Duty', 'Success', 'Brave', 'Leader', 'Discipline', 'Sacrifice', 'Courage',
    'Patriotism', 'Fear', 'Enemy', 'Defeat', 'Failure', 'Hard work', 'Honest', 'Help', 'Love', 'Peace',
    'Risk', 'Award', 'Youth', 'Faith', 'Work', 'Agree', 'Assist', 'Affection', 'Accept', 'Attack',
    'Afraid', 'Alone', 'Admire', 'Active', 'Nation', 'Avoid', 'Attempt', 'Determined', 'Accomplish', 'Appeal',
    'Abuse', 'Annoy', 'Accident', 'Government', 'Average', 'Approach', 'Aid', 'Argument', 'Architect', 'Ambassador',
    'Mother', 'Aware', 'Adult', 'Boredom', 'Barrier', 'Beauty', 'Bribe', 'Books', 'Behave', 'Break',
    'Blood', 'Begin', 'Beggar', 'Bed', 'Bad', 'Brave', 'Burden', 'Blame', 'Bomb', 'Calamity',
    'Calm', 'Careful', 'Captain', 'Capable', 'Company', 'Cheat', 'Clean', 'Cruel', 'Child', 'Care',
    'Change', 'Class', 'Convince', 'Criticize', 'Develop', 'Duty', 'Delay', 'Drink', 'Death', 'Difficult',
    'Earn', 'Escape', 'Elder', 'Enjoy', 'Enemy', 'Failure', 'Flower', 'Future', 'Habit', 'Honest'
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
    id: 'grok_100',
    name: 'Grok Repeated 100 Set',
    description: '100 highly repeated keywords drawn from frequent candidate experiences and mock databases.',
    words: watPool.grok_100
  },
  {
    id: 'mock_100',
    name: 'Full Mock Test (100 Words)',
    description: 'A comprehensive 100-word mock exam designed to simulate the actual ISSB testing experience under time constraints.',
    words: [...watPool.set_1, ...watPool.set_2]
  }
]

export function getRandomWatWords(count = 50) {
  const allWords = [...watPool.set_1, ...watPool.set_2, ...watPool.set_3, ...watPool.grok_100]
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
    },
    {
      id: 'eng_grok_100',
      name: 'Grok Repeated 100 Stems',
      description: 'A comprehensive 100-sentence completion practice sheet containing repeating psychometric stems.',
      starters: [
        'In trouble',
        'You cannot succeed',
        'His greatest fear',
        'He is worried',
        'The woman/women',
        'When in trouble/hard times',
        'His biggest mistake',
        'Our country/forces',
        'Love your',
        'Hard work',
        'Follow',
        'His attitude',
        'When angry/annoyed',
        'I do not like',
        'Memories of childhood',
        'If someone disturbs him',
        'His worst enemy',
        'During strikes/journey',
        'My father',
        'Life is a big',
        'It is rare to be',
        'He knows',
        'To become rich',
        'He could not',
        'Hardships',
        'Whenever he is alone',
        'He is upset',
        'Money is',
        'He tried but',
        'My greatest weakness is',
        'Our media is',
        'Harm of evil spirits',
        'At night we saw',
        'He cools down when',
        'The way is long but',
        'At midnight',
        'He did everything',
        'Our country is good in',
        'He decided to start',
        'Keep your',
        'Every young man',
        'After great effort',
        'My sister was',
        'In simple world',
        'A brother',
        'The boy and girl',
        'His attitude is always',
        'When I get annoyed',
        'He is a poor guy',
        'You are on duty',
        'Your brother is addict',
        'A women is driving',
        'Your friends are angry',
        'If you are driving',
        'Your mother is suffering',
        'You fall in love',
        'A woman has cancer',
        'You got a friend request',
        'At your friend wedding',
        'At a lonely place',
        'You are captain of',
        'Your elder brother is',
        'You killed a person',
        'You were going for',
        'You become mess instructor',
        'You are going with',
        'Due to COVID',
        'You purchased',
        'You are the only son',
        'An old man',
        'You got a foreign',
        'Your brother is your',
        'A girl get stuck',
        'You committed a sin',
        'One of your friend',
        'You are doing a job',
        'If someone steals',
        'A student always',
        'One of your friend',
        'If your father',
        'Your neighbors were',
        'A girl from',
        'If you are given',
        'One of your group',
        'You saw a person',
        'You and your friends',
        'A woman had',
        'You were playing',
        'You have a friend',
        'You are coming out',
        'There is girl who',
        'You are working in',
        'You are working in your',
        'There is a poor',
        'You were defeated',
        'You steal money',
        'You are in a hotel',
        'You are working in a',
        'If some people',
        'You are invited'
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
  },
  {
    id: 'srt_grok',
    name: 'Set D: Grok High-Frequency Situations',
    description: '80 repeated scenarios covering emergency crisis, leadership conflicts, and survival risks.',
    situations: [
      { id: 31, desc: 'A person is going to his office. He saw a man climbing a house building through a rope... He' },
      { id: 32, desc: 'You are on duty and there is a marriage ceremony of your sister. You are not granted leave... You' },
      { id: 33, desc: 'You are going for an important meeting and got stuck in a traffic jam... You' },
      { id: 34, desc: 'You are travelling in a train and find a person stealing through a window... You' },
      { id: 35, desc: 'You are going home at midnight and find two people fighting... You' },
      { id: 36, desc: 'You are assigned a tough task which you have never done before... You' },
      { id: 37, desc: 'You are attacked by 2-3 persons with a knife... You' },
      { id: 38, desc: 'A soldier is on leave and comes to know about India-Pak war... He' },
      { id: 39, desc: 'A soldier is in a desert/jungle and lost his way... He' },
      { id: 40, desc: 'You have a better plan than your boss but he doesn\'t agree... You' },
      { id: 41, desc: 'A poor guy with a family has less money for education... He' },
      { id: 42, desc: 'Your brother is addicted to PUBG and gets angry if denied... You' },
      { id: 43, desc: 'Your friends take you to an ICE club... You' },
      { id: 44, desc: 'A woman driving on motorway meets an accident... She' },
      { id: 45, desc: 'Your friends are angry due to high cost on a picnic... You' },
      { id: 46, desc: 'You are driving on a motorway and the brakes fail... You' },
      { id: 47, desc: 'In a COVID situation, your mother is suffering and you get no leave from your boss... You' },
      { id: 48, desc: 'A handsome rich man falls in love with a lower caste woman, but his parents disagree... He' },
      { id: 49, desc: 'A woman has cancer requiring 1 million PKR, but her husband has no resources... He' },
      { id: 50, desc: 'You got a friend request from a girl on Facebook who is your sister\'s friend... You' },
      { id: 51, desc: 'At your friend\'s wedding, no one is talking to you... You' },
      { id: 52, desc: 'At a lonely place, two men are misbehaving with a woman... You' },
      { id: 53, desc: 'You are the captain of a cricket team, but many players are against your appointment... You' },
      { id: 54, desc: 'Your elder brother is involved in immoral activities... You' },
      { id: 55, desc: 'You accidentally killed a person in a car crash, but a woman thinks she did it... You' },
      { id: 56, desc: 'Going for a job interview, you see an injured person on the road... You' },
      { id: 57, desc: 'You are a mess instructor and a senior asks you for extra billings... You' },
      { id: 58, desc: 'You are going with your sister and notice a stranger following you... You' },
      { id: 59, desc: 'During COVID, people are stealing basics from a local store... You' },
      { id: 60, desc: 'A dog snatches the meat you just purchased... You' },
      { id: 61, desc: 'You are the only son and your parents want you to marry, but it affects your Pak Army eligibility... You' },
      { id: 62, desc: 'An old man starts staring and blinking at you... You' },
      { id: 63, desc: 'You got a foreign scholarship at PMA, but your physical fitness is not good... You' },
      { id: 64, desc: 'Your brother is not performing in school due to mobile use and does not obey... You' },
      { id: 65, desc: 'A girl gets stuck in a jungle at night with no source to inform the police... She' },
      { id: 66, desc: 'You committed a sin and are ashamed, but there is a risk of defamation if you admit it... You' },
      { id: 67, desc: 'Your friend is addicted to wrong deeds and does not understand your advice... You' },
      { id: 68, desc: 'You are assigned a special secret mission but your family is not allowing you... You' },
      { id: 69, desc: 'Someone steals money from a bank and distributes it to the needy... You' },
      { id: 70, desc: 'A student cheats in an exam and you, the teacher, know it... You' },
      { id: 71, desc: 'Your friend is taking sleeping pills due to financial issues... You' },
      { id: 72, desc: 'Your uncle pays your college fee but demands you marry his daughter, whom you don\'t like... You' },
      { id: 73, desc: 'Your neighbors are shouting that there is a thief in the house, but the thief is your brother... You' },
      { id: 74, desc: 'Your neighbor\'s girl is kidnapped, and the kidnappers include your brother... You' },
      { id: 75, desc: 'You are asked to recommend a candidate for a role. What qualities do you focus on?... You' },
      { id: 76, desc: 'A group member has a joining letter for PMA, but their parents are not willing... You' },
      { id: 77, desc: 'A person hits a boy with their car and runs away... You' },
      { id: 78, desc: 'Your friends suggest lying to your father to get money/permission for a picnic... You' },
      { id: 79, desc: 'The ball goes to a neighbor\'s house and you are responsible for it... You' },
      { id: 80, desc: 'You steal money from your father for a needy friend, and your parents ask you about it... You' },
      { id: 81, desc: 'A watchman stops you at a plaza asking for your ID card... You' },
      { id: 82, desc: 'A decent girl is irritated by a boy who wants a relationship... She' },
      { id: 83, desc: 'A senior colleague who irritated you in the past is now appointed under you as a manager... You' },
      { id: 84, desc: 'Your friend\'s company is involved in money laundering... You' },
      { id: 85, desc: 'Your best friend bullies a poor student in class... You' },
      { id: 86, desc: 'You and your team are defeated badly in a football match... You' },
      { id: 87, desc: 'A robbery occurs at your friend\'s home after dinner, and the police ask you to surrender for questioning... You' },
      { id: 88, desc: 'Terrorists attack a coaching academy, and your friends are afraid to jump out of the window... You' },
      { id: 89, desc: 'You see a house on fire in your neighborhood... You' },
      { id: 90, desc: 'You see a child drowning in a river/pond... You' },
      { id: 91, desc: 'Your friend failed the exam and is highly upset... You' },
      { id: 92, desc: 'Your scooty gets punctured in a jungle at night... You' },
      { id: 93, desc: 'You witness a theft/robbery in the market... You' },
      { id: 94, desc: 'A group conflict/fight breaks out among your close friends... You' },
      { id: 95, desc: 'A natural calamity like a flood or earthquake strikes your town... You' },
      { id: 96, desc: 'You see your boss or colleague doing something ethically wrong... You' },
      { id: 97, desc: 'It is your sister\'s marriage but you are on an important military duty... You' },
      { id: 98, desc: 'You need to send an important message but the network is completely down... You' },
      { id: 99, desc: 'Your mother fell seriously ill during your final examinations... You' },
      { id: 100, desc: 'An elder in your family needs urgent help but you have critical commitments... You' }
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

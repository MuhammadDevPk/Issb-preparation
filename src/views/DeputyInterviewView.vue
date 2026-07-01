<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const activeTab = ref('overview') // 'overview', 'questions', 'tough', 'blame', 'outfit'
const searchQuery = ref('')

const tabs = computed(() => {
  const list = [
    { id: 'overview', label: '📋 Overview & Structure' },
    { id: 'questions', label: '❓ Question Bank' },
    { id: 'tough', label: '🔥 Tough Questions' },
    { id: 'blame', label: '🤝 Responsibility vs Blame' }
  ]
  // Gated: only admin can see the outfit guides tab
  if (authStore.profile?.role === 'admin') {
    list.push({ id: 'outfit', label: '👔 Outfit & Dressing (Admin)' })
  }
  return list
})

// Extracted questions from Deputy President Interview guides
const questionCategories = [
  {
    name: '👤 Introduction & Personal Profile',
    icon: '👤',
    questions: [
      { text: 'Tell me about yourself.', tip: 'Focus on facts, keep it structured, and be concise.', answers: ['I am a disciplined and motivated person with clear goals.', 'I believe in hard work, honesty and continuous self-improvement.'] },
      { text: 'What is your full name and meaning of your name?', tip: 'Understand the historical or linguistic context of your name.', answers: ['My name is Ali Raza. \'Ali\' means noble and \'Raza\' means satisfaction.', 'My name is Muhammad Hamza. \'Hamza\' means strong and firm.'] },
      { text: 'Where do you belong to?', tip: 'Be ready to answer questions about the history, culture, and issues of your home city.', answers: ['I belong to Lahore, Punjab.', 'I belong to Abbottabad, Khyber Pakhtunkhwa.'] },
      { text: 'Describe your family background.', tip: 'Talk about your parents, siblings, and the family values you grew up with.', answers: ['We are a close-knit family that values honesty and hard work.', 'My family is small, educated and well-mannered. We respect each other.'] },
      { text: 'Who influences you the most in your family and why?', tip: 'Highlight positive traits like discipline, sacrifices, or patience.', answers: ['My father, because of his guidance, discipline and sacrifices.', 'My mother, because of her patience, prayers and unconditional support.'] },
      { text: 'What are your hobbies?', tip: 'Be genuine. If you write gaming or reading, be prepared to answer deep questions about them.', answers: ['I enjoy reading books and playing cricket.', 'I like reading, fitness and learning new things.'] },
      { text: 'How do you spend your free time?', tip: 'Show that you use it productively to learn, stay fit, or help family.', answers: ['I read books or exercise to keep myself active.', 'I use it for self-study, skills improvement or spending time with family.'] },
      { text: 'What kind of friends do you have?', tip: 'Show that you associate with positive, ambitious, and supportive people.', answers: ['I have a few close friends who are sincere and supportive.', 'My friends are positive, ambitious and respectful.'] },
      { text: 'How would your friends describe you?', tip: 'Focus on qualities like loyalty, trustworthiness, and being helpful.', answers: ['They say I am loyal, helpful and trustworthy.', 'They describe me as honest, calm and reliable.'] },
      { text: 'How would your teachers describe you?', tip: 'Highlight discipline, respect, attentiveness, and hard work.', answers: ['They say I am sincere, focused and responsible.', 'They believe I am a dedicated student with leadership qualities.'] },
      { text: 'What is your date of birth and horoscope sign?', tip: 'Know your basic facts. Don\'t express superstitious belief in astrology, but know the sign.', answers: ['I was born on 15 March 2003. My sign is Pisces.', 'I was born on 22 July 2002. My sign is Cancer.'] },
      { text: 'Describe the city/village where you grew up.', tip: 'Mention its unique culture, key landmarks, or historical background.', answers: ['It is a peaceful place with hardworking and kind people, known for its strong community ties.', 'It is beautiful and calm, with strong community values.'] },
      { text: 'What type of environment did you grow up in?', tip: 'Show that you grew up in a supportive, value-based environment.', answers: ['I grew up in a disciplined and supportive environment.', 'I grew up in a simple and value-based environment.'] }
    ]
  },
  {
    name: '🎓 Education & Academics',
    icon: '🎓',
    questions: [
      { text: 'Why did you choose your current field of study?', tip: 'Align it with your long-term interests and goals.', answers: ['It matches my interest and career goals.', 'I want to contribute and make a difference in this field.'] },
      { text: 'Which subject do you like most and why?', tip: 'Pick a subject that demonstrates logic, critical thinking, or practical value.', answers: ['I like Physics because it is logical and exciting.', 'I like Computer Science because of innovation.'] },
      { text: 'Which subject do you dislike and why?', tip: 'Never say you dislike a subject because it\'s hard. Dislike rote-learning or lack of practical application.', answers: ['I dislike rote learning subjects.', 'I dislike subjects with no practical use.'] },
      { text: 'How are your academic results?', tip: 'Be honest. If they dropped, explain the reasons and how you improved.', answers: ['My results are good and improving.', 'I have maintained good grades consistently.'] },
      { text: 'Any failure in studies? What did you learn from it?', tip: 'Explain what caused it and the proactive steps you took to improve.', answers: ['Yes, it taught me patience and hard work.', 'Yes, it improved my focus and time management.'] },
      { text: 'What was your position in class?', tip: 'State it honestly. If not high, focus on your active participation and other skills.', answers: ['I was in the top five.', 'I was among the top performers.'] },
      { text: 'Are you satisfied with your performance?', tip: 'Acknowledge progress but express a healthy desire to keep growing.', answers: ['Yes, but I always try to do better.', 'Not completely, I aim for continuous growth.'] },
      { text: 'How do you manage studies and other activities?', tip: 'Highlight time management, scheduling, and self-discipline.', answers: ['I plan my time and stay consistent.', 'With proper schedule and daily targets.'] },
      { text: 'What are your future academic plans?', tip: 'Show foresight. Even if you join the army, express a desire for continuing professional education.', answers: ['I plan to pursue higher studies and research.', 'I want to specialize and excel in my field.'] }
    ]
  },
  {
    name: '⏰ Daily Routine & Discipline',
    icon: '⏰',
    questions: [
      { text: 'Describe your daily routine.', tip: 'Show structure: early rising, exercise, productive work/studies, family time, and adequate sleep.', answers: ['I follow a balanced routine of study, exercise and rest.', 'I plan my day and focus on important tasks.'] },
      { text: 'What time do you wake up?', tip: 'Military life requires early rising. Aim for consistency.', answers: ['I wake up at 5:30 AM daily.', 'I wake up early at 5:00 AM to stay productively.'] },
      { text: 'Do you exercise or play sports?', tip: 'Crucial for physical fitness checks. Mention details of your physical activity.', answers: ['Yes, I exercise daily and play cricket.', 'Yes, I do workouts and play badminton.'] },
      { text: 'How do you manage time?', tip: 'Mention prioritizing tasks, avoiding time wasters, and keeping a planner.', answers: ['I prioritize tasks and avoid wastage of time.', 'I use a timetable and stick to my schedule.'] },
      { text: 'Are you punctual? Give an example.', tip: 'Punctuality is a core military value. Mention a specific incident where you prioritized showing up on time.', answers: ['Yes, I always reach on time. I never miss deadlines.', 'Yes, I believe punctuality shows respect.'] },
      { text: 'How do you maintain discipline in life?', tip: 'Show that discipline is self-imposed, driven by goals and structure.', answers: ['I stay focused, avoid distractions and be consistent.', 'I set goals, control my habits and stay disciplined.'] }
    ]
  },
  {
    name: '🤝 Social Behavior & Interpersonal Skills',
    icon: '🤝',
    questions: [
      { text: 'How do you behave in a group?', tip: 'Show adaptability, active listening, and a collaborative spirit.', answers: ['I am cooperative, respectful and contribute positively.', 'I listen actively, value others\' opinions and work for a common goal.'] },
      { text: 'Do you prefer leading or following?', tip: 'Show that you are comfortable in both roles. A good leader must also know how to follow.', answers: ['I prefer leading but can follow when required.', 'I lead with responsibility and follow willingly when the leader is competent.'] },
      { text: 'How do you deal with disagreement?', tip: 'Focus on logical discussions, respect, and finding a consensus.', answers: ['I listen, stay calm and discuss logically.', 'I respect differences, communicate my point clearly and seek a win-win solution.'] },
      { text: 'Have you ever had a conflict with someone?', tip: 'Acknowledge that conflicts happen, but focus on the mature resolution.', answers: ['Yes, with a classmate over a group task.', 'Yes, we disagreed on an approach, but talked openly and resolved it maturely.'] },
      { text: 'How do you resolve conflicts?', tip: 'De-escalate, find common ground, and stay objective.', answers: ['Through calm discussion and mutual understanding.', 'I focus on the issue, not the person, and aim for a fair and lasting solution.'] },
      { text: 'Do you help others? Give an example.', tip: 'Altruism is a key officer trait. Provide a real, practical example.', answers: ['Yes, I help classmates in studies when needed.', 'Yes, I guided a weak student regularly and helped him improve his results.'] },
      { text: 'How do you react to criticism?', tip: 'See it as feedback for improvement, not a personal attack.', answers: ['I accept it positively and try to improve.', 'I listen carefully, analyze the feedback and use it as an opportunity to grow.'] }
    ]
  },
  {
    name: '👑 Leadership & Responsibility',
    icon: '👑',
    questions: [
      { text: 'Have you ever led a group?', tip: 'Mention a group project, sports team, or student committee.', answers: ['Yes, I led a group project in college.', 'Yes, I took initiative, assigned tasks fairly and ensured successful completion.'] },
      { text: 'What qualities make a good leader?', tip: 'Highlight vision, integrity, empathy, and decision-making.', answers: ['Honesty, confidence, decision making.', 'Vision, integrity, empathy and ability to inspire and guide others.'] },
      { text: 'Can everyone be a leader?', tip: 'Explain that leadership is both a natural trait and a skill that can be developed.', answers: ['Yes, anyone can be a leader.', 'Yes, leadership is a skill that can be developed with will, learning and experience.'] },
      { text: 'What kind of leader are you?', tip: 'Democratic and participatory leadership is preferred in early planning stages.', answers: ['I am a democratic leader.', 'I lead with trust, involve others in decisions and take responsibility.'] },
      { text: 'How do you motivate others?', tip: 'Lead by example, appreciate their efforts, and align them with the mission.', answers: ['By encouraging and appreciating them.', 'By setting a good example, recognizing efforts and inspiring confidence.'] },
      { text: 'Have you ever taken responsibility under pressure?', tip: 'Highlight calmness, rapid task assignment, and staying focused on the objective.', answers: ['Yes, during exams I managed my team and task on time.', 'Yes, I stayed calm, prioritized tasks and ensured we achieved our target.'] }
    ]
  },
  {
    name: '🔥 Stress, Failure & Problem Solving',
    icon: '🔥',
    questions: [
      { text: 'How do you handle stress?', tip: 'Stay composed, break down tasks, plan, and execute.', answers: ['I stay calm, prioritize tasks, and focus on solutions.', 'I manage stress through planning and a positive mindset.'] },
      { text: 'What was the most difficult situation you faced?', tip: 'Show resilience and persistence in overcoming a major personal or academic block.', answers: ['I handled academic pressure with discipline and time management.', 'A tough phase tested me, but I stayed consistent and focused.'] },
      { text: 'Describe a failure in your life.', tip: 'Avoid declaring critical character failures. Choose a task failure, own it, and show growth.', answers: ['I failed once due to poor planning but learned discipline.', 'It taught me resilience and the importance of continuous improvement.'] },
      { text: 'How did you overcome it?', tip: 'Explain the self-correction, efforts, and positive final outcome.', answers: ['I analyzed my mistakes and worked harder to improve.', 'I stayed determined, corrected my weaknesses and achieved better results.'] },
      { text: 'What do you do when things go wrong?', tip: 'Accept ownership. Avoid panic or finger-pointing. Implement corrective measures.', answers: ['I stay calm, assess the situation and take corrective action.', 'I accept responsibility, learn from it and move forward with a better approach.'] },
      { text: 'How do you react to sudden problems?', tip: 'Composure and logical assessment. Respond rather than react.', answers: ['I stay composed and respond logically rather than emotionally.', 'I quickly analyze the situation and take practical steps to resolve it.'] }
    ]
  },
  {
    name: '🎯 GTO & ISSB Experience',
    icon: '🎯',
    questions: [
      { text: 'How was your GTO experience?', tip: 'Express enthusiasm. Frame it as a great learning experience in teamwork.', answers: ['It was challenging and enjoyable, helping me learn teamwork and leadership.', 'It tested my confidence and cooperation, and I gave my best in all tasks.'] },
      { text: 'Which GTO task did you like most?', tip: 'Explain WHY you liked it. E.g. command task because of responsibility, or group tasks because of coordination.', answers: ['I liked group tasks because they involve teamwork and planning.', 'Command task, as it allowed me to lead and make decisions.'] },
      { text: 'Which task was difficult for you?', tip: 'Be honest. Mention a minor difficulty but show how you kept trying and stayed motivated.', answers: ['Some obstacles were challenging, but I stayed determined.', 'I found one task tough, but I learned to improve under pressure.'] },
      { text: 'How did you perform in group discussion?', tip: 'Demonstrate that you were cooperative, shared clear arguments, and listened to others.', answers: ['I shared my ideas clearly and listened to others.', 'I contributed positively and maintained a balanced discussion.'] },
      { text: 'Did you dominate or cooperate?', tip: 'Dominating is a negative trait. Frame it as cooperative participation with active leadership.', answers: ['I focused on cooperation and teamwork.', 'I balanced participation—contributing without dominating.'] },
      { text: 'How did you contribute in planning tasks?', tip: 'Suggesting logical solutions, planning space layout, and working with team consensus.', answers: ['I suggested practical ideas and supported team decisions.', 'I helped organize plans logically and ensured team coordination.'] }
    ]
  },
  {
    name: '🧠 Strengths, Weaknesses & Self-Awareness',
    icon: '🧠',
    questions: [
      { text: 'What are your strengths?', tip: 'Back your strengths with examples. e.g., discipline, consistency, integrity.', answers: ['Discipline, honesty, and strong work ethic.', 'I stay consistent, responsible, and focused on goals.'] },
      { text: 'Which strength helps you most in life?', tip: 'Explain how it acts as an anchor in your daily routine or decision-making.', answers: ['Discipline—it keeps me consistent.', 'Self-control—it helps me make better decisions.'] },
      { text: 'What are your weaknesses?', tip: 'State minor, solvable weaknesses (e.g., public speaking jitters, overthinking details). Never state fatal flaws like dishonesty or hot-headedness.', answers: ['I sometimes overthink decisions.', 'I can be perfectionist at times.'] },
      { text: 'How are you improving your weaknesses?', tip: 'Show concrete, ongoing actions you are taking.', answers: ['I practice better planning and time management.', 'I focus on balance and taking timely decisions.'] },
      { text: 'What makes you different from others?', tip: 'Focus on your unique combination of grit, adaptability, and positive outlook.', answers: ['My consistency and positive attitude.', 'I stay calm under pressure and keep improving.'] },
      { text: 'Are you emotional or logical?', tip: 'Show balance. Logic for decisions, empathy and emotions for relationships.', answers: ['I balance emotions with logic.', 'I stay logical while remaining empathetic.'] },
      { text: 'How do you control anger?', tip: 'Show high emotional intelligence (EQ). Pause, analyze the situation, and communicate calmly.', answers: ['I pause, stay calm, and think before reacting.', 'I control emotions and respond with maturity.'] },
      { text: 'Are you confident? Give an example.', tip: 'Show self-efficacy through action. E.g. speaking up, taking project lead.', answers: ['Yes, I express my ideas clearly in discussions.', 'I stay composed in challenging situations.'] }
    ]
  },
  {
    name: '🔬 Psychological Tests (TAT, WAT, SRT)',
    icon: '🔬',
    questions: [
      { text: 'How was your experience in psychological tests?', tip: 'Keep it positive. Frame it as a fast-paced, natural self-disclosure check.', answers: ['It was interesting and required quick thinking.', 'It helped me express my natural personality.'] },
      { text: 'Which test did you find most challenging?', tip: 'Be honest. WAT or SRT are common answers due to the extreme time limits.', answers: ['SRT due to time pressure.', 'WAT because of quick responses.'] },
      { text: 'Were you able to complete all tests?', tip: 'If you missed some, admit it honestly. It is normal to miss a few WATs or SRTs.', answers: ['Yes, I managed time effectively.', 'I completed most tests with proper focus.'] },
      { text: 'How did you manage time during psychology tests?', tip: 'Write down the first reaction that comes to mind, avoid faking, and keep a steady pace.', answers: ['I stayed focused and avoided overthinking.', 'I answered quickly and moved on.'] },
      { text: 'Did you write honestly?', tip: 'Absolute honesty. Psychologists cross-check consistency across WAT, SRT, and SD.', answers: ['Yes, I answered naturally and honestly.', 'I avoided fake or memorized responses.'] }
    ]
  },
  {
    name: '🎖️ Armed Forces Motivation',
    icon: '🎖️',
    questions: [
      { text: 'Why do you want to join Armed Forces?', tip: 'Explain the honor, purposeful life, leadership opportunities, and active routine.', answers: ['To serve my country with honor.', 'To live a disciplined and purposeful life.'] },
      { text: 'Since when do you want to become an officer?', tip: 'Show stable, long-term interest rather than a sudden decision.', answers: ['Since my school days.', 'It has been my long-term goal and dream.'] },
      { text: 'Why Army/Navy/Air Force specifically?', tip: 'Mention the distinct role, environment, or capabilities of the service that inspire you.', answers: ['It matches my interest and capabilities.', 'I am inspired by its discipline and role in the nation.'] },
      { text: 'What do you know about your chosen service?', tip: 'Know its command structure, weapon platforms, current operations, and historical victories.', answers: ['It protects the country and maintains peace.', 'It demands discipline, leadership and selfless service.'] },
      { text: 'What are the qualities of an officer?', tip: 'List core OLQs: integrity, courage, determination, teamwork, and decision-making.', answers: ['Leadership, integrity and responsibility.', 'Confidence, decision-making and teamwork.'] },
      { text: 'Do you think you have officer qualities?', tip: 'Acknowledge that you have the basic raw potential, ready to be polished by the academy.', answers: ['Yes, I am disciplined and responsible.', 'I am continuously improving myself to meet those standards.'] }
    ]
  },
  {
    name: '⚔️ Commitment & Sacrifice',
    icon: '⚔️',
    questions: [
      { text: 'Are you ready for tough life and discipline?', tip: 'Officer cadet training is physically and mentally grueling. Show complete readiness.', answers: ['Yes, I am mentally prepared for a disciplined life.', 'I accept challenges as part of growth and duty.'] },
      { text: 'Can you live away from family?', tip: 'Show maturity. While you love your family, national duty is your priority.', answers: ['Yes, for a greater purpose and national service.', 'I value family, but duty comes first.'] },
      { text: 'How will you handle failure in training?', tip: 'Academy instructors push you to failure to build resilience. Show grit.', answers: ['I will learn, improve, and try again.', 'Failure motivates me to work harder.'] },
      { text: 'What if you face strict seniors?', tip: 'Military training relies on strict hierarchy. Show respect and submissiveness to training guidelines.', answers: ['I will respect them and learn from them.', 'Discipline from seniors helps build character.'] },
      { text: 'Are you mentally prepared for challenges?', tip: 'Show high adaptability and mental resilience.', answers: ['Yes, I stay calm and focused in difficulties.', 'I see challenges as opportunities to grow.'] }
    ]
  },
  {
    name: '⚖️ Ethics & Values',
    icon: '⚖️',
    questions: [
      { text: 'What does honesty mean to you?', tip: 'Integrity is the non-negotiable core of leadership.', answers: ['Being truthful in every situation.', 'Staying genuine even under pressure.'] },
      { text: 'Is discipline important? Why?', tip: 'Discipline is the glue that binds military units together. Explain how it creates order.', answers: ['It builds consistency and success.', 'Discipline shapes character and performance.'] },
      { text: 'What would you do if you see wrongdoing?', tip: 'Do not ignore it. Stand up, report it, or correct it depending on context.', answers: ['I will report it responsibly.', 'I will act honestly and stand for what is right.'] },
      { text: 'What are your core values?', tip: 'Integrity, honor, respect, duty, and loyalty.', answers: ['Integrity, responsibility, and respect.', 'Discipline, honesty, and teamwork.'] },
      { text: 'What do you respect the most?', tip: 'Respect values and actions rather than material success.', answers: ['Discipline and honesty.', 'People who fulfill their responsibilities.'] }
    ]
  },
  {
    name: '⚡ Rapid / Trick Questions',
    icon: '⚡',
    questions: [
      { text: 'Who is your role model and why?', tip: 'Pick someone who represents the values of discipline, selflessness, or leadership.', answers: ['A person who shows discipline and leadership.', 'Someone who serves the country with dedication.'] },
      { text: 'What irritates you most?', tip: 'Never say minor human actions. Say dishonesty, laziness, or lack of discipline.', answers: ['Lack of discipline.', 'Dishonesty.'] },
      { text: 'What makes you angry?', tip: 'Never say personal insults. Say injustice, unfairness, or neglect of duty.', answers: ['Unfair behavior.', 'Irresponsibility.'] },
      { text: 'Are you stubborn?', tip: 'Never say yes or no blindly. Explain that you hold firm principles but are highly open to learning.', answers: ['I am firm on principles, but open to learning.', 'I stay flexible while staying focused on goals.'] },
      { text: 'Do you accept mistakes?', tip: 'Acknowledge mistakes immediately. Learning from errors is a key officer trait.', answers: ['Yes, I learn and improve.', 'Accepting mistakes helps me grow.'] },
      { text: 'Why should we select you?', tip: 'Own your value. Emphasize your motivation, self-discipline, and training potential.', answers: ['I am disciplined, responsible, and motivated.', 'I have the mindset and potential to become an officer.'] }
    ]
  },
  {
    name: '⚠️ Dangerous & Tricky Traps',
    icon: '⚠️',
    questions: [
      { text: 'Why should we select you? (Interviewer Check)', isTricky: true, analysis: 'DP checks your confidence without pride, and self-awareness. Exposes ego or insecurity.', wrong: 'Because I am the best candidate.', correct: 'Sir, I am disciplined, willing to learn, and committed to improve. I believe I have the potential and mindset to become a good officer.', tip: 'Focus on potential and trainability, not superiority.' },
      { text: 'Do you think you deserve recommendation?', isTricky: true, analysis: 'DP checks humility vs confidence balance.', wrong: 'Yes, I fully deserve it.', correct: 'Sir, I believe I have given my best and I am improving. I hope my performance meets the required standard.', tip: 'Believe in your potential, but remain humble.' },
      { text: 'What if you are not recommended?', isTricky: true, analysis: 'DP checks resilience and positive mindset.', wrong: 'I will quit / I will be very disappointed.', correct: 'I will learn from my mistakes and come back stronger. It will motivate me to improve further.', tip: 'Show learning attitude and resilience.' },
      { text: 'What is your biggest weakness? (Interviewer Check)', isTricky: true, analysis: 'DP checks self-awareness and improvement mindset.', wrong: 'I get angry very fast.', correct: 'I sometimes overthink, but I am learning to plan better. I focus on constructive weaknesses + what I do to improve.', tip: 'Mention minor weaknesses + how you are actively overcoming them.' },
      { text: 'Tell me about a failure. (Interviewer Check)', isTricky: true, analysis: 'DP checks coping behavior. Exposes blaming others or the system.', wrong: 'Blaming others or the system.', correct: 'I made a mistake, learned from it, and improved. It taught me discipline and better planning.', tip: 'Take responsibility, show maturity.' },
      { text: 'Are you emotional or aggressive?', isTricky: true, analysis: 'Direct personality trap.', wrong: 'Yes, I am aggressive.', correct: 'I stay calm and control my emotions. I balance emotions with logical thinking.', tip: 'Stay calm and show emotional regulation.' },
      { text: 'Did you lie in psychological tests?', isTricky: true, analysis: 'Shock + honesty test.', wrong: 'Over-defensive answers.', correct: 'No Sir, I answered honestly. I focused on natural responses.', tip: 'Be honest in your potential, avoid defensive posturing.' },
      { text: 'Do you think others performed better than you?', isTricky: true, analysis: 'Tests insecurity & ego.', wrong: 'No, I was the best.', correct: 'Some candidates performed well. I focused on giving my best.', tip: 'Focus on your own growth, respect peers.' },
      { text: 'Why not choose a civilian job?', isTricky: true, analysis: 'Exposes wrong motivation.', wrong: 'Army has more respect.', correct: 'I want to serve my country with purpose. I am motivated by discipline and responsibility.', tip: 'Highlight service-oriented, clean motivation.' },
      { text: 'Are you stubborn? (Interviewer Check)', isTricky: true, analysis: 'Labels can harm selection.', wrong: 'Yes, for my decisions.', correct: 'I am firm on principles but open to learning. I adapt when needed.', tip: 'Firm on principles, open to learning.' },
      { text: 'Have you ever broken rules?', isTricky: true, analysis: 'Honesty vs discipline test.', wrong: 'Never in my life.', correct: 'A minor mistake occurred, but I learned from it. It improved my sense of responsibility.', tip: 'Acknowledge minor human errors, show respect for rules.' },
      { text: 'Do you get angry? (Interviewer Check)', isTricky: true, analysis: 'Emotional control check.', wrong: 'Yes, very often.', correct: 'I control my anger and respond calmly. I focus on solutions instead of reacting.', tip: 'Control emotions and stay composed.' },
      { text: 'Who do you dislike most?', isTricky: true, analysis: 'Negativity exposure.', wrong: 'Naming a person emotionally.', correct: 'I avoid personal dislikes and focus on understanding others. I respect differences.', tip: 'Show tolerance, avoid personal complaints.' }
    ]
  }
]

// Expandable Categories and Questions state
const expandedCategories = ref({
  '👤 Introduction & Personal Profile': true
})
const expandedQuestions = ref({})

const toggleCategory = (catName) => {
  expandedCategories.value[catName] = !expandedCategories.value[catName]
}

const isCategoryExpanded = (catName) => {
  if (searchQuery.value.trim() !== '') return true
  return !!expandedCategories.value[catName]
}

const toggleQuestion = (qText) => {
  expandedQuestions.value[qText] = !expandedQuestions.value[qText]
}

const isQuestionExpanded = (qText) => {
  if (searchQuery.value.trim() !== '') return true
  return !!expandedQuestions.value[qText]
}

// Search and filter questions
const filteredCategories = computed(() => {
  if (!searchQuery.value.trim()) return questionCategories
  
  const query = searchQuery.value.toLowerCase()
  return questionCategories.map(cat => {
    const matched = cat.questions.filter(q => 
      q.text.toLowerCase().includes(query) || 
      q.tip.toLowerCase().includes(query) ||
      (q.answers && q.answers.some(a => a.toLowerCase().includes(query))) ||
      (q.correct && q.correct.toLowerCase().includes(query)) ||
      (q.wrong && q.wrong.toLowerCase().includes(query))
    )
    return { ...cat, questions: matched }
  }).filter(cat => cat.questions.length > 0)
})

// STAR formula examples
const starExamples = [
  {
    question: 'Tell me about your biggest failure.',
    situation: 'In college, I failed to clear a critical physics midterm exam because I was overconfident and did not manage my prep time.',
    task: 'I had to cover a massive backlog while keeping up with new coursework, aiming to secure an A-grade in the final.',
    action: 'I created a daily study plan, consulted my teacher during office hours, cut down on distractions, and practiced solving past papers.',
    result: 'I scored an A-grade in the finals and learned the value of consistency, humility, and proper time management.'
  },
  {
    question: 'Why should we select you?',
    situation: 'During intermediate and sports events, I have consistently taken responsibility and led teams under pressure.',
    task: 'To represent my team as a candidate who possesses the potential to be trained into a balanced, mature military leader.',
    action: 'I developed self-discipline, stayed physically active, cultivated analytical thinking, and remained honest in my self-assessment.',
    result: 'My continuous self-improvement aligns with the officer qualities sought at ISSB. I am ready to be trained.'
  },
  {
    question: 'What would you do if your senior officers give you an unfair order?',
    situation: 'As a junior officer in a field operation, an instruction is passed down that seems contradictory or unsafe.',
    task: 'To ensure mission success and safety while upholding absolute military chain-of-command and discipline.',
    action: 'I would politely seek clarification to ensure I fully understand the commander\'s intent, pointing out critical risks if unseen, but once the final command is issued, I will execute it with complete dedication.',
    result: 'Maintained integrity and trust while ensuring absolute discipline and mission focus.'
  },
  {
    question: 'What if you don\'t get commissioned?',
    situation: 'Being recommended is my primary goal, but competitive selection processes have uncertain outcomes.',
    task: 'To maintain my determination and choose a constructive, backup career path without losing motivation.',
    action: 'I will analyze my weaknesses from this attempt, work hard to rectify them, and apply again. Meanwhile, I will pursue my degree in Computer Science/Engineering as an alternative plan.',
    result: 'Shows emotional stability, maturity, and goal-oriented resilience. Never shows panic or depression.'
  }
]

// Blame vs Responsibility dataset
const blameComparisons = [
  {
    situation: 'Poor performance in intermediate board exams',
    blame: 'My college teachers did not teach properly, and the papers were checked unfairly.',
    responsible: 'I should have paid more attention, self-studied consistently, and sought extra help when needed.'
  },
  {
    situation: 'Late submission of a group project',
    blame: 'My group members were lazy and they did not remind me or send their parts on time.',
    responsible: 'I did not establish clear deadlines or follow up regularly. I should have managed the team better.'
  },
  {
    situation: 'Losing a key sports match',
    blame: 'The referee was completely biased and made unfair decisions against our team.',
    responsible: 'We made defensive errors and failed to adapt to the opponent\'s style. We will practice harder next time.'
  },
  {
    situation: 'Developing a bad habit or poor routine',
    blame: 'My home environment is stressful and my friends forced me into these habits.',
    responsible: 'It is my responsibility to control my actions, choose my social circle wisely, and improve my routine.'
  }
]

// Admin Outfit Guides (Section-grouped)
const adminGuides = ref({
  general: [
    { title: 'Deputy President Interview Details', filename: 'interview_structure_details.jpeg', folder: '' },
    { title: 'Dressing & Outfit Overview', filename: 'dos_donts_dressing_summary.jpeg', folder: '' },
    { title: 'Never Blame, Take Responsibility Guide', filename: 'responsibility_vs_blaming_guide.jpeg', folder: '' },
    { title: 'How to Prepare (Part 1: Entry & Posture)', filename: 'how_to_prepare_part1_entry.jpeg', folder: '' },
    { title: 'How to Prepare (Part 2: Body Language & Tone)', filename: 'how_to_prepare_part2_body_language.jpeg', folder: '' },
    { title: 'How to Prepare (Part 3: Leaving & Mindset)', filename: 'how_to_prepare_part3_exit.jpeg', folder: '' },
    { title: 'Handling Tough Questions Guide', filename: 'handling_tough_questions_guide.jpeg', folder: '' }
  ],
  dressing: [
    { title: 'Dressing & Outfit Guide (Male Candidates)', filename: 'male_outfit_guide.jpeg', folder: '' },
    { title: 'Best Tie Combinations with White Shirt', filename: 'best_tie_combinations_white_shirt.jpeg', folder: '' },
    { title: 'Full Pent Coat 3-Piece Dressing Sense', filename: 'dressing_three_piece_suit_guide.jpeg', folder: 'Interview Dressing' },
    { title: 'Recommended Shirt Guide', filename: 'dressing_recommended_shirt.jpeg', folder: 'Interview Dressing' },
    { title: 'Recommended Trousers Guide', filename: 'dressing_recommended_trousers.jpeg', folder: 'Interview Dressing' },
    { title: 'Tie Knots Guide', filename: 'dressing_tie_knots.jpeg', folder: 'Interview Dressing' },
    { title: 'Belt, Shoes & Socks Guide', filename: 'dressing_belt_shoes_socks.jpeg', folder: 'Interview Dressing' },
    { title: 'Socks Details Guide', filename: 'dressing_socks_guide.jpeg', folder: 'Interview Dressing' },
    { title: 'Watch & Perfume Guide', filename: 'dressing_watch_perfume.jpeg', folder: 'Interview Dressing' },
    { title: 'Hair Cutting Guide', filename: 'dressing_haircut_guide.jpeg', folder: 'Interview Dressing' },
    { title: 'Beard Grooming Guide', filename: 'dressing_beard_grooming.jpeg', folder: 'Interview Dressing' },
    { title: 'Moustache & Nails Guide', filename: 'dressing_moustache_nails_guide.jpeg', folder: 'Interview Dressing' },
    { title: 'Handkerchief, Oral Hygiene & Face Wash', filename: 'dressing_oral_hygiene_face_wash.jpeg', folder: 'Interview Dressing' },
    { title: 'Overall Appearance Guide', filename: 'dressing_overall_appearance.jpeg', folder: 'Interview Dressing' }
  ],
  questions: [
    { title: 'Common Asked Questions: Intro & Personal Profile (Main)', filename: 'questions_intro_personal_main.jpeg', folder: 'Interview Questions' },
    { title: 'Intro & Personal Profile Answers (Part 1)', filename: 'questions_intro_personal_answers_part1.jpeg', folder: 'Interview Questions' },
    { title: 'Intro & Personal Profile Questions (Part 1.1)', filename: 'questions_intro_personal_part1_1.jpeg', folder: 'Interview Questions' },
    { title: 'Intro & Personal Profile Questions (Part 2)', filename: 'questions_intro_personal_part2.jpeg', folder: 'Interview Questions' },
    { title: 'Intro & Personal Profile Questions (Part 3)', filename: 'questions_intro_personal_part3.jpeg', folder: 'Interview Questions' },
    { title: 'Intro & Personal Profile Questions (Part 4)', filename: 'questions_intro_personal_part4.jpeg', folder: 'Interview Questions' },
    { title: 'Intro & Personal Profile Questions (Part 5)', filename: 'questions_intro_personal_part5.jpeg', folder: 'Interview Questions' },
    { title: 'Dangerous & Tricky Asked Questions & Answers (Part 1)', filename: 'questions_tricky_answers_part1.jpeg', folder: 'Interview Questions' },
    { title: 'Dangerous & Tricky Asked Questions & Answers (Part 2)', filename: 'questions_tricky_answers_part2.jpeg', folder: 'Interview Questions' }
  ]
})

const expandedAdminSections = ref({
  general: true,
  dressing: false,
  questions: false
})

const toggleAdminSection = (section) => {
  expandedAdminSections.value[section] = !expandedAdminSections.value[section]
}

const flatOutfitGuides = computed(() => {
  return [
    ...adminGuides.value.general.map(item => ({ ...item, section: 'General Prep & Mindset' })),
    ...adminGuides.value.dressing.map(item => ({ ...item, section: 'Dressing & Grooming' })),
    ...adminGuides.value.questions.map(item => ({ ...item, section: 'Interview Questions Board' }))
  ]
})

const outfitLightboxOpen = ref(false)
const outfitLightboxIndex = ref(0)

const openOutfitLightbox = (filename) => {
  const idx = flatOutfitGuides.value.findIndex(item => item.filename === filename)
  if (idx !== -1) {
    outfitLightboxIndex.value = idx
    outfitLightboxOpen.value = true
  }
}

const closeOutfitLightbox = () => {
  outfitLightboxOpen.value = false
}

const prevOutfitLightbox = () => {
  const count = flatOutfitGuides.value.length
  outfitLightboxIndex.value = (outfitLightboxIndex.value - 1 + count) % count
}

const nextOutfitLightbox = () => {
  const count = flatOutfitGuides.value.length
  outfitLightboxIndex.value = (outfitLightboxIndex.value + 1) % count
}

const handleOutfitLightboxKeys = (e) => {
  if (!outfitLightboxOpen.value) return
  if (e.key === 'Escape') closeOutfitLightbox()
  if (e.key === 'ArrowLeft') prevOutfitLightbox()
  if (e.key === 'ArrowRight') nextOutfitLightbox()
}

const getImgUrl = (item) => {
  if (!item) return ''
  const base = '/media/images/tests-guides/Deputy Interview guide/'
  return item.folder ? `${base}${item.folder}/${item.filename}` : `${base}${item.filename}`
}

onMounted(() => {
  window.addEventListener('keydown', handleOutfitLightboxKeys)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleOutfitLightboxKeys)
})
</script>

<template>
  <div class="interview-wrapper">
    <!-- Header -->
    <div class="interview-header glass-card">
      <div class="header-content">
        <span class="badge badge-gold">💡 ISSB Final Assessment</span>
        <h1>Deputy President (DP) Interview</h1>
        <p class="subtitle-text">
          The final one-on-one assessment in the ISSB testing process. Typically conducted by a Brigadier or equivalent, focusing on personality, emotional maturity, general awareness, and Officer-Like Qualities (OLQs).
        </p>
      </div>
      <div class="header-action">
        <button class="btn btn-secondary" @click="router.push('/roadmap')">
          ← Back to Roadmap
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs-container glass-card">
      <div class="tabs-row">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- Tab 1: Overview & Structure -->
    <div class="tab-panel glass-card" v-if="activeTab === 'overview'">
      <div class="grid-2">
        <div class="info-block border-blue">
          <h3>🎯 Purpose of the DP Interview</h3>
          <p>
            The DP Interview is not a formal academic knowledge test. The primary goal is to assess your core personality traits, confidence, integrity, values, motivations, and suitability to serve as a commissioned officer.
          </p>
          <ul class="olq-list" style="margin-top: 1rem;">
            <li><strong>Personality & Character:</strong> Your honesty, values, and self-discipline.</li>
            <li><strong>Confidence & Composure:</strong> Ability to handle direct questioning and stress.</li>
            <li><strong>Motivation:</strong> Sincerity of your desire to serve in the armed forces.</li>
            <li><strong>Maturity:</strong> Your reactions to difficult or unexpected situational questions.</li>
            <li><strong>General Awareness:</strong> Basic knowledge of global issues, regional security, and Pakistan.</li>
          </ul>
        </div>
        
        <div class="info-block border-gold">
          <h3>⏱️ Structure & Environment</h3>
          <div class="meta-row">
            <span class="meta-label">Duration:</span>
            <span class="meta-value">Typically 15 to 30 minutes per candidate.</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Interviewer:</span>
            <span class="meta-value">Deputy President of ISSB (Brigadier / equivalent).</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">Environment:</span>
            <span class="meta-value">Private, one-on-one, formal office setting.</span>
          </div>
          <div class="meta-row" style="border-bottom: none;">
            <span class="meta-label">Primary Inputs:</span>
            <span class="meta-value">Your Bio-Data Form, academic results, and GTO performance indicators.</span>
          </div>
        </div>
      </div>

      <div class="tactical-tips border-green" style="margin-top: 1.5rem;">
        <h4>💡 Critical Success Tips:</h4>
        <div class="tips-grid">
          <div class="tip-card">
            <h5>1. Maintain Integrity</h5>
            <p>Never tell a lie. The Deputy President will cross-question you on your statements. Contradictions will damage your profile.</p>
          </div>
          <div class="tip-card">
            <h5>2. Dress Comfortably</h5>
            <p>Ensure your outfit (suit or Shalwar Kameez with waistcoat) is neat, ironed, and well-fitted. Polished shoes and tidy grooming make the first impression.</p>
          </div>
          <div class="tip-card">
            <h5>3. Composure Under Pressure</h5>
            <p>If you face a tough question or get challenged, stay calm. Never get defensive, argue, or panic. Pause, think, and answer with maturity.</p>
          </div>
          <div class="tip-card">
            <h5>4. Admit "Don't Know"</h5>
            <p>If you do not know the answer to a general knowledge question, say: <em>"I don't know, Sir"</em> politely, rather than guessing blindly.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Question Bank -->
    <div class="tab-panel glass-card" v-if="activeTab === 'questions'">
      <div class="search-bar-row">
        <input 
          type="text" 
          v-model="searchQuery" 
          class="form-input search-field" 
          placeholder="🔍 Search 80+ questions, tips, or correct answers..." 
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">×</button>
      </div>

      <div class="categories-container" v-if="filteredCategories.length > 0">
        <div 
          v-for="cat in filteredCategories" 
          :key="cat.name" 
          class="category-panel border-blue"
          style="margin-bottom: 1.5rem;"
        >
          <div class="category-header interactive-header" @click="toggleCategory(cat.name)">
            <div class="cat-header-title">
              <span class="cat-icon">{{ cat.icon }}</span>
              <h4>{{ cat.name }} ({{ cat.questions.length }})</h4>
            </div>
            <span class="cat-toggle-arrow" :class="{ 'rotated': isCategoryExpanded(cat.name) }">▼</span>
          </div>
          
          <div class="questions-list" v-show="isCategoryExpanded(cat.name)">
            <div 
              v-for="(q, idx) in cat.questions" 
              :key="idx" 
              class="question-item glass-card collapsible-question"
              :class="{ 'expanded': isQuestionExpanded(q.text) }"
            >
              <div class="q-header" @click="toggleQuestion(q.text)">
                <div class="q-header-title">
                  <span class="q-bullet">❓</span>
                  <span class="q-text">{{ q.text }}</span>
                </div>
                <span class="q-toggle-icon">{{ isQuestionExpanded(q.text) ? '▲' : '▼' }}</span>
              </div>
              
              <div class="q-body-content" v-show="isQuestionExpanded(q.text)">
                <div v-if="q.tip" class="q-tip">
                  <strong>💡 Preparation Tip:</strong> {{ q.tip }}
                </div>
                
                <!-- Tricky Question Layout -->
                <div v-if="q.isTricky" class="tricky-box">
                  <div class="tricky-analysis">
                    <strong>🔍 What the Interviewer is Checking:</strong>
                    <p>{{ q.analysis }}</p>
                  </div>
                  <div class="tricky-comparison-row">
                    <div class="tricky-path path-wrong">
                      <div class="path-badge badge-wrong">❌ WRONG Path</div>
                      <p class="path-quote">"{{ q.wrong }}"</p>
                    </div>
                    <div class="tricky-path path-correct">
                      <div class="path-badge badge-correct">✅ CORRECT Path</div>
                      <p class="path-quote">"{{ q.correct }}"</p>
                    </div>
                  </div>
                </div>

                <!-- Standard Question Layout -->
                <div v-else-if="q.answers && q.answers.length > 0" class="answers-box">
                  <div 
                    v-for="(ans, ansIdx) in q.answers" 
                    :key="ansIdx" 
                    class="answer-option"
                  >
                    <span class="ans-badge">Option {{ ansIdx + 1 }}</span>
                    <p class="ans-text">"{{ ans }}"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="no-results glass-card" v-else>
        <p>🔍 No questions match your search query. Try another keyword.</p>
      </div>
    </div>

    <!-- Tab 3: Tough Questions (STAR Method) -->
    <div class="tab-panel glass-card" v-if="activeTab === 'tough'">
      <div class="star-explanation border-gold">
        <h3>⭐ The STAR Response Formula</h3>
        <p>
          When asked tough situational or failure-related questions, keep your answer structured, logical, and growth-oriented by following the STAR method:
        </p>
        <div class="star-flow">
          <div class="star-step">
            <span class="star-letter">S</span>
            <strong>Situation</strong>
            <span>Briefly set the context.</span>
          </div>
          <div class="star-step">
            <span class="star-letter">T</span>
            <strong>Task</strong>
            <span>Define the challenge or goal.</span>
          </div>
          <div class="star-step">
            <span class="star-letter">A</span>
            <strong>Action</strong>
            <span>Explain the steps YOU took.</span>
          </div>
          <div class="star-step">
            <span class="star-letter">R</span>
            <strong>Result</strong>
            <span>Share the positive outcome or what you learned.</span>
          </div>
        </div>
      </div>

      <h3 style="margin-top: 2rem; margin-bottom: 1rem;">🔥 Sample Tough Questions & Responses</h3>
      <div class="star-examples-grid">
        <div 
          v-for="(ex, idx) in starExamples" 
          :key="idx" 
          class="star-example-card glass-card"
        >
          <h4 class="ex-question">Q: {{ ex.question }}</h4>
          
          <div class="ex-parts">
            <div class="ex-part"><span class="lbl s-lbl">S</span> <p>{{ ex.situation }}</p></div>
            <div class="ex-part"><span class="lbl t-lbl">T</span> <p>{{ ex.task }}</p></div>
            <div class="ex-part"><span class="lbl a-lbl">A</span> <p>{{ ex.action }}</p></div>
            <div class="ex-part"><span class="lbl r-lbl">R</span> <p>{{ ex.result }}</p></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 4: Responsibility vs Blame -->
    <div class="tab-panel glass-card" v-if="activeTab === 'blame'">
      <div class="blame-overview border-red">
        <h3>🤝 Never Blame. Take Responsibility.</h3>
        <p>
          Military psychologists and the Deputy President are looking for candidates who demonstrate <strong>maturity</strong> and <strong>accountability</strong>. 
          Blaming parents, teachers, friends, resources, or the "system" for your shortcomings shows lack of control, immaturity, and makes you look defensive.
        </p>
        <p style="margin-top: 0.5rem; font-weight: 500;">
          👉 The Mindset Shift: Stop making excuses. Acknowledge mistakes, accept ownership, and explain how you are working to improve.
        </p>
      </div>

      <h3 style="margin-top: 2rem; margin-bottom: 1rem;">⚖️ Blaming (Weak) vs. Responsible (Strong) Examples</h3>
      <div class="comparison-table-wrapper">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Situation</th>
              <th class="col-avoid">❌ Don't Say (Blaming / Weak)</th>
              <th class="col-use">✅ Say This Instead (Responsible / Strong)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in blameComparisons" :key="idx">
              <td class="sit-cell"><strong>{{ item.situation }}</strong></td>
              <td class="blame-cell text-red">{{ item.blame }}</td>
              <td class="resp-cell text-green">{{ item.responsible }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="formula-box border-green" style="margin-top: 1.5rem;">
        <h4>🏆 The Responsibility Formula:</h4>
        <div class="formula-steps">
          <div class="f-step"><strong>1. Accept:</strong> Own the mistake/situation honestly without hesitation.</div>
          <div class="arrow">➔</div>
          <div class="f-step"><strong>2. Learn:</strong> Identify the lesson or exact point of failure.</div>
          <div class="arrow">➔</div>
          <div class="f-step"><strong>3. Improve:</strong> Share the steps you have taken or are taking to correct it.</div>
          <div class="arrow">➔</div>
          <div class="f-step"><strong>4. Move Forward:</strong> Present a solution-oriented, positive path.</div>
        </div>
      </div>
    </div>

    <!-- Tab 5: Outfit & Dressing (Admin Only) -->
    <div class="tab-panel glass-card" v-if="activeTab === 'outfit' && authStore.profile?.role === 'admin'">
      <div class="guides-header" style="margin-bottom: 1.5rem;">
        <h3 class="text-glow">👔 Admin Panel: Dressing, Ties, & Outfit Boards</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
          Admin access only. These visual boards are hidden from standard candidates. Study outfit matching and tie length guides.
        </p>
      </div>
      
      <!-- Collapsible Section 1: General Prep -->
      <div class="admin-section-wrapper glass-card">
        <div class="admin-section-header" @click="toggleAdminSection('general')">
          <h4>📁 General Prep & Mindset Guides ({{ adminGuides.general.length }} items)</h4>
          <span class="section-arrow" :class="{ 'rotated': expandedAdminSections.general }">▼</span>
        </div>
        <div class="admin-section-content" v-show="expandedAdminSections.general">
          <div class="guides-grid">
            <div 
              v-for="(item, itemIdx) in adminGuides.general" 
              :key="itemIdx"
              class="guide-card glass-card interactive"
              @click="openOutfitLightbox(item.filename)"
            >
              <div class="guide-image-container">
                <img 
                  :src="getImgUrl(item)" 
                  :alt="item.title"
                  class="guide-thumbnail"
                  loading="lazy"
                />
                <div class="guide-card-overlay">
                  <span class="zoom-text">🔍 Click to View Full Size</span>
                </div>
              </div>
              <div class="guide-card-footer">
                <span class="guide-card-title">{{ item.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Collapsible Section 2: Dressing & Grooming -->
      <div class="admin-section-wrapper glass-card" style="margin-top: 1rem;">
        <div class="admin-section-header" @click="toggleAdminSection('dressing')">
          <h4>📁 Dressing & Grooming Standards ({{ adminGuides.dressing.length }} items)</h4>
          <span class="section-arrow" :class="{ 'rotated': expandedAdminSections.dressing }">▼</span>
        </div>
        <div class="admin-section-content" v-show="expandedAdminSections.dressing">
          <div class="guides-grid">
            <div 
              v-for="(item, itemIdx) in adminGuides.dressing" 
              :key="itemIdx"
              class="guide-card glass-card interactive"
              @click="openOutfitLightbox(item.filename)"
            >
              <div class="guide-image-container">
                <img 
                  :src="getImgUrl(item)" 
                  :alt="item.title"
                  class="guide-thumbnail"
                  loading="lazy"
                />
                <div class="guide-card-overlay">
                  <span class="zoom-text">🔍 Click to View Full Size</span>
                </div>
              </div>
              <div class="guide-card-footer">
                <span class="guide-card-title">{{ item.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Collapsible Section 3: Questions Board -->
      <div class="admin-section-wrapper glass-card" style="margin-top: 1rem;">
        <div class="admin-section-header" @click="toggleAdminSection('questions')">
          <h4>📁 Interview Questions & Traps Boards ({{ adminGuides.questions.length }} items)</h4>
          <span class="section-arrow" :class="{ 'rotated': expandedAdminSections.questions }">▼</span>
        </div>
        <div class="admin-section-content" v-show="expandedAdminSections.questions">
          <div class="guides-grid">
            <div 
              v-for="(item, itemIdx) in adminGuides.questions" 
              :key="itemIdx"
              class="guide-card glass-card interactive"
              @click="openOutfitLightbox(item.filename)"
            >
              <div class="guide-image-container">
                <img 
                  :src="getImgUrl(item)" 
                  :alt="item.title"
                  class="guide-thumbnail"
                  loading="lazy"
                />
                <div class="guide-card-overlay">
                  <span class="zoom-text">🔍 Click to View Full Size</span>
                </div>
              </div>
              <div class="guide-card-footer">
                <span class="guide-card-title">{{ item.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Outfit Lightbox Modal (Admin only) -->
    <div class="lightbox-modal" v-if="outfitLightboxOpen && authStore.profile?.role === 'admin'" @click.self="closeOutfitLightbox">
      <div class="lightbox-content-wrapper">
        <button class="lightbox-close-btn" @click="closeOutfitLightbox">×</button>
        <button 
          class="lightbox-nav-btn prev-btn" 
          @click="prevOutfitLightbox" 
          v-if="flatOutfitGuides.length > 1"
        >
          ‹
        </button>
        <div class="lightbox-image-box">
          <img 
            :src="getImgUrl(flatOutfitGuides[outfitLightboxIndex])" 
            :alt="flatOutfitGuides[outfitLightboxIndex].title"
            class="lightbox-image"
          />
          <div class="lightbox-caption">
            <span class="caption-category">Deputy Interview Prep Guide ➔ {{ flatOutfitGuides[outfitLightboxIndex].section }}</span>
            <h4 class="caption-title">{{ flatOutfitGuides[outfitLightboxIndex].title }}</h4>
          </div>
        </div>
        <button 
          class="lightbox-nav-btn next-btn" 
          @click="nextOutfitLightbox" 
          v-if="flatOutfitGuides.length > 1"
        >
          ›
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.interview-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-bottom: 2rem;
}

.interview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.header-content h1 {
  font-size: 1.85rem;
  margin-top: 0.25rem;
}

.subtitle-text {
  color: var(--text-secondary);
  font-size: 0.95rem;
  margin-top: 0.5rem;
  max-width: 800px;
}

.tabs-container {
  padding: 0.5rem;
}

.tabs-row {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tab-btn {
  padding: 0.75rem 1.25rem;
  font-family: var(--font-heading);
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-smooth);
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.tab-btn.active {
  background: rgba(0, 242, 254, 0.08);
  color: var(--accent-cyan);
  border: 1px solid rgba(0, 242, 254, 0.25);
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.info-block {
  padding: 1.25rem;
  border-left: 4px solid var(--accent-cyan);
  background: rgba(3, 194, 252, 0.02);
  border-radius: var(--border-radius-md);
}

.info-block.border-gold {
  border-left-color: var(--accent-gold);
  background: rgba(245, 158, 11, 0.02);
}

.info-block h3 {
  font-size: 1.15rem;
  margin-bottom: 0.75rem;
}

.olq-list {
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.meta-row {
  display: flex;
  justify-content: space-between;
  padding: 0.65rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.9rem;
}

.meta-label {
  font-weight: 600;
  color: var(--text-primary);
}

.meta-value {
  color: var(--text-secondary);
  text-align: right;
  max-width: 65%;
}

.tactical-tips {
  padding: 1.25rem;
  background: rgba(34, 197, 94, 0.02);
  border-left: 4px solid var(--accent-green);
  border-radius: var(--border-radius-md);
}

.tactical-tips h4 {
  font-size: 1.15rem;
  margin-bottom: 1rem;
}

.tips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.tip-card h5 {
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.tip-card p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Question Bank Tab */
.search-bar-row {
  position: relative;
  width: 100%;
}

.search-field {
  width: 100%;
  padding: 0.85rem 1rem 0.85rem 2.5rem;
  background: var(--bg-panel-solid, #f8fafc);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  font-size: 0.95rem;
  color: var(--text-primary);
}

.search-field:focus {
  outline: 2px solid var(--accent-cyan);
  border-color: transparent;
}

.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0 0.5rem;
}

.category-panel {
  padding: 1.25rem;
  background: rgba(3, 194, 252, 0.01);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--border-color);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 0.5rem;
}

.category-header h4 {
  font-size: 1.1rem;
}

.cat-icon {
  font-size: 1.25rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.question-item {
  padding: 1rem;
  background: var(--bg-panel-solid, #f8fafc);
}

.q-text {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
}

.q-tip {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
  border-top: 1px solid rgba(255,255,255,0.03);
  padding-top: 0.5rem;
}

.q-tip strong {
  color: var(--accent-cyan);
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
}

/* STAR Answering method */
.star-explanation {
  padding: 1.25rem;
  border-left: 4px solid var(--accent-gold);
  background: rgba(245, 158, 11, 0.02);
  border-radius: var(--border-radius-md);
}

.star-explanation h3 {
  font-size: 1.15rem;
  margin-bottom: 0.75rem;
}

.star-flow {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 1.25rem;
}

.star-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.star-letter {
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--accent-gold);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.star-step strong {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.star-step span:last-child {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.star-examples-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.star-example-card h4 {
  font-size: 0.95rem;
  color: var(--accent-cyan);
  margin-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 0.5rem;
}

.ex-parts {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.ex-part {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.ex-part .lbl {
  font-size: 0.7rem;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  margin-top: 2px;
}

.s-lbl { background: var(--accent-cyan); }
.t-lbl { background: var(--accent-gold); }
.a-lbl { background: var(--accent-green); }
.r-lbl { background: #8b5cf6; }

.ex-part p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Blame vs Responsibility */
.blame-overview {
  padding: 1.25rem;
  border-left: 4px solid var(--accent-red);
  background: rgba(239, 68, 68, 0.02);
  border-radius: var(--border-radius-md);
}

.blame-overview h3 {
  font-size: 1.15rem;
  margin-bottom: 0.75rem;
}

.comparison-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  text-align: left;
}

.comparison-table th, .comparison-table td {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.comparison-table th {
  background: var(--bg-panel-solid, #f8fafc);
  font-weight: 600;
  color: var(--text-primary);
}

.col-avoid {
  color: var(--accent-red);
}

.col-use {
  color: var(--accent-green);
}

.sit-cell {
  background: var(--bg-panel-solid, #f8fafc);
  width: 25%;
}

.blame-cell {
  color: var(--accent-red);
  width: 37.5%;
  line-height: 1.4;
}

.resp-cell {
  color: var(--accent-green);
  width: 37.5%;
  line-height: 1.4;
}

.formula-box {
  padding: 1.25rem;
  border-left: 4px solid var(--accent-green);
  background: rgba(34, 197, 94, 0.02);
  border-radius: var(--border-radius-md);
}

.formula-box h4 {
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.formula-steps {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.f-step {
  background: rgba(255,255,255,0.03);
  padding: 0.75rem;
  border-radius: var(--border-radius-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
  border: 1px solid rgba(255,255,255,0.05);
  flex: 1;
  min-width: 150px;
}

.arrow {
  color: var(--text-muted);
  font-size: 1.2rem;
}

/* Dressing/Outfit gallery (Admin-only) */
.guides-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
}

.guide-card {
  overflow: hidden;
  padding: 0;
  border-radius: var(--border-radius-md);
  transition: transform var(--transition-smooth), border-color var(--transition-smooth);
}

.guide-image-container {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
  background: rgba(0,0,0,0.1);
}

.guide-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-smooth);
}

.guide-card:hover .guide-thumbnail {
  transform: scale(1.05);
}

.guide-card-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-smooth);
}

.guide-card:hover .guide-card-overlay {
  opacity: 1;
}

.zoom-text {
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(0,0,0,0.6);
  padding: 0.35rem 0.75rem;
  border-radius: 50px;
}

.guide-card-footer {
  padding: 0.75rem;
  text-align: center;
  background: var(--bg-panel-solid, #f8fafc);
  border-top: 1px solid var(--border-color);
}

.guide-card-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

/* Lightbox Modal */
.lightbox-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.94);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.lightbox-content-wrapper {
  position: relative;
  width: 95vw;
  max-width: 1400px;
  height: 90vh;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lightbox-image-box {
  background: #000;
  border-radius: var(--border-radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
}

.lightbox-image {
  max-width: 100%;
  max-height: calc(90vh - 80px);
  object-fit: contain;
}

.lightbox-close-btn {
  position: absolute;
  top: -2.5rem;
  right: 0;
  font-size: 2rem;
  color: #fff;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--transition-smooth);
}

.lightbox-close-btn:hover {
  opacity: 1;
}

.lightbox-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 3rem;
  color: #fff;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-smooth);
  opacity: 0.6;
}

.lightbox-nav-btn:hover {
  opacity: 1;
  background: rgba(3, 194, 252, 0.8);
}

.prev-btn {
  left: -4rem;
}

.next-btn {
  right: -4rem;
}

.lightbox-caption {
  padding: 0.75rem 1.25rem;
  background: rgba(30, 41, 59, 0.95);
  color: #fff;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  width: 100%;
}

.caption-category {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent-cyan);
  letter-spacing: 0.05em;
}

.caption-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0.15rem 0 0 0;
}

/* Interactive & Collapsible Styling */
.interactive-header {
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background var(--transition-smooth);
  padding: 0.5rem;
  border-radius: var(--border-radius-sm);
}

.interactive-header:hover {
  background: rgba(255, 255, 255, 0.03);
}

.cat-header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cat-toggle-arrow, .section-arrow {
  font-size: 0.75rem;
  color: var(--text-muted);
  transition: transform var(--transition-smooth);
}

.cat-toggle-arrow.rotated, .section-arrow.rotated {
  transform: rotate(180deg);
  color: var(--accent-cyan);
}

/* Collapsible Question Cards */
.collapsible-question {
  cursor: pointer;
  transition: all var(--transition-smooth);
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

.collapsible-question:hover {
  border-color: rgba(3, 194, 252, 0.2) !important;
  background: rgba(255, 255, 255, 0.02);
}

.collapsible-question.expanded {
  border-color: rgba(3, 194, 252, 0.4) !important;
  background: rgba(3, 194, 252, 0.01);
}

.q-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.q-header-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.q-bullet {
  font-size: 1.1rem;
}

.q-toggle-icon {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.q-body-content {
  margin-top: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 0.75rem;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Tricky & Normal Answer Blocks */
.tricky-box {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.5rem;
}

.tricky-analysis {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius-md);
  font-size: 0.85rem;
}

.tricky-analysis strong {
  color: var(--accent-gold);
}

.tricky-comparison-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.tricky-path {
  padding: 1rem;
  border-radius: var(--border-radius-md);
  background: rgba(255, 255, 255, 0.01);
}

.tricky-path.path-wrong {
  border-left: 4px solid var(--accent-red);
}

.tricky-path.path-correct {
  border-left: 4px solid var(--accent-green);
}

.path-badge {
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}

.badge-wrong {
  color: var(--accent-red);
}

.badge-correct {
  color: var(--accent-green);
}

.path-quote {
  font-style: italic;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.answers-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.answer-option {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius-md);
  padding: 0.75rem 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.ans-badge {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--accent-cyan);
  background: rgba(3, 194, 252, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.ans-text {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

/* Collapsible Admin sections */
.admin-section-wrapper {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
}

.admin-section-header {
  padding: 1rem 1.25rem;
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background var(--transition-smooth);
}

.admin-section-header:hover {
  background: rgba(255, 255, 255, 0.04);
}

.admin-section-header h4 {
  font-size: 1rem;
  margin: 0;
}

.admin-section-content {
  padding: 1.25rem;
  border-top: 1px solid var(--border-color);
  background: rgba(0, 0, 0, 0.1);
  animation: slideDown 0.2s ease-out;
}

/* Responsiveness */
@media (max-width: 992px) {
  .prev-btn { left: 0.5rem; z-index: 10; }
  .next-btn { right: 0.5rem; z-index: 10; }
  .lightbox-content-wrapper {
    width: 100%;
    height: 100%;
    max-height: 100vh;
  }
}

@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  
  .interview-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-action {
    margin-top: 0.5rem;
  }
  
  .star-flow {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .star-examples-grid {
    grid-template-columns: 1fr;
  }
  
  .formula-steps {
    flex-direction: column;
    align-items: stretch;
  }
  
  .arrow {
    text-align: center;
    transform: rotate(90deg);
    margin: 0.25rem 0;
  }

  .comparison-table th, .comparison-table td {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }

  .sit-cell { width: 30%; }
  .blame-cell, .resp-cell { width: 35%; }

  .tricky-comparison-row {
    grid-template-columns: 1fr;
  }

  /* Mobile Fullscreen Lightbox */
  .lightbox-modal {
    padding: 0;
    background: #000000;
  }

  .lightbox-content-wrapper {
    width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
  }

  .lightbox-image-box {
    width: 100%;
    height: 100%;
    max-height: 100dvh;
    border-radius: 0;
    border: none;
    box-shadow: none;
    background: #000000;
    justify-content: center;
  }

  .lightbox-image {
    width: 100%;
    height: 100%;
    max-height: 100dvh;
    object-fit: contain;
  }

  .lightbox-caption {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(15, 23, 42, 0.75);
    backdrop-filter: blur(8px);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    z-index: 12;
    padding: 1rem 1.25rem;
  }

  .lightbox-close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    left: auto;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: rgba(15, 23, 42, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #ffffff;
    z-index: 20;
    opacity: 0.9;
    padding-bottom: 4px;
  }

  .lightbox-nav-btn {
    width: 44px;
    height: 44px;
    font-size: 2.5rem;
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(255, 255, 255, 0.15);
    z-index: 15;
  }

  .prev-btn { left: 0.75rem; }
  .next-btn { right: 0.75rem; }
}

@media (max-width: 480px) {
  .guides-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 0.75rem;
  }
}
</style>

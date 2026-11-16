export const QUIZ_EXAMPLES = [
  {
    id: 'photos',
    title: 'Katzen in Fotos finden',
    description: 'Eine Foto-App sammelt Bilder, auf denen eine Katze zu sehen ist.',
    explanation: 'Die App erkennt Katzen an sichtbaren Merkmalen in den Fotos.',
    correct: true,
  },
  {
    id: 'voice',
    title: 'Sprachnachrichten abtippen',
    description: 'Ein Handy wandelt eine gesprochene Nachricht in Text um.',
    explanation: 'Hier wird Ton ausgewertet. Das ist Spracherkennung, keine Bilderkennung.',
    correct: false,
  },
  {
    id: 'traffic',
    title: 'Verkehrsschilder erkennen',
    description: 'Eine Kamera erkennt ein Tempolimit-Schild am Straßenrand.',
    explanation:
      'Das System erkennt Form, Zeichen und Zahlen im Kamerabild. Ein einzelnes Modell ersetzt keine verlässliche Sicherheitsentscheidung.',
    correct: true,
  },
  {
    id: 'calculator',
    title: '12 × 8 ausrechnen',
    description: 'Tasten geben die Zahlen in einen einfachen Taschenrechner ein.',
    explanation: 'Der Rechner verarbeitet eingegebene Zahlen. Dafür wertet er keine Bilder aus.',
    correct: false,
  },
  {
    id: 'photo-text',
    title: 'Text aus einem Foto lesen',
    description: 'Ein Handy macht gedruckten Text auf einem Foto kopierbar.',
    explanation:
      'Die Buchstaben werden im Bild erkannt. Das heißt optische Zeichenerkennung, kurz OCR.',
    correct: true,
  },
  {
    id: 'timer',
    title: 'Einen Timer stellen',
    description: 'Ein Timer klingelt nach fünf Minuten.',
    explanation: 'Hier wird Zeit gezählt. Dafür müssen keine Bilder erkannt werden.',
    correct: false,
  },
] as const;

export type QuizExample = (typeof QUIZ_EXAMPLES)[number];
export type QuizId = QuizExample['id'];
export const QUIZ_CORRECT_COUNT = QUIZ_EXAMPLES.filter((example) => example.correct).length;

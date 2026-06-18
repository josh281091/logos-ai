import type { BiblePassage, Translation } from "./types";

const GERMAN_TRANSLATIONS = ["schlachter", "luther"];

// Book number mapping for getbible.net (1-based)
const BOOK_NUMBER: Record<string, number> = {
  Genesis: 1, Exodus: 2, Leviticus: 3, Numbers: 4, Deuteronomy: 5,
  Joshua: 6, Judges: 7, Ruth: 8, "1 Samuel": 9, "2 Samuel": 10,
  "1 Kings": 11, "2 Kings": 12, "1 Chronicles": 13, "2 Chronicles": 14,
  Ezra: 15, Nehemiah: 16, Esther: 17, Job: 18, Psalms: 19, Proverbs: 20,
  Ecclesiastes: 21, "Song of Solomon": 22, Isaiah: 23, Jeremiah: 24,
  Lamentations: 25, Ezekiel: 26, Daniel: 27, Hosea: 28, Joel: 29, Amos: 30,
  Obadiah: 31, Jonah: 32, Micah: 33, Nahum: 34, Habakkuk: 35, Zephaniah: 36,
  Haggai: 37, Zechariah: 38, Malachi: 39,
  Matthew: 40, Mark: 41, Luke: 42, John: 43, Acts: 44,
  Romans: 45, "1 Corinthians": 46, "2 Corinthians": 47, Galatians: 48,
  Ephesians: 49, Philippians: 50, Colossians: 51, "1 Thessalonians": 52,
  "2 Thessalonians": 53, "1 Timothy": 54, "2 Timothy": 55, Titus: 56,
  Philemon: 57, Hebrews: 58, James: 59, "1 Peter": 60, "2 Peter": 61,
  "1 John": 62, "2 John": 63, "3 John": 64, Jude: 65, Revelation: 66,
};

async function fetchFromGetBible(
  book: string,
  chapter: number,
  translation: string
): Promise<BiblePassage> {
  const bookNum = BOOK_NUMBER[book];
  if (!bookNum) throw new Error(`Unknown book: ${book}`);

  const url = `https://api.getbible.net/v2/${translation}/${bookNum}/${chapter}.json`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`getbible.net error: ${res.status}`);
  const data = await res.json();

  const rawVerses = Array.isArray(data.verses)
    ? data.verses
    : Object.values(data.verses as Record<string, { verse: number; text: string }>);

  const bookName = data.book_name ?? book;

  const verses: BiblePassage["verses"] = (rawVerses as { verse: number; text: string }[]).map((v) => ({
    book_id: book,
    book_name: bookName,
    chapter,
    verse: v.verse,
    text: v.text,
  }));

  const translationName =
    translation === "schlachter" ? "Schlachter" : "Lutherbibel";

  return {
    reference: `${bookName} ${chapter}`,
    verses,
    text: verses.map((v) => v.text).join(" "),
    translation_id: translation,
    translation_name: translationName,
  };
}

async function fetchFromBibleApi(
  book: string,
  chapter: number,
  translation: string
): Promise<BiblePassage> {
  const ref = encodeURIComponent(`${book} ${chapter}`);
  const url = `https://bible-api.com/${ref}?translation=${translation}&verse_numbers=true`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Bible API error: ${res.status}`);
  return res.json();
}

export async function fetchPassage(
  book: string,
  chapter: number,
  translation: Translation = "kjv"
): Promise<BiblePassage> {
  if (GERMAN_TRANSLATIONS.includes(translation)) {
    return fetchFromGetBible(book, chapter, translation);
  }
  return fetchFromBibleApi(book, chapter, translation);
}

// German to English book name mapping
const GERMAN_TO_ENGLISH: Record<string, string> = {
  "1 mose": "Genesis", "1. mose": "Genesis", "genesis": "Genesis",
  "2 mose": "Exodus", "2. mose": "Exodus", "exodus": "Exodus",
  "3 mose": "Leviticus", "3. mose": "Leviticus",
  "4 mose": "Numbers", "4. mose": "Numbers",
  "5 mose": "Deuteronomy", "5. mose": "Deuteronomy",
  "josua": "Joshua", "richter": "Judges", "rut": "Ruth", "ruth": "Ruth",
  "1 samuel": "1 Samuel", "1. samuel": "1 Samuel",
  "2 samuel": "2 Samuel", "2. samuel": "2 Samuel",
  "1 könige": "1 Kings", "1. könige": "1 Kings", "1 koenige": "1 Kings",
  "2 könige": "2 Kings", "2. könige": "2 Kings", "2 koenige": "2 Kings",
  "1 chronik": "1 Chronicles", "1. chronik": "1 Chronicles",
  "2 chronik": "2 Chronicles", "2. chronik": "2 Chronicles",
  "esra": "Ezra", "nehemia": "Nehemiah", "ester": "Esther", "esther": "Esther",
  "hiob": "Job", "ijob": "Job",
  "psalmen": "Psalms", "psalm": "Psalms", "psalms": "Psalms",
  "sprüche": "Proverbs", "sprichwörter": "Proverbs",
  "prediger": "Ecclesiastes", "hohelied": "Song of Solomon",
  "jesaja": "Isaiah", "jesaia": "Isaiah",
  "jeremia": "Jeremiah", "klagelieder": "Lamentations",
  "hesekiel": "Ezekiel", "daniel": "Daniel",
  "hosea": "Hosea", "joel": "Joel", "amos": "Amos",
  "obadja": "Obadiah", "jona": "Jonah", "micha": "Micah",
  "nahum": "Nahum", "habakuk": "Habakkuk", "zefanja": "Zephaniah",
  "haggai": "Haggai", "sacharja": "Zechariah", "maleachi": "Malachi",
  "matthäus": "Matthew", "markus": "Mark", "lukas": "Luke",
  "johannes": "John", "apostelgeschichte": "Acts", "apg": "Acts",
  "römer": "Romans", "roemer": "Romans",
  "1 korinther": "1 Corinthians", "1. korinther": "1 Corinthians",
  "2 korinther": "2 Corinthians", "2. korinther": "2 Corinthians",
  "galater": "Galatians", "epheser": "Ephesians",
  "philipper": "Philippians", "kolosser": "Colossians",
  "1 thessalonicher": "1 Thessalonians", "1. thessalonicher": "1 Thessalonians",
  "2 thessalonicher": "2 Thessalonians", "2. thessalonicher": "2 Thessalonians",
  "1 timotheus": "1 Timothy", "1. timotheus": "1 Timothy",
  "2 timotheus": "2 Timothy", "2. timotheus": "2 Timothy",
  "titus": "Titus", "philemon": "Philemon", "hebräer": "Hebrews",
  "jakobus": "James",
  "1 petrus": "1 Peter", "1. petrus": "1 Peter",
  "2 petrus": "2 Peter", "2. petrus": "2 Peter",
  "1 johannes": "1 John", "1. johannes": "1 John",
  "2 johannes": "2 John", "2. johannes": "2 John",
  "3 johannes": "3 John", "3. johannes": "3 John",
  "judas": "Jude", "offenbarung": "Revelation", "offb": "Revelation",
};

function resolveBookName(name: string): string {
  return GERMAN_TO_ENGLISH[name.toLowerCase()] ?? name;
}

export function parseReference(ref: string): {
  book: string;
  chapter: number;
  verse?: number;
} | null {
  const trimmed = ref.trim();
  const match = trimmed.match(/^((?:\d\.?\s+)?\w+(?:\s+\w+)*)\s+(\d+)(?::(\d+))?/i);
  if (!match) return null;
  const book = resolveBookName(match[1].trim());
  return {
    book,
    chapter: parseInt(match[2], 10),
    verse: match[3] ? parseInt(match[3], 10) : undefined,
  };
}

export const BOOKS_OF_THE_BIBLE = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles",
  "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah",
  "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
  "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation",
];

export const CHAPTER_COUNTS: Record<string, number> = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36,
  Ezra: 10, Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Proverbs: 31,
  Ecclesiastes: 12, "Song of Solomon": 8, Isaiah: 66, Jeremiah: 52,
  Lamentations: 5, Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9,
  Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3, Zephaniah: 3,
  Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28,
  Romans: 16, "1 Corinthians": 16, "2 Corinthians": 13, Galatians: 6,
  Ephesians: 6, Philippians: 4, Colossians: 4, "1 Thessalonians": 5,
  "2 Thessalonians": 3, "1 Timothy": 6, "2 Timothy": 4, Titus: 3,
  Philemon: 1, Hebrews: 13, James: 5, "1 Peter": 5, "2 Peter": 3,
  "1 John": 5, "2 John": 1, "3 John": 1, Jude: 1, Revelation: 22,
};

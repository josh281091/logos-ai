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
  const internalBook = BOOK_DISPLAY_TO_INTERNAL[book] ?? book;
  const bookNum = BOOK_NUMBER[internalBook];
  if (!bookNum) throw new Error(`Unknown book: ${book} (${internalBook})`);

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
  const internalBook = BOOK_DISPLAY_TO_INTERNAL[book] ?? book;
  const ref = encodeURIComponent(`${internalBook} ${chapter}`);
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

// Maps search input to display name used in sidebar
const INTERNAL_TO_DISPLAY: Record<string, string> = Object.fromEntries(
  Object.entries(BOOK_DISPLAY_TO_INTERNAL).map(([display, internal]) => [internal, display])
);

function resolveBookName(name: string): string {
  const english = GERMAN_TO_ENGLISH[name.toLowerCase()] ?? name;
  return INTERNAL_TO_DISPLAY[english] ?? english;
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

// Display name → internal English key used by APIs
export const BOOK_DISPLAY_TO_INTERNAL: Record<string, string> = {
  "1. Mose": "Genesis", "2. Mose": "Exodus", "3. Mose": "Leviticus",
  "4. Mose": "Numbers", "5. Mose": "Deuteronomy",
  "Josua": "Joshua", "Richter": "Judges", "Ruth": "Ruth",
  "1. Samuel": "1 Samuel", "2. Samuel": "2 Samuel",
  "1. Könige": "1 Kings", "2. Könige": "2 Kings",
  "1. Chronik": "1 Chronicles", "2. Chronik": "2 Chronicles",
  "Esra": "Ezra", "Nehemia": "Nehemiah", "Ester": "Esther",
  "Hiob": "Job", "Psalmen": "Psalms", "Sprüche": "Proverbs",
  "Prediger": "Ecclesiastes", "Hohelied": "Song of Solomon",
  "Jesaja": "Isaiah", "Jeremia": "Jeremiah", "Klagelieder": "Lamentations",
  "Hesekiel": "Ezekiel", "Daniel": "Daniel", "Hosea": "Hosea",
  "Joel": "Joel", "Amos": "Amos", "Obadja": "Obadiah", "Jona": "Jonah",
  "Micha": "Micah", "Nahum": "Nahum", "Habakuk": "Habakkuk",
  "Zefanja": "Zephaniah", "Haggai": "Haggai", "Sacharja": "Zechariah",
  "Maleachi": "Malachi",
  "Matthäus": "Matthew", "Markus": "Mark", "Lukas": "Luke",
  "Johannes": "John", "Apostelgeschichte": "Acts", "Römer": "Romans",
  "1. Korinther": "1 Corinthians", "2. Korinther": "2 Corinthians",
  "Galater": "Galatians", "Epheser": "Ephesians", "Philipper": "Philippians",
  "Kolosser": "Colossians", "1. Thessalonicher": "1 Thessalonians",
  "2. Thessalonicher": "2 Thessalonians", "1. Timotheus": "1 Timothy",
  "2. Timotheus": "2 Timothy", "Titus": "Titus", "Philemon": "Philemon",
  "Hebräer": "Hebrews", "Jakobus": "James", "1. Petrus": "1 Peter",
  "2. Petrus": "2 Peter", "1. Johannes": "1 John", "2. Johannes": "2 John",
  "3. Johannes": "3 John", "Judas": "Jude", "Offenbarung": "Revelation",
};

export const BOOKS_OF_THE_BIBLE = Object.keys(BOOK_DISPLAY_TO_INTERNAL);

export const CHAPTER_COUNTS: Record<string, number> = {
  "1. Mose": 50, "2. Mose": 40, "3. Mose": 27, "4. Mose": 36, "5. Mose": 34,
  "Josua": 24, "Richter": 21, "Ruth": 4, "1. Samuel": 31, "2. Samuel": 24,
  "1. Könige": 22, "2. Könige": 25, "1. Chronik": 29, "2. Chronik": 36,
  "Esra": 10, "Nehemia": 13, "Ester": 10, "Hiob": 42, "Psalmen": 150, "Sprüche": 31,
  "Prediger": 12, "Hohelied": 8, "Jesaja": 66, "Jeremia": 52,
  "Klagelieder": 5, "Hesekiel": 48, "Daniel": 12, "Hosea": 14, "Joel": 3, "Amos": 9,
  "Obadja": 1, "Jona": 4, "Micha": 7, "Nahum": 3, "Habakuk": 3, "Zefanja": 3,
  "Haggai": 2, "Sacharja": 14, "Maleachi": 4,
  "Matthäus": 28, "Markus": 16, "Lukas": 24, "Johannes": 21, "Apostelgeschichte": 28,
  "Römer": 16, "1. Korinther": 16, "2. Korinther": 13, "Galater": 6,
  "Epheser": 6, "Philipper": 4, "Kolosser": 4, "1. Thessalonicher": 5,
  "2. Thessalonicher": 3, "1. Timotheus": 6, "2. Timotheus": 4, "Titus": 3,
  "Philemon": 1, "Hebräer": 13, "Jakobus": 5, "1. Petrus": 5, "2. Petrus": 3,
  "1. Johannes": 5, "2. Johannes": 1, "3. Johannes": 1, "Judas": 1, "Offenbarung": 22,
};

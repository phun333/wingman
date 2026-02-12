/**
 * Teknik terimlerin Türkçe telaffuz rehberi
 * Bu rehber, TTS motorunun İngilizce terimleri doğru telaffuz etmesi için kullanılır
 */

export const pronunciationGuide = {
  // Programming terms
  "array": "erey",
  "target": "targıt",
  "sum": "sam",
  "return": "ritörn",
  "function": "fankşın",
  "variable": "veriebıl",
  "string": "sıtring",
  "integer": "intıcır",
  "boolean": "bulien",
  "null": "nal",
  "undefined": "andifaynd",
  "object": "obcekt",
  "class": "klas",
  "method": "metod",
  "property": "propırti",
  "value": "velyu",
  "key": "ki",
  "index": "indeks",
  "element": "elımınt",
  "node": "nod",
  "tree": "tri",
  "graph": "graf",
  "hash": "heş",
  "map": "mep",
  "set": "set",
  "list": "list",
  "queue": "kyu",
  "stack": "stek",
  "heap": "hip",
  "sort": "sort",
  "search": "sörç",
  "binary": "baynıri",
  "merge": "mörc",
  "quick": "kvik",
  "bubble": "babıl",
  "insertion": "insörşın",
  "selection": "silekşın",

  // Common algorithm terms
  "complexity": "kompleksiti",
  "time": "taym",
  "space": "speys",
  "input": "inpat",
  "output": "autput",
  "edge": "ec",
  "case": "keys",
  "worst": "vörst",
  "best": "best",
  "average": "evırıc",
  "optimal": "optimıl",
  "solution": "söluşın",
  "approach": "ıproç",
  "algorithm": "algoritm",
  "recursion": "rikörjın",
  "iteration": "itereyşın",
  "loop": "lup",
  "condition": "kındişın",
  "statement": "steytmınt",
  "expression": "ikspireşın",
  "operator": "opereytor",
  "operand": "operand",

  // Data structures
  "linked": "linkd",
  "doubly": "dablı",
  "circular": "sörkyulır",
  "balanced": "belınsd",
  "binary search tree": "baynıri sörç tri",
  "AVL": "ey vi el",
  "red-black": "red blek",

  // Common words in problems
  "two sum": "tu sam",
  "three sum": "tri sam",
  "palindrome": "pelindrom",
  "anagram": "enegram",
  "substring": "sabstring",
  "subarray": "saberey",
  "subsequence": "sabsikvıns",
  "permutation": "pörmyuteyşın",
  "combination": "kombıneyşın",
  "valid": "velid",
  "invalid": "invelid",
  "parentheses": "perentisiz",
  "bracket": "brekıt",
  "brace": "breys",

  // Test related
  "test": "test",
  "case": "keys",
  "pass": "pas",
  "fail": "feyl",
  "error": "erör",
  "exception": "iksepşın",
  "debug": "dibag",
  "breakpoint": "breykpoynt",
  "console": "konsol",
  "log": "log",
  "print": "print",

  // Common abbreviations
  "API": "ey pi ay",
  "URL": "yu ar el",
  "JSON": "cey son",
  "XML": "eks em el",
  "HTML": "eyç ti em el",
  "CSS": "si es es",
  "SQL": "es kyu el",
  "REST": "rest",
  "CRUD": "krad",
  "MVC": "em vi si",
  "OOP": "o o pi",
  "DRY": "dray",
  "SOLID": "solid",
  "KISS": "kis",
  "YAGNI": "yagni",

  // Framework/Library names
  "React": "riekt",
  "Vue": "vyu",
  "Angular": "engyulır",
  "Node": "nod",
  "Express": "ikspres",
  "Django": "cengo",
  "Flask": "flask",
  "Spring": "sıpring",
  "Rails": "reylz",

  // Common English words in tech
  "click": "klik",
  "drag": "dreg",
  "drop": "drop",
  "push": "puş",
  "pop": "pop",
  "shift": "şift",
  "unshift": "anşift",
  "splice": "sıplayş",
  "slice": "sılays",
  "split": "sıplit",
  "join": "coyn",
  "filter": "filtır",
  "reduce": "ridyus",
  "find": "faynd",
  "includes": "inkluds",
  "indexOf": "indeks of",
  "charAt": "ker et",
  "substring": "sabsıtring",
  "toLowerCase": "tu lovır keys",
  "toUpperCase": "tu apır keys",
};

/**
 * Metindeki İngilizce terimleri Türkçe telaffuzlarıyla değiştirir
 */
export function applyPronunciationGuide(text: string): string {
  let processedText = text;

  // Önce uzun terimleri değiştir (birleşik kelimeler)
  const sortedTerms = Object.keys(pronunciationGuide).sort((a, b) => b.length - a.length);

  for (const term of sortedTerms) {
    const pronunciation = pronunciationGuide[term as keyof typeof pronunciationGuide];

    // Case-insensitive regex ile değiştirme
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    processedText = processedText.replace(regex, (match) => {
      // Orijinal case'i koru
      if (match[0] === match[0].toUpperCase()) {
        return pronunciation.charAt(0).toUpperCase() + pronunciation.slice(1);
      }
      return pronunciation;
    });
  }

  return processedText;
}

/**
 * Kod içindeki değişken isimlerini telaffuz edilebilir hale getirir
 */
export function makeVariableNamesPronunciable(code: string): string {
  // camelCase'i ayır: targetSum -> target Sum
  let processed = code.replace(/([a-z])([A-Z])/g, '$1 $2');

  // snake_case'i ayır: max_value -> max value
  processed = processed.replace(/_/g, ' ');

  // Sayıları telaffuz et
  processed = processed.replace(/\b0\b/g, 'sıfır');
  processed = processed.replace(/\b1\b/g, 'bir');
  processed = processed.replace(/\b2\b/g, 'iki');
  processed = processed.replace(/\b3\b/g, 'üç');
  processed = processed.replace(/\b4\b/g, 'dört');
  processed = processed.replace(/\b5\b/g, 'beş');

  // Telaffuz rehberini uygula
  return applyPronunciationGuide(processed);
}

/**
 * Problem açıklamalarını TTS için optimize eder
 */
export function optimizeForTTS(text: string): string {
  // Backtick'li kod bloklarını temizle ve doğal dile çevir
  text = text.replace(/`([^`]+)`/g, (match, code) => {
    // Değişken isimlerini doğal dile çevir
    const processed = makeVariableNamesPronunciable(code);
    // = işaretini "eşittir" olarak değiştir
    return processed.replace(/=/g, 'eşittir');
  });

  // Array syntax'ını doğal dile çevir - köşeli parantezleri kaldır
  text = text.replace(/\[([^\]]+)\]/g, (match, content) => {
    // Sadece sayı dizilerini çevir
    if (/^[\d,\s]+$/.test(content)) {
      const numbers = content.split(',').map(n => n.trim());
      if (numbers.length === 1) {
        return numbers[0];
      } else if (numbers.length === 2) {
        return `${numbers[0]} ve ${numbers[1]}`;
      } else {
        const last = numbers.pop();
        return `${numbers.join(', ')} ve ${last} sayıları`;
      }
    }
    // Diğer durumlarda köşeli parantezi kaldır
    return content;
  });

  // Değişken atamalarını düzelt
  text = text.replace(/(\w+)\s*=\s*(\d+)/g, (match, varName, value) => {
    const varPronounced = makeVariableNamesPronunciable(varName);
    return `${varPronounced} ${value} olsun`;
  });

  // Array indexlerini doğal dile çevir
  text = text.replace(/(\w+)\[(\d+)\]/g, (match, arr, index) => {
    const arrName = makeVariableNamesPronunciable(arr);
    const indexNum = parseInt(index);
    if (indexNum === 0) return `${arrName} dizisinin ilk elemanı`;
    else if (indexNum === 1) return `${arrName} dizisinin ikinci elemanı`;
    else return `${arrName} dizisinin ${index}. elemanı`;
  });

  // Matematiksel ifadeleri çevir
  text = text.replace(/O\(([^)]+)\)/g, 'o $1');
  text = text.replace(/n\^2/g, 'n kare');
  text = text.replace(/n\^3/g, 'n küp');
  text = text.replace(/log n/gi, 'log n');
  text = text.replace(/n log n/gi, 'n log n');

  // + işaretini "artı" olarak değiştir
  text = text.replace(/(\d+)\s*\+\s*(\d+)/g, '$1 artı $2');

  // = işaretini toplam sonuçlarında düzelt
  text = text.replace(/(\d+\s+artı\s+\d+)\s*=\s*(\d+)/g, '$1, toplam $2 eder');

  // Genel telaffuz rehberini uygula
  return applyPronunciationGuide(text);
}
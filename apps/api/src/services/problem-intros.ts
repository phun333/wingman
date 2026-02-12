/**
 * Pre-defined intro texts for each problem
 * These will be converted to audio once and cached
 */

export const problemIntros: Record<string, string> = {
  "two-sum": "Bugün Two Sum problemi üzerinde çalışacağız. Elimizde bir sayı dizisi ve hedef bir toplam var. Bu dizideki hangi iki sayının toplamı hedef değeri veriyor, onu bulmamız gerekiyor. Örneğin, 2, 7, 11 ve 15 sayıları ve hedef toplam 9 verildiğinde, 2 artı 7 toplam 9 eder, yani ilk iki elemanın indekslerini döndürmeliyiz. Anlaşıldı mı? Nasıl yaklaşmayı düşünüyorsun?",

  "valid-parentheses": "Valid Parentheses problemi üzerinde çalışacağız. Sadece parantezlerden oluşan bir string veriliyor. Her açılan parantezin doğru sırada kapandığını kontrol etmemiz gerekiyor. Örneğin, açılış parantezi, köşeli parantez, süslü parantez gibi. Hepsinin doğru eşleşip eşleşmediğini bulmalıyız. Nasıl bir yaklaşım düşünüyorsun?",

  "merge-two-sorted-lists": "Merge Two Sorted Lists problemi. İki tane sıralı bağlı liste veriliyor. Bunları birleştirip tek bir sıralı liste oluşturmamız gerekiyor. Her iki listenin elemanlarını karşılaştırarak yeni listeyi oluşturacağız. Bağlı liste yapısına aşina mısın? Nasıl başlamak istersin?",

  "best-time-to-buy-and-sell-stock": "Best Time to Buy and Sell Stock problemi. Bir hisse senedinin günlük fiyatları veriliyor. Bir kez alıp bir kez satarak maksimum karı bulmamız gerekiyor. Tabii ki satış, alımdan sonra olmalı. Örneğin fiyatlar 7, 1, 5, 3, 6, 4 ise, 1'de alıp 6'da satarsak maksimum 5 kar ederiz. Yaklaşımın ne olurdu?",

  "valid-palindrome": "Valid Palindrome problemi üzerinde çalışacağız. Bir string'in palindrom olup olmadığını kontrol edeceğiz. Palindrom, baştan ve sondan okunduğunda aynı olan kelimedir. Büyük küçük harf ve alfa-numerik olmayan karakterleri göz ardı edeceğiz. Nasıl bir algoritma kurardın?",

  "invert-binary-tree": "Invert Binary Tree problemi. Bir ikili ağacı ters çevirmemiz gerekiyor. Yani her düğümün sol ve sağ çocuklarını yer değiştireceğiz. Bu işlemi tüm ağaç boyunca yapacağız. İkili ağaç yapısına hakimsin değil mi? Hangi yaklaşımı tercih ederdin?",

  "maximum-depth-of-binary-tree": "Maximum Depth of Binary Tree problemi. Bir ikili ağacın maksimum derinliğini bulmamız gerekiyor. Kökten en uzak yaprağa olan mesafe. Recursive mi iterative mi yaklaşmayı tercih edersin?",

  "single-number": "Single Number problemi. Bir dizide her eleman iki kez geçiyor, sadece bir tanesi tek. O tek elemanı bulmamız gerekiyor. Extra alan kullanmadan çözebilir misin? İpucu: XOR operatörünü düşün.",

  "linked-list-cycle": "Linked List Cycle problemi. Bir bağlı listede döngü olup olmadığını tespit etmemiz gerekiyor. Floyd'un kaplumbağa ve tavşan algoritmasını biliyor musun? Yoksa farklı bir yaklaşım mı düşünüyorsun?",

  "reverse-linked-list": "Reverse Linked List problemi. Bir bağlı listeyi tersine çevirmemiz gerekiyor. İterative veya recursive olarak çözebiliriz. Hangisini tercih edersin?",

  "contains-duplicate": "Contains Duplicate problemi. Bir dizide tekrarlanan eleman olup olmadığını kontrol edeceğiz. Hangi veri yapısı bu iş için uygun olur?",

  "maximum-subarray": "Maximum Subarray problemi. Bir dizideki en büyük toplamı veren alt diziyi bulacağız. Kadane algoritmasını biliyor musun?",

  "climbing-stairs": "Climbing Stairs problemi. Merdiveni bir veya iki basamak atlayarak çıkabiliyoruz. N basamaklı merdiveni kaç farklı şekilde çıkabiliriz? Dynamic programming yaklaşımı düşünebilir misin?",

  "min-stack": "Min Stack problemi. Normal stack operasyonlarının yanında minimum elemanı da sabit zamanda döndüren bir stack tasarlayacağız. Nasıl bir yapı kurardın?",

  "lru-cache": "LRU Cache problemi. En az kullanılan elemanı çıkaran bir cache sistemi tasarlayacağız. Hem get hem put operasyonları sabit zamanda çalışmalı. Hangi veri yapılarını kullanırdın?",

  "number-of-islands": "Number of Islands problemi. Grid üzerindeki ada sayısını bulacağız. Birler kara, sıfırlar denizi temsil ediyor. DFS mi BFS mi kullanırdın?",

  "course-schedule": "Course Schedule problemi. Dersleri ve önkoşulları veriliyor. Tüm dersleri alabilir miyiz? Döngü kontrolü yapmalıyız. Graph teorisine aşina mısın?",

  "word-search": "Word Search problemi. Grid içinde verilen kelimeyi arayacağız. Backtracking kullanmamız gerekiyor. Nasıl yaklaşırdın?",

  "coin-change": "Coin Change problemi. Verilen para birimlerini kullanarak hedef miktarı oluşturmak için minimum coin sayısını bulacağız. Dynamic programming ile çözelim mi?",

  "house-robber": "House Robber problemi. Ardışık evleri soyamayacak şekilde maksimum parayı nasıl toplarız? Dynamic programming yaklaşımını düşünelim.",

  "longest-common-subsequence": "Longest Common Subsequence problemi. İki string'in en uzun ortak alt dizisini bulacağız. DP tablosu kurmayı deneyelim mi?",

  "reverse-string": "Reverse String problemi üzerinde çalışacağız. Verilen bir metni tersine çevirmemiz gerekiyor. Basit görünen bu problem, aslında farklı yaklaşımlar ve optimizasyonlar içerebilir. Örneğin, merhaba kelimesini tersine çevirdiğimizde abahrem elde ederiz. In-place çözüm mü yoksa yeni bir string mi oluşturacaksın? İki pointer tekniği kullanmayı düşündün mü? Ya da belki built-in fonksiyonları mı kullanmayı planlıyorsun? Farklı dillerde farklı yaklaşımlar olabilir. String'in immutable olduğu dillerde nasıl bir yol izlersin? Karakterleri swap ederken nelere dikkat etmeliyiz? Unicode karakterler veya emoji'ler varsa bunları nasıl handle ederiz? Hadi başlayalım, nasıl bir algoritma kurardın?",

  // Default for any problem not in the list
  "default": "Bu problem üzerinde çalışacağız. Problemi birlikte inceleyelim. İlk olarak ne yapman gerektiğini düşünüyorsun? Hangi veri yapısını kullanmayı planlıyorsun?"
};

/**
 * Get intro text for a problem.
 * First checks hardcoded intros, then generates a dynamic one from problem data.
 */
export function getProblemIntro(problemSlug: string, problemData?: { title?: string; description?: string; difficulty?: string; relatedTopics?: string[] }): string {
  // Normalize the slug (lowercase, replace spaces with dashes)
  const normalizedSlug = problemSlug.toLowerCase().replace(/\s+/g, '-');

  // Check hardcoded intros first
  const hardcoded = problemIntros[normalizedSlug];
  if (hardcoded) {
    return hardcoded;
  }

  // Generate dynamic intro from problem data if available
  if (problemData?.title && problemData?.description) {
    return generateDynamicIntro(problemData);
  }

  return problemIntros["default"] ?? "Bu problem üzerinde çalışacağız. Birlikte inceleyelim. Nasıl yaklaşmayı düşünüyorsun?";
}

/**
 * Generate a natural intro text from problem metadata.
 * Keeps it conversational — no code syntax, no brackets.
 */
function generateDynamicIntro(problem: { title?: string; description?: string; difficulty?: string; relatedTopics?: string[] }): string {
  const difficultyLabels: Record<string, string> = {
    easy: "temel seviyede",
    medium: "orta seviyede",
    hard: "ileri seviyede",
  };
  const diffLabel = difficultyLabels[problem.difficulty ?? "medium"] ?? "orta seviyede";

  // Extract first meaningful sentence from description (strip markdown/html)
  const cleanDesc = (problem.description ?? "")
    .replace(/```[\s\S]*?```/g, "")       // remove code blocks
    .replace(/`[^`]*`/g, "")              // remove inline code
    .replace(/\*\*([^*]+)\*\*/g, "$1")    // bold → plain
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text
    .replace(/<[^>]+>/g, "")              // strip HTML tags
    .replace(/\n+/g, " ")                 // newlines → spaces
    .trim();

  // Take first ~200 chars as a summary
  const summary = cleanDesc.length > 200 ? cleanDesc.substring(0, 200).replace(/\s\S*$/, "") + "..." : cleanDesc;

  const topicHint = problem.relatedTopics?.length
    ? ` Bu problemde ${problem.relatedTopics.slice(0, 2).join(" ve ")} konularına hakim olman faydalı olacak.`
    : "";

  return `Bugün ${problem.title} problemi üzerinde çalışacağız. Bu ${diffLabel} bir soru. ${summary}${topicHint} Nasıl yaklaşmayı düşünüyorsun?`;
}

/**
 * Generate intro audio for a problem using fal.ai TTS
 */
export async function generateIntroAudio(
  problemSlug: string,
  falClient: any
): Promise<{ audio: ArrayBuffer; text: string }> {
  const text = getProblemIntro(problemSlug);

  try {
    // Use fal.ai TTS to generate audio
    const result = await falClient.subscribe("freya-mypsdi253hbk/freya-tts", {
      input: {
        input: text,
        response_format: "wav",
        speed: 1.0,
      },
      path: "/generate",
    });

    if (result.data?.audio?.url) {
      // Fetch the audio data
      const audioResponse = await fetch(result.data.audio.url);
      const audioBuffer = await audioResponse.arrayBuffer();

      return {
        audio: audioBuffer,
        text: text
      };
    }

    throw new Error("Failed to generate audio");
  } catch (error) {
    console.error("Error generating intro audio:", error);
    throw error;
  }
}
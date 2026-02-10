import { internalMutation } from "./_generated/server";

interface Problem {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  starterCode?: {
    javascript?: string;
    python?: string;
    typescript?: string;
  };
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
  timeComplexity?: string;
  spaceComplexity?: string;
}

const PROBLEMS: Problem[] = [
  // ─── Easy ────────────────────────────────────────────
  {
    title: "Two Sum",
    description: `Bir tam sayı dizisi \`nums\` ve bir \`target\` hedef değer verildiğinde, toplamları hedef değere eşit olan iki sayının indekslerini döndürün.

Her girdinin **tam olarak bir çözümü** olduğunu varsayabilirsiniz ve aynı elemanı iki kez kullanamazsınız.

**Örnek:**
\`\`\`
Girdi: nums = [2,7,11,15], target = 9
Çıktı: [0,1]
Açıklama: nums[0] + nums[1] = 2 + 7 = 9
\`\`\``,
    difficulty: "easy",
    category: "array",
    starterCode: {
      javascript: `function twoSum(nums, target) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def two_sum(nums, target):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function twoSum(nums: number[], target: number): number[] {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", isHidden: false },
      { input: "[3,2,4], 6", expectedOutput: "[1,2]", isHidden: false },
      { input: "[3,3], 6", expectedOutput: "[0,1]", isHidden: true },
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
  },
  {
    title: "Reverse String",
    description: `Bir karakter dizisi \`s\` verildiğinde, diziyi yerinde (\`in-place\`) tersine çevirin.

Bunu O(1) ekstra bellek kullanarak yapmalısınız.

**Örnek:**
\`\`\`
Girdi: s = ["h","e","l","l","o"]
Çıktı: ["o","l","l","e","h"]
\`\`\``,
    difficulty: "easy",
    category: "string",
    starterCode: {
      javascript: `function reverseString(s) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def reverse_string(s):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function reverseString(s: string[]): void {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: '["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false },
      { input: '["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: false },
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
  },
  {
    title: "Valid Palindrome",
    description: `Bir string \`s\` verildiğinde, sadece alfanümerik karakterleri dikkate alarak ve büyük/küçük harf farkını görmezden gelerek, palindrom olup olmadığını belirleyin.

**Örnek:**
\`\`\`
Girdi: s = "A man, a plan, a canal: Panama"
Çıktı: true
Açıklama: "amanaplanacanalpanama" palindromdur.
\`\`\``,
    difficulty: "easy",
    category: "string",
    starterCode: {
      javascript: `function isPalindrome(s) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def is_palindrome(s):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function isPalindrome(s: string): boolean {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true", isHidden: false },
      { input: '"race a car"', expectedOutput: "false", isHidden: false },
      { input: '" "', expectedOutput: "true", isHidden: true },
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
  },
  {
    title: "FizzBuzz",
    description: `1'den \`n\`'e kadar olan sayılar için:
- 3'e bölünebiliyorsa \`"Fizz"\`
- 5'e bölünebiliyorsa \`"Buzz"\`
- Hem 3'e hem 5'e bölünebiliyorsa \`"FizzBuzz"\`
- Hiçbiri değilse sayının string hali

döndürün.

**Örnek:**
\`\`\`
Girdi: n = 5
Çıktı: ["1","2","Fizz","4","Buzz"]
\`\`\``,
    difficulty: "easy",
    category: "math",
    starterCode: {
      javascript: `function fizzBuzz(n) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def fizz_buzz(n):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function fizzBuzz(n: number): string[] {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: "3", expectedOutput: '["1","2","Fizz"]', isHidden: false },
      { input: "5", expectedOutput: '["1","2","Fizz","4","Buzz"]', isHidden: false },
      { input: "15", expectedOutput: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]', isHidden: true },
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
  },
  {
    title: "Maximum Subarray",
    description: `Bir tam sayı dizisi \`nums\` verildiğinde, en büyük toplama sahip alt diziyi (subarray) bulun ve toplamını döndürün.

Alt dizi, dizinin **ardışık** bir bölümüdür.

**Örnek:**
\`\`\`
Girdi: nums = [-2,1,-3,4,-1,2,1,-5,4]
Çıktı: 6
Açıklama: [4,-1,2,1] alt dizisinin toplamı 6'dır.
\`\`\``,
    difficulty: "easy",
    category: "array",
    starterCode: {
      javascript: `function maxSubArray(nums) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def max_sub_array(nums):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function maxSubArray(nums: number[]): number {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: "[-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isHidden: false },
      { input: "[1]", expectedOutput: "1", isHidden: false },
      { input: "[5,4,-1,7,8]", expectedOutput: "23", isHidden: true },
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
  },

  // ─── Medium ──────────────────────────────────────────
  {
    title: "Valid Parentheses",
    description: `Sadece \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` ve \`']'\` karakterlerini içeren bir string verildiğinde, stringin geçerli olup olmadığını belirleyin.

Geçerli olması için:
1. Açık parantezler aynı türde kapatılmalıdır.
2. Açık parantezler doğru sırada kapatılmalıdır.

**Örnek:**
\`\`\`
Girdi: s = "()[]{}"
Çıktı: true
\`\`\``,
    difficulty: "medium",
    category: "stack",
    starterCode: {
      javascript: `function isValid(s) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def is_valid(s):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function isValid(s: string): boolean {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: '"()"', expectedOutput: "true", isHidden: false },
      { input: '"()[]{}"', expectedOutput: "true", isHidden: false },
      { input: '"(]"', expectedOutput: "false", isHidden: false },
      { input: '"([)]"', expectedOutput: "false", isHidden: true },
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
  },
  {
    title: "LRU Cache",
    description: `LRU (Least Recently Used) cache mekanizması tasarlayın. \`get\` ve \`put\` operasyonlarını desteklemelidir.

- \`get(key)\` — Anahtar varsa değeri döndürür, yoksa -1 döndürür.
- \`put(key, value)\` — Anahtarın değerini günceller veya ekler. Kapasite aşılırsa en az kullanılan öğeyi siler.

Her iki operasyon da **O(1)** zaman karmaşıklığında çalışmalıdır.

**Örnek:**
\`\`\`
LRUCache cache = new LRUCache(2);
cache.put(1, 1);
cache.put(2, 2);
cache.get(1);       // 1 döner
cache.put(3, 3);    // 2 silinir
cache.get(2);       // -1 döner
\`\`\``,
    difficulty: "medium",
    category: "design",
    starterCode: {
      javascript: `class LRUCache {\n  constructor(capacity) {\n    // Kodunuzu buraya yazın\n  }\n\n  get(key) {\n    \n  }\n\n  put(key, value) {\n    \n  }\n}`,
      typescript: `class LRUCache {\n  constructor(private capacity: number) {\n    // Kodunuzu buraya yazın\n  }\n\n  get(key: number): number {\n    \n  }\n\n  put(key: number, value: number): void {\n    \n  }\n}`,
    },
    testCases: [
      { input: "LRUCache(2), put(1,1), put(2,2), get(1), put(3,3), get(2)", expectedOutput: "1, -1", isHidden: false },
    ],
    timeComplexity: "O(1)",
    spaceComplexity: "O(capacity)",
  },
  {
    title: "Binary Search",
    description: `Sıralı bir tam sayı dizisi \`nums\` ve bir \`target\` hedef değer verildiğinde, \`target\`'ın dizideki indeksini döndürün. Eğer yoksa \`-1\` döndürün.

Algoritmanız **O(log n)** zaman karmaşıklığında olmalıdır.

**Örnek:**
\`\`\`
Girdi: nums = [-1,0,3,5,9,12], target = 9
Çıktı: 4
\`\`\``,
    difficulty: "medium",
    category: "search",
    starterCode: {
      javascript: `function search(nums, target) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def search(nums, target):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function search(nums: number[], target: number): number {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: "[-1,0,3,5,9,12], 9", expectedOutput: "4", isHidden: false },
      { input: "[-1,0,3,5,9,12], 2", expectedOutput: "-1", isHidden: false },
      { input: "[5], 5", expectedOutput: "0", isHidden: true },
    ],
    timeComplexity: "O(log n)",
    spaceComplexity: "O(1)",
  },
  {
    title: "Merge Intervals",
    description: `Aralıklar dizisi \`intervals\` verildiğinde (her biri \`[start, end]\`), örtüşen tüm aralıkları birleştirin ve örtüşmeyen aralıkları döndürün.

**Örnek:**
\`\`\`
Girdi: intervals = [[1,3],[2,6],[8,10],[15,18]]
Çıktı: [[1,6],[8,10],[15,18]]
Açıklama: [1,3] ve [2,6] örtüşüyor → [1,6] olarak birleşir.
\`\`\``,
    difficulty: "medium",
    category: "array",
    starterCode: {
      javascript: `function merge(intervals) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def merge(intervals):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function merge(intervals: number[][]): number[][] {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: "[[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]", isHidden: false },
      { input: "[[1,4],[4,5]]", expectedOutput: "[[1,5]]", isHidden: false },
      { input: "[[1,4],[0,4]]", expectedOutput: "[[0,4]]", isHidden: true },
    ],
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
  },
  {
    title: "Group Anagrams",
    description: `Bir string dizisi \`strs\` verildiğinde, anagramları gruplandırın. Herhangi bir sırada döndürebilirsiniz.

Anagram, başka bir kelimenin harflerini yeniden düzenleyerek oluşturulan kelimedir.

**Örnek:**
\`\`\`
Girdi: strs = ["eat","tea","tan","ate","nat","bat"]
Çıktı: [["bat"],["nat","tan"],["ate","eat","tea"]]
\`\`\``,
    difficulty: "medium",
    category: "hash",
    starterCode: {
      javascript: `function groupAnagrams(strs) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def group_anagrams(strs):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function groupAnagrams(strs: string[]): string[][] {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expectedOutput: '[["bat"],["nat","tan"],["ate","eat","tea"]]', isHidden: false },
      { input: '[""]', expectedOutput: '[[""]]', isHidden: false },
      { input: '["a"]', expectedOutput: '[["a"]]', isHidden: true },
    ],
    timeComplexity: "O(n * k log k)",
    spaceComplexity: "O(n * k)",
  },

  // ─── Hard ────────────────────────────────────────────
  {
    title: "Median of Two Sorted Arrays",
    description: `İki sıralı dizi \`nums1\` ve \`nums2\` verildiğinde, birleşik dizinin medyanını döndürün.

Algoritmanız **O(log(m+n))** karmaşıklığında olmalıdır.

**Örnek:**
\`\`\`
Girdi: nums1 = [1,3], nums2 = [2]
Çıktı: 2.0
Açıklama: Birleşik dizi = [1,2,3], medyan 2.0
\`\`\``,
    difficulty: "hard",
    category: "array",
    starterCode: {
      javascript: `function findMedianSortedArrays(nums1, nums2) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def find_median_sorted_arrays(nums1, nums2):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function findMedianSortedArrays(nums1: number[], nums2: number[]): number {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: "[1,3], [2]", expectedOutput: "2.0", isHidden: false },
      { input: "[1,2], [3,4]", expectedOutput: "2.5", isHidden: false },
      { input: "[0,0], [0,0]", expectedOutput: "0.0", isHidden: true },
    ],
    timeComplexity: "O(log(min(m,n)))",
    spaceComplexity: "O(1)",
  },
  {
    title: "Regular Expression Matching",
    description: `Bir girdi stringi \`s\` ve bir pattern \`p\` verildiğinde, \`'.'\` ve \`'*'\` desteğiyle düzenli ifade eşleştirmesi yapın.

- \`'.'\` herhangi bir tek karakterle eşleşir.
- \`'*'\` önceki elemanın sıfır veya daha fazla tekrarıyla eşleşir.

Eşleştirme **tüm** stringi kapsamalıdır (kısmi değil).

**Örnek:**
\`\`\`
Girdi: s = "aa", p = "a*"
Çıktı: true
\`\`\``,
    difficulty: "hard",
    category: "string",
    starterCode: {
      javascript: `function isMatch(s, p) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def is_match(s, p):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function isMatch(s: string, p: string): boolean {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: '"aa", "a"', expectedOutput: "false", isHidden: false },
      { input: '"aa", "a*"', expectedOutput: "true", isHidden: false },
      { input: '"ab", ".*"', expectedOutput: "true", isHidden: false },
      { input: '"aab", "c*a*b"', expectedOutput: "true", isHidden: true },
    ],
    timeComplexity: "O(m * n)",
    spaceComplexity: "O(m * n)",
  },
  {
    title: "Merge K Sorted Lists",
    description: `\`k\` adet sıralı bağlı liste verildiğinde, hepsini tek bir sıralı bağlı liste olarak birleştirin ve döndürün.

**Örnek:**
\`\`\`
Girdi: lists = [[1,4,5],[1,3,4],[2,6]]
Çıktı: [1,1,2,3,4,4,5,6]
\`\`\``,
    difficulty: "hard",
    category: "linked-list",
    starterCode: {
      javascript: `function mergeKLists(lists) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def merge_k_lists(lists):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function mergeKLists(lists: (ListNode | null)[]): ListNode | null {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: "[[1,4,5],[1,3,4],[2,6]]", expectedOutput: "[1,1,2,3,4,4,5,6]", isHidden: false },
      { input: "[]", expectedOutput: "[]", isHidden: false },
      { input: "[[]]", expectedOutput: "[]", isHidden: true },
    ],
    timeComplexity: "O(N log k)",
    spaceComplexity: "O(k)",
  },
  {
    title: "Serialize and Deserialize Binary Tree",
    description: `Bir ikili ağacı (binary tree) serialize ve deserialize eden bir algoritma tasarlayın.

Serialize: Ağacı bir stringe dönüştürün.
Deserialize: Stringden ağacı geri oluşturun.

Format kısıtlaması yoktur — sadece iki fonksiyonun birlikte doğru çalışması gerekir.

**Örnek:**
\`\`\`
Girdi: root = [1,2,3,null,null,4,5]
Çıktı: [1,2,3,null,null,4,5]
\`\`\``,
    difficulty: "hard",
    category: "tree",
    starterCode: {
      javascript: `function serialize(root) {\n  // Kodunuzu buraya yazın\n}\n\nfunction deserialize(data) {\n  // Kodunuzu buraya yazın\n}`,
      typescript: `function serialize(root: TreeNode | null): string {\n  // Kodunuzu buraya yazın\n}\n\nfunction deserialize(data: string): TreeNode | null {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: "[1,2,3,null,null,4,5]", expectedOutput: "[1,2,3,null,null,4,5]", isHidden: false },
      { input: "[]", expectedOutput: "[]", isHidden: false },
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
  },
  {
    title: "Longest Increasing Subsequence",
    description: `Bir tam sayı dizisi \`nums\` verildiğinde, en uzun kesin artan alt dizinin (subsequence) uzunluğunu döndürün.

Alt dizi, orijinal diziden bazı elemanlar çıkarılarak (veya çıkarılmadan) oluşturulan ve kalan elemanların sırasını koruyan bir dizidir.

**Örnek:**
\`\`\`
Girdi: nums = [10,9,2,5,3,7,101,18]
Çıktı: 4
Açıklama: En uzun artan alt dizi [2,3,7,101] olup uzunluğu 4'tür.
\`\`\``,
    difficulty: "hard",
    category: "dp",
    starterCode: {
      javascript: `function lengthOfLIS(nums) {\n  // Kodunuzu buraya yazın\n}`,
      python: `def length_of_lis(nums):\n    # Kodunuzu buraya yazın\n    pass`,
      typescript: `function lengthOfLIS(nums: number[]): number {\n  // Kodunuzu buraya yazın\n}`,
    },
    testCases: [
      { input: "[10,9,2,5,3,7,101,18]", expectedOutput: "4", isHidden: false },
      { input: "[0,1,0,3,2,3]", expectedOutput: "4", isHidden: false },
      { input: "[7,7,7,7,7,7,7]", expectedOutput: "1", isHidden: true },
    ],
    timeComplexity: "O(n log n)",
    spaceComplexity: "O(n)",
  },
];

export const seedProblems = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("problems").first();
    if (existing) {
      console.log("Problems already seeded, skipping.");
      return { seeded: 0 };
    }

    for (const problem of PROBLEMS) {
      await ctx.db.insert("problems", {
        ...problem,
        createdAt: Date.now(),
      });
    }

    console.log(`Seeded ${PROBLEMS.length} problems.`);
    return { seeded: PROBLEMS.length };
  },
});

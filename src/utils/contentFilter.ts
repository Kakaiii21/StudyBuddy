import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
  DataSet,
  pattern,
} from "obscenity";

const filipinoDataset = new DataSet<{ originalWord: string }>()
  .addAll(englishDataset)
  .addPhrase((p) =>
    p
      .setMetadata({ originalWord: "putangina" })
      .addPattern(pattern`putangina`)
      .addPattern(pattern`putang ina`)
      
  )
  .addPhrase((p) => p.setMetadata({ originalWord: "tangina" }).addPattern(pattern`|tangina|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "gago" }).addPattern(pattern`|gago|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "pakyu" }).addPattern(pattern`|pakyu|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "bobo" }).addPattern(pattern`bobo`).addPattern(pattern`8080`))
  .addPhrase((p) => p.setMetadata({ originalWord: "puki" }).addPattern(pattern`|puki|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "tite" }).addPattern(pattern`|tite|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "tanga" }).addPattern(pattern`|tanga|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "dede" }).addPattern(pattern`|dede|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "suso" }).addPattern(pattern`|suso|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "chupa" }).addPattern(pattern`|chupa|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "glokglok" }).addPattern(pattern`|glokglok|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "kantot" }).addPattern(pattern`|kantot|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "pakantot" }).addPattern(pattern`|pakantot|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "bbc" }).addPattern(pattern`|bbc|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "BigBlackCock" }).addPattern(pattern`|BigBlackCock|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "tamod" }).addPattern(pattern`|tamod|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "gagu" }).addPattern(pattern`|gagu|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "toytoy" }).addPattern(pattern`|toytoy|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "malandi" }).addPattern(pattern`|malandi|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "ulol" }).addPattern(pattern`|ulol|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "malibog" }).addPattern(pattern`|malibog|`))
  .addPhrase((p) => p.setMetadata({ originalWord: "pekpek" }).addPattern(pattern`|pekpek|`));
  // add more the same way

const matcher = new RegExpMatcher({
  ...filipinoDataset.build(),
  ...englishRecommendedTransformers,
});
// Number/symbol slang the word matcher can't see, checked on the raw text
const EXTRA_PATTERNS: RegExp[] = [
  /(?<!\d)8\s*0\s*8\s*0(?!\d)/,   // 8080, 80 80, 8 0 8 0 ("bobo")
]

export const containsBadWords = (text: string): boolean =>
  matcher.hasMatch(text) || EXTRA_PATTERNS.some((r) => r.test(text))

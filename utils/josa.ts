const HANGUL_FIRST = 0xac00;
const HANGUL_LAST = 0xd7a3;
const JONGSEONG_COUNT = 28;
const JONGSEONG_RIEUL = 8;

// 앞 글자의 받침에 따라 '으로'/'로'를 고른다.
// 받침이 없거나(가기 → 가기로) ㄹ 받침이면(서울 → 서울로) '로', 그 밖의 받침이면
// (좋음 → 좋음으로) '으로'다.
// 한글이 아닌 글자로 끝나면 판단할 근거가 없으므로 짧은 쪽인 '로'를 쓴다.
export function withRo(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (Number.isNaN(code) || code < HANGUL_FIRST || code > HANGUL_LAST) return `${word}로`;
  const jongseong = (code - HANGUL_FIRST) % JONGSEONG_COUNT;
  const needsEu = jongseong !== 0 && jongseong !== JONGSEONG_RIEUL;
  return needsEu ? `${word}으로` : `${word}로`;
}

// TourAPI 운영시간(useTime)은 줄바꿈 없이 "[숙박]- 입실 14:00- 퇴실 11:00[물썰매장]10:00~…"처럼
// 붙어서 온다. 상세 화면에서 [구분] 제목 / "- " 항목 / "※" 안내를 각각 한 줄로 보여주려고
// 구분자 앞에 줄바꿈을 넣은 뒤 줄 종류를 나눈다.

export interface UseTimeLine {
  kind: 'header' | 'item' | 'text' | 'note';
  text: string;
}

export function toUseTimeLines(raw: string): UseTimeLine[] {
  const normalized = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\[([^\]\n]+)\]/g, '\n[$1]\n')
    // 글머리표는 하이픈 뒤에 숫자가 아닌 글자가 올 때만. 뒤쪽 공백도 제외해야 \s+가 덜 먹고
    // 공백을 글자로 보지 않는다. 앞에 공백이 없으면("14:00- 퇴실") 글머리표지만, " - "는
    // 범위일 수 있어서("09:00 - 18:00", "18:00 - 익일 02:00") 같은 줄에 "~" 범위가 이미
    // 나온 뒤("11:00~17:00 - 마지막 주문")에만 나눈다. 실제 데이터의 범위는 모두 "~"다.
    // 줄 맨 앞 "- "(<br>·[구분] 뒤)는 이미 줄 시작이라 나누지 않아도 항목이 된다.
    .replace(/(\s*)-\s+(?=[^\d\s])/g, (match, space: string, offset: number, text: string) =>
      space === '' || /~[^\n]*$/.test(text.slice(0, offset)) ? '\n- ' : match,
    )
    .replace(/※/g, '\n※');

  return normalized
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line): UseTimeLine => {
      const header = line.match(/^\[(.+)\]$/);
      if (header) return { kind: 'header', text: header[1].trim() };
      if (line.startsWith('- ')) return { kind: 'item', text: line.slice(2).trim() };
      if (line.startsWith('※')) return { kind: 'note', text: line };
      return { kind: 'text', text: line };
    });
}

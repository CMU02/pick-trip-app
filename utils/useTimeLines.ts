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
    // 글머리표는 "- " 뒤에 숫자가 아닌 글자가 올 때만 — "09:00 - 18:00"의 하이픈은 범위다.
    // 공백도 제외해야 "09:00  - 18:00"처럼 공백이 여러 개일 때 \s+가 덜 먹고 쪼개지 않는다.
    .replace(/-\s+(?=[^\d\s])/g, '\n- ')
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

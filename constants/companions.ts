import type { Companion, StyleOption } from '../types/companion';

// Ionicons에는 나이대(아이/어르신)를 구분하는 아이콘이 없어서, 인원 수로 시각적 위계만 준다
// (혼자→happy, 두 명→person, 가족 전체→people).
export const COMPANIONS: Companion[] = [
  {
    id: 'with_kids',
    label: '아이와 함께',
    icon: 'happy-outline',
    description: '아이가 즐길 수 있는 코스',
  },
  {
    id: 'with_parents',
    label: '부모님과 함께',
    icon: 'person-outline',
    description: '어르신도 편안한 여행',
  },
  {
    id: 'whole_family',
    label: '가족 전체',
    icon: 'people-outline',
    description: '온 가족이 함께하는 코스',
  },
];

export const STYLE_OPTIONS: StyleOption[] = [
  { id: 'less_walking', label: '걷기 적게' },
  { id: 'nature_focused', label: '자연 위주' },
  { id: 'experience_focused', label: '체험 위주' },
  { id: 'food_focused', label: '음식 위주' },
  { id: 'indoor_alternative', label: '실내 대안 필요' },
];

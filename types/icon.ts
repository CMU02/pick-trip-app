import type { Ionicons } from '@expo/vector-icons';

// 앱 전체에서 쓰는 아이콘은 @expo/vector-icons의 Ionicons 하나로 통일한다.
// (Ionicons.glyphMap의 키만 허용해서, 존재하지 않는 아이콘 이름을 쓰면 타입 에러로 잡힌다.)
export type IoniconName = keyof typeof Ionicons.glyphMap;

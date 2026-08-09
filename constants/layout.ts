// 하단 탭바는 화면 위에 떠 있어서(position: absolute) 콘텐츠 흐름에서 빠진다.
// 그래서 탭바가 가리는 만큼을 각 화면이 직접 여백으로 확보해야 한다.
// 여러 화면이 같은 수치를 알아야 하므로 한 곳에 둔다.
export const TAB_BAR_HEIGHT = 58; // 캡슐 높이
export const TAB_BAR_BOTTOM = 14; // 화면 하단에서 띄우는 거리
export const TAB_BAR_SIDE = 14; // 캡슐 좌우 여백

// 하단에 고정된 CTA 바를 탭바 위로 올릴 때 쓰는 높이
export const TAB_BAR_TOTAL = TAB_BAR_HEIGHT + TAB_BAR_BOTTOM;

// 스크롤 콘텐츠가 확보할 여백. 마지막 항목이 캡슐에 딱 붙지 않도록 조금 더 준다.
export const TAB_BAR_CLEARANCE = TAB_BAR_TOTAL + 12;

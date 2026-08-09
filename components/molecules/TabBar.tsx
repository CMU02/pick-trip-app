import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { TAB_BAR_BOTTOM, TAB_BAR_HEIGHT, TAB_BAR_SIDE } from '../../constants/layout';
import { FONT } from '../../constants/typography';

export type TabKey = 'home' | 'explore' | 'basket' | 'profile';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface Tab {
  key: TabKey;
  label: string;
  icon: IoniconName;
  iconInactive: IoniconName;
}

const TABS: Tab[] = [
  { key: 'home', label: '홈', icon: 'home', iconInactive: 'home-outline' },
  { key: 'explore', label: '탐색', icon: 'search', iconInactive: 'search-outline' },
  { key: 'basket', label: '바구니', icon: 'bookmark', iconInactive: 'bookmark-outline' },
  { key: 'profile', label: '내 정보', icon: 'person', iconInactive: 'person-outline' },
];

const EXPAND_DURATION = 260;
const FADE_DURATION = 200;
// 바구니 뱃지가 아이콘 오른쪽으로 10px 튀어나오므로, 그보다 넓게 띄워야 라벨과 겹치지 않는다.
const LABEL_GAP = 12;

interface TabBarProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
  basketCount: number;
}

// 흐름에서 빠져 콘텐츠 위에 뜬다. 스크롤하면 콘텐츠가 캡슐 뒤로 지나간다.
// 가려지는 만큼의 여백은 각 화면이 constants/layout.ts 값으로 확보한다.
const Bar = styled(View)`
  position: absolute;
  left: ${TAB_BAR_SIDE}px;
  right: ${TAB_BAR_SIDE}px;
  bottom: ${TAB_BAR_BOTTOM}px;
  height: ${TAB_BAR_HEIGHT}px;
  flex-direction: row;
  align-items: center;
  padding-horizontal: 6px;
  border-radius: 100px;
  background-color: ${COLORS.white};
  shadow-color: #000;
  shadow-opacity: 0.1;
  shadow-radius: 16px;
  shadow-offset: 0px 4px;
  elevation: 8;
`;

// flexGrow는 flex 아이템 본인에게 걸려야 폭이 바뀐다. 그래서 바깥이 Animated.View이고
// 터치 영역이 그 안에서 꽉 찬다.
const TabButton = styled(Animated.View)`
  flex-basis: 0px;
  height: 44px;
`;

const TabInner = styled(TouchableOpacity)`
  flex: 1;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  border-radius: 100px;
`;

// 배경색을 transparent ↔ hex로 보간하면 플랫폼별로 불안정해서,
// 캡슐을 따로 깔고 opacity만 애니메이션한다.
const Capsule = styled(Animated.View)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 100px;
  background-color: ${COLORS.coral50};
`;

const IconWrapper = styled(View)`
  position: relative;
`;

const CountBadge = styled(View)`
  position: absolute;
  top: -4px;
  right: -10px;
  background-color: ${COLORS.coral500};
  border-radius: 100px;
  min-width: 15px;
  padding-horizontal: 4px;
  align-items: center;
`;

const CountBadgeLabel = styled(Text)`
  font-size: 10px;
  font-family: ${FONT.bold};
  color: ${COLORS.white};
`;

const LabelBox = styled(Animated.View)`
  height: 16px;
  overflow: hidden;
`;

const Label = styled(Text)`
  font-size: 12px;
  font-family: ${FONT.semibold};
  line-height: 16px;
  color: ${COLORS.coral600};
`;

interface TabItemProps {
  tab: Tab;
  active: boolean;
  badgeCount: number;
  onPress: () => void;
}

function TabItem({ tab, active, badgeCount, onPress }: TabItemProps) {
  // 라벨 폭은 글자 수와 폰트에 따라 달라진다. 상수로 박아두면 폰트를 바꿀 때
  // 어긋나므로, 첫 렌더에서 자연 폭을 재고 그 값으로 애니메이션한다.
  const [labelWidth, setLabelWidth] = useState(0);
  const measured = labelWidth > 0;

  const growStyle = useAnimatedStyle(() => ({
    flexGrow: withTiming(active ? 1.75 : 1, { duration: EXPAND_DURATION }),
  }));

  const capsuleStyle = useAnimatedStyle(() => ({
    opacity: withTiming(active ? 1 : 0, { duration: FADE_DURATION }),
  }));

  const labelStyle = useAnimatedStyle(() => ({
    width: withTiming(active ? labelWidth : 0, { duration: EXPAND_DURATION }),
    marginLeft: withTiming(active ? LABEL_GAP : 0, { duration: EXPAND_DURATION }),
    opacity: withTiming(active ? 1 : 0, { duration: FADE_DURATION }),
  }));

  return (
    <TabButton style={growStyle}>
      <TabInner
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        accessibilityLabel={tab.label}
      >
        <Capsule style={capsuleStyle} />
        <IconWrapper>
          <Ionicons
            name={active ? tab.icon : tab.iconInactive}
            size={22}
            color={active ? COLORS.coral600 : COLORS.gray400}
          />
          {badgeCount > 0 && (
            <CountBadge>
              <CountBadgeLabel>{badgeCount}</CountBadgeLabel>
            </CountBadge>
          )}
        </IconWrapper>
        {/* 자연 폭을 재기 전 한 프레임은 투명하게 둔다. 안 그러면 비활성 탭 라벨이 깜빡인다. */}
        <LabelBox style={measured ? labelStyle : { opacity: 0 }}>
          {/* 폭을 고정하지 않으면 부모가 줄어드는 동안 Text가 다시 measure되어
              전환 중에 '바…'처럼 말줄임된다. 잰 폭으로 고정하면 그냥 잘린다. */}
          <Label
            numberOfLines={1}
            style={measured ? { width: labelWidth } : undefined}
            onLayout={(event) => {
              if (!measured) setLabelWidth(event.nativeEvent.layout.width);
            }}
          >
            {tab.label}
          </Label>
        </LabelBox>
      </TabInner>
    </TabButton>
  );
}

export function TabBar({ active, onChange, basketCount }: TabBarProps) {
  return (
    <Bar>
      {TABS.map((tab) => (
        <TabItem
          key={tab.key}
          tab={tab}
          active={active === tab.key}
          badgeCount={tab.key === 'basket' ? basketCount : 0}
          onPress={() => onChange(tab.key)}
        />
      ))}
    </Bar>
  );
}

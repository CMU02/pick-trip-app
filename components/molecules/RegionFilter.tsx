import { ScrollView, Text, TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { REGIONS } from '../../constants/regions';
import { FONT } from '../../constants/typography';

interface RegionFilterProps {
  // 지금 화면이 다루는 지역만 칩으로 보여준다 — 홈에서 지역을 좁혀 왔으면(예: 하동만)
  // 그 지역만, 아무것도 안 골랐으면(기본값) 3개 지역 전부 보여준다.
  regionIds: string[];
  // 지역 칩은 복수 선택(체크박스 방식) — "전체" 칩 없이, 지역 칩 3개를 모두 선택하면
  // 그 자체로 전체 보기가 된다.
  selectedRegionIds: string[];
  onToggleRegion: (id: string) => void;
}

const Chip = styled(TouchableOpacity)<{ $active: boolean }>`
  padding-vertical: 7px;
  padding-horizontal: 14px;
  border-radius: 100px;
  border-width: 1px;
  background-color: ${({ $active }) => ($active ? COLORS.coral500 : COLORS.white)};
  border-color: ${({ $active }) => ($active ? COLORS.coral500 : COLORS.gray200)};
`;

const ChipLabel = styled(Text)<{ $active: boolean }>`
  font-size: 13px;
  font-family: ${({ $active }) => ($active ? FONT.semibold : FONT.regular)};
  color: ${({ $active }) => ($active ? COLORS.white : COLORS.gray700)};
`;

export function RegionFilter({ regionIds, selectedRegionIds, onToggleRegion }: RegionFilterProps) {
  const regions = REGIONS.filter((region) => regionIds.includes(region.id));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 4 }}
    >
      {regions.map((region) => {
        const active = selectedRegionIds.includes(region.id);
        return (
          <Chip
            key={region.id}
            $active={active}
            onPress={() => onToggleRegion(region.id)}
            activeOpacity={0.8}
          >
            <ChipLabel $active={active}>{region.name}</ChipLabel>
          </Chip>
        );
      })}
    </ScrollView>
  );
}

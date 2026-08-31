import { Ionicons } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { CATEGORIES } from '../../constants/categories';
import { COLORS } from '../../constants/colors';
import { FONT } from '../../constants/typography';
import type { NearbyContentItem } from '../../types/nearbyContent';

interface NearbyContentCardProps {
  item: NearbyContentItem;
  onPress: () => void;
}

// 상세 화면 안의 보조 섹션이라 가로 스크롤 한 줄에 세 장 정도 걸리는 폭으로 작게 잡는다
// (ContentCard처럼 화면 폭 전체를 쓰는 목록 카드와는 쓰임이 다르다).
const CARD_WIDTH = 148;

const Card = styled(TouchableOpacity)`
  width: ${CARD_WIDTH}px;
  background-color: ${COLORS.white};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  overflow: hidden;
`;

const Thumbnail = styled(View)<{ $color: string }>`
  width: 100%;
  height: 92px;
  background-color: ${({ $color }) => `${$color}33`};
  align-items: center;
  justify-content: center;
`;

const ThumbnailImage = styled(Image)`
  width: 100%;
  height: 92px;
`;

const Body = styled(View)`
  padding: 8px 10px 10px;
`;

const Name = styled(Text)`
  font-size: 13px;
  font-family: ${FONT.semibold};
  color: ${COLORS.gray900};
  margin-bottom: 4px;
`;

const DistanceRow = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 3px;
`;

const DistanceText = styled(Text)`
  font-size: 11px;
  font-family: ${FONT.medium};
  color: ${COLORS.coral700};
`;

export function NearbyContentCard({ item, onPress }: NearbyContentCardProps) {
  const category = CATEGORIES.find((c) => c.id === item.category);
  const distanceLabel =
    item.durationMinutes != null
      ? `${item.distanceKm.toFixed(1)}km · 차로 ${item.durationMinutes}분`
      : `${item.distanceKm.toFixed(1)}km`;

  return (
    <Card onPress={onPress} activeOpacity={0.8}>
      {item.imageUrl ? (
        <ThumbnailImage source={{ uri: item.imageUrl }} resizeMode="cover" />
      ) : (
        <Thumbnail $color={category?.color ?? COLORS.gray400}>
          <Ionicons name={category?.icon ?? 'location-outline'} size={28} color={COLORS.gray500} />
        </Thumbnail>
      )}
      <Body>
        <Name numberOfLines={1}>{item.title}</Name>
        <DistanceRow>
          <Ionicons name="navigate-outline" size={11} color={COLORS.coral700} />
          <DistanceText numberOfLines={1}>{distanceLabel}</DistanceText>
        </DistanceRow>
      </Body>
    </Card>
  );
}

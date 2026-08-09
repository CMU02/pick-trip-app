import { Image, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { CATEGORIES } from '../../constants/categories';
import { COLORS } from '../../constants/colors';
import type { Content } from '../../types/content';

interface ContentCardProps {
  content: Content;
  selected?: boolean;
  onPress: () => void;
  onPressDetail?: () => void;
}

const Card = styled(TouchableOpacity)<{ $selected: boolean }>`
  background-color: ${COLORS.white};
  border-radius: 12px;
  border-width: ${({ $selected }) => ($selected ? '2px' : '1px')};
  border-color: ${({ $selected }) => ($selected ? COLORS.coral500 : COLORS.gray200)};
  overflow: hidden;
  margin-horizontal: 20px;
`;

const Thumbnail = styled(View)<{ $color: string }>`
  height: 100px;
  background-color: ${({ $color }) => `${$color}33`};
  align-items: center;
  justify-content: center;
`;

const ThumbnailImage = styled(Image)`
  height: 100px;
  width: 100%;
`;

const ThumbnailEmoji = styled(Text)`
  font-size: 36px;
`;

const CheckBadge = styled(View)`
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: ${COLORS.coral500};
  border-radius: 100px;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
`;

const CheckMark = styled(Text)`
  font-size: 13px;
  color: ${COLORS.white};
  font-weight: 700;
`;

const Body = styled(View)`
  padding: 14px 16px 16px;
`;

const CategoryBadge = styled(View)`
  background-color: ${COLORS.coral50};
  border-radius: 100px;
  padding-vertical: 2px;
  padding-horizontal: 8px;
  align-self: flex-start;
  margin-bottom: 6px;
`;

const CategoryLabel = styled(Text)`
  font-size: 12px;
  font-weight: 500;
  color: ${COLORS.coral700};
`;

const ContentName = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${COLORS.gray900};
  margin-bottom: 4px;
`;

const Address = styled(Text)`
  font-size: 12px;
  color: ${COLORS.gray400};
  margin-bottom: 12px;
`;

const InfoRow = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
`;

const InfoChip = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 3px;
`;

const InfoEmoji = styled(Text)`
  font-size: 13px;
`;

const InfoText = styled(Text)`
  font-size: 12px;
  color: ${COLORS.gray500};
`;

const DetailLink = styled(TouchableOpacity)`
  align-self: flex-start;
  margin-top: 12px;
`;

const DetailLinkLabel = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS.coral700};
`;

export function ContentCard({
  content,
  selected = false,
  onPress,
  onPressDetail,
}: ContentCardProps) {
  const category = CATEGORIES.find((c) => c.id === content.category);

  return (
    <Card $selected={selected} onPress={onPress} activeOpacity={0.8}>
      {content.imageUrl ? (
        <ThumbnailImage source={{ uri: content.imageUrl }} resizeMode="cover" />
      ) : (
        <Thumbnail $color={category?.color ?? COLORS.gray400}>
          <ThumbnailEmoji>{category?.emoji ?? '📍'}</ThumbnailEmoji>
        </Thumbnail>
      )}
      {selected && (
        <CheckBadge>
          <CheckMark>✓</CheckMark>
        </CheckBadge>
      )}
      <Body>
        <CategoryBadge>
          <CategoryLabel>{category?.label ?? content.category}</CategoryLabel>
        </CategoryBadge>
        <ContentName>{content.name}</ContentName>
        <Address numberOfLines={1}>{content.address}</Address>
        <InfoRow>
          {content.indoor && (
            <InfoChip>
              <InfoEmoji>🏠</InfoEmoji>
              <InfoText>실내</InfoText>
            </InfoChip>
          )}
        </InfoRow>
        {onPressDetail && (
          <DetailLink onPress={onPressDetail} activeOpacity={0.7}>
            <DetailLinkLabel>자세히 보기 →</DetailLinkLabel>
          </DetailLink>
        )}
      </Body>
    </Card>
  );
}

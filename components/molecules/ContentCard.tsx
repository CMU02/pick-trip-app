import { Ionicons } from '@expo/vector-icons';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { CATEGORIES } from '../../constants/categories';
import { COLORS } from '../../constants/colors';
import { REGIONS } from '../../constants/regions';
import { FONT } from '../../constants/typography';
import type { Content } from '../../types/content';

interface ContentCardProps {
  content: Content;
  selected?: boolean;
  onPress: () => void;
  onPressDetail?: () => void;
  favorite?: boolean;
  onToggleFavorite?: (content: Content) => void;
  // 바구니 담기/빼기. 없으면(예: 찜한 콘텐츠 화면) 바구니 아이콘 자체를 안 보여준다.
  onToggleBasket?: (content: Content) => void;
  // 카드 오른쪽 위에 지역 뱃지(하동/영주/예천)를 보여줄지. 화면마다 필요 여부가 달라서 옵트인으로 둔다.
  showRegion?: boolean;
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
  height: 220px;
  background-color: ${({ $color }) => `${$color}33`};
  align-items: center;
  justify-content: center;
`;

const ThumbnailImage = styled(Image)`
  height: 220px;
  width: 100%;
`;

// 지역 뱃지(RegionBadge)와 바구니 담기 버튼(BasketBadge)이 둘 다 뜨면 겹치지 않도록,
// 이 행 하나에 나란히 두고 오른쪽 위 모서리에 고정한다.
const TopRightRow = styled(View)`
  position: absolute;
  top: 8px;
  right: 8px;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const RegionBadge = styled(View)`
  background-color: ${COLORS.coral500};
  border-radius: 100px;
  padding-vertical: 3px;
  padding-horizontal: 8px;
`;

const RegionLabel = styled(Text)`
  font-size: 11px;
  font-family: ${FONT.medium};
  color: ${COLORS.white};
`;

// 예전엔 카드 전체를 눌러야 바구니에 담겼고, 이 자리엔 담겼는지 보여주기만 하는 체크
// 표시(비활성)가 있었다. 이제는 카드를 누르면 상세 화면으로 이동하고, 바구니 담기/빼기는
// 이 아이콘을 직접 눌러야 하는 별도 동작이라 TouchableOpacity로 바꿨다. 담겼으면 코랄
// 배경 + 채운 바구니 아이콘, 아니면 반투명 배경 + 테두리만 있는 바구니 아이콘.
const BasketBadge = styled(TouchableOpacity)<{ $active: boolean }>`
  background-color: ${({ $active }) => ($active ? COLORS.coral500 : 'rgba(0, 0, 0, 0.35)')};
  border-radius: 100px;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
`;

// 바구니 담기 버튼(BasketBadge)과 겹치지 않게 반대쪽 모서리에 둔다.
const FavoriteBadge = styled(View)`
  position: absolute;
  top: 8px;
  left: 8px;
`;

// 사각형 배경 없이 하트 아이콘만 보여준다 — 상세 화면의 흰 사각형 찜 버튼과 달리, 카드
// 썸네일 위에서는 배경 없는 하트만 쓰는 게 낫다는 피드백. 탭 영역은 hitSlop으로 넓혀서
// 시각적으로는 작아도 누르기는 어렵지 않게 한다.
const FavoriteIconButton = styled(TouchableOpacity)`
  align-items: center;
  justify-content: center;
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
  font-family: ${FONT.medium};
  color: ${COLORS.coral700};
`;

const ContentName = styled(Text)`
  font-size: 16px;
  font-family: ${FONT.semibold};
  color: ${COLORS.gray900};
  margin-bottom: 4px;
`;

const Address = styled(Text)`
  font-family: ${FONT.regular};
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

const InfoText = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
`;

const DetailLink = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  align-self: flex-start;
  margin-top: 12px;
`;

const DetailLinkLabel = styled(Text)`
  font-size: 12px;
  font-family: ${FONT.semibold};
  color: ${COLORS.coral700};
`;

export function ContentCard({
  content,
  selected = false,
  onPress,
  onPressDetail,
  favorite = false,
  onToggleFavorite,
  onToggleBasket,
  showRegion = false,
}: ContentCardProps) {
  const category = CATEGORIES.find((c) => c.id === content.category);
  const region = showRegion ? REGIONS.find((r) => r.id === content.regionId) : undefined;

  return (
    <Card $selected={selected} onPress={onPress} activeOpacity={0.8}>
      {content.imageUrl ? (
        <ThumbnailImage source={{ uri: content.imageUrl }} resizeMode="cover" />
      ) : (
        <Thumbnail $color={category?.color ?? COLORS.gray400}>
          <Ionicons name={category?.icon ?? 'location-outline'} size={48} color={COLORS.gray500} />
        </Thumbnail>
      )}
      <TopRightRow>
        {region && (
          <RegionBadge>
            <RegionLabel>{region.name}</RegionLabel>
          </RegionBadge>
        )}
        {onToggleBasket && (
          <BasketBadge
            $active={selected}
            onPress={() => onToggleBasket(content)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons
              name={selected ? 'basket' : 'basket-outline'}
              size={15}
              color={COLORS.white}
            />
          </BasketBadge>
        )}
      </TopRightRow>
      {onToggleFavorite && (
        <FavoriteBadge>
          <FavoriteIconButton
            onPress={() => onToggleFavorite(content)}
            activeOpacity={0.7}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons
              name={favorite ? 'heart' : 'heart-outline'}
              size={20}
              color={favorite ? COLORS.coral500 : COLORS.white}
            />
          </FavoriteIconButton>
        </FavoriteBadge>
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
              <Ionicons name="home-outline" size={13} color={COLORS.gray500} />
              <InfoText>실내</InfoText>
            </InfoChip>
          )}
        </InfoRow>
        {onPressDetail && (
          <DetailLink onPress={onPressDetail} activeOpacity={0.7}>
            <DetailLinkLabel>자세히 보기</DetailLinkLabel>
            <Ionicons name="chevron-forward" size={12} color={COLORS.coral700} />
          </DetailLink>
        )}
      </Body>
    </Card>
  );
}

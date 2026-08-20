import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { CATEGORIES } from '../../constants/categories';
import { COLORS } from '../../constants/colors';
import { FONT } from '../../constants/typography';
import { fetchContentDetail } from '../../services/contentService';
import type { Content } from '../../types/content';
import { FavoriteButton } from '../atoms/FavoriteButton';
import { ContentDetailSkeleton } from './ContentDetailSkeleton';

interface ContentDetailModalProps {
  contentId: string | null;
  onClose: () => void;
  favorite?: boolean;
  onToggleFavorite?: (content: Content) => void;
}

const ModalOverlay = styled(View)`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: flex-end;
`;

// 콘텐츠 양에 따라 시트 높이가 들쭉날쭉하지 않도록 max-height 대신 고정 height를 쓴다.
// 92%로 두면 상단에 화면 제목("어떤 곳이 끌리나요" 등) 정도만 보이고 나머지는 시트가 덮는다.
const ModalSheet = styled(View)`
  background-color: ${COLORS.white};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  height: 92%;
`;

const CloseButton = styled(TouchableOpacity)`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background-color: rgba(0, 0, 0, 0.45);
  align-items: center;
  justify-content: center;
  z-index: 1;
`;

// 닫기 버튼과 겹치지 않게 반대쪽 모서리에 둔다.
const FavoriteBadge = styled(View)`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
`;

const DetailImage = styled(Image)`
  width: 100%;
  height: 220px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
`;

const DetailThumbnail = styled(View)<{ $color: string }>`
  width: 100%;
  height: 220px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  background-color: ${({ $color }) => `${$color}33`};
  align-items: center;
  justify-content: center;
`;

const Body = styled(View)`
  padding: 20px;
`;

const CategoryBadge = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  background-color: ${COLORS.coral50};
  border-radius: 100px;
  padding-vertical: 4px;
  padding-horizontal: 10px;
  margin-bottom: 10px;
`;

const CategoryLabel = styled(Text)`
  font-size: 12px;
  font-family: ${FONT.semibold};
  color: ${COLORS.coral700};
`;

const ContentName = styled(Text)`
  font-size: 20px;
  font-family: ${FONT.bold};
  color: ${COLORS.gray900};
  margin-bottom: 10px;
`;

const Summary = styled(Text)`
  font-family: ${FONT.medium};
  font-size: 15px;
  color: ${COLORS.gray900};
  line-height: 23px;
  margin-bottom: 16px;
`;

const InfoRow = styled(View)`
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
`;

const InfoText = styled(Text)`
  font-family: ${FONT.medium};
  flex: 1;
  font-size: 14px;
  color: ${COLORS.gray900};
  line-height: 20px;
`;

const CenterBox = styled(View)`
  height: 220px;
  align-items: center;
  justify-content: center;
`;

const ErrorText = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 13px;
  color: ${COLORS.gray500};
`;

export function ContentDetailModal({
  contentId,
  onClose,
  favorite = false,
  onToggleFavorite,
}: ContentDetailModalProps) {
  const {
    data: content,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['content-detail', contentId],
    queryFn: () => fetchContentDetail(contentId as string),
    enabled: contentId !== null,
  });

  const category = content && CATEGORIES.find((c) => c.id === content.category);

  return (
    <Modal visible={contentId !== null} transparent animationType="slide" onRequestClose={onClose}>
      <ModalOverlay>
        {/* 배경 탭하면 닫힘 */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <ModalSheet>
          <CloseButton onPress={onClose} activeOpacity={0.8}>
            <Ionicons name="close" size={18} color={COLORS.white} />
          </CloseButton>
          {content && onToggleFavorite && (
            <FavoriteBadge>
              <FavoriteButton active={favorite} onPress={() => onToggleFavorite(content)} />
            </FavoriteBadge>
          )}
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {isLoading && <ContentDetailSkeleton />}
            {isError && (
              <CenterBox>
                <ErrorText>정보를 불러오지 못했습니다.</ErrorText>
              </CenterBox>
            )}
            {content && (
              <>
                {content.imageUrl ? (
                  <DetailImage source={{ uri: content.imageUrl }} resizeMode="cover" />
                ) : (
                  <DetailThumbnail $color={category?.color ?? COLORS.gray400}>
                    <Ionicons
                      name={category?.icon ?? 'location-outline'}
                      size={48}
                      color={COLORS.gray500}
                    />
                  </DetailThumbnail>
                )}
                <Body>
                  {category && (
                    <CategoryBadge>
                      <Ionicons name={category.icon} size={13} color={COLORS.coral700} />
                      <CategoryLabel>{category.label}</CategoryLabel>
                    </CategoryBadge>
                  )}
                  <ContentName>{content.name}</ContentName>
                  {content.summary !== '' && <Summary>{content.summary}</Summary>}
                  <InfoRow>
                    <Ionicons name="location-outline" size={14} color={COLORS.gray900} />
                    <InfoText>{content.address}</InfoText>
                  </InfoRow>
                  {content.indoor && (
                    <InfoRow>
                      <Ionicons name="home-outline" size={14} color={COLORS.gray900} />
                      <InfoText>실내 콘텐츠</InfoText>
                    </InfoRow>
                  )}
                </Body>
              </>
            )}
          </ScrollView>
        </ModalSheet>
      </ModalOverlay>
    </Modal>
  );
}

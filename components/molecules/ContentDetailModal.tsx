import { useQuery } from '@tanstack/react-query';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import styled from 'styled-components';
import { CATEGORIES } from '../../constants/categories';
import { COLORS } from '../../constants/colors';
import { fetchContentDetail } from '../../services/contentService';

interface ContentDetailModalProps {
  contentId: string | null;
  onClose: () => void;
}

const ModalOverlay = styled(View)`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: flex-end;
`;

const ModalSheet = styled(View)`
  background-color: ${COLORS.white};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  max-height: 85%;
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

const CloseButtonLabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 15px;
  font-weight: 600;
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

const ThumbnailEmoji = styled(Text)`
  font-size: 48px;
`;

const Body = styled(View)`
  padding: 20px;
`;

const CategoryBadge = styled(View)`
  align-self: flex-start;
  background-color: ${COLORS.amber50};
  border-radius: 100px;
  padding-vertical: 4px;
  padding-horizontal: 10px;
  margin-bottom: 10px;
`;

const CategoryLabel = styled(Text)`
  font-size: 12px;
  font-weight: 600;
  color: ${COLORS.amber700};
`;

const ContentName = styled(Text)`
  font-size: 20px;
  font-weight: 700;
  color: ${COLORS.gray900};
  margin-bottom: 10px;
`;

const Summary = styled(Text)`
  font-size: 14px;
  color: ${COLORS.gray700};
  line-height: 21px;
  margin-bottom: 16px;
`;

const InfoRow = styled(View)`
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
`;

const InfoEmoji = styled(Text)`
  font-size: 14px;
`;

const InfoText = styled(Text)`
  flex: 1;
  font-size: 13px;
  color: ${COLORS.gray700};
  line-height: 19px;
`;

const CenterBox = styled(View)`
  height: 220px;
  align-items: center;
  justify-content: center;
`;

const ErrorText = styled(Text)`
  font-size: 13px;
  color: ${COLORS.gray500};
`;

export function ContentDetailModal({ contentId, onClose }: ContentDetailModalProps) {
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
            <CloseButtonLabel>✕</CloseButtonLabel>
          </CloseButton>
          <ScrollView showsVerticalScrollIndicator={false}>
            {isLoading && (
              <CenterBox>
                <ActivityIndicator color={COLORS.amber500} />
              </CenterBox>
            )}
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
                    <ThumbnailEmoji>{category?.emoji ?? '📍'}</ThumbnailEmoji>
                  </DetailThumbnail>
                )}
                <Body>
                  {category && (
                    <CategoryBadge>
                      <CategoryLabel>
                        {category.emoji} {category.label}
                      </CategoryLabel>
                    </CategoryBadge>
                  )}
                  <ContentName>{content.name}</ContentName>
                  {content.summary !== '' && <Summary>{content.summary}</Summary>}
                  <InfoRow>
                    <InfoEmoji>📍</InfoEmoji>
                    <InfoText>{content.address}</InfoText>
                  </InfoRow>
                  {content.indoor && (
                    <InfoRow>
                      <InfoEmoji>🏠</InfoEmoji>
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

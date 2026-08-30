import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import styled from 'styled-components';
import { CATEGORIES } from '../../constants/categories';
import { COLORS } from '../../constants/colors';
import { REGIONS } from '../../constants/regions';
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

// 모달 시트가 화면 폭 그대로라, 사진 한 장의 너비를 화면 폭에 맞춰야 스와이프했을 때
// 한 장씩 딱 맞게 넘어간다(pagingEnabled).
const SCREEN_WIDTH = Dimensions.get('window').width;

// 사진 캐러셀 영역. overflow: hidden으로 감싸서, 안에서 가로로 넘기는 사진들이
// 이 모서리 둥근 영역 밖으로 삐져나오지 않게 한다.
const ImageCarouselWrapper = styled(View)`
  width: 100%;
  height: 220px;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  overflow: hidden;
`;

const CarouselImage = styled(Image)`
  width: ${SCREEN_WIDTH}px;
  height: 220px;
`;

// 사진이 몇 장 남았는지 보여주는 우측 하단 뱃지 ("1 / 4").
const ImageCounterBadge = styled(View)`
  position: absolute;
  bottom: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.45);
  border-radius: 100px;
  padding-vertical: 3px;
  padding-horizontal: 10px;
`;

const ImageCounterText = styled(Text)`
  color: ${COLORS.white};
  font-size: 11px;
  font-family: ${FONT.semibold};
`;

// 좌측 하단 페이지 표시 점들. 지금 보고 있는 사진의 점만 길쭉하게 강조한다.
const DotRow = styled(View)`
  position: absolute;
  bottom: 14px;
  left: 12px;
  flex-direction: row;
  gap: 4px;
`;

const Dot = styled(View)<{ $active: boolean }>`
  width: ${({ $active }) => ($active ? 14 : 5)}px;
  height: 5px;
  border-radius: 100px;
  background-color: ${({ $active }) => ($active ? COLORS.white : 'rgba(255, 255, 255, 0.5)')};
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

const SectionTitle = styled(Text)`
  font-size: 15px;
  font-family: ${FONT.bold};
  color: ${COLORS.gray900};
  margin-bottom: 8px;
`;

const SummarySection = styled(View)`
  margin-bottom: 16px;
`;

const Summary = styled(Text)`
  font-family: ${FONT.medium};
  font-size: 15px;
  color: ${COLORS.gray900};
  line-height: 23px;
`;

// 실제로는 안 보이지만(height: 0 + overflow: hidden), 줄바꿈 제한 없이 렌더링해서
// onTextLayout으로 전체 줄 수를 재는 용도. Summary와 같은 스타일이어야 줄바꿈 위치가
// 똑같이 계산된다.
const SummaryMeasure = styled(Text)`
  font-family: ${FONT.medium};
  font-size: 15px;
  line-height: 23px;
  height: 0;
  overflow: hidden;
  opacity: 0;
`;

const ExpandToggle = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
`;

const ExpandToggleLabel = styled(Text)`
  font-family: ${FONT.medium};
  font-size: 13px;
  color: ${COLORS.gray500};
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

// 운영시간·휴무일·주차 등 상세 조회에서만 내려오는 항목들 — 아이콘 + 라벨 + 값 형태의
// 표처럼 나열한다. 값이 없는 항목(reservationRequired가 null인 경우가 특히 흔하다)은
// 통째로 안 보여준다.
const InfoTable = styled(View)`
  background-color: ${COLORS.gray50};
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 16px;
  gap: 10px;
`;

const InfoTableRow = styled(View)`
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
`;

const InfoTableLabel = styled(Text)`
  width: 60px;
  font-family: ${FONT.medium};
  font-size: 13px;
  color: ${COLORS.gray500};
`;

const InfoTableValue = styled(Text)`
  flex: 1;
  font-family: ${FONT.medium};
  font-size: 13px;
  color: ${COLORS.gray900};
  line-height: 19px;
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

// 백엔드 원본(TourAPI)이 줄바꿈을 <br> 태그로 넣어서 준다(예: "11:30~18:00<br>- 마지막 주문 17:00").
// RN Text는 HTML을 해석 안 해서 그대로 두면 "<br>" 글자가 그대로 보이므로 줄바꿈으로 바꿔준다.
function withLineBreaks(text: string): string {
  return text.replace(/<br\s*\/?>/gi, '\n');
}

// 소개 문구가 이 줄 수를 넘으면 접어두고 "더 보기"로 펼칠 수 있게 한다.
const SUMMARY_COLLAPSED_LINES = 3;

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

  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  // 3줄을 넘는 소개만 "더 보기" 토글을 보여준다 — 짧은 소개엔 눌러도 아무 변화 없는
  // 버튼이 뜨면 안 되니, 실제로 넘치는지 SummaryMeasure의 onTextLayout으로 먼저 재본다.
  const [summaryOverflows, setSummaryOverflows] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const carouselRef = useRef<ScrollView>(null);
  // 이 모달은 카드마다 새로 만들어지는 게 아니라 화면에 하나만 떠 있고 contentId prop만
  // 바뀌는 구조라, 안 지워주면 "더 보기"를 펼친 채로 다른 콘텐츠를 열어도 그 상태가
  // 그대로 남아있는다(실제로 그렇게 다른 콘텐츠까지 펼쳐져 보이는 버그였음). 사진 캐러셀도
  // 같은 이유로 스크롤 위치·페이지 번호를 안 돌려놓으면 이전 콘텐츠에서 넘겨보던 위치가
  // 그대로 남는다.
  // biome-ignore lint/correctness/useExhaustiveDependencies: contentId가 바뀌는 시점에만 리셋하면 된다
  useEffect(() => {
    setIsSummaryExpanded(false);
    setSummaryOverflows(false);
    setActiveImageIndex(0);
    carouselRef.current?.scrollTo({ x: 0, animated: false });
  }, [contentId]);

  const handleCarouselScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveImageIndex(index);
  };

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
                {content.images.length > 0 ? (
                  <ImageCarouselWrapper>
                    <ScrollView
                      ref={carouselRef}
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onMomentumScrollEnd={handleCarouselScrollEnd}
                    >
                      {content.images.map((uri) => (
                        <CarouselImage key={uri} source={{ uri }} resizeMode="cover" />
                      ))}
                    </ScrollView>
                    {content.images.length > 1 && (
                      <>
                        <DotRow>
                          {content.images.map((uri, index) => (
                            <Dot key={uri} $active={index === activeImageIndex} />
                          ))}
                        </DotRow>
                        <ImageCounterBadge>
                          <ImageCounterText>
                            {activeImageIndex + 1} / {content.images.length}
                          </ImageCounterText>
                        </ImageCounterBadge>
                      </>
                    )}
                  </ImageCarouselWrapper>
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
                  <InfoTable>
                    {[
                      {
                        icon: 'earth-outline' as const,
                        label: '지역',
                        value: REGIONS.find((r) => r.id === content.regionId)?.name ?? null,
                      },
                      {
                        icon: 'time-outline' as const,
                        label: '운영시간',
                        value: content.useTime,
                      },
                      {
                        icon: 'calendar-outline' as const,
                        label: '휴무일',
                        value: content.restDate,
                      },
                      {
                        icon: 'car-outline' as const,
                        label: '주차',
                        value: content.parking,
                      },
                      {
                        icon: 'hourglass-outline' as const,
                        label: '예상 체류',
                        value: content.stayDuration,
                      },
                      {
                        icon: 'bookmark-outline' as const,
                        label: '예약',
                        value: content.reservationRequired,
                      },
                    ]
                      .filter((row) => row.value)
                      .map((row) => (
                        <InfoTableRow key={row.label}>
                          <Ionicons name={row.icon} size={14} color={COLORS.gray500} />
                          <InfoTableLabel>{row.label}</InfoTableLabel>
                          <InfoTableValue>{withLineBreaks(row.value as string)}</InfoTableValue>
                        </InfoTableRow>
                      ))}
                  </InfoTable>
                  {content.summary !== '' && (
                    <SummarySection>
                      <SectionTitle>소개</SectionTitle>
                      <Summary
                        numberOfLines={isSummaryExpanded ? undefined : SUMMARY_COLLAPSED_LINES}
                      >
                        {content.summary}
                      </Summary>
                      {/* 화면엔 안 보이고 줄 수만 재서, 실제로 넘칠 때만 토글을 보여준다 */}
                      <SummaryMeasure
                        onTextLayout={(e) =>
                          setSummaryOverflows(e.nativeEvent.lines.length > SUMMARY_COLLAPSED_LINES)
                        }
                      >
                        {content.summary}
                      </SummaryMeasure>
                      {summaryOverflows && (
                        <ExpandToggle
                          onPress={() => setIsSummaryExpanded((prev) => !prev)}
                          activeOpacity={0.7}
                        >
                          <ExpandToggleLabel>
                            {isSummaryExpanded ? '접기' : '더 보기'}
                          </ExpandToggleLabel>
                          <Ionicons
                            name={isSummaryExpanded ? 'chevron-up' : 'chevron-down'}
                            size={12}
                            color={COLORS.gray500}
                          />
                        </ExpandToggle>
                      )}
                    </SummarySection>
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

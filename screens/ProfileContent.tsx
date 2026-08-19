import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../constants/colors';
import { COMPANIONS, STYLE_OPTIONS } from '../constants/companions';
import { TAB_BAR_CLEARANCE } from '../constants/layout';
import { REGIONS } from '../constants/regions';
import { FONT } from '../constants/typography';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { SavedItinerarySummary } from '../services/itineraryHistoryStorage';
import type { CompanionType, StylePreference } from '../types/companion';
import type { CurrentUser } from '../types/user';
import { formatItinerarySub } from '../utils/itineraryHistory';

const PROVIDER_LABELS: Record<string, string> = {
  kakao: '카카오',
  google: 'Google',
};

// "카카오 · 2026년 8월 1일 가입"처럼 로그인 수단과 가입일을 한 줄로 합친다.
function formatProviderJoin(user: CurrentUser): string {
  const providerLabel = PROVIDER_LABELS[user.provider.toLowerCase()] ?? user.provider;
  const joined = new Date(user.createdAt);
  const joinLabel = Number.isNaN(joined.getTime())
    ? null
    : `${joined.getFullYear()}년 ${joined.getMonth() + 1}월 ${joined.getDate()}일 가입`;
  return [providerLabel, joinLabel].filter((part): part is string => Boolean(part)).join(' · ');
}

interface ProfileContentProps {
  isGuest: boolean;
  companion: CompanionType | null;
  stylePrefs: StylePreference[];
  selectedRegions: string[];
  itineraryHistory: SavedItinerarySummary[];
  openingItineraryId: string | null;
  onOpenItinerary: (itineraryId: string) => void;
  onDeleteItinerary: (itineraryId: string, title: string) => void;
  onChangeCompanion: (companion: CompanionType) => void;
  onToggleStylePref: (pref: StylePreference) => void;
  onToggleRegion: (regionId: string) => void;
  onLogin: () => void;
  onLogout: () => void;
}

const Scroll = styled(ScrollView)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

// 하단 여백은 플로팅 탭바가 가리는 높이를 확보한다.
const Content = styled(View)`
  padding: 16px 20px ${TAB_BAR_CLEARANCE}px;
`;

const IdentityCard = styled(LinearGradient)`
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 16px;
  flex-direction: row;
  align-items: center;
  gap: 14px;
`;

const IdentityInfo = styled(View)`
  flex: 1;
`;

const LoginButton = styled(TouchableOpacity)`
  background-color: ${COLORS.white};
  border-radius: 100px;
  padding-vertical: 8px;
  padding-horizontal: 16px;
`;

const LoginButtonLabel = styled(Text)`
  font-size: 13px;
  font-family: ${FONT.semibold};
  color: ${COLORS.coral600};
`;

const Avatar = styled(View)`
  width: 56px;
  height: 56px;
  border-radius: 100px;
  background-color: rgba(255, 255, 255, 0.25);
  align-items: center;
  justify-content: center;
`;

const AvatarLabel = styled(Text)`
  font-size: 22px;
  font-family: ${FONT.bold};
  color: ${COLORS.white};
`;

const IdentityName = styled(Text)`
  font-size: 17px;
  font-family: ${FONT.bold};
  color: ${COLORS.white};
  margin-bottom: 4px;
`;

const IdentitySub = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
`;

const IdentityMeta = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 2px;
`;

const TripRow = styled(TouchableOpacity)<{ $last: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding-vertical: 12px;
  border-bottom-width: ${({ $last }) => ($last ? '0px' : '1px')};
  border-bottom-color: ${COLORS.gray100};
`;

const TripIconBadge = styled(View)`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background-color: ${COLORS.coral50};
  align-items: center;
  justify-content: center;
`;

const TripBody = styled(View)`
  flex: 1;
`;

const TripTitleRow = styled(View)`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
`;

const TripTitle = styled(Text)`
  font-size: 15px;
  font-family: ${FONT.bold};
  color: ${COLORS.gray900};
  flex-shrink: 1;
`;

const TripSub = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
`;

const DeleteTripButton = styled(TouchableOpacity)`
  padding: 2px;
`;

const Card = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  padding: 18px;
  margin-bottom: 16px;
`;

const CardTitle = styled(Text)`
  font-size: 15px;
  font-family: ${FONT.bold};
  color: ${COLORS.gray900};
  margin-bottom: 4px;
`;

const CardDesc = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
  margin-bottom: 14px;
`;

const FieldLabel = styled(Text)`
  font-size: 13px;
  font-family: ${FONT.semibold};
  color: ${COLORS.gray500};
  margin-bottom: 8px;
`;

const ChipRow = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;

const Chip = styled(TouchableOpacity)<{ $active: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 5px;
  padding-vertical: 8px;
  padding-horizontal: 14px;
  border-radius: 100px;
  border-width: 1px;
  background-color: ${({ $active }) => ($active ? COLORS.coral50 : COLORS.white)};
  border-color: ${({ $active }) => ($active ? COLORS.coral500 : COLORS.gray200)};
`;

const ChipLabel = styled(Text)<{ $active: boolean }>`
  font-size: 13px;
  font-family: ${FONT.medium};
  color: ${({ $active }) => ($active ? COLORS.coral700 : COLORS.gray700)};
`;

const NotifyRow = styled(View)<{ $last: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-vertical: 13px;
  border-bottom-width: ${({ $last }) => ($last ? '0px' : '1px')};
  border-bottom-color: ${COLORS.gray100};
`;

const NotifyTitle = styled(Text)`
  font-size: 14px;
  font-family: ${FONT.medium};
  color: ${COLORS.gray900};
`;

const NotifyDesc = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
  margin-top: 2px;
`;

const Toggle = styled(TouchableOpacity)<{ $on: boolean }>`
  width: 46px;
  height: 28px;
  border-radius: 100px;
  background-color: ${({ $on }) => ($on ? COLORS.coral500 : COLORS.gray200)};
  padding: 3px;
`;

const ToggleKnob = styled(View)<{ $on: boolean }>`
  width: 22px;
  height: 22px;
  border-radius: 100px;
  background-color: ${COLORS.white};
  margin-left: ${({ $on }) => ($on ? 18 : 0)}px;
`;

const LogoutButton = styled(TouchableOpacity)`
  padding-vertical: 13px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  align-items: center;
  background-color: ${COLORS.white};
`;

const LogoutLabel = styled(Text)`
  font-size: 14px;
  font-family: ${FONT.medium};
  color: ${COLORS.gray500};
`;

const NOTIFY_ROWS = [
  { key: 'recommend', title: '맞춤 추천 알림', desc: '취향에 맞는 새 콘텐츠 알림' },
  { key: 'festival', title: '축제·행사 알림', desc: '선호 지역 축제 일정' },
  { key: 'trip', title: '여행 리마인더', desc: '출발 전 일정 알림' },
] as const;

export function ProfileContent({
  isGuest,
  companion,
  stylePrefs,
  selectedRegions,
  itineraryHistory,
  openingItineraryId,
  onOpenItinerary,
  onDeleteItinerary,
  onChangeCompanion,
  onToggleStylePref,
  onToggleRegion,
  onLogin,
  onLogout,
}: ProfileContentProps) {
  const [notifyState, setNotifyState] = useState<Record<string, boolean>>({
    recommend: true,
    festival: true,
    trip: false,
  });
  const { user } = useCurrentUser(!isGuest);
  const displayName = isGuest ? '게스트님' : (user?.nickname ?? '불러오는 중...');

  return (
    <Scroll showsVerticalScrollIndicator={false}>
      <Content>
        <IdentityCard
          colors={[COLORS.coral500, COLORS.coral700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Avatar>
            <AvatarLabel>{displayName.charAt(0)}</AvatarLabel>
          </Avatar>
          <IdentityInfo>
            <IdentityName>{displayName}</IdentityName>
            {isGuest ? (
              <IdentitySub>게스트로 둘러보는 중</IdentitySub>
            ) : (
              user && <IdentityMeta>{formatProviderJoin(user)}</IdentityMeta>
            )}
          </IdentityInfo>
          {isGuest && (
            <LoginButton onPress={onLogin} activeOpacity={0.8}>
              <LoginButtonLabel>로그인</LoginButtonLabel>
            </LoginButton>
          )}
        </IdentityCard>

        {itineraryHistory.length > 0 && (
          <Card>
            <CardTitle>저장한 여행</CardTitle>
            {itineraryHistory.map((item, index) => {
              const isOpening = openingItineraryId === item.itineraryId;
              return (
                <TripRow
                  key={item.itineraryId}
                  onPress={() => onOpenItinerary(item.itineraryId)}
                  disabled={openingItineraryId != null}
                  $last={index === itineraryHistory.length - 1}
                >
                  <TripIconBadge>
                    <Ionicons name="map-outline" size={20} color={COLORS.coral600} />
                  </TripIconBadge>
                  <TripBody>
                    <TripTitleRow>
                      <TripTitle numberOfLines={1}>{item.title}</TripTitle>
                    </TripTitleRow>
                    <TripSub numberOfLines={1}>{formatItinerarySub(item)}</TripSub>
                  </TripBody>
                  {isOpening ? (
                    <ActivityIndicator color={COLORS.coral500} />
                  ) : (
                    <>
                      <DeleteTripButton
                        onPress={() => onDeleteItinerary(item.itineraryId, item.title)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={16} color={COLORS.gray400} />
                      </DeleteTripButton>
                      <Ionicons name="chevron-forward" size={14} color={COLORS.gray400} />
                    </>
                  )}
                </TripRow>
              );
            })}
          </Card>
        )}

        <Card>
          <CardTitle>여행 취향</CardTitle>
          <CardDesc>온보딩에서 고른 취향이에요. AI 추천에 반영됩니다.</CardDesc>

          <FieldLabel>누구와 함께 가나요?</FieldLabel>
          <ChipRow>
            {COMPANIONS.map((c) => (
              <Chip
                key={c.id}
                $active={companion === c.id}
                onPress={() => onChangeCompanion(c.id)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={c.icon}
                  size={14}
                  color={companion === c.id ? COLORS.coral700 : COLORS.gray700}
                />
                <ChipLabel $active={companion === c.id}>{c.label}</ChipLabel>
              </Chip>
            ))}
          </ChipRow>

          <FieldLabel>여행 스타일</FieldLabel>
          <ChipRow>
            {STYLE_OPTIONS.map((option) => (
              <Chip
                key={option.id}
                $active={stylePrefs.includes(option.id)}
                onPress={() => onToggleStylePref(option.id)}
                activeOpacity={0.8}
              >
                <ChipLabel $active={stylePrefs.includes(option.id)}>{option.label}</ChipLabel>
              </Chip>
            ))}
          </ChipRow>

          <FieldLabel>선호 지역</FieldLabel>
          <ChipRow style={{ marginBottom: 0 }}>
            {REGIONS.map((region) => (
              <Chip
                key={region.id}
                $active={selectedRegions.includes(region.id)}
                onPress={() => onToggleRegion(region.id)}
                activeOpacity={0.8}
              >
                <ChipLabel $active={selectedRegions.includes(region.id)}>{region.name}</ChipLabel>
              </Chip>
            ))}
          </ChipRow>
        </Card>

        <Card>
          <CardTitle>알림 설정</CardTitle>
          {NOTIFY_ROWS.map((row, index) => (
            <NotifyRow key={row.key} $last={index === NOTIFY_ROWS.length - 1}>
              <View>
                <NotifyTitle>{row.title}</NotifyTitle>
                <NotifyDesc>{row.desc}</NotifyDesc>
              </View>
              <Toggle
                $on={notifyState[row.key]}
                onPress={() => setNotifyState((prev) => ({ ...prev, [row.key]: !prev[row.key] }))}
                activeOpacity={0.8}
              >
                <ToggleKnob $on={notifyState[row.key]} />
              </Toggle>
            </NotifyRow>
          ))}
        </Card>

        <LogoutButton onPress={onLogout} activeOpacity={0.8}>
          <LogoutLabel>로그아웃</LogoutLabel>
        </LogoutButton>
      </Content>
    </Scroll>
  );
}

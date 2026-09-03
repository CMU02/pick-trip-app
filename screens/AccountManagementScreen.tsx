import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../constants/colors';
import { FONT } from '../constants/typography';
import type { CurrentUser } from '../types/user';

interface AccountManagementScreenProps {
  user: CurrentUser | undefined;
  onWithdraw: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  kakao: '카카오',
  google: 'Google',
};

// ProfileContent의 "카카오 · 2026년 8월 1일 가입"과 같은 형식으로 맞춘다.
function formatProviderJoin(user: CurrentUser): string {
  const providerLabel = PROVIDER_LABELS[user.provider.toLowerCase()] ?? user.provider;
  const joined = new Date(user.createdAt);
  const joinLabel = Number.isNaN(joined.getTime())
    ? null
    : `${joined.getFullYear()}년 ${joined.getMonth() + 1}월 ${joined.getDate()}일 가입`;
  return [providerLabel, joinLabel].filter((part): part is string => Boolean(part)).join(' · ');
}

const Scroll = styled(ScrollView)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

const Content = styled(View)`
  padding: 16px 20px 32px;
`;

// 프로필 화면 맨 위의 아이덴티티 카드와 같은 스타일. "계정 관리" 화면이 이메일·가입일
// 표만 덜렁 있어 허전해 보여서, 여기도 누구의 계정을 관리하는지 한눈에 보이게 둔다.
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

const IdentityMeta = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
`;

const Card = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  padding: 18px;
  margin-bottom: 16px;
`;

// Card와 달리 위아래 패딩을 두지 않는다 — InfoRow가 자체 padding-vertical로 줄 사이
// 간격을 만드는데, 여기에 Card의 세로 패딩까지 얹히면 카드 위/아래 가장자리 쪽 여백만
// 구분선 쪽 여백보다 훨씬 커져서 글자가 구분선 쪽으로 쏠려 보인다(위 칸은 아래로,
// 아래 칸은 위로). 세로 패딩을 없애 모든 줄 간격을 InfoRow 하나가 균일하게 만들게 한다.
const InfoCard = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  padding: 0 18px;
  margin-bottom: 16px;
`;

const InfoRow = styled(View)<{ $last: boolean }>`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-vertical: 20px;
  border-bottom-width: ${({ $last }) => ($last ? '0px' : '1px')};
  border-bottom-color: ${COLORS.gray100};
`;

// 텍스트 상자를 고정 높이로 못박고 justify-content: center로 그 안에서만 정렬해도,
// 안드로이드는 폰트 굵기(Regular/SemiBold)·스크립트(한글/영문)별로 글자에 자동으로
// 얹는 내부 여백(includeFontPadding)이 달라서 상자는 같아도 잉크 위치가 미묘하게
// 위/아래로 치우쳐 보일 수 있다. include-font-padding을 꺼서 그 여백 자체를 없앤다.
const InfoTextBox = styled(View)`
  height: 20px;
  justify-content: center;
`;

const InfoLabel = styled(Text)`
  font-size: 14px;
  font-family: ${FONT.regular};
  color: ${COLORS.gray500};
  include-font-padding: false;
  text-align-vertical: center;
`;

const InfoValue = styled(Text)`
  font-size: 14px;
  font-family: ${FONT.semibold};
  color: ${COLORS.gray900};
  include-font-padding: false;
  text-align-vertical: center;
`;

const CardTitle = styled(Text)`
  font-size: 15px;
  font-family: ${FONT.bold};
  color: ${COLORS.gray900};
  margin-bottom: 8px;
`;

const CardDesc = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 13px;
  line-height: 20px;
  color: ${COLORS.gray500};
  margin-bottom: 16px;
`;

const WithdrawButton = styled(TouchableOpacity)`
  padding-vertical: 14px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.coral300};
  align-items: center;
  background-color: ${COLORS.white};
`;

const WithdrawButtonLabel = styled(Text)`
  font-size: 15px;
  font-family: ${FONT.semibold};
  color: ${COLORS.coral600};
`;

// ProfileContent의 "OOOO년 O월 O일 가입" 문구와 같은 형식으로 맞춘다.
function formatJoinDate(createdAt: string): string {
  const joined = new Date(createdAt);
  if (Number.isNaN(joined.getTime())) return '-';
  return `${joined.getFullYear()}년 ${joined.getMonth() + 1}월 ${joined.getDate()}일`;
}

// 프로필 화면의 "계정 관리" 행을 눌렀을 때 들어오는 화면. 로그인 정보(이메일·가입일)
// 확인과 회원 탈퇴 진입점을 분리해서, 되돌릴 수 없는 탈퇴 동작이 프로필 첫 화면에
// 바로 노출되지 않도록 한 단계 안쪽에 둔다.
export function AccountManagementScreen({ user, onWithdraw }: AccountManagementScreenProps) {
  return (
    <Scroll showsVerticalScrollIndicator={false}>
      <Content>
        <IdentityCard
          colors={[COLORS.coral500, COLORS.coral700]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Avatar>
            <AvatarLabel>{(user?.nickname ?? '?').charAt(0)}</AvatarLabel>
          </Avatar>
          <IdentityInfo>
            <IdentityName>{user?.nickname ?? '불러오는 중...'}</IdentityName>
            {user && <IdentityMeta>{formatProviderJoin(user)}</IdentityMeta>}
          </IdentityInfo>
        </IdentityCard>

        <InfoCard>
          <InfoRow $last={false}>
            <InfoTextBox>
              <InfoLabel>이메일</InfoLabel>
            </InfoTextBox>
            <InfoTextBox>
              <InfoValue>{user?.email ?? '-'}</InfoValue>
            </InfoTextBox>
          </InfoRow>
          <InfoRow $last>
            <InfoTextBox>
              <InfoLabel>가입일</InfoLabel>
            </InfoTextBox>
            <InfoTextBox>
              <InfoValue>{user ? formatJoinDate(user.createdAt) : '-'}</InfoValue>
            </InfoTextBox>
          </InfoRow>
        </InfoCard>

        <Card>
          <CardTitle>회원 탈퇴</CardTitle>
          <CardDesc>담아둔 장소와 만든 일정이 모두 삭제되고 되돌릴 수 없어요.</CardDesc>
          <WithdrawButton onPress={onWithdraw} activeOpacity={0.7}>
            <WithdrawButtonLabel>탈퇴 진행하기</WithdrawButtonLabel>
          </WithdrawButton>
        </Card>
      </Content>
    </Scroll>
  );
}

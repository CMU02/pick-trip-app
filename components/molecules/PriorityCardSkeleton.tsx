import { View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { SkeletonBox } from '../atoms/SkeletonBox';

// PrioritySelectScreen의 Card(썸네일 44px + 정보 + 우선순위 칩 3개) 치수를 맞춘 로딩 자리표시자.
const Card = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 14px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  margin-horizontal: 20px;
  padding: 14px 16px;
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

const InfoColumn = styled(View)`
  flex: 1;
  gap: 8px;
`;

const ChipRow = styled(View)`
  flex-direction: row;
  gap: 8px;
`;

export function PriorityCardSkeleton() {
  return (
    <Card>
      <SkeletonBox width={44} height={44} radius={10} />
      <InfoColumn>
        <View>
          <SkeletonBox width="55%" height={15} radius={4} style={{ marginBottom: 6 }} />
          <SkeletonBox width="40%" height={12} radius={4} />
        </View>
        <ChipRow>
          <SkeletonBox height={32} radius={20} style={{ flex: 1 }} />
          <SkeletonBox height={32} radius={20} style={{ flex: 1 }} />
          <SkeletonBox height={32} radius={20} style={{ flex: 1 }} />
        </ChipRow>
      </InfoColumn>
    </Card>
  );
}

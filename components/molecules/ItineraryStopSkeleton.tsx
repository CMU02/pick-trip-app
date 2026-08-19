import { View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { SkeletonBox } from '../atoms/SkeletonBox';

// SharedItineraryScreen의 일차 라벨 + StopCard 치수를 맞춘 로딩 자리표시자.
const DayLabelBox = styled(View)`
  margin: 20px 20px 12px;
`;

const StopCard = styled(View)`
  border-width: 1px;
  border-color: ${COLORS.gray200};
  border-radius: 12px;
  padding: 14px 16px;
  background-color: ${COLORS.white};
  margin-horizontal: 20px;
  margin-bottom: 12px;
`;

export function ItineraryStopSkeleton() {
  return (
    <View>
      <DayLabelBox>
        <SkeletonBox width={70} height={19} radius={4} />
      </DayLabelBox>
      {[0, 1, 2].map((i) => (
        <StopCard key={i}>
          <SkeletonBox width="50%" height={17} radius={4} style={{ marginBottom: 8 }} />
          <SkeletonBox width="90%" height={13} radius={4} style={{ marginBottom: 5 }} />
          <SkeletonBox width="70%" height={13} radius={4} />
        </StopCard>
      ))}
    </View>
  );
}

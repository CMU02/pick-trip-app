import { View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { SkeletonBox } from '../atoms/SkeletonBox';

// ContentCard와 동일한 치수로 맞춘 로딩 자리표시자.
const Card = styled(View)`
  background-color: ${COLORS.white};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  overflow: hidden;
  margin-horizontal: 20px;
`;

const Body = styled(View)`
  padding: 14px 16px 16px;
`;

export function ContentCardSkeleton() {
  return (
    <Card>
      <SkeletonBox width="100%" height={180} radius={0} />
      <Body>
        <SkeletonBox width={64} height={20} radius={100} style={{ marginBottom: 10 }} />
        <SkeletonBox width="60%" height={18} radius={4} style={{ marginBottom: 8 }} />
        <SkeletonBox width="85%" height={12} radius={4} style={{ marginBottom: 16 }} />
        <SkeletonBox width={90} height={12} radius={4} />
      </Body>
    </Card>
  );
}

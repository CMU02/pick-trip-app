import { View } from 'react-native';
import styled from 'styled-components';
import { SkeletonBox } from '../atoms/SkeletonBox';

// ContentDetailModal의 실제 레이아웃(썸네일 220px + 본문)과 치수를 맞춘 로딩 자리표시자.
const Body = styled(View)`
  padding: 20px;
`;

export function ContentDetailSkeleton() {
  return (
    <View>
      <SkeletonBox width="100%" height={220} radius={0} />
      <Body>
        <SkeletonBox width={90} height={22} radius={100} style={{ marginBottom: 12 }} />
        <SkeletonBox width="70%" height={24} radius={4} style={{ marginBottom: 12 }} />
        <SkeletonBox width="100%" height={15} radius={4} style={{ marginBottom: 6 }} />
        <SkeletonBox width="80%" height={15} radius={4} style={{ marginBottom: 16 }} />
        <SkeletonBox width="60%" height={16} radius={4} />
      </Body>
    </View>
  );
}

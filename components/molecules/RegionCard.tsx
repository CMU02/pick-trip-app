import { Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import type { Region } from '../../types/region';
import { Badge } from '../atoms/Badge';

interface RegionCardProps {
  region: Region;
  selected: boolean;
  onPress: () => void;
}

const Card = styled(TouchableOpacity)<{ $selected: boolean }>`
  border-radius: 12px;
  overflow: hidden;
  border-width: 2px;
  border-color: ${(p) => (p.$selected ? COLORS.amber500 : COLORS.gray200)};
  background-color: ${(p) => (p.$selected ? COLORS.amber50 : COLORS.white)};
`;

const ImagePlaceholder = styled(View)<{ $color: string }>`
  height: 100px;
  background-color: ${(p) => `${p.$color}44`};
  align-items: center;
  justify-content: center;
`;

const PlaceholderText = styled(Text)`
  color: ${COLORS.gray500};
  font-size: 13px;
`;

const CardBody = styled(View)`
  padding: 16px;
`;

const RegionName = styled(Text)`
  font-size: 20px;
  font-weight: 500;
  color: ${COLORS.gray900};
`;

const Tagline = styled(Text)`
  font-size: 14px;
  color: ${COLORS.gray500};
  margin-top: 4px;
  margin-bottom: 12px;
`;

const BadgeRow = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
`;

const SelectedIndicator = styled(View)`
  border-top-width: 1px;
  border-top-color: ${COLORS.amber100};
  padding-top: 8px;
  padding-horizontal: 16px;
  padding-bottom: 12px;
`;

const SelectedText = styled(Text)`
  color: ${COLORS.amber700};
  font-size: 14px;
  font-weight: 500;
`;

export function RegionCard({ region, selected, onPress }: RegionCardProps) {
  return (
    <Card $selected={selected} onPress={onPress} activeOpacity={0.8}>
      <ImagePlaceholder $color={region.color}>
        <PlaceholderText>{region.name} 대표 이미지</PlaceholderText>
      </ImagePlaceholder>
      <CardBody>
        <RegionName>{region.name}</RegionName>
        <Tagline>{region.tagline}</Tagline>
        <BadgeRow>
          {region.tags.map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </BadgeRow>
      </CardBody>
      {selected && (
        <SelectedIndicator>
          <SelectedText>✓ 선택됨</SelectedText>
        </SelectedIndicator>
      )}
    </Card>
  );
}

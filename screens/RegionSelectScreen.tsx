import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { RegionCard } from '../components/molecules/RegionCard';
import { COLORS } from '../constants/colors';
import { REGIONS } from '../constants/regions';

const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

const Header = styled(View)`
  padding-top: 24px;
  padding-horizontal: 20px;
  padding-bottom: 8px;
`;

const Title = styled(Text)`
  font-size: 24px;
  font-weight: 500;
  color: ${COLORS.gray900};
`;

const Subtitle = styled(Text)`
  font-size: 15px;
  color: ${COLORS.gray500};
  margin-top: 6px;
`;

const CardList = styled(View)`
  padding-horizontal: 20px;
  gap: 16px;
  margin-top: 8px;
`;

const BottomBar = styled(View)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding-top: 12px;
  padding-horizontal: 20px;
  padding-bottom: 28px;
  background-color: ${COLORS.white};
`;

const CTAButton = styled(TouchableOpacity)`
  background-color: ${COLORS.amber500};
  border-radius: 12px;
  padding-vertical: 14px;
  align-items: center;
`;

const CTALabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 16px;
  font-weight: 500;
`;

interface RegionSelectScreenProps {
  onContinue: (regions: string[]) => void;
}

export function RegionSelectScreen({ onContinue }: RegionSelectScreenProps) {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  const handleToggleRegion = (id: string) => {
    setSelectedRegions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Header>
          <Title>어디로 떠나볼까요?</Title>
          <Subtitle>가고 싶은 지역을 선택하세요</Subtitle>
        </Header>
        <CardList>
          {REGIONS.map((region) => (
            <RegionCard
              key={region.id}
              region={region}
              selected={selectedRegions.includes(region.id)}
              onPress={() => handleToggleRegion(region.id)}
            />
          ))}
        </CardList>
      </ScrollView>
      {selectedRegions.length > 0 && (
        <BottomBar>
          <CTAButton onPress={() => onContinue(selectedRegions)} activeOpacity={0.8}>
            <CTALabel>{selectedRegions.length}개 지역 콘텐츠 보기</CTALabel>
          </CTAButton>
        </BottomBar>
      )}
    </ScreenContainer>
  );
}

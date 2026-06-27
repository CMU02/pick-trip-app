import { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { CompanionCard } from '../components/molecules/CompanionCard';
import { COLORS } from '../constants/colors';
import { COMPANIONS } from '../constants/companions';
import type { Companion, CompanionType } from '../types/companion';

interface CompanionSelectScreenProps {
  onContinue: (companions: CompanionType[]) => void;
}

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

const GridContent = styled(View)`
  padding-horizontal: 20px;
  gap: 12px;
  margin-top: 8px;
`;

const Row = styled(View)`
  flex-direction: row;
  gap: 12px;
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

const COMPANION_PAIRS = COMPANIONS.reduce<Companion[][]>((pairs, item, i) => {
  if (i % 2 === 0) pairs.push([item]);
  else pairs[pairs.length - 1].push(item);
  return pairs;
}, []);

export function CompanionSelectScreen({ onContinue }: CompanionSelectScreenProps) {
  const [selectedIds, setSelectedIds] = useState<CompanionType[]>([]);

  const handleToggle = (id: CompanionType) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Header>
          <Title>누구와 함께 가시나요?</Title>
          <Subtitle>동행 조건을 선택하세요</Subtitle>
        </Header>
        <GridContent>
          {COMPANION_PAIRS.map((pair) => (
            <Row key={pair[0].id}>
              {pair.map((companion) => (
                <CompanionCard
                  key={companion.id}
                  companion={companion}
                  selected={selectedIds.includes(companion.id)}
                  onPress={() => handleToggle(companion.id)}
                />
              ))}
              {pair.length === 1 && <View style={{ flex: 1 }} />}
            </Row>
          ))}
        </GridContent>
      </ScrollView>

      {selectedIds.length > 0 && (
        <BottomBar>
          <CTAButton onPress={() => onContinue(selectedIds)} activeOpacity={0.8}>
            <CTALabel>여행 준비 완료!</CTALabel>
          </CTAButton>
        </BottomBar>
      )}
    </ScreenContainer>
  );
}

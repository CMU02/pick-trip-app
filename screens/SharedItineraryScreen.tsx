import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { COLORS } from '../constants/colors';
import { fetchSharedItinerary, type SharedItinerary } from '../services/shareService';

interface SharedItineraryScreenProps {
  token: string;
  onClose: () => void;
}

const ScreenContainer = styled(SafeAreaView)`
  flex: 1;
  background-color: ${COLORS.gray50};
`;

const CenterBox = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
  gap: 12px;
`;

const Header = styled(View)`
  padding-top: 24px;
  padding-horizontal: 20px;
  padding-bottom: 12px;
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

const DayLabel = styled(Text)`
  font-size: 17px;
  font-weight: 700;
  color: ${COLORS.gray900};
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

const StopName = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${COLORS.gray900};
`;

const ReasonText = styled(Text)`
  font-size: 12px;
  color: ${COLORS.teal700};
  margin-top: 6px;
  line-height: 17px;
`;

const CloseButton = styled(TouchableOpacity)`
  margin: 12px 20px 24px;
  padding-vertical: 14px;
  border-radius: 12px;
  align-items: center;
  background-color: ${COLORS.coral500};
`;

const CloseButtonLabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 16px;
  font-weight: 500;
`;

export function SharedItineraryScreen({ token, onClose }: SharedItineraryScreenProps) {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading');
  const [itinerary, setItinerary] = useState<SharedItinerary | null>(null);

  useEffect(() => {
    fetchSharedItinerary(token)
      .then((result) => {
        setItinerary(result);
        setStatus('done');
      })
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <ScreenContainer>
        <CenterBox>
          <ActivityIndicator color={COLORS.coral500} />
        </CenterBox>
      </ScreenContainer>
    );
  }

  if (status === 'error' || !itinerary) {
    return (
      <ScreenContainer>
        <CenterBox>
          <Subtitle>공유된 일정을 찾을 수 없어요.</Subtitle>
          <CloseButton onPress={onClose} activeOpacity={0.8}>
            <CloseButtonLabel>닫기</CloseButtonLabel>
          </CloseButton>
        </CenterBox>
      </ScreenContainer>
    );
  }

  const dayIndexes = Array.from(new Set(itinerary.stops.map((s) => s.day))).sort((a, b) => a - b);

  return (
    <ScreenContainer>
      <Header>
        <Title>{itinerary.title}</Title>
        <Subtitle>다른 사람이 공유한 여행 일정이에요</Subtitle>
      </Header>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {dayIndexes.map((dayIndex) => (
          <View key={dayIndex}>
            <DayLabel>{dayIndex}일차</DayLabel>
            {itinerary.stops
              .filter((stop) => stop.day === dayIndex)
              .map((stop) => (
                <StopCard key={`${stop.day}-${stop.contentId}`}>
                  <StopName>{stop.title ?? stop.contentId}</StopName>
                  <ReasonText>{stop.reason}</ReasonText>
                </StopCard>
              ))}
          </View>
        ))}
      </ScrollView>
      <CloseButton onPress={onClose} activeOpacity={0.8}>
        <CloseButtonLabel>닫기</CloseButtonLabel>
      </CloseButton>
    </ScreenContainer>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Modal, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { DurationSelector } from '../components/molecules/DurationSelector';
import { COLORS } from '../constants/colors';
import type { DurationType } from '../types/trip';

// ─── 스타일 ────────────────────────────────────────────────────────────────

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

const Section = styled(View)`
  margin-top: 24px;
  padding-horizontal: 20px;
`;

const SectionLabel = styled(Text)`
  font-size: 14px;
  color: ${COLORS.gray500};
  margin-bottom: 10px;
`;

const DateButton = styled(TouchableOpacity)`
  background-color: ${COLORS.white};
  border-radius: 12px;
  padding-vertical: 14px;
  padding-horizontal: 16px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
`;

const DateButtonText = styled(Text)<{ $hasValue: boolean }>`
  font-size: 15px;
  color: ${({ $hasValue }) => ($hasValue ? COLORS.gray900 : COLORS.gray500)};
`;

const SummaryText = styled(Text)`
  font-size: 14px;
  color: ${COLORS.gray700};
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

const ModalOverlay = styled(View)`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: flex-end;
`;

const ModalSheet = styled(View)`
  background-color: ${COLORS.white};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 24px 20px 40px;
`;

const ModalTitle = styled(Text)`
  font-size: 16px;
  font-weight: 600;
  color: ${COLORS.gray900};
  text-align: center;
  margin-bottom: 20px;
`;

const PickerRow = styled(View)`
  flex-direction: row;
  margin-bottom: 24px;
`;

const PickerColumnLabel = styled(Text)`
  font-size: 12px;
  color: ${COLORS.gray500};
  text-align: center;
  margin-bottom: 6px;
`;

const ConfirmButton = styled(TouchableOpacity)`
  background-color: ${COLORS.amber500};
  border-radius: 12px;
  padding-vertical: 14px;
  align-items: center;
`;

const ConfirmButtonLabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 16px;
  font-weight: 500;
`;

// ─── 유틸 ──────────────────────────────────────────────────────────────────

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();

const getNights = (type: DurationType, custom: number): number => {
  if (type === 'day') return 0;
  if (type === '1night') return 1;
  if (type === '2night') return 2;
  return custom;
};

const getEndDate = (start: Date, nights: number): Date => {
  const end = new Date(start);
  end.setDate(end.getDate() + nights);
  return end;
};

const formatDate = (date: Date): string => {
  const weekday = WEEKDAYS[date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
};

// ─── ScrollPicker ──────────────────────────────────────────────────────────

interface ScrollPickerProps {
  items: string[];
  selectedIndex: number;
  onValueChange: (index: number) => void;
}

function ScrollPicker({ items, selectedIndex, onValueChange }: ScrollPickerProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [localIndex, setLocalIndex] = useState(selectedIndex);

  // biome-ignore lint/correctness/useExhaustiveDependencies: 초기 스크롤 위치 설정 전용
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_HEIGHT)));
    setLocalIndex(index);
    onValueChange(index);
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={{ height: PICKER_HEIGHT, alignSelf: 'stretch' }}>
      {/* 선택된 항목 하이라이트 */}
      <View
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT * 2,
          left: 4,
          right: 4,
          height: ITEM_HEIGHT,
          backgroundColor: COLORS.amber50,
          borderRadius: 8,
        }}
        pointerEvents="none"
      />
      <ScrollView
        ref={scrollRef}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * 2 }}
      >
        {items.map((item, i) => (
          <View
            key={item}
            style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text
              style={{
                fontSize: i === localIndex ? 17 : 14,
                fontWeight: i === localIndex ? '600' : '400',
                color: i === localIndex ? COLORS.gray900 : COLORS.gray500,
              }}
            >
              {item}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── DatePickerModal ───────────────────────────────────────────────────────

interface DatePickerModalProps {
  visible: boolean;
  initialDate: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

function DatePickerModal({ visible, initialDate, onConfirm, onClose }: DatePickerModalProps) {
  const today = new Date();
  const currentYear = today.getFullYear();

  const years = [currentYear, currentYear + 1, currentYear + 2].map(String);
  const months = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);

  const [yearIdx, setYearIdx] = useState(Math.max(0, initialDate.getFullYear() - currentYear));
  const [monthIdx, setMonthIdx] = useState(initialDate.getMonth());
  const [dayIdx, setDayIdx] = useState(initialDate.getDate() - 1);

  const selectedYear = currentYear + yearIdx;
  const selectedMonth = monthIdx + 1;
  const maxDays = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: maxDays }, (_, i) => `${i + 1}일`);
  const clampedDayIdx = Math.min(dayIdx, maxDays - 1);

  const handleConfirm = () => {
    onConfirm(new Date(selectedYear, selectedMonth - 1, clampedDayIdx + 1));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ModalOverlay>
        {/* 배경 탭하면 닫힘 */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <ModalSheet>
          <ModalTitle>출발 날짜 선택</ModalTitle>
          <PickerRow>
            <View style={{ flex: 1 }}>
              <PickerColumnLabel>년</PickerColumnLabel>
              <ScrollPicker items={years} selectedIndex={yearIdx} onValueChange={setYearIdx} />
            </View>
            <View style={{ flex: 1 }}>
              <PickerColumnLabel>월</PickerColumnLabel>
              <ScrollPicker items={months} selectedIndex={monthIdx} onValueChange={setMonthIdx} />
            </View>
            <View style={{ flex: 1 }}>
              <PickerColumnLabel>일</PickerColumnLabel>
              <ScrollPicker
                key={`${yearIdx}-${monthIdx}`}
                items={days}
                selectedIndex={clampedDayIdx}
                onValueChange={setDayIdx}
              />
            </View>
          </PickerRow>
          <ConfirmButton onPress={handleConfirm} activeOpacity={0.8}>
            <ConfirmButtonLabel>확인</ConfirmButtonLabel>
          </ConfirmButton>
        </ModalSheet>
      </ModalOverlay>
    </Modal>
  );
}

// ─── TripDateScreen ────────────────────────────────────────────────────────

interface TripDateScreenProps {
  onContinue: (tripDate: { startDate: Date; durationType: DurationType; nights: number }) => void;
}

export function TripDateScreen({ onContinue }: TripDateScreenProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [durationType, setDurationType] = useState<DurationType | null>(null);
  const [customNights, setCustomNights] = useState(3);
  const [showPicker, setShowPicker] = useState(false);

  const nights = durationType ? getNights(durationType, customNights) : 0;
  const endDate = startDate && durationType ? getEndDate(startDate, nights) : null;

  const summaryText = (() => {
    if (!startDate || !durationType) return null;
    if (durationType === 'day') return `${formatDate(startDate)} · 당일치기`;
    return `${formatDate(startDate)} ~ ${formatDate(endDate ?? new Date())} · ${nights}박 ${nights + 1}일`;
  })();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Header>
          <Title>언제 떠나볼까요?</Title>
          <Subtitle>여행 날짜와 기간을 선택하세요</Subtitle>
        </Header>

        <Section>
          <SectionLabel>출발 날짜</SectionLabel>
          <DateButton onPress={() => setShowPicker(true)} activeOpacity={0.8}>
            <DateButtonText $hasValue={!!startDate}>
              {startDate ? formatDate(startDate) : '날짜를 선택하세요'}
            </DateButtonText>
          </DateButton>
        </Section>

        <Section>
          <SectionLabel>여행 기간</SectionLabel>
          <DurationSelector
            selected={durationType}
            customNights={customNights}
            onSelect={setDurationType}
            onCustomNightsChange={setCustomNights}
          />
          {summaryText && <SummaryText>{summaryText}</SummaryText>}
        </Section>
      </ScrollView>

      {startDate && durationType && (
        <BottomBar>
          <CTAButton
            onPress={() => {
              if (startDate && durationType) {
                onContinue({ startDate, durationType, nights });
              }
            }}
            activeOpacity={0.8}
          >
            <CTALabel>동행 조건 설정하기</CTALabel>
          </CTAButton>
        </BottomBar>
      )}

      <DatePickerModal
        visible={showPicker}
        initialDate={startDate ?? new Date()}
        onConfirm={(date) => {
          setStartDate(date);
          setShowPicker(false);
        }}
        onClose={() => setShowPicker(false)}
      />
    </ScreenContainer>
  );
}

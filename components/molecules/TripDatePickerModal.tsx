import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { FONT } from '../../constants/typography';
import type { DurationType } from '../../types/trip';
import { DurationSelector } from './DurationSelector';

export interface TripDateValue {
  startDate: Date;
  durationType: DurationType;
  nights: number;
}

interface TripDatePickerModalProps {
  visible: boolean;
  initialValue: TripDateValue | null;
  onConfirm: (value: TripDateValue) => void;
  onClose: () => void;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 3;
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
  font-size: 17px;
  font-family: ${FONT.bold};
  color: ${COLORS.gray900};
  margin-bottom: 4px;
`;

const ModalSubtitle = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 13px;
  color: ${COLORS.gray500};
  margin-bottom: 20px;
`;

const SectionLabel = styled(Text)`
  font-size: 13px;
  font-family: ${FONT.semibold};
  color: ${COLORS.gray500};
  margin-bottom: 10px;
`;

const PickerRow = styled(View)`
  flex-direction: row;
  margin-bottom: 24px;
`;

const PickerColumnLabel = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
  text-align: center;
  margin-bottom: 6px;
`;

const SummaryText = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 13px;
  color: ${COLORS.gray700};
  margin-top: 12px;
  margin-bottom: 4px;
`;

const ConfirmButton = styled(TouchableOpacity)<{ $disabled: boolean }>`
  background-color: ${({ $disabled }) => ($disabled ? COLORS.gray200 : COLORS.coral500)};
  border-radius: 12px;
  padding-vertical: 14px;
  align-items: center;
  margin-top: 20px;
`;

const ConfirmButtonLabel = styled(Text)<{ $disabled: boolean }>`
  color: ${({ $disabled }) => ($disabled ? COLORS.gray400 : COLORS.white)};
  font-size: 16px;
  font-family: ${FONT.medium};
`;

interface ScrollPickerProps {
  items: string[];
  selectedIndex: number;
  onValueChange: (index: number) => void;
}

function ScrollPicker({ items, selectedIndex, onValueChange }: ScrollPickerProps) {
  const scrollRef = useRef<ScrollView>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: 초기 스크롤 위치 설정 전용
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleScrollEnd = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(0, Math.min(items.length - 1, Math.round(y / ITEM_HEIGHT)));
    onValueChange(index);
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={{ height: PICKER_HEIGHT, alignSelf: 'stretch' }}>
      <View
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT,
          left: 4,
          right: 4,
          height: ITEM_HEIGHT,
          backgroundColor: COLORS.coral50,
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
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
      >
        {items.map((item, i) => (
          <View
            key={item}
            style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text
              style={{
                fontSize: i === selectedIndex ? 16 : 13,
                fontFamily: i === selectedIndex ? FONT.semibold : FONT.regular,
                color: i === selectedIndex ? COLORS.gray900 : COLORS.gray500,
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

export function TripDatePickerModal({
  visible,
  initialValue,
  onConfirm,
  onClose,
}: TripDatePickerModalProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthNum = today.getMonth() + 1; // 1-indexed
  const currentDayNum = today.getDate();
  const initialDate = initialValue?.startDate ?? today;

  const years = [currentYear, currentYear + 1, currentYear + 2].map(String);

  // 초기값이 올해라면 지난 달은 목록에서 제외한 상태로 인덱스를 맞춘다
  const initialYear = initialDate.getFullYear();
  const initialIsCurrentYear = initialYear === currentYear;
  const initialMonthStart = initialIsCurrentYear ? currentMonthNum : 1;
  const initialMonthNum = initialDate.getMonth() + 1;
  const initialIsCurrentMonth = initialIsCurrentYear && initialMonthNum === currentMonthNum;
  const initialDayStart = initialIsCurrentMonth ? currentDayNum : 1;

  const [yearIdx, setYearIdx] = useState(Math.max(0, initialYear - currentYear));
  const [monthIdx, setMonthIdx] = useState(Math.max(0, initialMonthNum - initialMonthStart));
  const [dayIdx, setDayIdx] = useState(Math.max(0, initialDate.getDate() - initialDayStart));
  const [durationType, setDurationType] = useState<DurationType | null>(
    initialValue?.durationType ?? null,
  );
  const [customNights, setCustomNights] = useState(
    initialValue?.durationType === 'custom' ? initialValue.nights : 3,
  );

  const selectedYear = currentYear + yearIdx;
  const isCurrentYear = yearIdx === 0;

  // 올해면 지난 달을 제외하고 이번 달부터 12월까지만 노출
  const monthStart = isCurrentYear ? currentMonthNum : 1;
  const months = Array.from({ length: 12 - monthStart + 1 }, (_, i) => `${monthStart + i}월`);
  const clampedMonthIdx = Math.min(monthIdx, months.length - 1);
  const selectedMonth = monthStart + clampedMonthIdx;

  // 이번 달이면 지난 날짜를 제외하고 오늘부터 말일까지만 노출
  const isCurrentMonth = isCurrentYear && selectedMonth === currentMonthNum;
  const dayStart = isCurrentMonth ? currentDayNum : 1;
  const maxDays = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: maxDays - dayStart + 1 }, (_, i) => `${dayStart + i}일`);
  const clampedDayIdx = Math.min(dayIdx, days.length - 1);
  const selectedDay = dayStart + clampedDayIdx;
  const startDate = new Date(selectedYear, selectedMonth - 1, selectedDay);

  const nights = durationType ? getNights(durationType, customNights) : 0;
  const endDate = durationType ? getEndDate(startDate, nights) : null;

  const summaryText = durationType
    ? durationType === 'day'
      ? `${formatDate(startDate)} · 당일치기`
      : `${formatDate(startDate)} ~ ${formatDate(endDate ?? startDate)} · ${nights}박 ${nights + 1}일`
    : null;

  const ready = durationType !== null;

  const handleConfirm = () => {
    if (!durationType) return;
    onConfirm({ startDate, durationType, nights });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ModalOverlay>
        {/* 배경 탭하면 닫힘 */}
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        <ModalSheet>
          <ModalTitle>언제 떠나볼까요?</ModalTitle>
          <ModalSubtitle>여행 날짜와 기간을 선택하세요</ModalSubtitle>

          <SectionLabel>출발 날짜</SectionLabel>
          <PickerRow>
            <View style={{ flex: 1 }}>
              <PickerColumnLabel>년</PickerColumnLabel>
              <ScrollPicker items={years} selectedIndex={yearIdx} onValueChange={setYearIdx} />
            </View>
            <View style={{ flex: 1 }}>
              <PickerColumnLabel>월</PickerColumnLabel>
              <ScrollPicker
                key={yearIdx}
                items={months}
                selectedIndex={clampedMonthIdx}
                onValueChange={setMonthIdx}
              />
            </View>
            <View style={{ flex: 1 }}>
              <PickerColumnLabel>일</PickerColumnLabel>
              <ScrollPicker
                key={`${yearIdx}-${clampedMonthIdx}`}
                items={days}
                selectedIndex={clampedDayIdx}
                onValueChange={setDayIdx}
              />
            </View>
          </PickerRow>

          <SectionLabel>여행 기간</SectionLabel>
          <DurationSelector
            selected={durationType}
            customNights={customNights}
            onSelect={setDurationType}
            onCustomNightsChange={setCustomNights}
          />
          {summaryText && <SummaryText>{summaryText}</SummaryText>}

          <ConfirmButton $disabled={!ready} disabled={!ready} onPress={handleConfirm}>
            <ConfirmButtonLabel $disabled={!ready}>확인</ConfirmButtonLabel>
          </ConfirmButton>
        </ModalSheet>
      </ModalOverlay>
    </Modal>
  );
}

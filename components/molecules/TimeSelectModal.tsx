import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { FONT } from '../../constants/typography';

interface TimeSelectModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selected: string | null;
  onSelect: (time: string) => void;
  onClose: () => void;
}

const Overlay = styled(TouchableOpacity)`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const Sheet = styled(TouchableOpacity)`
  width: 100%;
  max-height: 70%;
  background-color: ${COLORS.white};
  border-radius: 20px;
  padding: 24px 20px;
`;

const Title = styled(Text)`
  font-size: 17px;
  font-family: ${FONT.bold};
  color: ${COLORS.gray900};
  margin-bottom: 16px;
`;

const Grid = styled(View)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

// 한 줄 4개. 23%면 좁은 폰에서 gap(8px×3)을 더해 100%를 넘겨 3개씩 꺾여서 22%로 둔다.
const Chip = styled(TouchableOpacity)<{ $active: boolean }>`
  width: 22%;
  padding-vertical: 10px;
  border-radius: 10px;
  align-items: center;
  border-width: 1px;
  border-color: ${({ $active }) => ($active ? COLORS.coral500 : COLORS.gray200)};
  background-color: ${({ $active }) => ($active ? COLORS.coral50 : COLORS.white)};
`;

const ChipLabel = styled(Text)<{ $active: boolean }>`
  font-family: ${({ $active }) => ($active ? FONT.bold : FONT.medium)};
  font-size: 14px;
  color: ${({ $active }) => ($active ? COLORS.coral700 : COLORS.gray700)};
`;

// 우선순위 화면의 "일차별 시작 시각"을 한 번에 고르는 모달. 30분 단위 ± 스테퍼로는
// 09:00 → 18:00까지 18번을 눌러야 해서, 서버 허용 범위의 시각을 격자로 늘어놓는다.
// 네이티브 시간 피커를 안 쓰는 건 OTA로 내보내기 위해서다(네이티브 모듈 추가 = 새 빌드).
export function TimeSelectModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: TimeSelectModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Overlay activeOpacity={1} onPress={onClose}>
        <Sheet activeOpacity={1}>
          <Title>{title}</Title>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Grid>
              {options.map((time) => {
                const active = time === selected;
                return (
                  <Chip
                    key={time}
                    $active={active}
                    onPress={() => onSelect(time)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <ChipLabel $active={active}>{time}</ChipLabel>
                  </Chip>
                );
              })}
            </Grid>
          </ScrollView>
        </Sheet>
      </Overlay>
    </Modal>
  );
}

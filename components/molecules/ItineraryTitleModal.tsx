import { useEffect, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { FONT } from '../../constants/typography';

interface ItineraryTitleModalProps {
  visible: boolean;
  initialTitle: string;
  isSaving: boolean;
  heading: string;
  subtitle: string;
  onConfirm: (title: string) => void;
  onClose: () => void;
}

const ModalOverlay = styled(TouchableOpacity)`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const ModalSheet = styled(TouchableOpacity)`
  width: 100%;
  background-color: ${COLORS.white};
  border-radius: 20px;
  padding: 24px 20px;
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

const NameInput = styled(TextInput)`
  border-width: 1px;
  border-color: ${COLORS.gray200};
  border-radius: 12px;
  padding: 14px;
  font-size: 15px;
  font-family: ${FONT.medium};
  color: ${COLORS.gray900};
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

// 여행 이름을 입력받는 모달. "일정 저장" 시 처음 이름을 정할 때(ItineraryResultScreen)와
// 저장된 일정의 이름을 나중에 바꿀 때(SavedItineraryScreen) 둘 다 여기서 쓴다 — heading/subtitle만
// 상황에 맞게 바꿔서 넘긴다.
export function ItineraryTitleModal({
  visible,
  initialTitle,
  isSaving,
  heading,
  subtitle,
  onConfirm,
  onClose,
}: ItineraryTitleModalProps) {
  const [title, setTitle] = useState(initialTitle);

  // 열릴 때마다 그 시점의 기본 이름으로 다시 맞춘다 (이전에 열었을 때 지웠던 값이 남지 않게).
  // biome-ignore lint/correctness/useExhaustiveDependencies: visible이 true로 바뀌는 시점에만 반영하면 된다
  useEffect(() => {
    if (visible) setTitle(initialTitle);
  }, [visible]);

  const trimmed = title.trim();
  const ready = trimmed.length > 0 && !isSaving;

  const handleConfirm = () => {
    if (!ready) return;
    onConfirm(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* 배경(카드 바깥) 탭하면 닫힘. 카드 자체도 터치 가능한 컴포넌트로 감싸서 탭이 배경까지 안 뚫고 가게 한다. */}
      <ModalOverlay activeOpacity={1} onPress={onClose}>
        <ModalSheet activeOpacity={1} onPress={() => {}}>
          <ModalTitle>{heading}</ModalTitle>
          <ModalSubtitle>{subtitle}</ModalSubtitle>

          <NameInput
            value={title}
            onChangeText={setTitle}
            placeholder="여행 이름"
            placeholderTextColor={COLORS.gray400}
            autoFocus
            maxLength={30}
            returnKeyType="done"
            onSubmitEditing={handleConfirm}
          />

          <ConfirmButton $disabled={!ready} disabled={!ready} onPress={handleConfirm}>
            <ConfirmButtonLabel $disabled={!ready}>
              {isSaving ? '저장 중...' : '저장'}
            </ConfirmButtonLabel>
          </ConfirmButton>
        </ModalSheet>
      </ModalOverlay>
    </Modal>
  );
}

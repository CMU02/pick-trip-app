import { useEffect, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { FONT } from '../../constants/typography';

interface SaveItineraryModalProps {
  visible: boolean;
  initialTitle: string;
  isSaving: boolean;
  onConfirm: (title: string) => void;
  onConfirmAndGoHome: (title: string) => void;
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

const GoHomeButton = styled(TouchableOpacity)`
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  padding-vertical: 14px;
  align-items: center;
  margin-top: 10px;
`;

const GoHomeButtonLabel = styled(Text)`
  color: ${COLORS.gray700};
  font-size: 15px;
  font-family: ${FONT.semibold};
`;

export function SaveItineraryModal({
  visible,
  initialTitle,
  isSaving,
  onConfirm,
  onConfirmAndGoHome,
  onClose,
}: SaveItineraryModalProps) {
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

  const handleConfirmAndGoHome = () => {
    if (!ready) return;
    onConfirmAndGoHome(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* 배경(카드 바깥) 탭하면 닫힘. 카드 자체도 터치 가능한 컴포넌트로 감싸서 탭이 배경까지 안 뚫고 가게 한다. */}
      <ModalOverlay activeOpacity={1} onPress={onClose}>
        <ModalSheet activeOpacity={1} onPress={() => {}}>
          <ModalTitle>여행 이름을 정해주세요</ModalTitle>
          <ModalSubtitle>나중에 "저장한 여행" 목록에서 이 이름으로 보여요</ModalSubtitle>

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
          <GoHomeButton disabled={!ready} onPress={handleConfirmAndGoHome}>
            <GoHomeButtonLabel>저장하고 홈으로 가기</GoHomeButtonLabel>
          </GoHomeButton>
        </ModalSheet>
      </ModalOverlay>
    </Modal>
  );
}

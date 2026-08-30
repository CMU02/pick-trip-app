import { Modal, Text, TouchableOpacity, View } from 'react-native';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { FONT } from '../../constants/typography';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  // true면 확인 버튼을 경고색(coral)으로 강조한다 — 삭제처럼 되돌리기 어려운 동작에 쓴다.
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
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

const ModalMessage = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 13px;
  color: ${COLORS.gray500};
  margin-top: 4px;
`;

const ButtonRow = styled(View)`
  flex-direction: row;
  gap: 8px;
  margin-top: 20px;
`;

const CancelButton = styled(TouchableOpacity)`
  flex: 1;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  padding-vertical: 14px;
  align-items: center;
`;

const CancelButtonLabel = styled(Text)`
  color: ${COLORS.gray700};
  font-size: 15px;
  font-family: ${FONT.semibold};
`;

const ConfirmButton = styled(TouchableOpacity)<{ $destructive: boolean }>`
  flex: 1;
  border-radius: 12px;
  padding-vertical: 14px;
  align-items: center;
  background-color: ${({ $destructive }) => ($destructive ? COLORS.coral500 : COLORS.gray900)};
`;

const ConfirmButtonLabel = styled(Text)`
  color: ${COLORS.white};
  font-size: 15px;
  font-family: ${FONT.semibold};
`;

// 화면 어디서든 재사용하는 확인 모달. OS 기본 Alert.alert 대신 앱 디자인이 그대로 적용된
// 확인창이 필요할 때(삭제, 나가기 등) title/message/버튼 라벨만 바꿔서 쓴다.
export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* 배경(카드 바깥) 탭하면 취소. 카드 자체도 터치 가능한 컴포넌트로 감싸서 탭이 배경까지 안 뚫고 가게 한다. */}
      <ModalOverlay activeOpacity={1} onPress={onCancel}>
        <ModalSheet activeOpacity={1} onPress={() => {}}>
          <ModalTitle>{title}</ModalTitle>
          {message ? <ModalMessage>{message}</ModalMessage> : null}

          <ButtonRow>
            <CancelButton onPress={onCancel}>
              <CancelButtonLabel>{cancelLabel}</CancelButtonLabel>
            </CancelButton>
            <ConfirmButton $destructive={destructive} onPress={onConfirm}>
              <ConfirmButtonLabel>{confirmLabel}</ConfirmButtonLabel>
            </ConfirmButton>
          </ButtonRow>
        </ModalSheet>
      </ModalOverlay>
    </Modal>
  );
}

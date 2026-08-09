// 커스텀 폰트를 쓰면 React Native에서 font-weight 숫자값을 신뢰할 수 없다.
// iOS와 Android가 다르게 처리해서 굵기가 어긋나거나 합성 볼드가 걸린다.
// 그래서 굵기마다 font-family를 직접 지정한다.
export const FONT = {
  regular: 'Paperlogy-4Regular',
  medium: 'Paperlogy-5Medium',
  semibold: 'Paperlogy-6SemiBold',
  bold: 'Paperlogy-7Bold',
} as const;

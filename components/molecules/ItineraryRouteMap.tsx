import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import styled from 'styled-components';
import { COLORS } from '../../constants/colors';
import { getDayRouteColor } from '../../constants/dayColors';
import { KAKAO_MAP_JS_KEY } from '../../constants/kakao';
import { FONT } from '../../constants/typography';
import type { Content } from '../../types/content';
import type { ItineraryStop } from '../../types/itinerary';
import type { DayRoute } from '../../types/route';
import { computeDayHops } from '../../utils/geoDistance';
import { buildKakaoRouteLink } from '../../utils/kakaoDirectionsLink';
import { buildKakaoRouteMapHtml, type RouteMapDay } from '../../utils/kakaoMapHtml';

interface ItineraryRouteMapProps {
  stops: ItineraryStop[];
  contentById: Record<string, Content | undefined>;
  routeByDay: Record<number, DayRoute | null>;
  totalDays: number;
  selectedDay: number;
  onSelectDay: (day: number) => void;
}

const Wrapper = styled(View)`
  margin: 8px 20px 4px;
`;

const MapWrapper = styled(View)`
  width: 100%;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
  border-width: 1px;
  border-color: ${COLORS.gray200};
  margin-bottom: 10px;
`;

const MapPlaceholder = styled(View)`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${COLORS.gray50};
  padding: 12px;
`;

const MapPlaceholderText = styled(Text)`
  font-family: ${FONT.regular};
  font-size: 12px;
  color: ${COLORS.gray500};
  text-align: center;
`;

const TopRow = styled(View)`
  flex-direction: row;
  justify-content: flex-end;
  margin-bottom: 8px;
`;

const DirectionsLink = styled(TouchableOpacity)`
  flex-direction: row;
  align-items: center;
  gap: 2px;
`;

const DirectionsLinkLabel = styled(Text)`
  font-family: ${FONT.medium};
  font-size: 13px;
  color: ${COLORS.coral500};
`;

const TabRow = styled(View)`
  flex-direction: row;
  gap: 8px;
`;

const DayTab = styled(TouchableOpacity)<{ $active: boolean; $color: string }>`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding-vertical: 6px;
  padding-horizontal: 12px;
  border-radius: 100px;
  background-color: ${({ $active, $color }) => ($active ? $color : COLORS.white)};
  border-width: 1px;
  border-color: ${({ $color }) => $color};
`;

const DayTabDot = styled(View)<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 100px;
  background-color: ${({ $color }) => $color};
`;

const DayTabLabel = styled(Text)<{ $active: boolean }>`
  font-size: 13px;
  font-family: ${({ $active }) => ($active ? FONT.bold : FONT.medium)};
  color: ${({ $active }) => ($active ? COLORS.white : COLORS.gray700)};
`;

// 일정 전체 경로를 일차별 색으로 구분해 지도 위에 그리고, 아래 탭으로 일차를 고를 수 있게 한다.
// 실제 표시 값은 routeByDay(useItineraryRoutes)를 우선 쓰고, 아직 조회 전이거나 실패했으면
// 좌표로 즉석에서 계산한 직선거리로 대신 채운다(지도가 빈 채로 보이지 않도록).
export function ItineraryRouteMap({
  stops,
  contentById,
  routeByDay,
  totalDays,
  selectedDay,
  onSelectDay,
}: ItineraryRouteMapProps) {
  const dayList = Array.from({ length: totalDays }, (_, i) => i + 1);

  const mapDays = useMemo<RouteMapDay[]>(() => {
    return dayList
      .map((day): RouteMapDay | null => {
        const dayStops = stops.filter((stop) => stop.day === day);
        const points = dayStops
          .map((stop) => contentById[stop.contentId])
          .filter((content): content is Content => content != null)
          .map((content) => ({ latitude: content.latitude, longitude: content.longitude }));
        if (points.length === 0) return null;

        const route = routeByDay[day];
        const hops =
          route?.legs.map((leg) => leg.distanceKm) ??
          computeDayHops(dayStops, contentById).map((hop) => hop.distanceKm);

        return {
          dayIndex: day,
          color: getDayRouteColor(day),
          opacity: day === selectedDay ? 1 : 0.35,
          points: points.map((point, index) => ({
            ...point,
            distanceToNextKm: hops[index],
          })),
        };
      })
      .filter((day): day is RouteMapDay => day !== null);
  }, [dayList, stops, contentById, routeByDay, selectedDay]);

  if (mapDays.every((day) => day.points.length < 2)) return null;

  // 지금 고른 일차 순서대로 카카오맵 길찾기 링크를 만든다. 좌표를 모르는 콘텐츠는 건너뛴다 —
  // 지도 위 폴리라인(mapDays)과 같은 기준.
  const selectedDayWaypoints = stops
    .filter((stop) => stop.day === selectedDay)
    .map((stop) => contentById[stop.contentId])
    .filter((content): content is Content => content != null)
    .map((content) => ({
      name: content.name,
      latitude: content.latitude,
      longitude: content.longitude,
    }));
  const directionsLink = buildKakaoRouteLink(selectedDayWaypoints);

  return (
    <Wrapper>
      {directionsLink && (
        <TopRow>
          <DirectionsLink onPress={() => Linking.openURL(directionsLink)} activeOpacity={0.7}>
            <DirectionsLinkLabel>길찾기</DirectionsLinkLabel>
            <Ionicons name="arrow-forward" size={13} color={COLORS.coral500} />
          </DirectionsLink>
        </TopRow>
      )}
      <MapWrapper>
        {KAKAO_MAP_JS_KEY ? (
          <WebView
            originWhitelist={['*']}
            scrollEnabled={false}
            source={{ html: buildKakaoRouteMapHtml({ appKey: KAKAO_MAP_JS_KEY, days: mapDays }) }}
          />
        ) : (
          <MapPlaceholder>
            <MapPlaceholderText>
              카카오맵 키가 아직 설정되지 않았어요.{'\n'}
              EXPO_PUBLIC_KAKAO_MAP_JS_KEY를 .env에 추가해주세요.
            </MapPlaceholderText>
          </MapPlaceholder>
        )}
      </MapWrapper>
      {dayList.length > 1 && (
        <TabRow>
          {dayList.map((day) => {
            const color = getDayRouteColor(day);
            const active = day === selectedDay;
            return (
              <DayTab
                key={day}
                $active={active}
                $color={color}
                onPress={() => onSelectDay(day)}
                activeOpacity={0.8}
              >
                <DayTabDot $color={active ? COLORS.white : color} />
                <DayTabLabel $active={active}>{day}일차</DayTabLabel>
              </DayTab>
            );
          })}
        </TabRow>
      )}
    </Wrapper>
  );
}

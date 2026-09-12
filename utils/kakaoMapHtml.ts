// 카카오맵은 리액트 네이티브 전용 공식 SDK가 없어서, WebView 안에 카카오맵 JS SDK를 띄우는
// HTML을 통째로 넣는 방식으로 쓴다. 지도 하나에 마커 하나(+이름 라벨)만 있으면 되는 단순한
// 쓰임이라, 서버에 따로 페이지를 호스팅하지 않고 인라인 HTML 문자열로 바로 넘긴다.
//
// source에 baseUrl을 안 줘서 이 HTML은 어느 도메인에서도 로드된 적 없는 걸로 취급된다.
// 그래서 sdk.js를 요청할 때 Referer가 안 실리는데, 카카오맵 API는 Referer가 아예 없는
// 요청은 카카오 콘솔에 도메인을 등록했는지와 상관없이 통과시켜준다(직접 확인함) — 그래서
// 카카오 디벨로퍼스에 별도 Web 플랫폼 도메인 등록 없이도 이 방식이 동작한다.
export function buildKakaoMapHtml(params: {
  appKey: string;
  latitude: number;
  longitude: number;
  label: string;
}): string {
  const { appKey, latitude, longitude, label } = params;
  // label은 장소 이름(사용자 데이터)이라, <script> 안에 그대로 꽂으면 따옴표 등으로 깨질 수
  // 있다. JSON.stringify로 안전한 JS 문자열 리터럴로 이스케이프해서 넣는다.
  // 근데 JSON.stringify는 따옴표·역슬래시만 처리하고 꺾쇠(<)는 그대로 둔다 — 이름에 우연히
  // "</script>"가 들어있으면 HTML 파서가 JS를 파싱하기도 전에 그 지점에서 스크립트 태그를
  // 끊어버린다(뒷부분은 그냥 문서 본문으로 렌더됨). 꺾쇠를 JS 유니코드 이스케이프
  // 6글자(백슬래시+u003c)로 한 번 더 바꿔두면, HTML 파서는 리터럴 꺾쇠를 못 보고 그냥
  // 텍스트로 지나가고, JS 엔진이 문자열을 실행할 때만 꺾쇠로 되돌려 읽는다.
  const safeLabel = JSON.stringify(label).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false"></script>
  <script>
    kakao.maps.load(function () {
      var center = new kakao.maps.LatLng(${latitude}, ${longitude});
      var map = new kakao.maps.Map(document.getElementById('map'), {
        center: center,
        level: 4,
      });
      map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);

      new kakao.maps.Marker({ position: center, map: map });

      // 기본 마커 이미지는 핀 끝(뾰족한 지점)이 좌표에 정확히 맞닿도록 세로 37px 크기로
      // 렌더링된다(카카오맵 기본 마커 규격). 라벨을 핀 머리(이미지 맨 위) 바로 위에 띄우려면
      // yAnchor:1(라벨 박스 하단을 좌표에 맞춤)로 기준을 잡은 뒤, 마커 높이(37px)만큼 위로
      // 밀어 올리고 약간의 여백(6px)을 더한다.
      var content = document.createElement('div');
      content.style.cssText =
        'padding:4px 10px;background:#111827;color:#fff;font-size:12px;' +
        'font-weight:600;border-radius:100px;white-space:nowrap;transform:translateY(-43px);';
      content.innerText = ${safeLabel};
      new kakao.maps.CustomOverlay({
        position: center,
        content: content,
        yAnchor: 1,
      }).setMap(map);

      // 카카오맵은 지도를 만든 시점의 컨테이너 크기를 내부에 그대로 굳혀버려서, 그 뒤에
      // 웹뷰 높이가 최종 크기로 자리 잡으면(RN 쪽 레이아웃이 한 프레임 늦게 끝나는 경우가
      // 흔하다) 지도 내부 좌표계가 낡은 크기 기준으로 남아 핀이 중앙에서 벗어나 보인다.
      // relayout으로 실제 크기를 다시 재고 center를 다시 맞춰서 바로잡는다.
      setTimeout(function () {
        map.relayout();
        map.setCenter(center);
      }, 200);
    });
  </script>
</body>
</html>`;
}

export interface RouteMapPoint {
  latitude: number;
  longitude: number;
  /** 다음 지점까지 구간 거리(km). 그 일차의 마지막 지점이면 없다. */
  distanceToNextKm?: number;
}

export interface RouteMapDay {
  dayIndex: number;
  /** 이 일차의 마커·선 색(hex). constants/dayColors.ts의 getDayRouteColor로 정한다. */
  color: string;
  points: RouteMapPoint[];
  /** 일차 탭에서 다른 날을 골랐을 때 이 날을 흐리게 보여주기 위한 값(0~1). 기본 1. */
  opacity?: number;
}

/**
 * 일정 전체 경로를 한 지도에 그린다. 일차마다 색을 구분해 순서대로 선으로 잇고,
 * 마커에는 그 일차 안에서의 방문 순번을, 구간 중점에는 거리 라벨을 붙인다.
 * baseUrl을 안 주는 이유·Referer 관련 동작은 buildKakaoMapHtml 상단 주석과 같다.
 *
 * 확대 범위(bounds)는 전체 일정이 아니라 selectedDayIndex 하루치 좌표만으로 잡는다.
 * 예전엔 모든 일차의 좌표를 합쳐 bounds를 잡았는데, 그러면 하동 1일차·영주 2일차처럼
 * 일차별 동선이 멀리 떨어져 있을 때 그 전체를 다 담으려고 지도가 확 줌아웃되고, 정작
 * 보고 있는 하루 안의 지점들은 화면상 너무 다닥다닥 붙어 번호·경로선이 겹쳐 보였다.
 * 선택된 날짜에 좌표가 없는(길이<1) 예외적인 경우에만 전체 좌표로 폴백한다.
 */
export function buildKakaoRouteMapHtml(params: {
  appKey: string;
  days: RouteMapDay[];
  selectedDayIndex: number;
}): string {
  const { appKey, days, selectedDayIndex } = params;
  // 좌표는 숫자라 안전하지만, 이 객체 전체를 <script> 안에 통째로 꽂으므로 문자열이
  // 섞여 들어올 여지를 없애기 위해 JSON.stringify로 한 번에 이스케이프한다.
  // 지금은 color(hex)·숫자뿐이라 당장 위험하진 않지만, RouteMapDay/RouteMapPoint에
  // 문자열 필드(예: 지점 이름)가 나중에 늘면 buildKakaoMapHtml의 safeLabel과 같은
  // "</script>" 조기 종료 문제가 그대로 생긴다. 미리 같은 방식으로 막아둔다.
  const safeDays = JSON.stringify(days).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false"></script>
  <script>
    var days = ${safeDays};
    var selectedDayIndex = ${JSON.stringify(selectedDayIndex)};

    kakao.maps.load(function () {
      var map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(35.8, 128.4),
        level: 8,
      });
      map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);

      // allBounds는 폴백용, selectedBounds가 실제로 화면을 맞추는 기준이다.
      var allBounds = new kakao.maps.LatLngBounds();
      var selectedBounds = new kakao.maps.LatLngBounds();

      days.forEach(function (day) {
        var path = [];
        var opacity = typeof day.opacity === 'number' ? day.opacity : 1;

        day.points.forEach(function (point, index) {
          var position = new kakao.maps.LatLng(point.latitude, point.longitude);
          path.push(position);
          allBounds.extend(position);
          if (day.dayIndex === selectedDayIndex) selectedBounds.extend(position);

          var marker = document.createElement('div');
          marker.style.cssText =
            'width:24px;height:24px;border-radius:100px;background:' + day.color + ';' +
            'color:#fff;font-size:12px;font-weight:700;display:flex;' +
            'align-items:center;justify-content:center;border:2px solid #fff;' +
            'box-shadow:0 1px 4px rgba(0,0,0,0.35);opacity:' + opacity + ';';
          marker.innerText = String(index + 1);
          // zIndex를 명시하지 않으면 CustomOverlay는 생성 순서대로 쌓여서, 나중에 그려진
          // 다른 지점의 거리 라벨이 먼저 그려진 마커 번호를 가릴 수 있다. 지점이 서로
          // 가까워 겹치더라도 방문 순번(마커)이 항상 라벨보다 위에 보이도록 고정한다.
          new kakao.maps.CustomOverlay({ position: position, content: marker, zIndex: 20 }).setMap(
            map,
          );

          if (typeof point.distanceToNextKm === 'number' && index < day.points.length - 1) {
            var next = day.points[index + 1];
            var midpoint = new kakao.maps.LatLng(
              (point.latitude + next.latitude) / 2,
              (point.longitude + next.longitude) / 2
            );
            var label = document.createElement('div');
            // 라벨을 두 지점을 잇는 선 한가운데(원래 앵커 좌표)에 그대로 두면, 그 지점이
            // 마침 다른 지점의 마커와 겹칠 때 라벨까지 같이 뭉쳐 보인다. transform으로
            // 지도 좌표는 그대로 두고 화면상으로만 위로 살짝 띄워서, 마커 위치와 라벨이
            // 겹치는 경우를 줄인다(buildKakaoMapHtml의 단일 마커 라벨과 같은 방식).
            label.style.cssText =
              'padding:2px 8px;background:#111827;color:#fff;font-size:11px;' +
              'font-weight:600;border-radius:100px;white-space:nowrap;opacity:' + opacity + ';' +
              'transform:translateY(-16px);';
            label.innerText = point.distanceToNextKm.toFixed(1) + 'km';
            new kakao.maps.CustomOverlay({
              position: midpoint,
              content: label,
              zIndex: 10,
            }).setMap(map);
          }
        });

        new kakao.maps.Polyline({
          path: path,
          strokeWeight: 4,
          strokeColor: day.color,
          strokeOpacity: 0.85 * opacity,
          strokeStyle: 'solid',
        }).setMap(map);
      });

      function fit() {
        // 선택된 일차에 좌표가 있으면 그 범위로, 없으면(예외 상황) 전체 좌표로 맞춘다.
        var target = !selectedBounds.isEmpty() ? selectedBounds : allBounds;
        if (!target.isEmpty()) {
          map.setBounds(target, 60);
          // setBounds가 고르는 확대 수준은 좌표를 여백 없이 다 담는 데만 맞춰져 있어서,
          // 지점이 넓게 퍼져 있으면 카카오맵 라벨 기준 "도" 단위가 보일 만큼 줌아웃된다.
          // 두 단계까지 당기면 "시.군" 단위까지 넘어가 버려서(2026-09-12 확인), 한 단계만
          // 더 확대해 "시.군~도" 사이 정도로 보이게 한다.
          map.setLevel(Math.max(1, map.getLevel() - 1));
        }
      }
      fit();

      // 컨테이너 크기가 뒤늦게 자리 잡는 문제 보정 — buildKakaoMapHtml 상단 주석과 같은 이유.
      setTimeout(function () {
        map.relayout();
        fit();
      }, 200);
    });
  </script>
</body>
</html>`;
}

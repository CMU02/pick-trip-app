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
  const safeLabel = JSON.stringify(label);

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

      var content = document.createElement('div');
      content.style.cssText =
        'padding:4px 10px;background:#111827;color:#fff;font-size:12px;' +
        'font-weight:600;border-radius:100px;white-space:nowrap;transform:translateY(-6px);';
      content.innerText = ${safeLabel};
      new kakao.maps.CustomOverlay({
        position: center,
        content: content,
        yAnchor: 1.6,
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
 */
export function buildKakaoRouteMapHtml(params: { appKey: string; days: RouteMapDay[] }): string {
  const { appKey, days } = params;
  // 좌표는 숫자라 안전하지만, 이 객체 전체를 <script> 안에 통째로 꽂으므로 문자열이
  // 섞여 들어올 여지를 없애기 위해 JSON.stringify로 한 번에 이스케이프한다.
  const safeDays = JSON.stringify(days);

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

    kakao.maps.load(function () {
      var map = new kakao.maps.Map(document.getElementById('map'), {
        center: new kakao.maps.LatLng(35.8, 128.4),
        level: 8,
      });
      map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);

      var bounds = new kakao.maps.LatLngBounds();

      days.forEach(function (day) {
        var path = [];
        var opacity = typeof day.opacity === 'number' ? day.opacity : 1;

        day.points.forEach(function (point, index) {
          var position = new kakao.maps.LatLng(point.latitude, point.longitude);
          path.push(position);
          bounds.extend(position);

          var marker = document.createElement('div');
          marker.style.cssText =
            'width:24px;height:24px;border-radius:100px;background:' + day.color + ';' +
            'color:#fff;font-size:12px;font-weight:700;display:flex;' +
            'align-items:center;justify-content:center;border:2px solid #fff;' +
            'box-shadow:0 1px 4px rgba(0,0,0,0.35);opacity:' + opacity + ';';
          marker.innerText = String(index + 1);
          new kakao.maps.CustomOverlay({ position: position, content: marker }).setMap(map);

          if (typeof point.distanceToNextKm === 'number' && index < day.points.length - 1) {
            var next = day.points[index + 1];
            var midpoint = new kakao.maps.LatLng(
              (point.latitude + next.latitude) / 2,
              (point.longitude + next.longitude) / 2
            );
            var label = document.createElement('div');
            label.style.cssText =
              'padding:2px 8px;background:#111827;color:#fff;font-size:11px;' +
              'font-weight:600;border-radius:100px;white-space:nowrap;opacity:' + opacity + ';';
            label.innerText = point.distanceToNextKm.toFixed(1) + 'km';
            new kakao.maps.CustomOverlay({ position: midpoint, content: label }).setMap(map);
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
        if (!bounds.isEmpty()) map.setBounds(bounds, 60);
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

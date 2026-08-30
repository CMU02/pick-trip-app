// 카카오맵은 리액트 네이티브 전용 공식 SDK가 없어서, WebView 안에 카카오맵 JS SDK를 띄우는
// HTML을 통째로 넣는 방식으로 쓴다. 지도 하나에 마커 하나(+이름 라벨)만 있으면 되는 단순한
// 쓰임이라, 서버에 따로 페이지를 호스팅하지 않고 인라인 HTML 문자열로 바로 넘긴다.
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
  <script>
    // WebView 안에서 나는 에러는 RN 쪽 콘솔에 안 잡혀서 원인을 알 수가 없다 —
    // window.onerror와 console.*을 postMessage로 흘려보내서 ContentDetailModal의
    // onMessage가 console.warn으로 다시 찍게 한다(adb logcat으로 확인 가능).
    function report(type, payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload }));
      }
    }
    window.onerror = function (message, source, lineno, colno) {
      report('error', message + ' (' + source + ':' + lineno + ':' + colno + ')');
    };
    ['log', 'warn', 'error'].forEach(function (level) {
      var original = console[level];
      console[level] = function () {
        report('console.' + level, Array.prototype.slice.call(arguments).join(' '));
        original.apply(console, arguments);
      };
    });
  </script>
  <script
    src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false"
    onerror="report('error', 'sdk.js 스크립트 로드 실패 — appKey 또는 등록 도메인을 확인하세요')"
  ></script>
  <script>
    try {
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

        report('log', 'map rendered ok');
      });
    } catch (e) {
      report('error', 'kakao.maps.load 실패: ' + e.message);
    }
  </script>
</body>
</html>`;
}

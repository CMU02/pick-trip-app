@AGENTS.md

## Figma

앱 아이콘·스토어 그래픽 원본: https://www.figma.com/design/uo8esxICkQgHAVrLTnH79t/PickTrip-Assets (fileKey `uo8esxICkQgHAVrLTnH79t`)

- `Page 1` > `App Icon - Fixed (2026-10-05)` 프레임들이 `assets/` 아이콘 PNG의 원본이다. 프레임 이름이 파일 이름과 같다.
- `Play Store` 페이지: 스토어 아이콘·피처 그래픽.
- 내보낼 때는 `get_screenshot`에 `contentsOnly: true`를 준다. 안 주면 부모 프레임 배경이 찍혀 투명 영역이 불투명해진다.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

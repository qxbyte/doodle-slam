# DOODLE SLAM! — 项目规范

手绘涂鸦画风的 Splatoon 式泼漆对战网页游戏。纯静态（HTML/CSS/vanilla JS + Canvas 2D），
**无构建步骤**，用 classic `<script>` 按序加载共享全局作用域——`index.html` 中的脚本顺序即依赖顺序。

## 模块边界（新代码放哪）

- `js/core/` — 与玩法无关的基础层（数学、常量、手绘绘制原语）。不得反向依赖上层。
- `js/maps/` — 每张地图一个**纯数据**文件，调用 `registerMap({...})`；schema 见 `registry.js` 顶部注释。地图文件里不写渲染/玩法逻辑。
- `js/world/` — 地图数据 → 世界：`render.js`（预渲染两张离屏层）、`collision.js`（阻挡查询）。新的地图元素 = 在 schema 加字段 + render.js 加一个 `drawXxx(g, rng, map)`。
- `js/systems/` — 玩法系统（paint 归属网格、entities/bot AI）。新玩法机制加新文件，不往 game.js 堆。
- `js/ui/` — DOM HUD 与菜单屏幕。
- `js/game.js` — 只做状态机、输入、相机、主循环的编排；具体逻辑下放到 systems。

## 硬约束

- 地图静态美术必须用**种子随机数**（`makeRng(map.seed)`），否则每帧重绘会闪烁。
- 建筑与水域 = `OBSTACLES`（碰撞 + 不可涂色 + 覆盖率分母剔除），三处由 `setMap()` 统一维护。
- 画布像素尺寸 = `窗口 × dpr`，CSS 显示尺寸固定 `100vw/100vh`（style.css `#game`）——两者缺一在 Retina 上就会画面溢出。
- 相机：镜头中心不出世界边界（纸外显示桌面粉色）；边缘平移偏移上限为视口 42%，保证角色永不离屏。

## 验证方式（无测试框架）

- 语法：`for f in $(find js -name '*.js'); do node --check $f; done`
- 视觉回归：起 `python3 -m http.server`，用无头 Chrome 截图调试参数场景
  （`?auto=N&map=M&ff=S&mx=X&my=Y`，见 README）；Retina 问题要加 `--force-device-scale-factor=2`。

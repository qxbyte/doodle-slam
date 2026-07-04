# DOODLE SLAM! — 项目规范

手绘涂鸦画风的 Splatoon 式泼漆对战网页游戏。纯静态（HTML/CSS/vanilla JS + Canvas 2D），
**无构建步骤**，用 classic `<script>` 按序加载共享全局作用域——`index.html` 中的脚本顺序即依赖顺序。

## 模块边界（新代码放哪）

- `js/core/` — 与玩法无关的基础层（数学、常量、手绘绘制原语）。不得反向依赖上层。
- `js/maps/` — 每张地图一个**纯数据**文件，调用 `registerMap({...})`；schema 见 `registry.js` 顶部注释。地图文件里不写渲染/玩法逻辑。
- `js/world/` — 地图数据 → 世界。`render.js` 是**插件核心**（grounds/roadStyles/features/plazas/obstacles 五个注册表），`themes/*.js` 每主题一个文件向核心注册绘制器；`collision.js` 阻挡查询 + 冰面 `onIce`。新地图元素 = schema 加字段 + 对应主题文件里 `registerFeature/registerObstacles`；新主题 = 新 theme 文件 + index.html 一行 script，核心零改动。
- `js/systems/` — 玩法系统，一职责一文件：paint 归属网格、entities/bot、modes 比赛模式、skills 主动技能、challenges 战役、daily 每日、sharecard 分享卡、ambient 环境粒子、replay 回放/导出、records 战绩、audio 音效。新机制加新文件，不往 game.js 堆。
- `js/ui/` — DOM HUD 与菜单屏幕。
- `js/game.js` — 只做状态机、输入、相机、主循环的编排；具体逻辑下放到 systems。

## 硬约束

- 地图静态美术必须用**种子随机数**（`makeRng(map.seed)`），否则每帧重绘会闪烁。
- 建筑与水域 = `OBSTACLES`（碰撞 + 不可涂色 + 覆盖率分母剔除）；冰面 `ICE` 可走可涂但打滑（entities 的动量分支）；出生点默认四角、地图可用 `spawns` 覆盖——这些全部由 `setMap()` 统一切换。
- 画布像素尺寸 = `窗口 × dpr`，CSS 显示尺寸固定 `100vw/100vh`（style.css `#game`）——两者缺一在 Retina 上就会画面溢出。
- 相机：镜头中心不出世界边界（纸外显示桌面粉色）；边缘平移偏移上限为视口 42%，保证角色永不离屏。

## 验证方式

- **单元测试**：`node test/run.js` —— vm 沙箱加载纯逻辑脚本（不含 ui/game 主循环），spec 在同一 context 内执行以便触达顶层 let 绑定；新增纯逻辑请补测试。
- **CI**：`.github/workflows/ci.yml` 每次 push 跑 node --check + 单测。
- **PWA**：上线文件增删后必须同步 `sw.js` 的 SHELL 列表并 bump VERSION，否则老缓存不更新。
- 语法：`for f in $(find js -name '*.js'); do node --check $f; done`
- 视觉回归：起 `python3 -m http.server`，用无头 Chrome 截图调试参数场景
  （`?auto=N&map=M&ff=S&mx=X&my=Y`，见 README）；Retina 问题要加 `--force-device-scale-factor=2`。

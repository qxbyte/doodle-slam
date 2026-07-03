# DOODLE SLAM!

一个手绘涂鸦画风的 Splatoon 式地盘泼漆对战小游戏（fan project，复刻自 Higgsfield 上的一个演示视频）。

纯静态网页：HTML + CSS + 原生 JavaScript + Canvas 2D，**零依赖、无构建步骤**。

## 运行

任选其一：

```bash
# 方式一：直接双击 index.html（或）
open index.html

# 方式二：本地服务器
python3 -m http.server 8080
# 然后访问 http://localhost:8080
```

## 玩法

- 流程：**选阶段**（STAGE 1 城市 / STAGE 2 野外）→ **选地图** → **选 Fighter**（ZURI 蓝 / JAX 红 / NIA 黄 / KOBI 绿）→ 与 3 个 bot 对战
- 阶段与地图：城市阶段 = DOWNTOWN、RIVERSIDE；野外阶段 = PINE CAMP、FERN HOLLOW
- 彩蛋：阶段选择页点击空白纸面会迸出随机队伍色的泼漆
- **3 分钟**倒计时内，用泼漆覆盖最多地面的队伍获胜
- **角色即武器**：ZURI 均衡喷枪 SketchBlaster / JAX 近战四连霰弹 Splat Scatter / NIA 长程狙击 Longshot Pen / KOBI 大范围慢速 Blob Roller
- 选人页可选 **bot 难度**（EASY / NORMAL / HARD）
- **SLAM TIME**：最后 30 秒所有泼漆半径 ×1.6，终局翻盘窗口
- **结算仪式**：TURF REPLAY 领土演变快放 + 每人战绩（击杀/阵亡/按钮）；标题页记录生涯战绩（localStorage），破个人最佳弹 NEW BEST TURF! 徽章
- **WASD / 方向键** 移动，**按住左键** 朝准星喷漆，**右键** 投掷 Paint Bomb，**M** 静音（音效为 WebAudio 实时合成）
- **鼠标移到屏幕边缘** 平移镜头侦察（有范围上限），**空格** 立刻回中到角色
- 踩在自己颜色上移动更快、回墨更快；踩在敌方颜色上会减速
- 地图上散落 Paint Bomb 道具（虚线圈中的炸弹）
- 广场会周期性出现 **RED BUTTON**——谁先踩到，就触发本队颜色的 **ROCKET STRIKE** 火箭雨
- 被敌方漆打空 HP 会被 splat，2.5 秒后在本队角落重生
- RIVERSIDE 地图：河流不可通行也不可涂色，两座桥是必争要道

## 项目结构

```
index.html            页面骨架 + HUD DOM + 脚本加载顺序（classic script，顺序即依赖）
style.css             UI 样式（黑描边圆角卡片、硬阴影）
js/
  core/               与玩法无关的基础层
    util.js           种子随机数、数学工具、圆-矩形碰撞
    teams.js          四支队伍常量（id/名字/颜色/介绍）
    sketch.js         手绘风绘制原语：抖动线条、排线、泼漆 blob、角色/道具涂鸦
  maps/               地图 = 纯数据文件
    registry.js       阶段/地图 schema 说明、注册表、当前地图状态（setMap）
    downtown.js       城市①：经典城区（商场/直升机楼/环岛喷泉）
    riverside.js      城市②：河流 + 桥 + 车站 + 体育场 + 公园池塘
    pinecamp.js       野外①：湖畔营地（帐篷/木屋/瞭望塔/营火广场）
    fernhollow.js     野外②：蕨谷（小溪原木桥/巨蘑菇/古树/立石圈）
  world/               把地图数据变成世界
    render.js         预渲染地面层/建筑层（每种元素一个 draw 函数）
    collision.js      碰撞与可行走查询（建筑 + 水域均阻挡）
  systems/             玩法系统
    audio.js          WebAudio 合成音效（射击/爆炸/事件/UI，零音频文件）
    replay.js         涂色回放：比赛网格快照 + 结算页 timelapse 播放
    records.js        localStorage 生涯战绩（场次/胜场/最佳覆盖率）
    paint.js          泼漆画布 + 归属网格（覆盖率/小地图/踩漆判定）
    entities.js       角色、武器、弹丸、炸弹、道具、bot AI（三档难度）
  ui/
    hud.js            比赛 HUD：覆盖率、计时、播报、状态条、小地图
    screens.js        菜单屏幕：标题/选图/选人/结算
  game.js             状态机、输入、相机、主循环、比赛规则
```

## 如何新增一张地图

1. 新建 `js/maps/<name>.js`，调用 `registerMap({...})`（字段说明见 `registry.js` 顶部注释）；
2. 在 `index.html` 的 maps 段加一行 `<script>`（放在 `registry.js` 之后）；
3. 完成——选图界面的卡片和缩略图会自动从地图数据生成。

## 调试参数

- `?auto=N` 跳过菜单直接以队伍 N（0-3）开局；`&map=M` 指定地图（0-3）
- `&ff=S` 开局快进 S 秒；`&mx=X&my=Y` 固定鼠标位置（配合边缘平移测试）
- `?screen=stages` / `?screen=maps` / `?screen=select` 直接打开某个菜单

Fan project inspired by Splatoon. Not affiliated with Nintendo.

# DOODLE SLAM!

一个手绘涂鸦画风的 Splatoon 式地盘泼漆对战小游戏。

**在线试玩：https://qxbyte.github.io/doodle-slam/**

纯静态网页：HTML + CSS + 原生 JavaScript + Canvas 2D，**零依赖、无构建步骤**。

## 运行

任选其一（也可直接在手机浏览器打开在线版，**支持触屏双摇杆 + 安装到主屏幕离线玩**）：

```bash
# 方式一：直接双击 index.html（或）
open index.html

# 方式二：本地服务器
python3 -m http.server 8080
# 然后访问 http://localhost:8080
```

## 玩法

- 双模式：**生涯**（选阶段→选地图→选 Fighter，与随机性格 bot 对战，星章解锁 10 站旅程）/ **闯关**（第一章故事线：2 普通关 + 橡皮擦 Boss 关，进度存档、途中传说武器）
- 计分：**覆盖率% + 击倒数×2** 的综合得分定胜负
- **战役**：每张地图 3 个星级挑战（获胜/覆盖率/击杀等），旅程线上一站拿到星星才解锁下一站
- **三种模式**：TURF WAR 覆盖率 / SPLAT HUNT 击杀数 / ZONE CONTROL 三点占领计分
- **角色技能（Q，每局 2 次）**：SPLASH 涂漆无人机 / BAM 冲撞突进 / ZIP 全图贯穿狙 / BLOB 漆墙
- **DAILY RUN**：每天固定地图+角色，比拼覆盖率分数，本地记录当日最佳
- **道具**：涂料炸弹 / 加速鞋（8s ×1.45）/ 泡泡护盾（5s 免伤）
- **分享与导出**：结算页一键生成战报 PNG 分享卡、TURF REPLAY 导出 WebM 视频
- **环境粒子**：雪原飘雪 / 深海气泡 / 黑板萤火虫 / 林间落叶 / 书桌浮尘 / 月面流星
- 十大阶段：城市 DOWNTOWN/RIVERSIDE · 野外 PINE CAMP/FERN HOLLOW · 海滨 SUNNY SHORE · 深海 THE DEEP（洋流）· 雪山 POWDER PEAKS（冰面）· 午夜游乐园 MIDNIGHT FAIR（黑板粉笔反色）· 书桌 MESSY DESK · 月球 CRATER FIELD · 火山 CINDER BASIN（岩浆伤害）· 下水道 GOO JUNCTION（传送管）
- 留存：战役星章解锁阶段 · 12 枚成就徽章墙（标题页 BADGES）· 每日挑战 · 生涯战绩 · BGM 按阶段换情绪
- **冰面机制**（POWDER PEAKS）：冰湖可通行可涂色但打滑——惯性滑行、转向迟缓、停不下来
- **洋流机制**（THE DEEP）：踩进洋流带会被持续冲走，借流赶路或被冲进敌阵
- **角色外观差异化**：SPLASH 背包天线+围巾+护膝 / BAM 脸贴+腰带+闪电纹 / ZIP 马尾+瞄准镜+星徽 / BLOB 耳机毛帽+沾漆围裙+口袋画笔，武器剪影也各不相同
- 彩蛋：阶段选择页点击空白纸面会迸出随机队伍色的泼漆
- **3 分钟**倒计时内，用泼漆覆盖最多地面的队伍获胜
- **角色即武器**：SPLASH 均衡喷枪 SketchBlaster / BAM 近战四连霰弹 Splat Scatter / ZIP 长程狙击 Longshot Pen / BLOB 大范围慢速 Blob Roller
- 选人页可选 **bot 难度**（EASY / NORMAL / HARD）
- **SLAM TIME**：最后 30 秒所有泼漆半径 ×1.6，终局翻盘窗口
- **结算仪式**：TURF REPLAY 领土演变快放 + 每人战绩（击杀/阵亡/按钮）；标题页记录生涯战绩（localStorage），破个人最佳弹 NEW BEST TURF! 徽章
- **WASD / 方向键** 移动，**按住左键** 朝准星喷漆，**右键** 投掷 Paint Bomb，**M** 静音（音效与 lo-fi 背景音乐均为 WebAudio 实时合成）
- **触屏**：左半屏虚拟摇杆移动，右半屏拖动瞄准并自动开火，💣/Q 圆钮投弹与放技能；PWA 可安装、离线可玩
- **⚙ 设置**（标题页右上角）：背景音乐 / 音效 / 屏幕震动 / 环境粒子 / **中英文语言**开关，localStorage 持久化
- **B / BROWSE MAP 按钮**：浏览模式 = **暂停** + 自由镜头——比赛完全冻结（计时/bot/弹道静止），WASD/方向键/边缘平移飞越全图看风景；再按 B、空格或点按钮返回战斗
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
    i18n.js           中英文词典（英文原文即 key，L() 查找 + 参数模板）
    teams.js          四支队伍常量（id/名字/颜色/介绍）
    sketch.js         手绘风绘制原语：抖动线条、排线、泼漆 blob、角色/道具涂鸦
  maps/               地图 = 纯数据文件
    registry.js       阶段/地图 schema 说明、注册表、当前地图状态（setMap）
    downtown.js       城市①：经典城区（商场/直升机楼/环岛喷泉）
    riverside.js      城市②：河流 + 桥 + 车站 + 体育场 + 公园池塘
    pinecamp.js       野外①：湖畔营地（帐篷/木屋/瞭望塔/营火广场）
    fernhollow.js     野外②：蕨谷（小溪原木桥/巨蘑菇/古树/立石圈）
    messydesk.js      书桌：木纹桌面/文具障碍/纸胶带道路/打翻的墨水瓶
    craterfield.js    月球：环形山/月面基地/火箭发射台/坠毁飞碟/脚印
  world/               把地图数据变成世界
    render.js         渲染核心：ground/road/feature/plaza/obstacle 五个注册表 + 编排
    collision.js      碰撞与可行走查询（建筑+水域阻挡；冰面 onIce 查询）
    themes/           每主题一个文件，向核心注册自己的绘制器
      common.js       纸张地面、街道/土路、水系与桥、树、草花、喷泉/池塘广场
      city.js         铁轨/斑马线/球场/汽车/亭子 + 纸片楼房
      wilds.js        原木、营火/立石广场、木屋/瞭望塔/帐篷/巨石/古树/蘑菇
      desk.js         木纹桌面、纸胶带路、作业纸/咖啡渍/回形针、墨水广场、文具
      moon.js         月面、环形山/旗帜/脚印、大坑广场、登月舱/飞碟/穹顶/发射台
      shore.js        沙滩地面、海浪泡沫、贝壳/海星/海鸥、潮池广场、灯塔/沙堡等
      peaks.js        雪地地面、冰湖/雪堆/滑雪道/缆车、旅馆/塔架/雪人
      fair.js         黑板地面（chalk 调色板反色）、粉笔路/彩旗/星月、舞台广场、摩天轮等
      deep.js         海床地面、洋流/海带/鱼群/水母、巨蚌广场、沉船/珊瑚/铁锚等
  systems/             玩法系统
    audio.js          WebAudio 合成音效（射击/爆炸/事件/UI，零音频文件）
    replay.js         涂色回放：网格快照 + timelapse 播放 + WebM 导出
    records.js        localStorage 生涯战绩（场次/胜场/最佳覆盖率）
    modes.js          比赛模式（turf/splat/zones 计分与胜负、占领区计算）
    skills.js         角色主动技能（Q）：无人机/冲撞/贯穿狙/漆墙
    challenges.js     战役星级挑战、进度存储、阶段解锁
    daily.js          每日挑战（日期种子定地图与角色）
    sharecard.js      战报分享卡 PNG 生成与下载
    ambient.js        环境粒子层（≤46 粒子，屏幕空间，逐图配置）
    settings.js       用户偏好（音乐/音效/震屏/粒子/语言），持久化并应用到各系统
    touch.js          触屏双摇杆 + 投弹/技能按钮（仅触屏设备激活）
    music.js          程序化 lo-fi 背景音乐（WebAudio 调度器，零音频文件）
    paint.js          泼漆画布 + 归属网格（覆盖率/小地图/踩漆判定）
    entities.js       角色、武器、弹丸、炸弹、道具、bot AI（三档难度）
  ui/
    hud.js            比赛 HUD：覆盖率、计时、播报、状态条、小地图
    screens.js        菜单屏幕：标题/选图/选人/结算
  game.js             状态机、输入、相机、主循环、比赛规则
```

## 如何扩展

**加一张地图**：新建 `js/maps/<name>.js` 调 `registerMap({...})`（schema 见 registry.js 注释）+ index.html 加一行 script，卡片/缩略图自动生成；出生角不可用时用 `spawns` 覆盖。
**加一个主题**：新建 `js/world/themes/<name>.js`，用 `registerGround / registerRoadStyle / registerFeature / registerPlaza / registerObstacles` 注册绘制器 + index.html 加一行 script——渲染核心零改动。整套线稿颜色可通过 `map.palette` 换调色板（core/sketch.js 的 PALETTES，如 chalk 黑板反色）。
**加一个阶段**：`registry.js` 的 `STAGES` 加一项 + `ui/vignettes.js` 加一幅简画。

## 测试与 CI

```bash
node test/run.js     # 35 项单元测试：工具函数/地图数据/碰撞/涂色网格/模式/战役/成就/每日/地形机制
```

GitHub Actions（.github/workflows/ci.yml）在每次 push/PR 时跑全量 `node --check` + 单测。
PWA：`manifest.webmanifest` + `sw.js`（app-shell 缓存，改动上线文件需 bump `sw.js` 的 `VERSION`）。

## 调试参数

- `?auto=N` 跳过菜单直接以队伍 N（0-3）开局；`&map=M` 指定地图（0-9）；`&mode=turf|splat|zones` 指定模式；`&lang=zh` 中文界面
- `&ff=S` 开局快进 S 秒；`&mx=X&my=Y` 固定鼠标位置（配合边缘平移测试）
- `?screen=stages` / `?screen=maps` / `?screen=select` 直接打开某个菜单

Fan project inspired by Splatoon. Not affiliated with Nintendo.

'use strict';

/* ============================================================
   i18n — English strings are the keys; L(key, vars) returns
   the translation for the active language with {placeholders}
   substituted. Static DOM nodes carry data-i18n attributes and
   are refreshed by applyStaticI18n().
   Proper nouns (stage/map/fighter/weapon/skill names) stay in
   English on purpose — they are part of the art direction.
   ============================================================ */

let LANG = 'en';

function setLang(lang) {
  LANG = lang === 'zh' ? 'zh' : 'en';
}

function L(key, vars) {
  let s = (LANG === 'zh' ? I18N_ZH[key] : undefined) ?? I18N_EN[key] ?? key;
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
  return s;
}

/* semantic keys whose English text lives here (entity-heavy strings
   read back decoded from data-i18n attributes, so raw text can't
   serve as the key) */
const I18N_EN = {
  controlsHint: 'WASD move &nbsp;&middot;&nbsp; hold Left Click to spray &nbsp;&middot;&nbsp; Right Click throws Paint Bombs &nbsp;&middot;&nbsp; Q fires your skill &nbsp;&middot;&nbsp; B browses the map &nbsp;&middot;&nbsp; M mutes',
  settingsBtn: '&#9881; SETTINGS',
  badgesBtn: '&#127941; BADGES',
};

function applyStaticI18n() {
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.innerHTML = L(el.dataset.i18n);
  }
}

const I18N_ZH = {
  /* ---- title ---- */
  'Splat the town. Own the turf. 3 minutes on the clock.': '泼漆全城，占领地盘，3 分钟定胜负。',
  'PLAY': '开始游戏',
  'DAILY RUN': '每日挑战',
  'best {b}': '今日最佳 {b}',
  settingsBtn: '&#9881; 设置',
  controlsHint: 'WASD 移动 &nbsp;&middot;&nbsp; 按住左键喷漆 &nbsp;&middot;&nbsp; 右键投掷炸弹 &nbsp;&middot;&nbsp; Q 释放技能 &nbsp;&middot;&nbsp; B 浏览地图 &nbsp;&middot;&nbsp; M 静音',
  'Fan project inspired by Splatoon. Not affiliated with Nintendo.': '灵感来自 Splatoon 的同人作品，与任天堂无关。',
  '{p} matches · {w} wins · best turf {b}%': '{p} 场 · {w} 胜 · 最佳覆盖 {b}%',

  /* ---- settings ---- */
  'Background music': '背景音乐',
  'Sound effects': '游戏音效',
  'Screen shake': '屏幕震动',
  'Ambient particles': '环境粒子',
  'Language': '语言 Language',
  'CLOSE': '关闭',
  'UNLOCK ALL STAGES': '解锁全部阶段',
  'RE-LOCK STAGES': '恢复阶段锁定',
  'ON': '开',
  'OFF': '关',
  'Sound off': '声音已关闭',
  'Sound on': '声音已开启',

  /* ---- badges ---- */
  badgesBtn: '&#127941; 成就',
  'BADGE WALL': '成就徽章墙',
  '{got}/{total} unlocked': '已解锁 {got}/{total}',
  '🏅 BADGE UNLOCKED — {n}': '🏅 解锁成就 —— {n}',
  'First Splat!': '首次击倒！',
  'Splat your first rival.': '第一次击倒对手。',
  'Hat Trick': '帽子戏法',
  'Splat 3 rivals in a single match.': '单场击倒 3 名对手。',
  'Rampage': '大杀特杀',
  'Splat 8 rivals in a single match.': '单场击倒 8 名对手。',
  'Landlord': '大地主',
  'Cover 40% of the ground yourself.': '单场个人覆盖 40% 地面。',
  'Untouchable': '毫发无伤',
  'Win a match without getting splatted.': '全程不被击倒并赢下比赛。',
  'Button Masher': '按钮狂魔',
  'Hit the red button 3 times in one match.': '单场踩下红按钮 3 次。',
  'Mode Hopper': '模式通吃',
  'Win in all three match modes.': '在三种模式中都取得胜利。',
  'Rising Star': '冉冉新星',
  'Earn 5 campaign stars.': '获得 5 颗战役星章。',
  'Constellation': '星座连线',
  'Earn 15 campaign stars.': '获得 15 颗战役星章。',
  'Daily Regular': '每日常客',
  'Play 3 daily runs.': '参加 3 次每日挑战。',
  'Veteran Doodler': '资深涂鸦手',
  'Play 25 matches.': '完成 25 场比赛。',
  'Champion': '常胜将军',
  'Win 10 matches.': '赢下 10 场比赛。',
  'Through the Little Door': '穿过那扇小门',
  'Find the way into another world.': '找到通往另一个世界的入口。',
  'King of the Other Side': '彼界之王',
  'Win a match that ends in the hidden world.': '在隐藏世界结束的对局中获胜。',
  'You slipped through the little door…': '你从那扇小门溜了进去……',
  'WELCOME TO THE OTHER SIDE.': '欢迎来到另一边。',

  /* ---- stage select ---- */
  'Pick Your Stage': '选择阶段',
  'BACK': '返回',
  'Tip: click the blank paper.': '小提示：点点空白的纸面。',
  'Locked — earn a star in the previous stage.': '未解锁——先在上一阶段拿到一颗星。',
  'Streets, malls and rooftop billboards.': '街道、商场与楼顶广告牌。',
  'Pines, campfires and creek crossings.': '松林、营火与小溪渡口。',
  'Sun, piers and a striped lighthouse.': '阳光、栈桥与条纹灯塔。',
  'Wrecks, corals and sweeping currents.': '沉船、珊瑚与湍急的洋流。',
  'Ski lifts, snowmen and slippery ice.': '缆车、雪人与打滑的冰面。',
  'A funfair chalked on the midnight blackboard.': '午夜黑板上粉笔画的游乐园。',
  'Zoom out — battle the stationery on the desktop.': '拉远镜头——在书桌文具间开战。',
  'Craters, flags and one crashed saucer.': '环形山、旗帜和一艘坠毁的飞碟。',
  'Black rock, ash plumes and bubbling lava.': '黑岩、火山灰与咕嘟冒泡的岩浆。',
  'Warp pipes and glowing goo under the town.': '小镇地下的传送管与荧光黏液。',

  /* ---- map select ---- */
  'Pick Your Turf': '选择地图',
  'The classic block party — mall, plaza fountain and tight streets.': '经典街区——商场、喷泉广场与紧凑街道。',
  'A river cuts the town in two — fight for the bridges.': '河流将小镇一分为二——为桥而战。',
  'Lakeside campground — tents, a watchtower and a campfire clearing.': '湖畔营地——帐篷、瞭望塔与营火空地。',
  'A creek, giant mushrooms and a stone circle deep in the woods.': '林深处的小溪、巨型蘑菇与立石圈。',
  'Sun, sand, two piers and a lighthouse.': '阳光、沙滩、两座栈桥和一座灯塔。',
  'A wreck, corals and currents that carry you away.': '沉船、珊瑚，还有会把你冲走的洋流。',
  'Ski lifts, a lodge and two lakes of slippery ice.': '缆车、旅馆和两片打滑的冰湖。',
  'A funfair chalked onto the blackboard after dark.': '天黑后粉笔画在黑板上的游乐园。',
  'Duck behind the stationery and claim the ink spill.': '躲在文具后面，抢占打翻的墨水。',
  'A moon base, a rocket pad and one crashed saucer.': '月面基地、火箭发射台和一艘坠毁的飞碟。',
  'Cross the lava river — or melt trying.': '跨越岩浆河——不然就熔在里面。',
  'Grate bridges and warp pipes — mind the goo.': '格栅桥与传送管——小心脚下的黏液。',

  /* ---- challenges ---- */
  'Win the match': '赢下比赛',
  'Cover {v}% of the ground': '覆盖 {v}% 的地面',
  'Splat {v} rivals': '击倒 {v} 名对手',
  'Finish without getting splatted': '全程不被击倒',
  'Hit the red button {v}×': '踩下红按钮 {v} 次',
  '★ NEW STAR — {d}': '★ 新星章 —— {d}',

  /* ---- fighter select ---- */
  'Pick Your Fighter': '选择角色',
  'MODE': '模式',
  'BOT DIFFICULTY': 'BOT 难度',
  'TURF WAR': '涂地大战',
  'SPLAT HUNT': '歼灭狩猎',
  'ZONE CONTROL': '据点控制',
  'EASY': '简单',
  'NORMAL': '普通',
  'HARD': '困难',
  'Cool-headed turf tactician. Team Blue.': '冷静的地盘战术家。蓝队。',
  'Hot-blooded rusher. Team Red.': '热血莽夫。红队。',
  'Sharp-eyed duelist. Team Yellow.': '眼神犀利的决斗者。黄队。',
  'Easy-going area painter. Team Green.': '佛系的大面积涂手。绿队。',
  'steady all-round sprayer': '稳定的全能喷枪',
  'point-blank burst of four pellets': '贴脸四连霰弹',
  'slow, surgical long-range bolt': '缓慢而精准的远程狙击',
  'lobs huge, slow blobs of paint': '抛出巨大而缓慢的漆团',

  /* ---- modes ---- */
  'most ground painted wins': '涂色面积最多者获胜',
  'most splats wins': '击倒数最多者获胜',
  'hold the three zones': '占住三个据点',
  'COVERAGE': '覆盖率',
  'SPLATS': '击倒数',
  'ZONE PTS': '据点分',
  'takes the town!': '拿下全城！',
  'out-splatted everyone!': '击倒全场！',
  'holds the zones!': '掌控了据点！',

  /* ---- pause dialog ---- */
  'PAUSED': '已暂停',
  'RESUME': '继续游戏',
  'RESTART MATCH': '重新开始',

  /* ---- HUD & toasts ---- */
  'LEAVE MATCH': '退出比赛',
  'BROWSE MAP': '浏览地图',
  'BACK TO BATTLE': '返回战斗',
  'PAINT BOMB &times;{s} &mdash; right-click to throw!': '涂料炸弹 &times;{s} &mdash; 右键投掷！',
  'PAINT BOMB &times;{s} &mdash; tap &#128163;': '涂料炸弹 &times;{s} &mdash; 点 &#128163;',
  '{s1} &middot; {s2} &mdash; tap Q': '{s1} &middot; {s2} &mdash; 点 Q',
  '{b} — Move faster and refill ink on your own paint.': '{b}。踩自己颜色上移动更快、回墨更快。',
  '{m} — {b}!': '{m} —— {b}！',
  '{n} picked up a Paint Bomb!': '{n} 捡到了涂料炸弹！',
  '{n} threw a Paint Bomb!': '{n} 扔出了涂料炸弹！',
  '{n} grabbed Speed Boots!': '{n} 穿上了加速鞋！',
  '{n} popped a Bubble Shield!': '{n} 开启了泡泡护盾！',
  '{n} hit the RED BUTTON!': '{n} 踩下了红按钮！',
  'ROCKET STRIKE incoming!': '火箭空袭来袭！',
  'RED BUTTON appeared at the plaza!': '广场上出现了红按钮！',
  'SLAM TIME! Splats hit bigger!': 'SLAM TIME！泼漆范围加大！',
  '{a} splatted {b}!': '{a} 击倒了 {b}！',
  '{n} melted in the lava!': '{n} 熔化在了岩浆里！',
  '{n} used {s}!': '{n} 使用了 {s}！',
  'Match paused — fly around with WASD or the screen edges. B returns.': '比赛已暂停——用 WASD 或屏幕边缘自由飞行，按 B 返回。',
  'Video export is not supported in this browser.': '当前浏览器不支持视频导出。',

  /* ---- results ---- */
  "TIME'S UP!": '时间到！',
  'TURF REPLAY': '涂色回放',
  'PLAY AGAIN': '再来一局',
  'SHARE CARD': '分享战报',
  'EXPORT WEBM': '导出视频',
  'RECORDING…': '录制中…',
  'BACK TO MENU': '返回菜单',
  ' 🎉 That’s you!': ' 🎉 就是你！',
  'NEW BEST TURF!': '新覆盖纪录！',
  'DAILY SCORE: {v}': '每日得分：{v}',
  ' — new daily best!': ' —— 刷新今日最佳！',
  '(YOU)': '（你）',
  '{v} splat': '{v} 击倒',
  '{v} splats': '{v} 击倒',
  '{v} down': '{v} 阵亡',
  '{v} downs': '{v} 阵亡',
  '{v} button': '{v} 次按钮',
  '{v} buttons': '{v} 次按钮',
};

# 烈日突击 SUNSTRIKE

一款**原创**的网页版单机战术射击游戏（5 v 5 人机对战），纯浏览器运行、单个 HTML 文件、无需安装。
地图、材质、音效为程序化生成的原创内容；人物、枪械与部分道具使用 CC0（公有领域）3D 模型（见文末致谢）；不包含任何第三方游戏的素材、名称或地图。

**▶ 在线试玩：https://joyhsin.github.io/sunstrike/**

![主菜单](screenshot-menu.png)

## 截图

| 实战 | 材质细节 |
|---|---|
| ![实战](screenshot-gameplay.png) | ![材质](screenshot-materials.png) |
| **角色模型** | **第一人称武器** |
| ![角色](screenshot-characters.png) | ![武器](screenshot-weapon.png) |

![购买菜单](screenshot-buymenu.png)

## 玩法介绍

- **爆破模式 5 v 5**：开局可选择阵营——**防守方**（蓝色，守住 A / B 包点）或**进攻方**（橙色，安放炸弹），你和 4 名 AI 队友对抗 5 名 AI 敌人。
- 进攻方中有一人携带 C4 炸弹（可能是你）：到达 A 或 B 包点按住 **E** 3 秒安放，40 秒后爆炸即进攻方获胜；携带者阵亡后炸弹掉落，队友可捡起（G 主动丢弃）。
- 防守方需阻止安放，或在爆炸前靠近炸弹按住 **E** 6 秒拆除；炸弹安放后，即使进攻方全灭也必须拆除才能获胜。
- 未安放炸弹时：消灭对方全部队员赢得回合，回合时间耗尽算防守方获胜；**先赢 8 局**的一方赢得比赛。
- 投掷物：**高爆手雷**（范围伤害）、**闪光弹**（致盲，背对可减轻）、**烟雾弹**（约 16 秒烟墙，阻挡 AI 视线）。AI 也会购买并使用投掷物（向最后发现敌人的位置扔雷 / 闪，进攻方会封烟包点入口）。
- AI 会在对枪时随机下蹲、跳上木箱架点、沿平滑路径（拐角捷径）移动，而不是贴着网格走。
- 击杀与胜负都会获得金钱，回合开始 20 秒内可按 **B** 打开购买菜单购买武器和护甲。
- 爆头伤害 ×2.5（狙击步枪 ×4），护甲可减免身体伤害，头盔可减免爆头伤害。
- 玩家受到 AI 的伤害按难度缩放：简单 50%、普通 70%、困难 90%。
- 难度可选：**简单 / 普通 / 困难**（影响 AI 反应速度、瞄准精度、爆头率和听觉范围）。

### 武器

| 武器 | 说明 |
|---|---|
| 突击步枪 AR-7 | 全自动，伤害高，后坐力明显（$2700） |
| 冲锋枪 MK-5 | 射速快、移动射击更稳，击杀奖励高（$1250） |
| 狙击步枪 LR-9 | 右键开镜（两级倍率），一枪致命（$4750） |
| 手枪 P-12 | 默认副武器 |
| 战术匕首 | 近战，背刺伤害极高 |
| 高爆手雷 | 范围爆炸伤害（$300，限 1 枚） |
| 闪光弹 | 致盲（$200，限 2 枚） |
| 烟雾弹 | 生成烟墙阻挡视线（$300，限 1 枚） |

## 操作说明

| 按键 | 功能 |
|---|---|
| W A S D | 移动 |
| 鼠标 | 瞄准 |
| 左键 | 开火 |
| 右键 | 狙击枪开镜 |
| 空格 | 跳跃 |
| Shift | 静步（敌人听不到脚步声） |
| C / Ctrl | 蹲下（射击更准）。Mac 上建议用 C（Ctrl+点击会被系统当作右键） |
| R | 换弹 |
| 1 / 2 / 3 | 主武器 / 手枪 / 匕首（Q 快速切换） |
| 4 | 切换投掷物（左键投掷，右键轻抛） |
| E（按住） | 安放 / 拆除炸弹 |
| G | 丢弃炸弹 |
| B | 购买菜单（数字键 1–9 购买） |
| Tab | 计分板 |
| Esc | 暂停 |

## 画面与技术

- 基于 [three.js](https://threejs.org/) r170，打包成**单个自包含的 `index.html`**（离线可玩，双击即可打开）。
- PBR 材质（MeshStandardMaterial），程序化生成 1024×1024 的颜色 / 法线 / 粗糙度贴图：混凝土地面、石砖地面、灰泥墙、红砖墙、木箱、锈蚀集装箱等；世界坐标 UV，贴图不拉伸；三线性过滤 + 各向异性过滤。
- 物理天空（Sky）+ PMREM 环境光照、ACES 电影色调映射、4096 软阴影、雾效、接触阴影（AO）。
- 圆角几何体、墙顶压檐、踢脚线、门框、窗户、管道、壁灯、远景建筑；木箱、油桶、沙袋墙、集装箱使用 CC0 glTF 模型（烘焙进静态批次，几乎不增加绘制调用）。
- 角色为**带骨骼动画的 glTF 人物**（SWAT 特警）：待机 / 走 / 跑 / 后退 / 左右横移按速度方向自动混合，死亡动画；双臂两段 IK 握枪、枪身随瞄准俯仰；防守方深蓝、进攻方沙色迷彩区分阵营。
- 第一人称步枪 / 冲锋枪 / 狙击枪 / 手枪使用 CC0 glTF 枪械模型，配程序化手套与袖子；战术匕首为程序化建模。
- 全部模型以二进制形式**内嵌**在 index.html 中（约 2.4 MB），仍可离线双击运行；加载时显示进度条。
- 程序化**体积感云层**（fbm 噪声，缓慢飘动、迎光面更亮）；地面随机分布**积水反光**（低粗糙度材质反射天空环境光）。
- 高清模式后期：**GTAO 环境光遮蔽**（只作用于场景，不影响手中武器）、泛光、**调色**（对比度、饱和度、暗部偏冷 / 亮部偏暖的分离色调、暗角）。
- 粒子：烟雾、火花、血雾、柔边弹孔贴花；枪口火焰配合泛光（Bloom）。
- **抛壳**：每次开枪从抛壳窗弹出黄铜弹壳（按枪种大小不同），带重力、旋转、落地弹跳与清脆的落地声，静止后平躺地面数秒再消失（玩家与附近机器人都会抛壳）。
- **弹着点碎屑**：命中墙面 / 地面时飞溅碎石屑（实例化渲染，带弹跳）并沿法线喷出尘土。
- **枪口余烟**：开火后枪口飘出向前扩散、缓慢上升的细烟，连射时会逐渐累积（狙击枪更浓）。
- 画质选项：**高清**（最高 2 倍像素比、4 倍 MSAA、GTAO、泛光、调色）/ **流畅**（1 倍像素比、关闭后期处理）。
- 启动时显示**加载进度条**（模型解析、逐张生成材质之间让出主线程，页面不会卡死）。

## 本地运行

直接下载仓库里的 `index.html`，用 Chrome / Safari / Edge 双击打开即可（无需服务器、无需联网）。

## 自行构建

```bash
npm install        # 安装 three.js 与 esbuild
npm run build      # 生成 index.html
```

源码结构：

```
src/
  template.html        页面结构、HUD 与菜单样式
  build.js             构建脚本：拼接 parts → esbuild 打包 → 内联到 index.html
  (../assets/models/   CC0 glTF 模型 .glb，构建时内嵌)
  parts/
    00-imports.js      three.js 及扩展模块引入
    10-core.js         地图、渲染器、天空/光照、程序化材质、场景搭建、碰撞与寻路
    12-atmosphere.js   云层与地面积水
    20-audio-weapons.js WebAudio 程序化音效、武器参数、购买列表
    05-assets.js       内嵌 glTF 模型加载、加载进度、静态道具烘焙
    25-models-fx.js    第一人称武器、粒子特效
    26-characters.js   骨骼动画人物、动画混合、手臂 IK、第三人称枪械
    27-effects2.js     抛壳、弹着点碎屑、枪口余烟
    30-gameplay.js     玩家控制、AI 机器人、伤害、回合与经济系统
    35-modes.js        爆破模式（炸弹安放/拆除）、阵营选择、投掷物、AI 下蹲/跳箱/平滑寻路
    40-hud-loop.js     HUD、输入、后期处理与主循环
```

## 美术素材致谢

所有 3D 模型均来自 [Poly Pizza](https://poly.pizza)，授权为 **CC0 1.0（公有领域）**：

| 用途 | 模型 | 作者 | 链接 |
|---|---|---|---|
| 人物（骨骼动画） | SWAT | Quaternius | https://poly.pizza/m/Btfn3G5Xv4 |
| 步枪 | Assault Rifle | Quaternius | https://poly.pizza/m/Bgvuu4CUMV |
| 冲锋枪 | Submachine Gun | Quaternius | https://poly.pizza/m/7ehatxr7FY |
| 狙击枪 | Sniper Rifle | Quaternius | https://poly.pizza/m/ASOMZIErq3 |
| 手枪 | Pistol | Quaternius | https://poly.pizza/m/52kQzphmeF |
| 匕首（备用） | Knife | Quaternius | https://poly.pizza/m/N9bfPFP1hr |
| 手雷 | Frag Grenade West | Pichuliru | https://poly.pizza/m/1aIZys4mhg |
| 木箱 | Crate | Quaternius | https://poly.pizza/m/oTD0P0yGLG |
| 深色木箱 | Crate | Quaternius | https://poly.pizza/m/3VGWnZPXmG |
| 油桶 | Barrel | Quaternius | https://poly.pizza/m/MraIiFnpAY |
| 集装箱 | Shipping Container | Quaternius | https://poly.pizza/m/dQXRtm5GbO |
| 集装箱（红） | Container Red | Quaternius | https://poly.pizza/m/vzzCNUB6Zn |
| 集装箱（绿） | Container Green | Quaternius | https://poly.pizza/m/h5RUr3vlcS |
| 沙袋墙 | Sack Trench | Quaternius | https://poly.pizza/m/LW3jwpPfiN |
| 木托盘（备用） | Pallet | Quaternius | https://poly.pizza/m/cUAsYHDqfD |

## 许可证

代码：[MIT](LICENSE)；模型：CC0（见上表）。

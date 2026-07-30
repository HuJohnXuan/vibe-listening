import type {
  Recommendation,
  RecommendationRoute,
} from "../../types/recommendation.ts";

type RecommendationSeed = readonly [
  sourceTrackId: string,
  targetTrackId: string,
  route: RecommendationRoute,
  reason: string,
];

const recommendationSeeds = [
  ["ember_after_midnight", "satin_window", "same_artist", "同一位歌手更轻的一面，鼓刷和呼吸感把夜色再放慢一点。"],
  ["ember_after_midnight", "slow_bloom", "same_room", "同样保持低亮度和宽松拍点，适合让房间继续安静下来。"],
  ["ember_after_midnight", "honey_static", "similar_voice", "贴近耳边的中低声区和微沙质感，让情绪自然衔接。"],
  ["ember_after_midnight", "blue_hour_vinyl", "production_texture", "磁带暖度与旧介质噪声相近，但男声带来更深的阴影。"],
  ["satin_window", "ember_after_midnight", "same_artist", "回到同张唱片更深的一页，Rhodes 和近距离嗓音更浓一些。"],
  ["satin_window", "velvet_weather", "same_room", "柔和灯光般的编曲与从容速度，延续成熟而私密的空间感。"],
  ["satin_window", "velvet_receiver", "similar_voice", "两首都用轻柔呼吸和近距离收音，把亲密感控制得很克制。"],
  ["satin_window", "hallway_echo", "production_texture", "刷鼓与房间混响同样留白，只把温度换成了更远的回声。"],
  ["slow_bloom", "hallway_echo", "same_artist", "同一位歌手把柔软假声放进更空的房间，情绪更内省。"],
  ["slow_bloom", "ember_after_midnight", "same_room", "宽松节奏与低亮度键盘音色一致，像坐回壁炉旁的旧沙发。"],
  ["slow_bloom", "blue_hour_vinyl", "similar_voice", "男声都落在偏低的位置，颗粒不同，却有相似的安定感。"],
  ["slow_bloom", "honey_static", "production_texture", "饱满低频和模拟质感相近，底噪让边缘显得更柔软。"],
  ["hallway_echo", "slow_bloom", "same_artist", "回到更温暖的同专辑作品，假声层次和低频会慢慢展开。"],
  ["hallway_echo", "satin_window", "same_room", "两首都像半开的门，微弱鼓点让安静不是完全静止。"],
  ["hallway_echo", "quiet_side_of_rain", "similar_voice", "温和低声与长尾混响相遇，听感同样稳妥而疏朗。"],
  ["hallway_echo", "velvet_weather", "production_texture", "木质低频与真实房间感相近，铜管让空间多一层暖光。"],
  ["honey_static", "velvet_receiver", "same_artist", "同一副烟熏中音换成更明亮的电钢琴，仍保留贴耳距离。"],
  ["honey_static", "blue_hour_vinyl", "same_room", "旧介质的噪声和松弛节拍一致，适合继续停在昏暗时段。"],
  ["honey_static", "ember_after_midnight", "similar_voice", "中低声区都带细微沙感，情绪从磁性自然落向温柔。"],
  ["honey_static", "velvet_weather", "production_texture", "圆润贝斯是共同底色，另一首用真实铜管替代电子纹理。"],
  ["velvet_receiver", "honey_static", "same_artist", "回到更低沉的同专辑切面，底噪和次低频会更明显。"],
  ["velvet_receiver", "quiet_side_of_rain", "same_room", "两首都不急着推高情绪，让温柔保持在很小的音量里。"],
  ["velvet_receiver", "satin_window", "similar_voice", "轻声与呼吸的处理相近，像两封写在不同夜晚的私密短信。"],
  ["velvet_receiver", "candle_smoke", "production_texture", "键盘都收掉尖锐高频，留下奶油般圆滑的中频触感。"],
  ["blue_hour_vinyl", "quiet_side_of_rain", "same_artist", "同一位男声走进更真实的刷鼓与吉他，雨夜感更清晰。"],
  ["blue_hour_vinyl", "honey_static", "same_room", "低速拍点和旧唱片颗粒把两首歌放进相同的深棕房间。"],
  ["blue_hour_vinyl", "slow_bloom", "similar_voice", "两种男声都压低锋芒，后拍演唱让呼吸显得格外宽松。"],
  ["blue_hour_vinyl", "ember_after_midnight", "production_texture", "磁带与 Rhodes 的暖度互相照应，只把重心从鼓机移向键盘。"],
  ["quiet_side_of_rain", "blue_hour_vinyl", "same_artist", "同一位歌手更旧、更颗粒化的一面，让雨停后仍留一点阴影。"],
  ["quiet_side_of_rain", "velvet_receiver", "same_room", "两首都像安静对话，节奏不争抢，旋律只在近处停留。"],
  ["quiet_side_of_rain", "hallway_echo", "similar_voice", "温和男声与房间尾音相近，孤独感被处理得很轻。"],
  ["quiet_side_of_rain", "satin_window", "production_texture", "刷鼓和柔软电钢琴共享相似触感，适合无缝接在一起。"],
  ["velvet_weather", "candle_smoke", "same_artist", "同一副女低音收起铜管，走进更克制的毛毡钢琴里。"],
  ["velvet_weather", "satin_window", "same_room", "成熟、低亮度的编曲气质一致，像同一间酒廊的两张唱片。"],
  ["velvet_weather", "honey_static", "similar_voice", "中低声区都圆润有重量，只是烟熏感与清晰度略有不同。"],
  ["velvet_weather", "hallway_echo", "production_texture", "真实房间与木质低频相互呼应，器乐之间都保留足够空气。"],
  ["candle_smoke", "velvet_weather", "same_artist", "回到同专辑更开阔的一首，铜管会为低沉嗓音添一圈暖边。"],
  ["candle_smoke", "ember_after_midnight", "same_room", "壁炉余温般的慢速氛围一致，适合在深夜继续保持低光。"],
  ["candle_smoke", "velvet_receiver", "similar_voice", "两首都用近距离中低音诉说，把情绪控制在耳语范围。"],
  ["candle_smoke", "slow_bloom", "production_texture", "柔化键盘和模拟铺底都没有硬边，听感细腻而不失厚度。"],
] satisfies readonly RecommendationSeed[];

export const recommendations = recommendationSeeds.map(
  ([sourceTrackId, targetTrackId, route, reason]): Recommendation => ({
    sourceTrackId,
    targetTrackId,
    route,
    reason,
  }),
);

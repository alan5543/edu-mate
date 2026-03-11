-- 增加插件描述字段
ALTER TABLE ai_model_provider ADD COLUMN description VARCHAR(255) COMMENT '功能描述';

-- 为现有的插件补充描述
UPDATE ai_model_provider SET description = '查询指定地点的实时天气信息。' WHERE id = 'SYSTEM_PLUGIN_WEATHER';
UPDATE ai_model_provider SET description = '播放服务器本地音乐库中的音乐。' WHERE id = 'SYSTEM_PLUGIN_MUSIC';
UPDATE ai_model_provider SET description = '获取中新网最新的国际、国内新闻资讯。' WHERE id = 'SYSTEM_PLUGIN_NEWS_CHINANEWS';
UPDATE ai_model_provider SET description = '强大的新闻聚合搜索，获取全球实时最新新闻。' WHERE id = 'SYSTEM_PLUGIN_NEWS_NEWSNOW';
UPDATE ai_model_provider SET description = '查询HomeAssistant中的智能家居设备状态。' WHERE id = 'SYSTEM_PLUGIN_HA_GET_STATE';
UPDATE ai_model_provider SET description = '控制HomeAssistant中的智能家居设备（如开灯、关灯）。' WHERE id = 'SYSTEM_PLUGIN_HA_SET_STATE';
UPDATE ai_model_provider SET description = '通过HomeAssistant控制外部智能音箱播放音乐。' WHERE id = 'SYSTEM_PLUGIN_HA_PLAY_MUSIC';
UPDATE ai_model_provider SET description = '通过Tavily引擎搜索互联网，获取实时、综合的网络信息。' WHERE id = 'SYSTEM_PLUGIN_SEARCH_TAVILY';
UPDATE ai_model_provider SET description = '查询维基百科，获取人物、历史、科学事实等百科知识。' WHERE id = 'SYSTEM_PLUGIN_WIKIPEDIA';
UPDATE ai_model_provider SET description = '提取指定网页URL的正文内容，用于网页摘要及问答。' WHERE id = 'SYSTEM_PLUGIN_FETCH_URL';
UPDATE ai_model_provider SET description = '查询指定日期的中国农历、节气、黄历宜忌等信息。' WHERE id = 'SYSTEM_PLUGIN_LUNAR';
UPDATE ai_model_provider SET description = '切换智能助手的性格、角色设定及提示词。' WHERE id = 'SYSTEM_PLUGIN_CHANGE_ROLE';
UPDATE ai_model_provider SET description = '处理用户的退出意图，结束对话过程。' WHERE id = 'SYSTEM_PLUGIN_EXIT_INTENT';

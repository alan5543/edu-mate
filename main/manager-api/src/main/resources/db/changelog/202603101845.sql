START TRANSACTION;

-- 更新所有插件名称为 繁体中文/English (function_code) 的格式，注意缩短以适应数据库字段长度

-- 1. 天气查询
UPDATE ai_model_provider 
SET name = '天氣/Weather (get_weather)' 
WHERE id = 'SYSTEM_PLUGIN_WEATHER';

-- 2. 服务器音乐播放
UPDATE ai_model_provider 
SET name = '音樂/Music (play_music)' 
WHERE id = 'SYSTEM_PLUGIN_MUSIC';

-- 3. 中新网新闻
UPDATE ai_model_provider 
SET name = '新闻/China News (get_news_from_chinanews)' 
WHERE id = 'SYSTEM_PLUGIN_NEWS_CHINANEWS';

-- 4. newsnow新闻聚合
UPDATE ai_model_provider 
SET name = 'Newsnow新聞/News (get_news_from_newsnow)' 
WHERE id = 'SYSTEM_PLUGIN_NEWS_NEWSNOW';

-- 5. HomeAssistant设备状态查询
UPDATE ai_model_provider 
SET name = 'HA狀態/HA Get State (hass_get_state)' 
WHERE id = 'SYSTEM_PLUGIN_HA_GET_STATE';

-- 6. HomeAssistant设备状态修改
UPDATE ai_model_provider 
SET name = 'HA控制/HA Set State (hass_set_state)' 
WHERE id = 'SYSTEM_PLUGIN_HA_SET_STATE';

-- 7. HomeAssistant音乐播放
UPDATE ai_model_provider 
SET name = 'HA音樂/HA Music (hass_play_music)' 
WHERE id = 'SYSTEM_PLUGIN_HA_PLAY_MUSIC';

-- 8. Tavily搜索
UPDATE ai_model_provider 
SET name = 'Tavily搜尋/Search (search_from_tavily)' 
WHERE id = 'SYSTEM_PLUGIN_SEARCH_TAVILY';

-- 9. Wikipedia百科查询
UPDATE ai_model_provider 
SET name = 'Wiki百科/Wiki (search_from_wikipedia)' 
WHERE id = 'SYSTEM_PLUGIN_WIKIPEDIA';

-- 10. URL内容获取
UPDATE ai_model_provider 
SET name = 'URL擷取/Fetch URL (fetch_url_content)' 
WHERE id = 'SYSTEM_PLUGIN_FETCH_URL';

-- 11. 农历/黄历查询
UPDATE ai_model_provider 
SET name = '農曆/Lunar (get_lunar)' 
WHERE id = 'SYSTEM_PLUGIN_LUNAR';

-- 12. 角色切换
UPDATE ai_model_provider 
SET name = '角色切換/Change Role (change_role)' 
WHERE id = 'SYSTEM_PLUGIN_CHANGE_ROLE';

-- 13. 退出意图处理
UPDATE ai_model_provider 
SET name = '退出處理/Exit Handler (handle_exit_intent)' 
WHERE id = 'SYSTEM_PLUGIN_EXIT_INTENT';

COMMIT;

START TRANSACTION;

-- ===============================
-- Register new plugins in the portal (功能管理)
-- ===============================

-- 1. Wikipedia百科查询 (free, no API key)
DELETE FROM ai_model_provider WHERE id = 'SYSTEM_PLUGIN_WIKIPEDIA';
INSERT INTO ai_model_provider (id, model_type, provider_code, name, fields,
                               sort, creator, create_date, updater, update_date)
VALUES ('SYSTEM_PLUGIN_WIKIPEDIA',
        'Plugin',
        'search_from_wikipedia',
        'Wikipedia百科查询',
        JSON_ARRAY(
                JSON_OBJECT(
                        'key', 'lang',
                        'type', 'string',
                        'label', '默认语言版本(zh/en/ja等)',
                        'default', 'zh'
                )
        ),
        85, 0, NOW(), 0, NOW());

-- 2. URL内容获取 (free, no config needed)
DELETE FROM ai_model_provider WHERE id = 'SYSTEM_PLUGIN_FETCH_URL';
INSERT INTO ai_model_provider (id, model_type, provider_code, name, fields,
                               sort, creator, create_date, updater, update_date)
VALUES ('SYSTEM_PLUGIN_FETCH_URL',
        'Plugin',
        'fetch_url_content',
        'URL内容获取',
        JSON_ARRAY(),
        90, 0, NOW(), 0, NOW());

-- 3. 农历/黄历查询 (free, no config needed)
DELETE FROM ai_model_provider WHERE id = 'SYSTEM_PLUGIN_LUNAR';
INSERT INTO ai_model_provider (id, model_type, provider_code, name, fields,
                               sort, creator, create_date, updater, update_date)
VALUES ('SYSTEM_PLUGIN_LUNAR',
        'Plugin',
        'get_lunar',
        '农历/黄历查询',
        JSON_ARRAY(),
        95, 0, NOW(), 0, NOW());

-- 4. 角色切换 (no config needed)
DELETE FROM ai_model_provider WHERE id = 'SYSTEM_PLUGIN_CHANGE_ROLE';
INSERT INTO ai_model_provider (id, model_type, provider_code, name, fields,
                               sort, creator, create_date, updater, update_date)
VALUES ('SYSTEM_PLUGIN_CHANGE_ROLE',
        'Plugin',
        'change_role',
        '角色切换',
        JSON_ARRAY(),
        100, 0, NOW(), 0, NOW());

COMMIT;

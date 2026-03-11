START TRANSACTION;

DELETE FROM ai_model_provider WHERE id = 'SYSTEM_PLUGIN_SEARCH_TAVILY';

INSERT INTO ai_model_provider (id, model_type, provider_code, name, fields,
                               sort, creator, create_date, updater, update_date)
VALUES ('SYSTEM_PLUGIN_SEARCH_TAVILY',
        'Plugin',
        'search_from_tavily',
        'Tavily搜索',
        JSON_ARRAY(
                JSON_OBJECT(
                        'key', 'api_key',
                        'type', 'string',
                        'label', 'Tavily搜索API密钥',
                        'default', 'your-tavily-api-key'
                ),
                JSON_OBJECT(
                        'key', 'search_depth',
                        'type', 'string',
                        'label', '搜索深度(basic/advanced)',
                        'default', 'basic'
                ),
                JSON_OBJECT(
                        'key', 'max_results',
                        'type', 'number',
                        'label', '最大结果数',
                        'default', '3'
                ),
                JSON_OBJECT(
                        'key', 'include_answer',
                        'type', 'string',
                        'label', '是否包含AI回复摘要(true/false)',
                        'default', 'true'
                ),
                JSON_OBJECT(
                        'key', 'include_raw_content',
                        'type', 'string',
                        'label', '是否包含原始内容(true/false)',
                        'default', 'false'
                )
        ),
        80, 0, NOW(), 0, NOW());

COMMIT;

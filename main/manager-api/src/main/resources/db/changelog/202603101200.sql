START TRANSACTION;

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
                        'label', 'Tavily 搜索 API 密钥',
                        'default', 'your-tavily-api-key'
                ),
                JSON_OBJECT(
                        'key', 'max_results',
                        'type', 'number',
                        'label', '最大结果数',
                        'default', 3
                )
        ),
        80, 0, NOW(), 0, NOW());

COMMIT;

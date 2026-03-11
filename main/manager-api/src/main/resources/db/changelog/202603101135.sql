-- Add Tavily web search plugin to ai_model_provider
INSERT INTO ai_model_provider (id, model_type, provider_code, name, fields,
                               sort, creator, create_date, updater, update_date)
VALUES ('SYSTEM_PLUGIN_TAVILY_SEARCH',
        'Plugin',
        'search_from_tavily',
        'Tavily网络搜索',
        JSON_ARRAY(
                JSON_OBJECT(
                        'key', 'api_key',
                        'type', 'string',
                        'label', 'Tavily API 密钥'
                ),
                JSON_OBJECT(
                        'key', 'max_results',
                        'type', 'number',
                        'label', '最大搜索结果数',
                        'default', '3'
                )
        ),
        15, 0, NOW(), 0, NOW());

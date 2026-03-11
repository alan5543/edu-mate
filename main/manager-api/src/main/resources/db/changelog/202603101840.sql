START TRANSACTION;

-- 5. 退出意图处理 (free, no config needed)
DELETE FROM ai_model_provider WHERE id = 'SYSTEM_PLUGIN_EXIT_INTENT';
INSERT INTO ai_model_provider (id, model_type, provider_code, name, fields,
                               sort, creator, create_date, updater, update_date)
VALUES ('SYSTEM_PLUGIN_EXIT_INTENT',
        'Plugin',
        'handle_exit_intent',
        '退出意图处理',
        JSON_ARRAY(),
        105, 0, NOW(), 0, NOW());

COMMIT;

-- 添加 Perplexity AI LLM Provider
delete from `ai_model_provider` where id = 'SYSTEM_LLM_perplexity';
INSERT INTO `ai_model_provider` (`id`, `model_type`, `provider_code`, `name`, `fields`, `sort`, `creator`, `create_date`, `updater`, `update_date`) VALUES
('SYSTEM_LLM_perplexity', 'LLM', 'perplexity', 'Perplexity AI', '[{\"key\":\"base_url\",\"label\":\"基础URL\",\"type\":\"string\"},{\"key\":\"model_name\",\"label\":\"模型名称\",\"type\":\"string\"},{\"key\":\"api_key\",\"label\":\"API密钥\",\"type\":\"string\"},{\"key\":\"temperature\",\"label\":\"温度\",\"type\":\"number\"},{\"key\":\"max_tokens\",\"label\":\"最大令牌数\",\"type\":\"number\"},{\"key\":\"top_p\",\"label\":\"top_p值\",\"type\":\"number\"},{\"key\":\"frequency_penalty\",\"label\":\"频率惩罚\",\"type\":\"number\"}]', 11, 1, NOW(), 1, NOW());

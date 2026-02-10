-- 最终更新: Google Cloud Speech-to-Text ASR 仅使用 API Key，无需 Project ID
delete from `ai_model_provider` where id = 'SYSTEM_ASR_GoogleCloud';
INSERT INTO `ai_model_provider` (`id`, `model_type`, `provider_code`, `name`, `fields`, `sort`, `creator`, `create_date`, `updater`, `update_date`) VALUES
('SYSTEM_ASR_GoogleCloud', 'ASR', 'google_cloud', 'Google Cloud Speech-to-Text', '[{"key":"api_key","label":"API Key","type":"password"},{"key":"language_1","label":"Language 1 (Primary)","type":"string"},{"key":"language_2","label":"Language 2 (Optional)","type":"string"},{"key":"language_3","label":"Language 3 (Optional)","type":"string"},{"key":"model","label":"Recognition Model","type":"string"},{"key":"output_dir","label":"Output Directory","type":"string"}]', 22, 1, NOW(), 1, NOW());

delete from `ai_model_config` where id = 'ASR_GoogleCloud';
INSERT INTO `ai_model_config` VALUES ('ASR_GoogleCloud', 'ASR', 'GoogleCloudSTT', 'Google Cloud Speech-to-Text', 0, 1, '{"type": "google_cloud", "api_key": "", "language_1": "en-US", "language_2": "zh-CN", "language_3": "yue-Hant-HK", "model": "latest_long", "output_dir": "tmp/"}', 'https://cloud.google.com/speech-to-text/v2/docs', 'Multi-language auto-detection: English, Chinese, Cantonese', 25, NULL, NULL, NULL, NULL);

UPDATE `ai_model_config` SET
`remark` = 'Google Cloud Speech-to-Text Configuration:
1. Go to https://console.cloud.google.com/ → create or select a project
2. Enable Speech-to-Text API: APIs & Services → Library → search "Speech-to-Text"
3. Create an API Key: APIs & Services → Credentials → Create Credentials → API Key
4. Language codes use BCP-47 format (up to 3 for auto-detection):
   - en-US (English), zh-CN (Mandarin), yue-Hant-HK (Cantonese)
   - ja-JP (Japanese), ko-KR (Korean), fr-FR (French), etc.
5. Recognition Model: latest_long (default), latest_short
Doc: https://cloud.google.com/speech-to-text/docs/sync-recognize
' WHERE `id` = 'ASR_GoogleCloud';

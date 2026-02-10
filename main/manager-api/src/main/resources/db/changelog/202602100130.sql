-- 添加 Google Cloud Speech-to-Text ASR 供应器
delete from `ai_model_provider` where id = 'SYSTEM_ASR_GoogleCloud';
INSERT INTO `ai_model_provider` (`id`, `model_type`, `provider_code`, `name`, `fields`, `sort`, `creator`, `create_date`, `updater`, `update_date`) VALUES
('SYSTEM_ASR_GoogleCloud', 'ASR', 'google_cloud', 'Google Cloud Speech-to-Text', '[{"key":"credentials_json","label":"Credentials JSON Path","type":"string"},{"key":"language_codes","label":"Language Codes (comma-separated)","type":"string"},{"key":"model","label":"Recognition Model","type":"string"},{"key":"output_dir","label":"Output Directory","type":"string"}]', 22, 1, NOW(), 1, NOW());

-- 添加 Google Cloud Speech-to-Text ASR 模型配置
delete from `ai_model_config` where id = 'ASR_GoogleCloud';
INSERT INTO `ai_model_config` VALUES ('ASR_GoogleCloud', 'ASR', 'GoogleCloudSTT', 'Google Cloud Speech-to-Text', 0, 1, '{"type": "google_cloud", "credentials_json": "", "language_codes": "en-US,zh-CN,yue-Hant-HK", "model": "latest_long", "output_dir": "tmp/"}', 'https://cloud.google.com/speech-to-text/v2/docs', 'Supports multi-language auto-detection (up to 3 languages)', 25, NULL, NULL, NULL, NULL);

-- 更新 Google Cloud Speech-to-Text 模型配置说明
UPDATE `ai_model_config` SET
`remark` = 'Google Cloud Speech-to-Text Configuration:
1. Create a Google Cloud project and enable the Speech-to-Text API
2. Create a Service Account and download the JSON key file
3. Set the "Credentials JSON Path" to the absolute path of the key file
4. Language Codes: comma-separated BCP-47 codes (max 3 for auto-detection)
   - Default: en-US,zh-CN,yue-Hant-HK (English, Mandarin, Cantonese)
   - Other examples: ja-JP (Japanese), ko-KR (Korean), fr-FR (French)
5. Recognition Model options: latest_long (default), latest_short, chirp_3
Setup steps:
1. Visit https://console.cloud.google.com/ and create/select a project
2. Enable Speech-to-Text API: https://console.cloud.google.com/apis/library/speech.googleapis.com
3. Create Service Account: https://console.cloud.google.com/iam-admin/serviceaccounts
4. Download JSON key → set path in credentials_json
5. For more info: https://cloud.google.com/speech-to-text/v2/docs/quickstart
' WHERE `id` = 'ASR_GoogleCloud';

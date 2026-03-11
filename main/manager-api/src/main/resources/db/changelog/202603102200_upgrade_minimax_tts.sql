-- Upgrade MiniMax TTS model to speech-2.8-turbo and add Cantonese voice presets
UPDATE `ai_model_config` 
SET `config_json` = JSON_SET(`config_json`, '$.model', 'speech-2.8-turbo')
WHERE `id` = 'TTS_MinimaxStreamTTS';

UPDATE `ai_model_provider`
SET `fields` = '[{"key":"output_dir","label":"输出目录","type":"string"},{"key":"group_id","label":"组ID","type":"string"},{"key":"api_key","label":"API密钥","type":"string"},{"key":"model","label":"模型","type":"select","options":[{"label":"Speech 2.8 Turbo (低延迟/推荐)","value":"speech-2.8-turbo"},{"label":"Speech 2.8 HD (高音质)","value":"speech-2.8-hd"},{"label":"Speech 2.6 Turbo","value":"speech-2.6-turbo"},{"label":"Speech 2.6 HD","value":"speech-2.6-hd"},{"label":"Speech 01 Turbo (旧版)","value":"speech-01-turbo"}],"default":"speech-2.8-turbo"},{"key":"voice_id","label":"音色ID","type":"select","options":[{"label":"粤语-亲切女声 (Kind Woman)","value":"Cantonese_KindWoman"},{"label":"粤语-解说员 (Articulate Commentator)","value":"Cantonese_Articulate_commentator_vv2"},{"label":"粤语-专业女播音 (Professional Host F)","value":"Cantonese_ProfessionalHost (F)"},{"label":"粤语-专业男播音 (Professional Host M)","value":"Cantonese_ProfessionalHost (M)"},{"label":"粤语-温柔女士 (Gentle Lady)","value":"Cantonese_GentleLady"},{"label":"粤语-活力男子 (Playful Man)","value":"Cantonese_PlayfulMan"},{"label":"粤语-可爱女孩 (Cute Girl)","value":"Cantonese_CuteGirl"},{"label":"普通话-少女 (Default)","value":"female-shaonv"}],"default":"female-shaonv"}]'
WHERE `id` = 'SYSTEM_TTS_minimax' OR `provider_code` = 'minimax';


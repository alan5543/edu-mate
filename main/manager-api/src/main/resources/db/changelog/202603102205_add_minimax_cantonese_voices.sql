-- Add Cantonese voices to the Voice Management list for MiniMax TTS
-- Note: is_system column does not exist in this table, removed.
INSERT INTO `ai_tts_voice` (`id`, `tts_model_id`, `name`, `tts_voice`, `languages`, `sort`, `create_date`) VALUES 
('TTS_MinimaxStreamTTS_0014', 'TTS_MinimaxStreamTTS', '粤语-亲切女声', 'Cantonese_KindWoman', '粤语', 14, NOW()),
('TTS_MinimaxStreamTTS_0015', 'TTS_MinimaxStreamTTS', '粤语-解说员', 'Cantonese_Articulate_commentator_vv2', '粤语', 15, NOW()),
('TTS_MinimaxStreamTTS_0016', 'TTS_MinimaxStreamTTS', '粤语-专业女播音', 'Cantonese_ProfessionalHost (F)', '粤语', 16, NOW()),
('TTS_MinimaxStreamTTS_0017', 'TTS_MinimaxStreamTTS', '粤语-专业男播音', 'Cantonese_ProfessionalHost (M)', '粤语', 17, NOW()),
('TTS_MinimaxStreamTTS_0018', 'TTS_MinimaxStreamTTS', '粤语-温柔女士', 'Cantonese_GentleLady', '粤语', 18, NOW()),
('TTS_MinimaxStreamTTS_0019', 'TTS_MinimaxStreamTTS', '粤语-活力男子', 'Cantonese_PlayfulMan', '粤语', 19, NOW()),
('TTS_MinimaxStreamTTS_0020', 'TTS_MinimaxStreamTTS', '粤语-可爱女孩', 'Cantonese_CuteGirl', '粤语', 20, NOW());

// WebSocket消息处理模块
import { getConfig, saveConnectionUrls } from '../../config/manager.js?v=0310-1';
import { uiController } from '../../ui/controller.js?v=0310-1';
import { log } from '../../utils/logger.js?v=0310-1';
import { getAudioPlayer } from '../audio/player.js?v=0310-1';
import { getAudioRecorder } from '../audio/recorder.js?v=0310-1';
import { executeMcpTool, getMcpTools, setWebSocket as setMcpWebSocket } from '../mcp/tools.js?v=0310-1';
import { renderToolList, addToolCallEvent, clearToolList, markToolCalling, markToolIdle, renderDeviceMcpTools, initToolTracker } from '../tools/tool-list.js?v=0310-2';
import { webSocketConnect } from './ota-connector.js?v=0310-1';

// WebSocket处理器类
export class WebSocketHandler {
    constructor() {
        this.websocket = null;
        this.onConnectionStateChange = null;
        this.onRecordButtonStateChange = null;
        this.onSessionStateChange = null;
        this.onSessionEmotionChange = null;
        this.onChatMessage = null; // 新增：聊天消息回调
        this.currentSessionId = null;
        this.isRemoteSpeaking = false;
        this.visionConfig = null; // Store vision API config from MCP initialize
    }

    // 发送hello握手消息
    async sendHelloMessage() {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return false;

        try {
            const config = getConfig();

            const helloMessage = {
                type: 'hello',
                device_id: config.deviceId,
                device_name: config.deviceName,
                device_mac: config.deviceMac,
                token: config.token,
                features: {
                    mcp: true
                }
            };

            log('发送hello握手消息', 'info');
            this.websocket.send(JSON.stringify(helloMessage));

            return new Promise(resolve => {
                const timeout = setTimeout(() => {
                    log('等待hello响应超时', 'error');
                    log('提示: 请尝试点击"测试认证"按钮进行连接排查', 'info');
                    resolve(false);
                }, 5000);

                const onMessageHandler = (event) => {
                    try {
                        const response = JSON.parse(event.data);
                        if (response.type === 'hello' && response.session_id) {
                            log(`服务器握手成功，会话ID: ${response.session_id}`, 'success');
                            clearTimeout(timeout);
                            this.websocket.removeEventListener('message', onMessageHandler);
                            resolve(true);
                        }
                    } catch (e) {
                        // 忽略非JSON消息
                    }
                };

                this.websocket.addEventListener('message', onMessageHandler);
            });
        } catch (error) {
            log(`发送hello消息错误: ${error.message}`, 'error');
            return false;
        }
    }

    // 处理文本消息
    handleTextMessage(message) {
        if (message.type === 'hello') {
            log(`服务器回应：${JSON.stringify(message, null, 2)}`, 'success');
            uiController.startAIChatSession();
        } else if (message.type === 'tts') {
            this.handleTTSMessage(message);
        } else if (message.type === 'audio') {
            log(`收到音频控制消息: ${JSON.stringify(message)}`, 'info');
        } else if (message.type === 'stt') {
            log(`识别结果: ${message.text}`, 'info');
            // 使用新的聊天消息回调显示STT消息
            if (this.onChatMessage && message.text) {
                this.onChatMessage(message.text, true);
            }
        } else if (message.type === 'llm') {
            log(`大模型回复: ${message.text}`, 'info');
            // 使用新的聊天消息回调显示LLM回复
            if (this.onChatMessage && message.text) {
                this.onChatMessage(message.text, false);
            }

            // 如果包含表情，更新sessionStatus表情并触发Live2D动作
            if (message.text && /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(message.text)) {
                // 提取表情符号
                const emojiMatch = message.text.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u);
                if (emojiMatch && this.onSessionEmotionChange) {
                    this.onSessionEmotionChange(emojiMatch[0]);
                }

                // 触发Live2D情绪动作
                if (message.emotion) {
                    console.log(`收到情绪消息: emotion=${message.emotion}, text=${message.text}`);
                    this.triggerLive2DEmotionAction(message.emotion);
                }
            }

            // 只有当文本不仅仅是表情时，才添加到对话中
            // 移除文本中的表情后检查是否还有内容
            const textWithoutEmoji = message.text ? message.text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim() : '';
            if (textWithoutEmoji && this.onChatMessage) {
                this.onChatMessage(message.text, false);
            }
        } else if (message.type === 'mcp') {
            this.handleMCPMessage(message);
        } else if (message.type === 'tool_list') {
            // 服务端工具列表
            log(`收到服务端工具列表: ${(message.tools || []).length} 个工具`, 'info');
            renderToolList(message.tools || []);
        } else if (message.type === 'tool_call') {
            // 服务端工具调用事件
            log(`收到工具调用事件: ${message.name}`, 'info');
            addToolCallEvent(message);
        } else {
            log(`未知消息类型: ${message.type}`, 'info');
            if (this.onChatMessage) {
                this.onChatMessage(`未知消息类型: ${message.type}\n${JSON.stringify(message, null, 2)}`, false);
            }
        }
    }

    // 处理TTS消息
    handleTTSMessage(message) {
        if (message.state === 'start') {
            log('服务器开始发送语音', 'info');
            this.currentSessionId = message.session_id;
            this.isRemoteSpeaking = true;
            if (this.onSessionStateChange) {
                this.onSessionStateChange(true);
            }

            // 启动Live2D说话动画
            this.startLive2DTalking();
        } else if (message.state === 'sentence_start') {
            log(`服务器发送语音段: ${message.text}`, 'info');
            this.ttsSentenceCount = (this.ttsSentenceCount || 0) + 1;

            if (message.text && this.onChatMessage) {
                this.onChatMessage(message.text, false);
            }

            // 确保动画在句子开始时运行
            const live2dManager = window.chatApp?.live2dManager;
            if (live2dManager && !live2dManager.isTalking) {
                this.startLive2DTalking();
            }
        } else if (message.state === 'sentence_end') {
            log(`语音段结束: ${message.text}`, 'info');

            // 句子结束时不清除动画，等待下一个句子或最终停止
        } else if (message.state === 'stop') {
            log('服务器语音传输结束，清空所有音频缓冲', 'info');

            // 清空所有音频缓冲并停止播放
            const audioPlayer = getAudioPlayer();
            audioPlayer.clearAllAudio();

            this.isRemoteSpeaking = false;
            if (this.onRecordButtonStateChange) {
                this.onRecordButtonStateChange(false);
            }
            if (this.onSessionStateChange) {
                this.onSessionStateChange(false);
            }

            // 延迟停止Live2D说话动画，确保所有句子都播放完毕
            setTimeout(() => {
                this.stopLive2DTalking();
                this.ttsSentenceCount = 0; // 重置计数器
            }, 1000); // 1秒延迟，确保所有句子都完成
        }
    }

    // 启动Live2D说话动画
    startLive2DTalking() {
        try {
            // 获取Live2D管理器实例
            const live2dManager = window.chatApp?.live2dManager;
            if (live2dManager && live2dManager.live2dModel) {
                // 使用音频播放器的分析器节点
                live2dManager.startTalking();
                log('Live2D说话动画已启动', 'info');
            }
        } catch (error) {
            log(`启动Live2D说话动画失败: ${error.message}`, 'error');
        }
    }

    // 停止Live2D说话动画
    stopLive2DTalking() {
        try {
            const live2dManager = window.chatApp?.live2dManager;
            if (live2dManager) {
                live2dManager.stopTalking();
                log('Live2D说话动画已停止', 'info');
            }
        } catch (error) {
            log(`停止Live2D说话动画失败: ${error.message}`, 'error');
        }
    }

    // 初始化Live2D音频分析器
    initializeLive2DAudioAnalyzer() {
        try {
            const live2dManager = window.chatApp?.live2dManager;
            if (live2dManager) {
                // 初始化音频分析器（使用音频播放器的上下文）
                if (live2dManager.initializeAudioAnalyzer()) {
                    log('Live2D音频分析器初始化完成，已连接到音频播放器', 'success');
                } else {
                    log('Live2D音频分析器初始化失败，将使用模拟动画', 'warning');
                }
            }
        } catch (error) {
            log(`初始化Live2D音频分析器失败: ${error.message}`, 'error');
        }
    }

    // 处理MCP消息
    handleMCPMessage(message) {
        const payload = message.payload || {};
        log(`服务器下发: ${JSON.stringify(message)}`, 'info');

        if (payload.method === 'tools/list') {
            const tools = getMcpTools();

            const replyMessage = JSON.stringify({
                "session_id": message.session_id || "",
                "type": "mcp",
                "payload": {
                    "jsonrpc": "2.0",
                    "id": payload.id,
                    "result": {
                        "tools": tools
                    }
                }
            });
            log(`客户端上报: ${replyMessage}`, 'info');
            this.websocket.send(replyMessage);
            log(`回复MCP工具列表: ${tools.length} 个工具`, 'info');

        } else if (payload.method === 'tools/call') {
            const toolName = payload.params?.name;
            const toolArgs = payload.params?.arguments;

            log(`调用工具: ${toolName} 参数: ${JSON.stringify(toolArgs)}`, 'info');

            // Mark tool as calling in the tracker
            markToolCalling(toolName);

            // INTERCEPT CAMERA TOOL CALL
            if (toolName === 'self.camera.take_picture') {
                log('====== 请求打开摄像头，进入相机模拟模式 ======', 'info');
                this.handleCameraSimulation(message, payload, toolName);
                return; // Stop normal execution
            }

            const result = executeMcpTool(toolName, toolArgs);

            // Track this device MCP tool call in the activity feed
            addToolCallEvent({
                name: toolName,
                arguments: toolArgs,
                result_action: 'RESPONSE',
                result_summary: JSON.stringify(result).substring(0, 200),
            });

            // Mark tool as idle
            markToolIdle(toolName);

            const replyMessage = JSON.stringify({
                "session_id": message.session_id || "",
                "type": "mcp",
                "payload": {
                    "jsonrpc": "2.0",
                    "id": payload.id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": JSON.stringify(result)
                            }
                        ],
                        "isError": false
                    }
                }
            });

            log(`客户端上报: ${replyMessage}`, 'info');
            this.websocket.send(replyMessage);
        } else if (payload.method === 'initialize') {
            log(`收到工具初始化请求: ${JSON.stringify(payload.params)}`, 'info');

            // Extract vision capabilities from MCP server if provided
            if (payload.params?.capabilities?.vision) {
                this.visionConfig = payload.params.capabilities.vision;
                log(`保存视觉API配置: URL=${this.visionConfig.url}`, 'info');
            }

            const replyMessage = JSON.stringify({
                "session_id": message.session_id || "",
                "type": "mcp",
                "payload": {
                    "jsonrpc": "2.0",
                    "id": payload.id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {
                            "tools": {}
                        },
                        "serverInfo": {
                            "name": "xiaozhi-web-test",
                            "version": "2.1.0"
                        }
                    }
                }
            });
            log(`回复初始化响应`, 'info');
            this.websocket.send(replyMessage);
        } else {
            log(`未知的MCP方法: ${payload.method}`, 'warning');
        }
    }

    // 模拟相机拍照和上传
    handleCameraSimulation(message, payload, toolName) {
        const modal = document.getElementById('cameraModal');
        const fileInput = document.getElementById('cameraFileInput');
        const textDisplay = document.getElementById('cameraPreviewText');
        const imgPreview = document.getElementById('cameraPreviewImg');
        const cancelBtn = document.getElementById('cancelCameraBtn');
        const submitBtn = document.getElementById('submitCameraBtn');
        const statusText = document.getElementById('cameraStatusText');
        const previewBg = document.getElementById('cameraPreviewContainer');

        if (!modal) {
            log('未找到相机模拟弹窗，无法执行', 'error');
            this.sendMcpError(message.session_id, payload.id, "Device camera UI not available");
            return;
        }

        // Reset UI
        modal.style.display = 'block';
        textDisplay.style.display = 'block';
        imgPreview.style.display = 'none';
        imgPreview.src = '';
        fileInput.value = '';
        statusText.style.display = 'none';
        statusText.textContent = '';
        submitBtn.disabled = true;

        let selectedFile = null;

        // Cleanup function for listeners
        const cleanup = () => {
            modal.style.display = 'none';
            markToolIdle(toolName);
            cancelBtn.onclick = null;
            submitBtn.onclick = null;
            previewBg.onclick = null;
            fileInput.onchange = null;
        };

        // Handlers
        cancelBtn.onclick = () => {
            log('用户取消了拍照', 'warning');
            this.sendMcpError(message.session_id, payload.id, "User cancelled camera capture");
            cleanup();
        };

        previewBg.onclick = () => {
            fileInput.click();
        };

        fileInput.onchange = (e) => {
            if (e.target.files && e.target.files[0]) {
                selectedFile = e.target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                    imgPreview.src = e.target.result;
                    imgPreview.style.display = 'block';
                    textDisplay.style.display = 'none';
                    submitBtn.disabled = false;
                };
                reader.readAsDataURL(selectedFile);
            }
        };

        submitBtn.onclick = async () => {
            if (!selectedFile) return;
            submitBtn.disabled = true;
            statusText.style.display = 'block';
            statusText.style.color = '#fee75c';
            statusText.textContent = '🔄 正在上传并在后端进行视觉分析...';

            log('开始发送图片到 /v1/vision 接口...', 'info');

            try {
                // Get config and url
                const config = getConfig();
                const deviceId = config.deviceId;

                let visionUrl, token;
                if (this.visionConfig && this.visionConfig.url && this.visionConfig.token) {
                    visionUrl = this.visionConfig.url;
                    token = this.visionConfig.token;
                    log('使用服务器下发的 Vision API 配置', 'info');
                } else {
                    token = config.token;
                    const otaUrlObj = new URL(document.getElementById('otaUrl').value);
                    // Extract host and port
                    const httpProtocol = otaUrlObj.protocol === 'wss:' ? 'https:' : 'http:';
                    // The vision API runs on port 8003
                    let host = otaUrlObj.host;
                    if (host.includes(':')) {
                        host = host.split(':')[0] + ':8003';
                    }
                    const hostUrl = `${httpProtocol}//${host}`;
                    visionUrl = `${hostUrl}/mcp/vision/explain`;
                    log('向 Vision API 发送数据，使用本地推导配置', 'info');
                }

                // We need the last user chat message to send as the question
                let lastQuestion = "请描述这张图片中有什么。";
                const chatStream = document.getElementById('chatStream');
                if (chatStream) {
                    const messages = Array.from(chatStream.querySelectorAll('.chat-message.user .message-bubble'));
                    // Find the last user message
                    if (messages.length > 0) {
                        lastQuestion = messages[messages.length - 1].textContent.trim();
                    }
                }

                const formData = new FormData();
                // IMPORTANT: The backend expects 'question' first, then 'image' in sequential multipart
                formData.append('question', lastQuestion);
                formData.append('image', selectedFile);

                const response = await fetch(visionUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Device-Id': deviceId,
                        'Client-Id': config.clientId
                    },
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                statusText.style.color = '#57f287';
                statusText.textContent = '✅ 视觉分析完成! 通知大模型...';
                log(`视觉分析响应: ${JSON.stringify(data)}`, 'success');

                // Track the successful tool call summary
                const mockSummary = `[照片已拍] 分析结果: ${data.response?.substring(0, 100)}...`;
                addToolCallEvent({
                    name: toolName,
                    arguments: {},
                    result_action: 'RESPONSE',
                    result_summary: mockSummary,
                });

                // Reply to the MCP server with the actual data from the backend
                const replyMessage = JSON.stringify({
                    "session_id": message.session_id || "",
                    "type": "mcp",
                    "payload": {
                        "jsonrpc": "2.0",
                        "id": payload.id,
                        "result": {
                            "content": [
                                {
                                    "type": "text",
                                    "text": JSON.stringify({
                                        success: data.success ?? true,
                                        message: data.message || (data.success ? "照片已拍摄，视觉分析结果已生成" : "视觉分析失败"),
                                        vision_analysis: data.response || null
                                    })
                                }
                            ],
                            "isError": !data.success
                        }
                    }
                });

                this.websocket.send(replyMessage);

                setTimeout(() => {
                    cleanup();
                }, 1500);

            } catch (error) {
                log(`视觉API上传失败: ${error.message} `, 'error');
                statusText.style.color = '#ed4245';
                statusText.textContent = `❌ 上传出错: ${error.message} `;
                submitBtn.disabled = false;

                // After 3 seconds, abort and cleanup
                setTimeout(() => {
                    this.sendMcpError(message.session_id, payload.id, `Upload failed: ${error.message} `);
                    cleanup();
                }, 3000);
            }
        };
    }

    // 发送MCP错误响应
    sendMcpError(sessionId, messageId, errorMessage) {
        if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) return;

        const replyMessage = JSON.stringify({
            "session_id": sessionId || "",
            "type": "mcp",
            "payload": {
                "jsonrpc": "2.0",
                "id": messageId,
                "error": {
                    "code": -32603,
                    "message": errorMessage
                }
            }
        });
        log(`发送MCP错误响应: ${errorMessage} `, 'warning');
        this.websocket.send(replyMessage);
    }

    // 处理二进制消息
    async handleBinaryMessage(data) {
        try {
            let arrayBuffer;
            if (data instanceof ArrayBuffer) {
                arrayBuffer = data;
            } else if (data instanceof Blob) {
                arrayBuffer = await data.arrayBuffer();
                log(`收到Blob音频数据，大小: ${arrayBuffer.byteLength} 字节`, 'debug');
            } else {
                log(`收到未知类型的二进制数据: ${typeof data} `, 'warning');
                return;
            }

            const opusData = new Uint8Array(arrayBuffer);
            const audioPlayer = getAudioPlayer();
            audioPlayer.enqueueAudioData(opusData);
        } catch (error) {
            log(`处理二进制消息出错: ${error.message} `, 'error');
        }
    }

    // 连接WebSocket服务器
    async connect() {
        const config = getConfig();
        log('正在检查OTA状态...', 'info');
        saveConnectionUrls();

        try {
            const otaUrl = document.getElementById('otaUrl').value.trim();
            const ws = await webSocketConnect(otaUrl, config);
            if (ws === undefined) {
                return false;
            }
            this.websocket = ws;

            // 设置接收二进制数据的类型为ArrayBuffer
            this.websocket.binaryType = 'arraybuffer';

            // 设置 MCP 模块的 WebSocket 实例
            setMcpWebSocket(this.websocket);

            // 设置录音器的WebSocket
            const audioRecorder = getAudioRecorder();
            audioRecorder.setWebSocket(this.websocket);

            this.setupEventHandlers();

            return true;
        } catch (error) {
            log(`连接错误: ${error.message} `, 'error');
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(false);
            }
            return false;
        }
    }

    // 设置事件处理器
    setupEventHandlers() {
        this.websocket.onopen = async () => {
            const url = document.getElementById('serverUrl').value;
            log(`已连接到服务器: ${url} `, 'success');

            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(true);
            }

            // 连接成功后，默认状态为聆听中
            this.isRemoteSpeaking = false;
            if (this.onSessionStateChange) {
                this.onSessionStateChange(false);
            }

            // Initialize the tool tracker panel toggles
            initToolTracker();

            // Render device MCP tools in the tracker
            const deviceTools = getMcpTools();
            renderDeviceMcpTools(deviceTools.map(t => ({
                name: t.name,
                description: t.description,
                inputSchema: t.inputSchema,
            })));

            // 在WebSocket连接成功时初始化Live2D音频分析器
            this.initializeLive2DAudioAnalyzer();

            await this.sendHelloMessage();
        };

        this.websocket.onclose = () => {
            log('已断开连接', 'info');

            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(false);
            }

            // 清除工具列表
            clearToolList();

            const audioRecorder = getAudioRecorder();
            audioRecorder.stop();
        };

        this.websocket.onerror = (error) => {
            log(`WebSocket错误: ${error.message || '未知错误'} `, 'error');
            uiController.addChatMessage(`⚠️ WebSocket错误: ${error.message || '未知错误'} `, false);
            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(false);
            }
        };

        this.websocket.onmessage = (event) => {
            try {
                if (typeof event.data === 'string') {
                    const message = JSON.parse(event.data);
                    this.handleTextMessage(message);
                } else {
                    this.handleBinaryMessage(event.data);
                }
            } catch (error) {
                log(`WebSocket消息处理错误: ${error.message} `, 'error');
                // 不再使用旧的addMessage函数，因为conversationDiv元素不存在
                // 错误消息将通过其他方式显示
            }
        };
    }

    // 断开连接
    disconnect() {
        if (!this.websocket) return;

        this.websocket.close();
        const audioRecorder = getAudioRecorder();
        audioRecorder.stop();
    }

    // 发送文本消息
    sendTextMessage(text) {
        if (text === '' || !this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
            return false;
        }

        try {
            // 如果对方正在说话，先发送打断消息
            if (this.isRemoteSpeaking && this.currentSessionId) {
                const abortMessage = {
                    session_id: this.currentSessionId,
                    type: 'abort',
                    reason: 'wake_word_detected'
                };
                this.websocket.send(JSON.stringify(abortMessage));
                log('发送打断消息', 'info');
            }

            const listenMessage = {
                type: 'listen',
                state: 'detect',
                text: text
            };

            this.websocket.send(JSON.stringify(listenMessage));
            log(`发送文本消息: ${text} `, 'info');

            return true;
        } catch (error) {
            log(`发送消息错误: ${error.message} `, 'error');
            return false;
        }
    }

    /**
     * 触发Live2D情绪动作
     * @param {string} emotion - 情绪名称
     */
    triggerLive2DEmotionAction(emotion) {
        try {
            const live2dManager = window.chatApp?.live2dManager;
            if (live2dManager && typeof live2dManager.triggerEmotionAction === 'function') {
                live2dManager.triggerEmotionAction(emotion);
                log(`触发Live2D情绪动作: ${emotion} `, 'info');
            } else {
                log(`无法触发Live2D情绪动作: Live2D管理器未找到或方法不可用`, 'warning');
            }
        } catch (error) {
            log(`触发Live2D情绪动作失败: ${error.message} `, 'error');
        }
    }

    // 获取WebSocket实例
    getWebSocket() {
        return this.websocket;
    }

    // 检查是否已连接
    isConnected() {
        return this.websocket && this.websocket.readyState === WebSocket.OPEN;
    }
}

// 创建单例
let wsHandlerInstance = null;

export function getWebSocketHandler() {
    if (!wsHandlerInstance) {
        wsHandlerInstance = new WebSocketHandler();
    }
    return wsHandlerInstance;
}

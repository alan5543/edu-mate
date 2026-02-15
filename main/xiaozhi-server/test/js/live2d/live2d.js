/**
 * Live2D 管理器
 * 负责 Live2D 模型的初始化、嘴部动画控制等功能
 */
class Live2DManager {
    constructor() {
        this.live2dApp = null;
        this.live2dModel = null;
        this.isTalking = false;
        this.mouthAnimationId = null;
        this.mouthParam = 'ParamMouthOpenY';
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.lastEmotionActionTime = null; // 上次情绪触发动作的时间

        // 情绪到动作的映射
        this.emotionToActionMap = {
            'happy': 'FlickUp',      // 开心-向上轻扫动作
            'laughing': 'FlickUp',   // 大笑-向上轻扫动作
            'funny': 'FlickUp',      // 搞笑-向上轻扫动作
            'sad': 'FlickDown',      // 伤心-向下轻扫动作
            'crying': 'FlickDown',   // 哭泣-向下轻扫动作
            'angry': 'Tap@Body',     // 生气-身体点击动作
            'surprised': 'Tap',      // 惊讶-点击动作
            'neutral': 'Flick',      // 平常-轻扫动作
            'default': 'Flick@Body'  // 默认-身体轻扫动作
        };

        // 单/双击判定配置与状态
        this._lastClickTime = 0;
        this._lastClickPos = { x: 0, y: 0 };
        this._singleClickTimer = null;
        this._doubleClickMs = 280; // 双击时间阈值(ms)
        this._doubleClickDist = 16; // 双击允许的最大位移(px)
        // 滑动判定
        this._pointerDown = false;
        this._downPos = { x: 0, y: 0 };
        this._downTime = 0;
        this._downArea = 'Body';
        this._movedBeyondClick = false;
        this._swipeMinDist = 24; // 触发滑动的最小距离

        // 模型配置
        this.models = {
            'cat': {
                path: 'LittleCat/LittleCat.model3.json',
                x: 0, // x offset (relative to center)
                y: 250,
                scale: 0.33
            },
            'girl': {
                path: 'hiyori_pro_zh/runtime/hiyori_pro_t11.model3.json',
                x: 0,
                y: 0,
                scale: 0.25
            }
        };
        this.currentModelKey = localStorage.getItem('live2d_model_key') || 'cat';
    }

    /**
     * 初始化 Live2D
     */
    async initializeLive2D() {
        try {
            const canvas = document.getElementById('live2d-stage');

            // 供内部使用
            window.PIXI = PIXI;

            this.live2dApp = new PIXI.Application({
                view: canvas,
                height: window.innerHeight,
                width: window.innerWidth,
                resolution: window.devicePixelRatio,
                autoDensity: true,
                antialias: true,
                backgroundAlpha: 0,
            });

            // 加载 Live2D 模型
            await this.loadModel(this.currentModelKey);

            // 添加窗口大小变化监听器，保持模型在Canvas中间和底部
            window.addEventListener('resize', () => {
                if (this.live2dModel) {
                    const config = this.models[this.currentModelKey];
                    // 使用窗口实际尺寸重新计算模型位置
                    this.live2dModel.x = (window.innerWidth - this.live2dModel.width) * 0.5 + (config.x || 0);
                    this.live2dModel.y = config.y;
                }
            });

        } catch (err) {
            console.error('加载 Live2D 模型失败:', err);
        }
    }

    /**
     * 加载指定模型
     * @param {string} key - 模型key ('cat' or 'girl')
     */
    async loadModel(key) {
        if (!this.models[key]) {
            console.error('未找到模型配置:', key);
            return;
        }

        const config = this.models[key];
        localStorage.setItem('live2d_model_key', key);
        this.currentModelKey = key;

        try {
            // 如果已有模型，先移除并销毁
            if (this.live2dModel) {
                this.live2dApp.stage.removeChild(this.live2dModel);
                this.live2dModel.destroy();
                this.live2dModel = null;
            }

            // 获取当前HTML文件所在的目录路径
            const currentPath = window.location.pathname;
            const lastSlashIndex = currentPath.lastIndexOf('/');
            const basePath = currentPath.substring(0, lastSlashIndex + 1);
            const modelPath = basePath + config.path;

            console.log(`Loading model: ${key}, path: ${modelPath}`);

            this.live2dModel = await PIXI.live2d.Live2DModel.from(modelPath);
            this.live2dApp.stage.addChild(this.live2dModel);

            // 设置模型属性
            this.live2dModel.scale.set(config.scale);
            this.live2dModel.x = (window.innerWidth - this.live2dModel.width) * 0.5 + (config.x || 0);
            this.live2dModel.y = config.y;

            // 重新绑定事件监听
            this.bindModelEvents();

        } catch (err) {
            console.error(`加载模型 ${key} 失败:`, err);
        }
    }

    /**
     * 绑定模型事件
     */
    bindModelEvents() {
        if (!this.live2dModel) return;

        // 启用交互
        this.live2dModel.interactive = true;

        // 重新绑定点击/滑动等事件
        this.live2dModel.on('doublehit', (args) => {
            const area = Array.isArray(args) ? args[0] : args;
            if (area === 'Body') {
                this.motion('Flick@Body');
            } else if (area === 'Head' || area === 'Face') {
                this.motion('Flick');
            }
            const app = window.chatApp;
            const payload = JSON.stringify({ type: 'live2d', event: 'doublehit', area });
            if (app && app.dataChannel && app.dataChannel.readyState === 'open') {
                app.dataChannel.send(payload);
            }
        });

        this.live2dModel.on('singlehit', (args) => {
            const area = Array.isArray(args) ? args[0] : args;
            if (area === 'Body') {
                this.motion('Tap@Body');
            } else if (area === 'Head' || area === 'Face') {
                this.motion('Tap');
            }
            const app = window.chatApp;
            const payload = JSON.stringify({ type: 'live2d', event: 'singlehit', area });
            if (app && app.dataChannel && app.dataChannel.readyState === 'open') {
                app.dataChannel.send(payload);
            }
        });

        this.live2dModel.on('swipe', (args) => {
            const area = Array.isArray(args) ? args[0] : args;
            const dir = Array.isArray(args) ? args[1] : undefined;
            if (area === 'Body') {
                if (dir === 'up') this.motion('FlickUp');
                else if (dir === 'down') this.motion('FlickDown');
            } else if (area === 'Head' || area === 'Face') {
                if (dir === 'up') this.motion('FlickUp');
                else if (dir === 'down') this.motion('FlickDown');
            }
            const app = window.chatApp;
            const payload = JSON.stringify({ type: 'live2d', event: 'swipe', area, dir });
            if (app && app.dataChannel && app.dataChannel.readyState === 'open') {
                app.dataChannel.send(payload);
            }
        });

        // 绑定自定义指针事件 (复用之前的逻辑)
        this.live2dModel.on('pointerdown', (event) => this.handlePointerDown(event));
        this.live2dModel.on('pointermove', (event) => this.handlePointerMove(event));
        const handlePointerUp = (event) => this.handlePointerUp(event);
        this.live2dModel.on('pointerup', handlePointerUp);
        this.live2dModel.on('pointerupoutside', handlePointerUp);
    }

    /**
     * 切换角色
     */
    async switchCharacter() {
        const keys = Object.keys(this.models);
        const currentIndex = keys.indexOf(this.currentModelKey);
        const nextIndex = (currentIndex + 1) % keys.length;
        const nextKey = keys[nextIndex];
        await this.loadModel(nextKey);
    }

    // 将原本内联的事件处理抽取为方法，以便在切换模型时复用
    handlePointerDown(event) {
        try {
            const global = event.data.global;
            const bounds = this.live2dModel.getBounds();
            if (!bounds || !bounds.contains(global.x, global.y)) return;

            const relX = (global.x - bounds.x) / (bounds.width || 1);
            const relY = (global.y - bounds.y) / (bounds.height || 1);
            let area = '';
            if (relX >= 0.4 && relX <= 0.6) {
                if (relY <= 0.15) {
                    area = 'Head';
                } else if (relY <= 0.23) {
                    area = 'Face';
                } else {
                    area = 'Body';
                }
            }
            if (area === '') return;

            this._pointerDown = true;
            this._downPos = { x: global.x, y: global.y };
            this._downTime = performance.now();
            this._downArea = area;
            this._movedBeyondClick = false;

            const now = performance.now();
            const dt = now - (this._lastClickTime || 0);
            const dx = global.x - (this._lastClickPos?.x || 0);
            const dy = global.y - (this._lastClickPos?.y || 0);
            const dist = Math.hypot(dx, dy);

            if (this._lastClickTime && dt <= this._doubleClickMs && dist <= this._doubleClickDist) {
                if (this._singleClickTimer) {
                    clearTimeout(this._singleClickTimer);
                    this._singleClickTimer = null;
                }
                if (typeof this.live2dModel.emit === 'function') {
                    this.live2dModel.emit('doublehit', [area]);
                }
                this._lastClickTime = 0;
                this._pointerDown = false;
                return;
            }

            this._lastClickTime = now;
            this._lastClickPos = { x: global.x, y: global.y };
            if (this._singleClickTimer) {
                clearTimeout(this._singleClickTimer);
                this._singleClickTimer = null;
            }
            this._singleClickTimer = setTimeout(() => {
                if (!this._movedBeyondClick && typeof this.live2dModel.emit === 'function') {
                    this.live2dModel.emit('singlehit', [area]);
                }
                this._singleClickTimer = null;
                this._lastClickTime = 0;
            }, this._doubleClickMs);
        } catch (e) { }
    }

    handlePointerMove(event) {
        try {
            if (!this._pointerDown) return;
            const global = event.data.global;
            const dx = global.x - this._downPos.x;
            const dy = global.y - this._downPos.y;
            const dist = Math.hypot(dx, dy);

            if (dist > this._doubleClickDist) {
                this._movedBeyondClick = true;
                if (this._singleClickTimer) {
                    clearTimeout(this._singleClickTimer);
                    this._singleClickTimer = null;
                }
                this._lastClickTime = 0;
            }
        } catch (e) { }
    }

    handlePointerUp(event) {
        try {
            if (!this._pointerDown) return;
            const global = (event && event.data && event.data.global) ? event.data.global : { x: this._downPos.x, y: this._downPos.y };
            const dx = global.x - this._downPos.x;
            const dy = global.y - this._downPos.y;
            const dist = Math.hypot(dx, dy);

            if (this._movedBeyondClick && dist >= this._swipeMinDist) {
                if (typeof this.live2dModel.emit === 'function') {
                    const dir = Math.abs(dx) >= Math.abs(dy)
                        ? (dx > 0 ? 'right' : 'left')
                        : (dy > 0 ? 'down' : 'up');
                    this.live2dModel.emit('swipe', [this._downArea, dir]);
                }
                if (this._singleClickTimer) {
                    clearTimeout(this._singleClickTimer);
                    this._singleClickTimer = null;
                }
                this._lastClickTime = 0;
            }
        } catch (e) {
        } finally {
            this._pointerDown = false;
            this._movedBeyondClick = false;
        }
    }



    /**
     * 初始化音频分析器 - 使用音频播放器的分析器节点
     */
    initializeAudioAnalyzer() {
        try {
            // 获取音频播放器实例
            const audioPlayer = window.chatApp?.audioPlayer;
            if (!audioPlayer) {
                console.warn('音频播放器未初始化，无法获取分析器节点');
                return false;
            }

            // 获取音频播放器的音频上下文
            this.audioContext = audioPlayer.getAudioContext();
            if (!this.audioContext) {
                console.warn('无法获取音频播放器的音频上下文');
                return false;
            }

            // 创建分析器节点
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            return true;
        } catch (error) {
            console.error('初始化音频分析器失败:', error);
            return false;
        }
    }

    /**
     * 连接到音频播放器的输出节点
     */
    connectToAudioPlayer() {
        try {
            // 获取音频播放器的流上下文
            const audioPlayer = window.chatApp?.audioPlayer;
            if (!audioPlayer || !audioPlayer.streamingContext) {
                console.warn('音频播放器或流上下文未初始化');
                return false;
            }

            // 获取音频播放器的流上下文
            const streamingContext = audioPlayer.streamingContext;

            // 获取分析器节点
            const analyser = streamingContext.getAnalyser();
            if (!analyser) {
                console.warn('音频播放器尚未创建分析器节点，无法连接');
                return false;
            }

            // 使用音频播放器的分析器节点
            this.analyser = analyser;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            return true;
        } catch (error) {
            console.error('连接到音频播放器失败:', error);
            return false;
        }
    }

    /**
     * 嘴部动画循环
     */
    animateMouth() {
        if (!this.isTalking) return;
        if (!this.live2dModel) return;
        const internal = this.live2dModel && this.live2dModel.internalModel;
        if (internal && internal.coreModel) {
            const coreModel = internal.coreModel;

            // 获取音频分贝值
            let mouthValue = 0;
            let average = 0;
            if (this.analyser && this.dataArray) {
                this.analyser.getByteFrequencyData(this.dataArray);
                average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;

                // 优化音量映射函数，使中等音量范围变化更明显
                // 使用S形曲线函数，在中等音量范围有更好的响应
                const normalizedVolume = average / 255;

                // S形曲线：在0.3-0.7范围内有最大的斜率（变化最明显）
                if (normalizedVolume < 0.3) {
                    // 低音量：缓慢增长
                    mouthValue = Math.pow(normalizedVolume / 0.3, 1.5) * 0.3;
                } else if (normalizedVolume < 0.7) {
                    // 中等音量：线性增长，变化最明显
                    mouthValue = 0.3 + (normalizedVolume - 0.3) / 0.4 * 0.5;
                } else {
                    // 高音量：缓慢接近最大值
                    mouthValue = 0.8 + Math.pow((normalizedVolume - 0.7) / 0.3, 1.2) * 0.2;
                }

                // 确保嘴部参数在0-1范围内
                mouthValue = Math.min(Math.max(mouthValue, 0), 1);
            }
            coreModel.setParameterValueById(this.mouthParam, mouthValue);
            coreModel.update();
        }
        this.mouthAnimationId = requestAnimationFrame(() => this.animateMouth());
    }

    /**
     * 开始说话动画
     */
    startTalking() {
        if (this.isTalking || !this.live2dModel) return;

        // 确保音频分析器已初始化
        if (!this.analyser) {
            if (!this.initializeAudioAnalyzer()) {
                console.warn('音频分析器初始化失败，将使用模拟动画');
                // 即使分析器初始化失败，也启动动画（使用模拟数据）
                this.isTalking = true;
                this.animateMouth();
                return;
            }
        }

        // 连接到音频播放器输出
        if (!this.connectToAudioPlayer()) {
            console.warn('无法连接到音频播放器输出，将使用模拟动画');
        }

        this.isTalking = true;
        this.animateMouth();
    }

    /**
     * 停止说话动画
     */
    stopTalking() {
        this.isTalking = false;
        if (this.mouthAnimationId) {
            cancelAnimationFrame(this.mouthAnimationId);
            this.mouthAnimationId = null;
        }

        // 重置嘴部参数
        if (this.live2dModel) {
            const internal = this.live2dModel.internalModel;
            if (internal && internal.coreModel) {
                const coreModel = internal.coreModel;
                coreModel.setParameterValueById(this.mouthParam, 0);
                coreModel.update();
            }
        }
    }

    /**
     * 基于情绪触发动作
     * @param {string} emotion - 情绪名称
     */
    triggerEmotionAction(emotion) {
        if (!this.live2dModel) return;

        // 添加冷却时间控制，避免过于频繁触发
        const now = Date.now();
        if (this.lastEmotionActionTime && now - this.lastEmotionActionTime < 5000) { // 5秒冷却时间
            return;
        }

        // 根据情绪获取对应的动作
        const action = this.emotionToActionMap[emotion] || this.emotionToActionMap['default'];

        // 触发动作并记录时间
        this.motion(action);
        this.lastEmotionActionTime = now;
    }



    /**
     * 触发模型动作（Motion）
     * @param {string} name - 动作分组名称，如 'TapBody'、'FlickUp'、'Idle' 等
     */
    motion(name) {
        try {
            if (!this.live2dModel) return;
            this.live2dModel.motion(name);
        } catch (error) {
            console.error('触发动作失败:', error);
        }
    }

    /**
     * 清理资源
     */
    destroy() {
        this.stopTalking();

        // 清理音频分析器
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.analyser = null;
        this.dataArray = null;

        // 清理 Live2D 应用
        if (this.live2dApp) {
            this.live2dApp.destroy(true);
            this.live2dApp = null;
        }
        this.live2dModel = null;
    }
}

// 导出全局实例
window.Live2DManager = Live2DManager;

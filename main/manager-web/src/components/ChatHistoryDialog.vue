<template>
    <el-dialog
        :title="dialogTitle"
        :visible.sync="dialogVisible"
        width="80%"
        :before-close="handleClose"
        custom-class="chat-history-dialog"
        :fullscreen="isMobile"
    >
        <div class="chat-container">
            <!-- Session List -->
            <div class="session-list" :class="{ 'hidden-mobile': !showSessionList && isMobile }">
                <div v-for="session in sessions" :key="session.sessionId" class="session-item"
                    :class="{ active: currentSessionId === session.sessionId }" @click="selectSession(session)">
                    <img :src="getUserAvatar(session.sessionId)" class="avatar" />
                    <div class="session-info">
                        <div class="session-time">{{ formatTime(session.createdAt) }}</div>
                        <div class="message-count" v-if="session.chatCount > 0">{{ session.chatCount > 99 ? '99+' : session.chatCount }}</div>
                    </div>
                    <i class="el-icon-arrow-right mobile-arrow visible-xs-only"></i>
                </div>
                <div v-if="loading" class="loading"><i class="el-icon-loading"></i> {{ $t('chatHistory.loading') }}</div>
                <div v-if="!hasMore && sessions.length > 0" class="no-more">{{ $t('chatHistory.noMoreRecords') }}</div>
                <div v-if="!loading && sessions.length === 0" class="empty-state">{{ $t('common.noData') }}</div>
            </div>

            <!-- Chat Content -->
            <div class="chat-content" :class="{ 'hidden-mobile': showSessionList && isMobile }">
                <!-- Mobile Header -->
                <div class="mobile-chat-header visible-xs-only" v-if="isMobile">
                    <div class="back-btn" @click="backToSessions">
                        <i class="el-icon-arrow-left"></i> {{ $t('common.back') }}
                    </div>
                </div>

                <div v-if="currentSessionId" class="messages-wrapper">
                    <div class="messages">
                         <div v-for="(message, index) in messagesWithTime" :key="message.id || index">
                            <div v-if="message.type === 'time'" class="time-divider">
                                <span>{{ message.content }}</span>
                            </div>
                            <div v-else class="message-item" :class="{ 'user-message': message.chatType === 1 }">
                                <img :src="message.chatType === 1 ? getUserAvatar(currentSessionId) : require('@/assets/xiaozhi-logo.png')"
                                    class="avatar" />
                                <div class="message-bubble">
                                    <div class="bubble-content">
                                        {{ extractContentFromString(message.content) }}
                                        <i v-if="message.audioId" :class="getAudioIconClass(message)"
                                            @click="playAudio(message)" class="audio-icon"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="footer-actions">
                        <el-button type="primary" plain size="small" @click="downloadCurrentSessionWithPrevious">
                            {{ $t('chatHistory.downloadCurrentWithPreviousSessions') }}
                        </el-button>
                        <el-button type="primary" plain size="small" @click="downloadCurrentSession">
                            {{ $t('chatHistory.downloadCurrentSession') }}
                        </el-button>
                    </div>
                </div>
                
                <div v-else class="no-session-selected">
                    <i class="el-icon-chat-dot-round empty-icon" v-if="!isMobile"></i>
                    <p>{{ $t('chatHistory.selectSession') }}</p>
                </div>
            </div>
        </div>
    </el-dialog>
</template>

<script>
import Api from '@/apis/api';

export default {
    name: 'ChatHistoryDialog',
    props: {
        visible: {
            type: Boolean,
            default: false
        },
        agentId: {
            type: String,
            required: true
        },
        agentName: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            dialogVisible: false,
            sessions: [],
            messages: [],
            currentSessionId: '',
            currentMacAddress: '',
            page: 1,
            limit: 20,
            loading: false,
            hasMore: true,
            scrollTimer: null,
            isFirstLoad: true,
            playingAudioId: null,
            audioElement: null,
            isMobile: window.innerWidth < 768,
            showSessionList: true, // Controls mobile view state
        };
    },
    computed: {
        dialogTitle() {
            return `${this.$t('chatHistory.with')}${this.agentName}${this.$t('chatHistory.dialogTitle')}${this.currentMacAddress ? ` [${this.currentMacAddress}]` : ''}`;
        },
        messagesWithTime() {
            if (!this.messages || this.messages.length === 0) return [];
            const result = [];
            const TIME_INTERVAL = 60 * 1000;
            if (this.messages[0]) {
                result.push({
                    type: 'time',
                    content: this.formatTime(this.messages[0].createdAt),
                    id: `time-start`
                });
            }
            for (let i = 0; i < this.messages.length; i++) {
                const currentMessage = this.messages[i];
                result.push(currentMessage);
                if (i < this.messages.length - 1) {
                    const currentTime = new Date(currentMessage.createdAt).getTime();
                    const nextTime = new Date(this.messages[i + 1].createdAt).getTime();
                    if (nextTime - currentTime > TIME_INTERVAL) {
                        result.push({
                            type: 'time',
                            content: this.formatTime(this.messages[i + 1].createdAt),
                            id: `time-${i}`
                        });
                    }
                }
            }
            return result;
        }
    },
    watch: {
        visible(val) {
            this.dialogVisible = val;
            if (val) {
                this.resetData();
                this.loadSessions();
                this.checkMobile();
                window.addEventListener('resize', this.checkMobile);
            } else {
                window.removeEventListener('resize', this.checkMobile);
            }
        },
        dialogVisible(val) {
            if (!val) {
                this.$emit('update:visible', false);
            }
        }
    },
    methods: {
        checkMobile() {
            this.isMobile = window.innerWidth < 768;
            if (!this.isMobile) {
                this.showSessionList = true;
            }
        },
        backToSessions() {
            this.showSessionList = true;
            this.currentSessionId = ''; // Optional: clear selection or keep it
        },
        extractContentFromString(content) {
            if (!content || content.trim() === '') return content;
            try {
                const jsonObj = JSON.parse(content);
                if (jsonObj && typeof jsonObj === 'object' && jsonObj.content) {
                    return jsonObj.content;
                }
            } catch (e) {
                // Ignore
            }
            return content;
        },
        resetData() {
            this.sessions = [];
            this.messages = [];
            this.currentSessionId = '';
            this.currentMacAddress = '';
            this.page = 1;
            this.loading = false;
            this.hasMore = true;
            this.isFirstLoad = true;
            this.showSessionList = true;
        },
        handleClose() {
            this.dialogVisible = false;
        },
        loadSessions() {
            if (this.loading || (!this.isFirstLoad && !this.hasMore)) return;
            this.loading = true;
            const params = { page: this.page, limit: this.limit };
            Api.agent.getAgentSessions(this.agentId, params, (res) => {
                if (res.data && res.data.data && Array.isArray(res.data.data.list)) {
                    const list = res.data.data.list;
                    this.hasMore = list.length === this.limit;
                    this.sessions = [...this.sessions, ...list];
                    this.page++;
                    // Auto-select first session on desktop
                    if (!this.isMobile && this.sessions.length > 0 && !this.currentSessionId) {
                        this.selectSession(this.sessions[0]);
                    }
                }
                this.loading = false;
                this.isFirstLoad = false;
            });
        },
        selectSession(session) {
            this.currentSessionId = session.sessionId;
            if (this.isMobile) {
                this.showSessionList = false;
            }
            Api.agent.getAgentChatHistory(this.agentId, session.sessionId, (res) => {
                if (res.data && res.data.data) {
                    this.messages = res.data.data;
                    if (this.messages.length > 0 && this.messages[0].macAddress) {
                        this.currentMacAddress = this.messages[0].macAddress;
                    }
                }
            });
        },
        formatTime(timestamp) {
            const date = new Date(timestamp);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            if (date >= today) return `${this.$t('chatHistory.today')} ${hours}:${minutes}`;
            if (date >= yesterday) return `${this.$t('chatHistory.yesterday')} ${hours}:${minutes}`;
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${date.getFullYear()}-${month}-${day} ${hours}:${minutes}`;
        },
        getAudioIconClass(message) {
            if (this.playingAudioId === message.audioId) return 'el-icon-loading active-audio';
            return 'el-icon-video-play';
        },
        playAudio(message) {
            if (this.playingAudioId === message.audioId) {
                if (this.audioElement) {
                    this.audioElement.pause();
                    this.audioElement = null;
                }
                this.playingAudioId = null;
                return;
            }
            if (this.audioElement) {
                this.audioElement.pause();
                this.audioElement = null;
            }
            this.playingAudioId = message.audioId;
            Api.agent.getAudioId(message.audioId, (res) => {
                if (res.data && res.data.data) {
                    this.audioElement = new Audio(Api.getServiceUrl() + `/agent/play/${res.data.data}`);
                    this.audioElement.onended = () => {
                        this.playingAudioId = null;
                        this.audioElement = null;
                    };
                    this.audioElement.play();
                }
            });
        },
        getUserAvatar(sessionId) {
            const numbers = sessionId.match(/\d+/g);
            if (!numbers) return require('@/assets/user-avatar1.png');
            const sum = numbers.reduce((acc, num) => acc + parseInt(num), 0);
            const avatarIndex = (sum % 5) + 1;
            return require(`@/assets/user-avatar${avatarIndex}.png`);
        },
        downloadCurrentSession() {
            Api.agent.getDownloadUrl(this.agentId, this.currentSessionId, (res) => {
                if (res?.data?.code === 0 && res.data.data) {
                    window.open(`${Api.getServiceUrl()}/agent/chat-history/download/${res.data.data}/current`, '_blank');
                } else {
                    this.$message.error(this.$t('chatHistory.downloadLinkFailed'));
                }
            });
        },
        downloadCurrentSessionWithPrevious() {
            Api.agent.getDownloadUrl(this.agentId, this.currentSessionId, (res) => {
                if (res?.data?.code === 0 && res.data.data) {
                    window.open(`${Api.getServiceUrl()}/agent/chat-history/download/${res.data.data}/previous`, '_blank');
                } else {
                    this.$message.error(this.$t('chatHistory.downloadLinkFailed'));
                }
            });
        }
    }
};
</script>

<style scoped lang="scss">
$primary: #07c160;
$primary-light: rgba(7, 193, 96, 0.1);
$bg-chat: #f5f7fb;
$border: #ebeef5;

.chat-container {
    display: flex;
    height: 100%;
    overflow: hidden;
}

// Session List
.session-list {
    width: 280px;
    border-right: 1px solid $border;
    overflow-y: auto;
    background: #fff;
    display: flex;
    flex-direction: column;
}

.session-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 1px solid #f9f9f9;
    
    &:hover {
        background-color: #f5f7fa;
    }
    
    &.active {
        background-color: $primary-light;
        border-right: 3px solid $primary;
    }
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    margin-right: 12px;
}

.session-info {
    flex: 1;
    overflow: hidden;
}

.session-time {
    font-size: 14px;
    color: #303133;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.message-count {
    font-size: 12px;
    color: #fff;
    background-color: #ff4d4f;
    border-radius: 10px;
    padding: 0 6px;
    height: 18px;
    line-height: 18px;
    display: inline-block;
}

// Chat Content
.chat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: $bg-chat;
    height: 100%;
    position: relative;
}

.messages-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.messages {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
}

.message-item {
    display: flex;
    margin-bottom: 24px;
    align-items: flex-start;
}

.message-item.user-message {
    flex-direction: row-reverse;
    
    .avatar {
        margin-right: 0;
        margin-left: 12px;
    }
    
    .message-bubble {
        align-items: flex-end;
    }
    
    .bubble-content {
        background-color: $primary;
        color: white;
        border-radius: 12px 0 12px 12px;
        box-shadow: 0 2px 12px rgba(7, 193, 96, 0.2);
    }
    
    .audio-icon {
        color: white;
    }
}

.message-bubble {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 70%;
}

.bubble-content {
    padding: 12px 16px;
    border-radius: 0 12px 12px 12px;
    background-color: white;
    color: #303133;
    line-height: 1.5;
    font-size: 14px;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    word-break: break-word;
    display: flex;
    align-items: center;
    gap: 8px;
}

.audio-icon {
    font-size: 20px;
    cursor: pointer;
    color: $primary;
    
    &.active-audio {
        animation: rotate 1s linear infinite;
    }
}

.time-divider {
    text-align: center;
    margin: 20px 0;
    
    span {
        background: rgba(0,0,0,0.05);
        color: #909399;
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 4px;
    }
}

.footer-actions {
    padding: 16px;
    background: white;
    border-top: 1px solid $border;
    display: flex;
    gap: 12px;
    
    .el-button {
        flex: 1;
    }
}

.no-session-selected {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #909399;
    background: #fff;
    
    .empty-icon {
        font-size: 80px;
        margin-bottom: 20px;
        opacity: 0.3;
        color: #c0c4cc;
    }
}

.loading, .no-more, .empty-state {
    text-align: center;
    padding: 20px;
    color: #909399;
    font-size: 13px;
}

// Mobile Specifics
.mobile-chat-header {
    background: white;
    padding: 12px 16px;
    border-bottom: 1px solid $border;
    display: flex;
    align-items: center;
    
    .back-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 14px;
        color: $primary;
        cursor: pointer;
        font-weight: 500;
    }
}

@keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

// Mobile Responsiveness
@media (max-width: 768px) {
    .chat-container {
        position: relative;
    }
    
    .session-list, .chat-content {
        width: 100%;
        height: 100%;
    }
    
    .hidden-mobile {
        display: none !important;
    }
    
    .mobile-arrow {
        color: #c0c4cc;
    }
    
    .message-bubble {
        max-width: 85%;
    }
}
</style>

<style>
/* Global overrides for this dialog */
.chat-history-dialog {
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 5vh;
}

.chat-history-dialog .el-dialog__header {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
}

.chat-history-dialog .el-dialog__title {
    font-size: 16px;
    font-weight: 600;
}

.chat-history-dialog .el-dialog__body {
    padding: 0;
    height: 600px; /* Fixed height for desktop */
}

@media (max-width: 768px) {
    .chat-history-dialog {
        width: 100% !important;
        height: 100vh !important;
        margin: 0 !important;
        border-radius: 0;
        max-width: 100vw;
    }
    
    .chat-history-dialog .el-dialog__body {
        height: calc(100vh - 55px); /* Full height minus header */
    }
}
</style>
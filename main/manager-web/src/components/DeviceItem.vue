<template>
  <div class="agent-card" @click="handleCardClick">
    <!-- Card Header -->
    <div class="card-header">
      <div class="avatar" :style="avatarStyle">
        <span class="avatar-initial">{{ avatarInitial }}</span>
      </div>
      <div class="header-content">
        <div class="name-row">
          <h3 class="agent-name">{{ device.agentName }}</h3>
          <span v-if="isRecentlyActive" class="active-badge">
            <span class="pulse"></span>
          </span>
        </div>
        <div class="model-info">
          <i class="el-icon-cpu"></i>
          <span>{{ device.llmModelName || 'No LLM' }}</span>
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat">
        <i class="el-icon-monitor"></i>
        <span>{{ device.deviceCount || 0 }} {{ $t('home.devices') }}</span>
      </div>
      <div class="stat">
        <i class="el-icon-time"></i>
        <span>{{ formattedLastConversation }}</span>
      </div>
    </div>

    <!-- Voice Tag -->
    <div class="voice-tag" v-if="device.ttsVoiceName">
      <i class="el-icon-microphone"></i>
      <span>{{ device.ttsVoiceName }}</span>
    </div>

    <!-- Action Buttons -->
    <div class="actions" @click.stop>
      <button class="action-btn primary" @click="$emit('configure', device.agentId)">
        <i class="el-icon-setting"></i>
        {{ $t('home.configureRole') }}
      </button>
      <button class="action-btn secondary" @click="$emit('deviceManage', device.agentId)">
        <i class="el-icon-monitor"></i>
        {{ $t('home.deviceManagement') }}
      </button>
      <button class="action-btn icon-only" @click="$emit('chat-history', { agentId: device.agentId, agentName: device.agentName })" :title="$t('home.chatHistory')">
        <i class="el-icon-chat-dot-round"></i>
      </button>
      <button class="action-btn icon-only danger" @click="$emit('delete', device.agentId)" :title="$t('common.delete')">
        <i class="el-icon-delete"></i>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DeviceItem',
  props: {
    device: { type: Object, required: true },
    featureStatus: { type: Object, default: () => ({}) }
  },
  computed: {
    avatarInitial() {
      return (this.device.agentName || 'A').charAt(0).toUpperCase();
    },
    avatarStyle() {
      const colors = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
        ['#a8edea', '#fed6e3'],
        ['#ff9a9e', '#fecfef'],
        ['#ffecd2', '#fcb69f']
      ];
      const hash = (this.device.agentName || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const [c1, c2] = colors[hash % colors.length];
      return { background: `linear-gradient(135deg, ${c1}, ${c2})` };
    },
    isRecentlyActive() {
      if (!this.device.lastConnectedAt) return false;
      const diff = Date.now() - new Date(this.device.lastConnectedAt).getTime();
      return diff < 3600000; // Active within last hour
    },
    formattedLastConversation() {
      if (!this.device.lastConnectedAt) return this.$t('home.noConversation');
      const diff = Date.now() - new Date(this.device.lastConnectedAt).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return this.$t('home.justNow');
      if (mins < 60) return this.$t('home.minutesAgo', { minutes: mins });
      const hours = Math.floor(mins / 60);
      return `${hours}h`;
    }
  },
  methods: {
    handleCardClick() {
      this.$emit('configure', this.device.agentId);
    }
  }
}
</script>

<style scoped lang="scss">
$primary: #07c160;
$primary-light: #e8f5e9;
$text-primary: #1a1a2e;
$text-secondary: #4a4a68;
$text-muted: #8e8ea9;
$border: #e8e8f0;
$danger: #f56c6c;

.agent-card {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.25s ease;
  border: 2px solid transparent;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-4px);
    border-color: rgba($primary, 0.3);
    box-shadow: 0 12px 32px rgba($primary, 0.12);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.avatar {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.avatar-initial {
  font-size: 22px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.header-content {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-name {
  font-size: 17px;
  font-weight: 700;
  color: $text-primary;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.active-badge {
  flex-shrink: 0;
}

.pulse {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: $primary;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba($primary, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba($primary, 0); }
}

.model-info {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 4px;
  font-size: 13px;
  color: $text-muted;

  i {
    font-size: 12px;
  }

  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.stats-row {
  display: flex;
  gap: 20px;
  padding: 12px 14px;
  background: #f8f9fc;
  border-radius: 12px;
  margin-bottom: 12px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: $text-secondary;

  i {
    color: $text-muted;
    font-size: 14px;
  }
}

.voice-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  background: $primary-light;
  color: $primary;
  border-radius: 20px;
  font-size: 12px;
  margin-bottom: 14px;

  i {
    font-size: 12px;
  }
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  white-space: nowrap;

  &.primary {
    flex: 1;
    padding: 10px 14px;
    background: $primary;
    color: white;

    &:hover {
      background: darken($primary, 8%);
    }
  }

  &.secondary {
    flex: 1;
    padding: 10px 14px;
    background: #f0f2f5;
    color: $text-secondary;
    border: 1px solid $border;

    &:hover {
      background: #e8eaed;
      border-color: darken($border, 5%);
    }
  }

  &.icon-only {
    width: 40px;
    height: 40px;
    padding: 0;
    background: #f0f2f5;
    color: $text-muted;
    border: 1px solid $border;

    &:hover {
      background: #e8eaed;
      color: $text-secondary;
    }

    &.danger:hover {
      background: #fef0f0;
      color: $danger;
      border-color: #fbc4c4;
    }

    i {
      font-size: 16px;
    }
  }
}

@media (max-width: 480px) {
  .agent-card {
    padding: 16px;
  }

  .actions {
    flex-wrap: wrap;
  }

  .action-btn {
    &.primary, &.secondary {
      flex: 1 1 calc(50% - 4px);
      min-width: 0;
    }
    
    &.icon-only {
      width: 38px;
      height: 38px;
    }
  }
}
</style>
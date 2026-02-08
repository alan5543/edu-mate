<template>
  <div class="home-page">
    <!-- Welcome Section -->
    <div class="welcome-section">
      <div class="welcome-content">
        <div class="greeting">
          <h1>{{ greeting }}, <span class="highlight">{{ username }}</span> 👋</h1>
          <p class="subtitle">{{ $t('home.wish') || "Let's have a wonderful day!" }}</p>
        </div>
        <div class="quick-stats" v-if="devices.length > 0">
          <div class="stat-card">
            <div class="stat-icon agents">
              <i class="el-icon-s-custom"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ devices.length }}</span>
              <span class="stat-label">{{ $t('home.totalAgents') || 'Agents' }}</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon devices">
              <i class="el-icon-monitor"></i>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalDevices }}</span>
              <span class="stat-label">{{ $t('home.devices') || 'Devices' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="welcome-actions">
        <el-button type="primary" size="large" @click="showAddDialog" class="add-agent-btn">
          <i class="el-icon-plus"></i>
          {{ $t('home.addAgent') || 'Create Agent' }}
        </el-button>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="toolbar">
      <div class="search-box">
        <i class="el-icon-search"></i>
        <input 
          type="text" 
          v-model="searchKeyword"
          :placeholder="$t('header.searchPlaceholder') || 'Search agents by name or MAC...'"
          @keyup.enter="handleLocalSearch"
        />
        <button v-if="searchKeyword" class="clear-btn" @click="handleSearchReset">
          <i class="el-icon-close"></i>
        </button>
      </div>
      <div class="view-toggle">
        <button :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">
          <i class="el-icon-s-grid"></i>
        </button>
        <button :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
          <i class="el-icon-s-operation"></i>
        </button>
      </div>
    </div>

    <!-- Agent Grid/List -->
    <div class="agents-container" :class="viewMode">
      <transition-group name="card-fade" tag="div" class="agents-grid" v-if="!isLoading && devices.length > 0">
        <DeviceItem 
          v-for="item in devices" 
          :key="item.agentId"
          :device="item" 
          :feature-status="featureStatus" 
          @configure="goToRoleConfig" 
          @deviceManage="handleDeviceManage" 
          @delete="handleDeleteAgent" 
          @chat-history="handleShowChatHistory" 
        />
      </transition-group>

      <!-- Loading Skeleton -->
      <div class="agents-grid" v-if="isLoading">
        <div v-for="i in skeletonCount" :key="'sk-' + i" class="skeleton-card">
          <div class="skeleton-avatar"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-buttons"></div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" v-if="!isLoading && devices.length === 0">
        <div class="empty-illustration">
          <div class="robot-face">
            <div class="eye left"></div>
            <div class="eye right"></div>
            <div class="mouth"></div>
          </div>
        </div>
        <h2>{{ isSearching ? ($t('home.noSearchResults') || 'No agents found') : ($t('home.noAgents') || 'No agents yet') }}</h2>
        <p v-if="!isSearching">{{ $t('home.createFirstAgent') || 'Create your first AI agent to get started!' }}</p>
        <p v-else>{{ $t('home.tryDifferentSearch') || 'Try a different search term' }}</p>
        <el-button v-if="!isSearching" type="primary" size="large" @click="showAddDialog">
          <i class="el-icon-plus"></i> {{ $t('home.addAgent') || 'Create Your First Agent' }}
        </el-button>
        <el-button v-else type="text" @click="handleSearchReset">
          {{ $t('home.clearSearch') || 'Clear Search' }}
        </el-button>
      </div>
    </div>

    <AddWisdomBodyDialog :visible.sync="addDeviceDialogVisible" @confirm="handleWisdomBodyAdded" />
    <chat-history-dialog :visible.sync="showChatHistory" :agent-id="currentAgentId" :agent-name="currentAgentName" />
  </div>
</template>

<script>
import Api from '@/apis/api';
import AddWisdomBodyDialog from '@/components/AddWisdomBodyDialog.vue';
import ChatHistoryDialog from '@/components/ChatHistoryDialog.vue';
import DeviceItem from '@/components/DeviceItem.vue';
import featureManager from '@/utils/featureManager';

export default {
  name: 'HomePage',
  components: { DeviceItem, AddWisdomBodyDialog, ChatHistoryDialog },
  data() {
    return {
      addDeviceDialogVisible: false,
      devices: [],
      originalDevices: [],
      isSearching: false,
      searchKeyword: '',
      isLoading: true,
      viewMode: 'grid',
      skeletonCount: 4,
      showChatHistory: false,
      currentAgentId: '',
      currentAgentName: '',
      featureStatus: {
        voiceprintRecognition: false,
        voiceClone: false,
        knowledgeBase: false
      }
    }
  },

  computed: {
    greeting() {
      const hour = new Date().getHours();
      if (hour < 12) return this.$t('home.goodMorning') || 'Good morning';
      if (hour < 18) return this.$t('home.goodAfternoon') || 'Good afternoon';
      return this.$t('home.goodEvening') || 'Good evening';
    },
    username() {
      return this.$store.state.userInfo?.username || 'User';
    },
    totalDevices() {
      return this.devices.reduce((sum, d) => sum + (d.deviceCount || 0), 0);
    }
  },

  async mounted() {
    this.fetchAgentList();
    await this.loadFeatureStatus();
    this.$eventBus.$on('global-search', this.handleSearch);
    this.$eventBus.$on('global-search-reset', this.handleSearchReset);
  },

  beforeDestroy() {
    this.$eventBus.$off('global-search', this.handleSearch);
    this.$eventBus.$off('global-search-reset', this.handleSearchReset);
  },

  methods: {
    async loadFeatureStatus() {
      await featureManager.waitForInitialization();
      const config = featureManager.getConfig();
      this.featureStatus = {
        voiceprintRecognition: config.voiceprintRecognition,
        voiceClone: config.voiceClone,
        knowledgeBase: config.knowledgeBase
      };
    },
    
    showAddDialog() {
      this.addDeviceDialogVisible = true;
    },
    
    goToRoleConfig(agentId) {
      this.$router.push({ path: '/role-config', query: { agentId } });
    },
    
    handleWisdomBodyAdded() {
      this.fetchAgentList();
      this.addDeviceDialogVisible = false;
    },
    
    handleDeviceManage(agentId) {
      this.$router.push({ path: '/device-management', query: { agentId } });
    },
    
    handleLocalSearch() {
      if (this.searchKeyword.trim()) {
        this.handleSearch(this.searchKeyword);
      } else {
        this.handleSearchReset();
      }
    },
    
    handleSearch(keyword) {
      this.isSearching = true;
      this.isLoading = true;
      const isMac = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(keyword);
      Api.agent.searchAgent(keyword, isMac ? 'mac' : 'name', ({ data }) => {
        if (data?.data) {
          this.devices = data.data.map(item => ({ ...item, agentId: item.id }));
        }
        this.isLoading = false;
      }, () => {
        this.isLoading = false;
        this.$message.error(this.$t('message.searchFailed'));
      });
    },
    
    handleSearchReset() {
      this.isSearching = false;
      this.searchKeyword = '';
      this.devices = [...this.originalDevices];
    },
    
    fetchAgentList() {
      this.isLoading = true;
      Api.agent.getAgentList(({ data }) => {
        if (data?.data) {
          this.originalDevices = data.data.map(item => ({ ...item, agentId: item.id }));
          this.skeletonCount = Math.min(Math.max(this.originalDevices.length, 2), 6);
          this.handleSearchReset();
        }
        this.isLoading = false;
      }, () => {
        this.isLoading = false;
      });
    },
    
    handleDeleteAgent(agentId) {
      this.$confirm(this.$t('home.confirmDeleteAgent'), this.$t('common.warning'), {
        confirmButtonText: this.$t('button.ok'),
        cancelButtonText: this.$t('button.cancel'),
        type: 'warning'
      }).then(() => {
        Api.agent.deleteAgent(agentId, (res) => {
          if (res.data.code === 0) {
            this.$message.success(this.$t('home.deleteSuccess'));
            this.fetchAgentList();
          } else {
            this.$message.error(res.data.msg || this.$t('home.deleteFailed'));
          }
        });
      }).catch(() => {});
    },
    
    handleShowChatHistory({ agentId, agentName }) {
      this.currentAgentId = agentId;
      this.currentAgentName = agentName;
      this.showChatHistory = true;
    }
  }
}
</script>

<style scoped lang="scss">
$primary: #07c160;
$primary-dark: #059652;
$text-primary: #1a1a2e;
$text-secondary: #4a4a68;
$text-muted: #8e8ea9;
$border: #e8e8f0;
$bg-page: #f5f7fb;
$bg-card: #ffffff;

.home-page {
  min-height: calc(100vh - 108px);
}

// Welcome Section
.welcome-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 28px 32px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fff8 100%);
  border-radius: 24px;
  border: 1px solid rgba(7, 193, 96, 0.1);
  box-shadow: 0 4px 24px rgba(7, 193, 96, 0.06);
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 24px;
    padding: 24px 20px;
    text-align: center;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 40px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
}

.greeting {
  h1 {
    font-size: 28px;
    font-weight: 700;
    color: $text-primary;
    margin: 0 0 6px;
    
    .highlight {
      color: $primary;
    }
    
    @media (max-width: 768px) {
      font-size: 22px;
    }
  }
  
  .subtitle {
    font-size: 15px;
    color: $text-muted;
    margin: 0;
  }
}

.quick-stats {
  display: flex;
  gap: 16px;
  
  @media (max-width: 768px) {
    justify-content: center;
  }
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    font-size: 18px;
    color: white;
  }
  
  &.agents {
    background: linear-gradient(135deg, $primary, #38f9d7);
  }
  
  &.devices {
    background: linear-gradient(135deg, #667eea, #764ba2);
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.2;
}

.stat-label {
  font-size: 12px;
  color: $text-muted;
}

.welcome-actions {
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 100%;
  }
}

.add-agent-btn {
  background: $primary;
  border-color: $primary;
  border-radius: 14px;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(7, 193, 96, 0.25);
  transition: all 0.3s;
  
  &:hover {
    background: $primary-dark;
    border-color: $primary-dark;
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(7, 193, 96, 0.3);
  }
  
  i {
    margin-right: 8px;
  }
  
  @media (max-width: 768px) {
    width: 100%;
  }
}

// Toolbar
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.search-box {
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 400px;
  background: white;
  border: 2px solid $border;
  border-radius: 14px;
  padding: 0 16px;
  transition: all 0.2s;
  
  &:focus-within {
    border-color: $primary;
    box-shadow: 0 0 0 4px rgba(7, 193, 96, 0.1);
  }
  
  i {
    color: $text-muted;
    font-size: 16px;
  }
  
  input {
    flex: 1;
    border: none;
    outline: none;
    padding: 14px 12px;
    font-size: 14px;
    color: $text-primary;
    background: transparent;
    
    &::placeholder {
      color: $text-muted;
    }
  }
  
  .clear-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: $text-muted;
    
    &:hover {
      color: $text-secondary;
    }
  }
  
  @media (max-width: 640px) {
    max-width: none;
  }
}

.view-toggle {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 4px;
  border: 1px solid $border;
  
  button {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    border-radius: 10px;
    cursor: pointer;
    color: $text-muted;
    transition: all 0.2s;
    
    &:hover {
      color: $text-secondary;
    }
    
    &.active {
      background: $primary;
      color: white;
    }
    
    i {
      font-size: 16px;
    }
  }
}

// Agents Grid
.agents-container {
  &.list .agents-grid {
    grid-template-columns: 1fr;
  }
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
  
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

// Card animation
.card-fade-enter-active,
.card-fade-leave-active {
  transition: all 0.4s ease;
}

.card-fade-enter,
.card-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// Skeleton
.skeleton-card {
  background: white;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  gap: 16px;
}

.skeleton-avatar {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f5f5f5 25%, #eee 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-content {
  flex: 1;
}

.skeleton-title {
  height: 20px;
  width: 60%;
  border-radius: 6px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, #f5f5f5 25%, #eee 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-text {
  height: 14px;
  width: 90%;
  border-radius: 4px;
  margin-bottom: 20px;
  background: linear-gradient(90deg, #f5f5f5 25%, #eee 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-buttons {
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f5f5f5 25%, #eee 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Empty State
.empty-state {
  text-align: center;
  padding: 80px 20px;
}

.empty-illustration {
  margin-bottom: 32px;
}

.robot-face {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  background: linear-gradient(135deg, $primary, #38f9d7);
  border-radius: 32px;
  position: relative;
  box-shadow: 0 20px 40px rgba(7, 193, 96, 0.2);
  animation: float 3s ease-in-out infinite;
  
  .eye {
    position: absolute;
    width: 16px;
    height: 16px;
    background: white;
    border-radius: 50%;
    top: 40px;
    
    &.left { left: 32px; }
    &.right { right: 32px; }
    
    &::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      background: $text-primary;
      border-radius: 50%;
      top: 4px;
      left: 4px;
      animation: blink 3s infinite;
    }
  }
  
  .mouth {
    position: absolute;
    width: 40px;
    height: 20px;
    border: 3px solid white;
    border-radius: 0 0 40px 40px;
    border-top: none;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes blink {
  0%, 90%, 100% { transform: scaleY(1); }
  95% { transform: scaleY(0.1); }
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 700;
  color: $text-primary;
  margin: 0 0 8px;
}

.empty-state p {
  font-size: 16px;
  color: $text-muted;
  margin: 0 0 24px;
}

.empty-state .el-button {
  border-radius: 14px;
  padding: 14px 28px;
  font-weight: 600;
}
</style>
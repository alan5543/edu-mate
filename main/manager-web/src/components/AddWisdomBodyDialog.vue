<template>
  <el-dialog 
    :visible="visible" 
    @close="handleClose" 
    :width="dialogWidth"
    custom-class="add-agent-dialog"
    center 
    @open="handleOpen"
    :close-on-click-modal="false"
  >
    <div class="dialog-content">
      <div class="dialog-header">
        <div class="header-icon">
          <i class="el-icon-plus"></i>
        </div>
        <h2 class="dialog-title">{{ $t('addAgentDialog.title') }}</h2>
        <p class="dialog-subtitle">{{ $t('addAgentDialog.subtitle') || 'Give your AI agent a name to get started' }}</p>
      </div>
      
      <div class="form-group">
        <label class="form-label">
          <span class="required">*</span> {{ $t('addAgentDialog.agentName') }}
        </label>
        <el-input 
          ref="inputRef" 
          v-model="wisdomBodyName" 
          :placeholder="$t('addAgentDialog.placeholder')"
          class="agent-input"
          @keyup.enter.native="confirm"
          maxlength="50"
          show-word-limit
        />
      </div>
      
      <div class="dialog-actions">
        <button class="btn btn-primary" @click="confirm">
          <i class="el-icon-check"></i>
          {{ $t('addAgentDialog.confirm') }}
        </button>
        <button class="btn btn-secondary" @click="cancel">
          {{ $t('addAgentDialog.cancel') }}
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import Api from '@/apis/api';

export default {
  name: 'AddWisdomBodyDialog',
  props: {
    visible: { type: Boolean, required: true }
  },
  data() {
    return {
      wisdomBodyName: "",
      windowWidth: window.innerWidth
    }
  },
  computed: {
    dialogWidth() {
      if (this.windowWidth < 500) return '90%';
      if (this.windowWidth < 768) return '80%';
      return '420px';
    }
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    handleResize() {
      this.windowWidth = window.innerWidth;
    },
    handleOpen() {
      this.$nextTick(() => {
        this.$refs.inputRef.focus();
      });
    },
    confirm() {
      if (!this.wisdomBodyName.trim()) {
        this.$message.error(this.$t('addAgentDialog.nameRequired'));
        return;
      }
      Api.agent.addAgent(this.wisdomBodyName, (res) => {
        this.$message.success({
          message: this.$t('addAgentDialog.addSuccess'),
          showClose: true
        });
        this.$emit('confirm', res);
        this.$emit('update:visible', false);
        this.wisdomBodyName = "";
      });
    },
    cancel() {
      this.$emit('update:visible', false);
      this.wisdomBodyName = "";
    },
    handleClose() {
      this.$emit('update:visible', false);
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
$border: #e4e6ef;

.dialog-content {
  padding: 8px;
}

.dialog-header {
  text-align: center;
  margin-bottom: 28px;
}

.header-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, $primary, #38f9d7);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba($primary, 0.25);
  
  i {
    font-size: 28px;
    color: white;
  }
}

.dialog-title {
  font-size: 22px;
  font-weight: 700;
  color: $text-primary;
  margin: 0 0 8px;
}

.dialog-subtitle {
  font-size: 14px;
  color: $text-muted;
  margin: 0;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: $text-secondary;
  margin-bottom: 10px;
  
  .required {
    color: #f56c6c;
    margin-right: 4px;
  }
}

.agent-input {
  ::v-deep .el-input__inner {
    height: 48px;
    border-radius: 14px;
    border: 2px solid $border;
    padding: 0 16px;
    font-size: 15px;
    transition: all 0.2s;
    
    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 4px rgba($primary, 0.1);
    }
  }
  
  ::v-deep .el-input__count {
    background: transparent;
  }
}

.dialog-actions {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  height: 48px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  
  &.btn-primary {
    background: $primary;
    color: white;
    box-shadow: 0 4px 16px rgba($primary, 0.3);
    
    &:hover {
      background: $primary-dark;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($primary, 0.35);
    }
  }
  
  &.btn-secondary {
    background: #f0f2f5;
    color: $text-secondary;
    border: 1px solid $border;
    
    &:hover {
      background: #e8eaed;
    }
  }
}

@media (max-width: 480px) {
  .dialog-content {
    padding: 4px;
  }
  
  .dialog-header {
    margin-bottom: 20px;
  }
  
  .header-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    
    i {
      font-size: 24px;
    }
  }
  
  .dialog-title {
    font-size: 20px;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
  
  .btn {
    height: 44px;
  }
}
</style>

<style>
/* Global dialog styles - not scoped */
.add-agent-dialog {
  border-radius: 24px !important;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
}

.add-agent-dialog .el-dialog__header {
  display: none;
}

.add-agent-dialog .el-dialog__body {
  padding: 24px;
}

@media (max-width: 500px) {
  .add-agent-dialog {
    margin: 16px !important;
    border-radius: 20px !important;
  }
  
  .add-agent-dialog .el-dialog__body {
    padding: 20px 16px;
  }
}
</style>
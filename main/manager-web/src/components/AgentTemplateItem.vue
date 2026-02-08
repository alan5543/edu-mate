<template>
  <div 
    class="agent-card" 
    :class="{ 'is-selected': template.selected }" 
    @click="handleSelect"
  >
    <div class="card-header">
      <div class="agent-icon">
        <span v-if="!template.icon">{{ (template.agentName || 'A').charAt(0).toUpperCase() }}</span>
        <img v-else :src="template.icon" alt="icon" />
      </div>
      <div class="header-actions">
        <el-dropdown trigger="click" @command="handleCommand" @click.native.stop>
          <span class="action-btn">
            <i class="el-icon-more"></i>
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="edit" icon="el-icon-edit">{{ $t('common.edit') || 'Edit' }}</el-dropdown-item>
            <el-dropdown-item command="delete" icon="el-icon-delete" class="delete-item">{{ $t('common.delete') || 'Delete' }}</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>

    <div class="card-body">
      <h3 class="agent-name" :title="template.agentName">{{ template.agentName }}</h3>
      <p class="agent-desc" :title="template.systemPrompt">
        {{ template.systemPrompt || $t('common.noDescription') || 'No description provided.' }}
      </p>
    </div>

    <div class="card-footer">
      <div class="tags">
        <el-tag size="mini" v-if="template.llmModelName" class="model-tag">
          <i class="el-icon-cpu"></i> {{ template.llmModelName }}
        </el-tag>
        <el-tag size="mini" v-if="template.ttsModelName" class="model-tag">
          <i class="el-icon-microphone"></i> {{ template.ttsModelName }}
        </el-tag>
      </div>
      <div class="selection-checkbox" @click.stop>
        <el-checkbox v-model="template.selected" @change="handleCheckboxChange"></el-checkbox>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AgentTemplateItem',
  props: {
    template: {
      type: Object,
      required: true
    }
  },
  methods: {
    handleSelect() {
      this.template.selected = !this.template.selected;
      this.$emit('select', this.template);
    },
    handleCheckboxChange() {
      this.$emit('select', this.template);
    },
    handleCommand(command) {
      if (command === 'edit') {
        this.$emit('edit', this.template);
      } else if (command === 'delete') {
        this.$emit('delete', this.template);
      }
    }
  }
}
</script>

<style scoped lang="scss">
$primary: #07c160;
$primary-light: rgba(7, 193, 96, 0.1);
$text-primary: #101828;
$text-secondary: #344054;
$text-muted: #667085;
$border-color: #eaecf0;
$bg-white: #ffffff;
$bg-hover: #f9fafb;

.agent-card {
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
  height: 100%;
  min-height: 200px;
  box-sizing: border-box;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px -4px rgba(16, 24, 40, 0.08);
    border-color: darken($border-color, 5%);
  }

  &.is-selected {
    border-color: $primary;
    background: linear-gradient(180deg, rgba(7, 193, 96, 0.02) 0%, rgba(7, 193, 96, 0.06) 100%);
    box-shadow: 0 0 0 3px rgba(7, 193, 96, 0.12);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.agent-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #d1fae5 0%, $primary 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 18px;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(7, 193, 96, 0.2);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 12px;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  color: $text-muted;
  transition: all 0.15s ease;

  &:hover {
    background: $bg-hover;
    color: $text-secondary;
  }
  
  i {
    font-size: 16px;
  }
}

.card-body {
  flex: 1;
  margin-bottom: 16px;
}

.agent-name {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin: 0 0 8px 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.agent-desc {
  font-size: 13px;
  color: $text-muted;
  margin: 0;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid $border-color;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: calc(100% - 40px);
}

.model-tag {
  background: $bg-hover;
  border: none;
  color: $text-secondary;
  border-radius: 6px;
  padding: 2px 8px;
  font-weight: 500;
  font-size: 11px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  i {
    color: $text-muted;
    margin-right: 3px;
    font-size: 10px;
  }
}

.selection-checkbox {
  padding: 4px;
  flex-shrink: 0;
}

::v-deep .delete-item {
  color: #ef4444 !important;
  
  &:hover {
    background: #fef2f2 !important;
  }
}

// Mobile
@media (max-width: 480px) {
  .agent-card {
    padding: 16px;
    min-height: auto;
  }
  
  .agent-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  .agent-name {
    font-size: 15px;
  }

  .agent-desc {
    font-size: 12px;
    -webkit-line-clamp: 2;
  }
}
</style>

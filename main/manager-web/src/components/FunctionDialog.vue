<template>
  <el-drawer :visible.sync="dialogVisible" direction="rtl" size="80%" :wrapperClosable="false" :withHeader="false">
    <div class="drawer-wrapper">
      <!-- 自定义标题区域 -->
      <div class="custom-header">
        <div class="header-left">
          <h3 class="bold-title">{{ $t('functionDialog.title') }}</h3>
        </div>
        <button class="custom-close-btn" @click="closeDialog">×</button>
      </div>

    <div class="function-manager">
      <el-row :gutter="20" class="responsive-row">
        <!-- 左侧：未选功能 -->
        <el-col :xs="24" :sm="12" :md="8" class="responsive-col">
          <el-card class="box-card function-card" shadow="never">
            <div slot="header" class="column-header">
              <span class="column-title">{{ $t('functionDialog.unselectedFunctions') }}</span>
              <el-button type="text" @click="selectAll" class="select-all-btn">
                {{ $t('functionDialog.selectAll') }}
              </el-button>
            </div>
            <div class="function-list">
              <div v-if="unselected.length">
                <div v-for="func in unselected" :key="func.name" class="function-item">
                  <el-checkbox :label="func.name" v-model="selectedNames" @change="(val) => handleCheckboxChange(func, val)"
                    @click.native.stop></el-checkbox>
                  <div class="func-tag" @click="handleFunctionClick(func)">
                    <div class="color-dot" style="margin-top: 5px; align-self: flex-start;"></div>
                    <div style="display: flex; flex-direction: column;">
                      <span>{{ func.name }}</span>
                      <span v-if="func.description" style="font-size: 12px; color: #909399; margin-top: 2px;">{{ func.description }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else style="display: flex; justify-content: center; align-items: center;">
                <el-empty :description="$t('functionDialog.noMorePlugins')" />
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 中间：已选功能 -->
        <el-col :xs="24" :sm="12" :md="8" class="responsive-col">
          <el-card class="box-card function-card" shadow="never">
            <div slot="header" class="column-header">
              <span class="column-title">{{ $t('functionDialog.selectedFunctions') }}</span>
              <el-button type="text" @click="deselectAll" class="select-all-btn">
                {{ $t('functionDialog.selectAll') }}
              </el-button>
            </div>
            <div class="function-list">
              <div v-if="selectedList.length > 0">
                <div v-for="func in selectedList" :key="func.name" class="function-item">
                  <el-checkbox :label="func.name" v-model="selectedNames" @change="(val) => handleCheckboxChange(func, val)"
                    @click.native.stop></el-checkbox>
                  <div class="func-tag" @click="handleFunctionClick(func)">
                    <div class="color-dot" style="margin-top: 5px; align-self: flex-start;"></div>
                    <div style="display: flex; flex-direction: column;">
                      <span>{{ func.name }}</span>
                      <span v-if="func.description" style="font-size: 12px; color: #909399; margin-top: 2px;">{{ func.description }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else style="display: flex; justify-content: center; align-items: center;">
                <el-empty :description="$t('functionDialog.pleaseSelectPlugin')" />
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：参数配置 -->
        <el-col :xs="24" :sm="24" :md="8" class="responsive-col">
          <el-card class="box-card params-card" shadow="never">
            <div slot="header" class="column-header">
              <span v-if="currentFunction" class="column-title">
                {{ $t('functionDialog.paramConfig') }} - {{ currentFunction.name }}
              </span>
              <span v-else class="column-title">{{ $t('functionDialog.paramConfig') }}</span>
            </div>
            
            <div v-if="currentFunction" class="params-container">
              <el-form :model="editingParams" class="param-form">
                <!-- 遍历 fieldsMeta -->
                <div v-if="currentFunction.fieldsMeta.length == 0">
                  <el-empty :description="currentFunction.name + $t('functionDialog.noNeedToConfig')" />
                </div>
                
                <el-form-item v-for="field in currentFunction.fieldsMeta" :key="field.key" :label="field.label"
                  class="param-item" :class="{ 'textarea-field': field.type === 'array' || field.type === 'json' }">
                  <template #label>
                    <span style="font-size: 16px; margin-right: 6px;">{{ field.label }}</span>
                    <el-tooltip effect="dark" :content="fieldRemark(field)" placement="top">
                      <img src="@/assets/home/info.png" alt="" class="info-icon">
                    </el-tooltip>
                  </template>

                  <!-- ARRAY -->
                  <el-input v-if="field.type === 'array'" type="textarea" v-model="editingParams[field.key]"
                    @input="val => handleParamInput(field.key, val)" />

                  <!-- JSON -->
                  <el-input v-else-if="field.type === 'json'" type="textarea" :rows="6" placeholder="请输入合法的 JSON"
                    v-model="textCache[field.key]" @blur="flushJson(field)" />

                  <!-- number -->
                  <div v-else-if="field.type === 'number'" class="custom-number-input el-input el-input--medium">
                    <input type="number" class="el-input__inner" v-model.number="editingParams[field.key]"
                      @input="e => handleParamInput(field.key, Number(e.target.value))" />
                  </div>

                  <!-- boolean -->
                  <el-switch v-else-if="field.type === 'boolean' || field.type === 'bool'"
                    v-model="editingParams[field.key]"
                    @change="val => handleParamInput(field.key, val)" />

                  <!-- string or fallback -->
                  <el-input v-else v-model="editingParams[field.key]"
                    @input="val => handleParamInput(field.key, val)" />
                </el-form-item>
              </el-form>
            </div>
            <div v-else class="empty-tip">{{ $t('functionDialog.pleaseSelectFunctionForParam') }}</div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- MCP区域 -->
    <div class="mcp-access-point" v-if="featureStatus.mcpAccessPoint">
      <div class="mcp-container">
        <!-- 左侧区域 -->
        <div class="mcp-left">
          <div class="mcp-header">
            <h3 class="bold-title">{{ $t('functionDialog.mcpAccessPoint') }}</h3>
          </div>
          <div class="url-header">
            <div class="address-desc">
              <span>{{ $t('functionDialog.mcpAddressDesc') }}</span>
              <a href="https://github.com/xinnan-tech/xiaozhi-esp32-server/blob/main/docs/mcp-endpoint-enable.md"
                target="_blank" class="doc-link">{{ $t('functionDialog.howToDeployMcp') }}</a> &nbsp;&nbsp;|&nbsp;&nbsp;
              <a href="https://github.com/xinnan-tech/xiaozhi-esp32-server/blob/main/docs/mcp-endpoint-integration.md"
                target="_blank" class="doc-link">{{ $t('functionDialog.howToIntegrateMcp') }}</a> &nbsp;
            </div>
          </div>
          <el-input v-model="mcpUrl" readonly class="url-input">
            <template #suffix>
              <el-button @click="copyUrl" class="inner-copy-btn" icon="el-icon-document-copy">
                {{ $t('functionDialog.copy') }}
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- 右侧区域 -->
        <div class="mcp-right">
          <div class="mcp-header">
            <h3 class="bold-title">{{ $t('functionDialog.accessPointStatus') }}</h3>
          </div>
          <div class="status-container">
            <span class="status-indicator" :class="mcpStatus"></span>
            <span class="status-text">{{
              mcpStatus === 'connected' ? $t('functionDialog.connected') :
                mcpStatus === 'loading' ? $t('functionDialog.loading') : $t('functionDialog.disconnected')
            }}</span>
            <button class="refresh-btn" @click="refreshStatus">
              <span class="refresh-icon">↻</span>
              <span>{{ $t('functionDialog.refresh') }}</span>
            </button>
          </div>
          <div class="mcp-tools-list">
            <div v-if="mcpTools.length > 0" class="tools-grid">
              <el-button v-for="tool in mcpTools" :key="tool" size="small" class="tool-btn" plain>
                {{ tool }}
              </el-button>
            </div>
            <div v-else class="no-tools">
              <span>{{ $t('functionDialog.noAvailableTools') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

      <div class="drawer-footer">
        <el-button @click="closeDialog">{{ $t('functionDialog.cancel') }}</el-button>
        <el-button type="primary" @click="saveSelection">{{ $t('functionDialog.saveConfig') }}</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import Api from '@/apis/api';
import i18n from '@/i18n';
import featureManager from '@/utils/featureManager';

export default {
  i18n,

  props: {
    value: Boolean,
    functions: {
      type: Array,
      default: () => []
    },
    allFunctions: {
      type: Array,
      default: () => []
    },
    agentId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      textCache: {},
      dialogVisible: this.value,
      selectedNames: [],
      currentFunction: null,
      editingParams: {},
      modifiedFunctions: {},
      tempFunctions: {},
      hasSaved: false,
      loading: false,

      mcpUrl: "",
      mcpStatus: "disconnected",
      mcpTools: [],
      
      featureStatus: {
        mcpAccessPoint: false
      }
    }
  },
  computed: {
    selectedList() {
      return this.allFunctions.filter(f => this.selectedNames.includes(f.name));
    },
    unselected() {
      return this.allFunctions.filter(f => !this.selectedNames.includes(f.name));
    }
  },
  watch: {
    currentFunction(newFn) {
      if (!newFn) {
        this.editingParams = {};
        return;
      }
      
      // Initialize an empty object for Vue to track
      const freshParams = {};
      
      newFn.fieldsMeta.forEach(f => {
        let v = newFn.params[f.key];
        
        // Backup from un-applied temp value
        if (this.tempFunctions[newFn.name]?.[f.key] !== undefined) {
          v = this.tempFunctions[newFn.name][f.key];
        } else if (v === undefined && f.default !== undefined) {
          v = f.default;
        }
        
        // 自动类型转换修复
        if (f.type === 'number') {
          v = Number(v);
          if (isNaN(v)) v = 0;
        } else if (f.type === 'boolean' || f.type === 'bool') {
          if (typeof v === 'string') {
            v = v.toLowerCase() === 'true';
          } else {
            v = Boolean(v);
          }
        } else if (v === undefined) {
          v = '';
        }

        // Set the property on our new tracking object BEFORE replacing editingParams
        freshParams[f.key] = v;

        if (f.type === 'array') {
          this.$set(this.textCache, f.key, Array.isArray(v) ? v.join('\n') : '');
        } else if (f.type === 'json') {
          try {
            this.$set(this.textCache, f.key, JSON.stringify(v ?? {}, null, 2));
          } catch {
            this.$set(this.textCache, f.key, '');
          }
        }
      });
      
      // Assign the fully populated object so Vue tracks all keys
      this.editingParams = freshParams;
      
      // Initialize temp buffer
      if (!this.tempFunctions[newFn.name]) {
        this.tempFunctions[newFn.name] = { ...freshParams };
      }
    },
    value(v) {
      this.dialogVisible = v;
      if (v) {
        this.selectedNames = this.functions.map(f => f.name);
        this.functions.forEach(saved => {
          const idx = this.allFunctions.findIndex(f => f.name === saved.name);
          if (idx >= 0) {
            this.allFunctions[idx].params = { ...saved.params };
          }
        });
        this.currentFunction = this.selectedList[0] || null;

        this.loadFeatureStatus();
        this.loadMcpAddress();
        this.loadMcpTools();
      }
    },
    dialogVisible(newVal) {
      this.$emit('input', newVal);
    }
  },
  methods: {
    async loadFeatureStatus() {
      await featureManager.waitForInitialization();
      
      const config = featureManager.getConfig();
      this.featureStatus = {
        mcpAccessPoint: config.mcpAccessPoint || false
      };
    },
    
    copyUrl() {
      const textarea = document.createElement('textarea');
      textarea.value = this.mcpUrl;
      textarea.style.position = 'fixed';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          this.$message.success(this.$t('functionDialog.copiedToClipboard'));
        } else {
          this.$message.error(this.$t('functionDialog.copyFailed'));
        }
      } catch (err) {
        this.$message.error('复制失败，请手动复制');
        console.error('复制失败:', err);
      } finally {
        document.body.removeChild(textarea);
      }
    },

    refreshStatus() {
      this.mcpStatus = "loading";
      this.loadMcpTools();
    },

    loadMcpAddress() {
      Api.agent.getAgentMcpAccessAddress(this.agentId, (res) => {
        if (res.data.code === 0) {
          this.mcpUrl = res.data.data || "";
        } else {
          this.mcpUrl = "";
          console.error('获取MCP地址失败:', res.data.msg);
        }
      });
    },

    loadMcpTools() {
      Api.agent.getAgentMcpToolsList(this.agentId, (res) => {
        if (res.data.code === 0) {
          this.mcpTools = res.data.data || [];
          this.mcpStatus = this.mcpTools.length > 0 ? "connected" : "disconnected";
        } else {
          this.mcpTools = [];
          this.mcpStatus = "disconnected";
          console.error('获取MCP工具列表失败:', res.data.msg);
        }
      });
    },

    flushArray(key) {
      const text = this.textCache[key] || '';
      const arr = text
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);
      this.handleParamInput(key, arr);
    },

    flushJson(field) {
      const key = field.key;
      if (!key) {
        return;
      }
      const text = this.textCache[key] || '';
      try {
        const obj = JSON.parse(text);
        this.handleParamInput(key, obj);
      } catch {
        this.$message.error(`${this.currentFunction.name}${this.$t('functionDialog.jsonFormatError')}`);
      }
    },
    handleFunctionClick(func) {
      if (this.selectedNames.includes(func.name)) {
        this.currentFunction = func;
      }
    },
    handleParamInput(key, value) {
      if (!this.currentFunction) return;
      const funcName = this.currentFunction.name;
      if (!this.tempFunctions[funcName]) {
        this.tempFunctions[funcName] = { ...this.currentFunction.params };
      }
      this.tempFunctions[funcName][key] = value;
    },
    handleCheckboxChange(func, checked) {
      if (checked) {
        if (!this.selectedNames.includes(func.name)) {
          this.selectedNames = [...this.selectedNames, func.name];
        }
      } else {
        this.selectedNames = this.selectedNames.filter(name => name !== func.name);
      }

      if (this.selectedList.length > 0) {
        this.currentFunction = this.selectedList[0];
      } else {
        this.currentFunction = null;
      }
    },

    selectAll() {
      this.selectedNames = [...this.allFunctions.map(f => f.name)];
      if (this.selectedList.length > 0) {
        this.currentFunction = this.selectedList[0];
      }
    },

    deselectAll() {
      this.selectedNames = [];
      this.currentFunction = null;
    },

    closeDialog() {
      this.tempFunctions = {};
      this.selectedNames = this.functions.map(f => f.name);
      this.currentFunction = null;
      this.dialogVisible = false;
      this.$emit('input', false);
      this.$emit('dialog-closed', false);
    },

    saveSelection() {
      Object.keys(this.tempFunctions).forEach(name => {
        this.modifiedFunctions[name] = { ...this.tempFunctions[name] };
      });
      this.tempFunctions = {};
      this.hasSaved = true;

      const selected = this.selectedList.map(f => {
        const modified = this.modifiedFunctions[f.name];
        return {
          id: f.id,
          name: f.name,
          params: modified ? { ...modified } : { ...f.params }
        }
      });

      this.$emit('update-functions', selected);
      this.dialogVisible = false;
      this.$emit('dialog-closed', true);
    },
    fieldRemark(field) {
      let description = (field && field.label) ? field.label : '';
      if (field.default) {
        description += `（${this.$t('functionDialog.defaultValue')}：${field.default}）`;
      }
      return description;
    },
  }
}
</script>

<style lang="scss" scoped>
.drawer-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.function-manager {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 24px;
}

.custom-header {
  flex-shrink: 0;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #EBEEF5;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .bold-title {
    font-size: 18px;
    font-weight: bold;
    margin: 0;
  }

  .select-all-btn {
    padding: 0;
    height: auto;
    font-size: 14px;
  }
}

.responsive-row {
  height: 100%;
}

.responsive-col {
  height: 100%; /* Ensure columns respect the row height limit */
  margin-bottom: 20px;
}

.box-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background-color: #fafafa;
  border: 1px solid #ebeef5;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px 0 rgba(0,0,0,0.05);
  }

  ::v-deep .el-card__header {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
    background-color: #ffffff;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
  
  ::v-deep .el-card__body {
    flex-grow: 1;
    overflow-y: auto;
    padding: 16px;
  }
}

.custom-number-input {
  width: 100%;
  
  input {
    text-align: left;
    height: 40px;
    line-height: 40px;
  }
}

.function-card, .params-card {
  min-height: 400px;
}

.mcp-access-point {
  flex-shrink: 0;
  background: white;
  border-top: 1px solid #EBEEF5;
  padding: 20px 24px;
}

.function-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.function-item {
  padding: 8px 12px;
  margin: 4px 0;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background-color: #f5f7fa;
  }
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-title {
  font-weight: bold;
  font-size: 16px;
}

.func-tag {
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-grow: 1;
  margin-left: 8px;
}

.color-dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  background-color: #07c160;
  margin-right: 8px;
  border-radius: 50%;
}

.param-form {
  .param-item {
    font-size: 16px;

    &.textarea-field {
      ::v-deep .el-form-item__content {
        margin-left: 0 !important;
        display: block;
        width: 100%;
      }

      ::v-deep .el-form-item__label {
        display: block;
        width: 100% !important;
        margin-bottom: 8px;
      }
    }
  }

  .param-input {
    width: 100%;
  }

  ::v-deep .el-form-item {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;

    .el-form-item__label {
      font-size: 14px !important;
      color: #606266;
      text-align: left;
      padding-right: 10px;
      flex-shrink: 0;
      width: auto !important;
    }

    .el-form-item__content {
      margin-left: 0 !important;
      flex-grow: 1;

      .el-input__inner {
        text-align: left;
        padding-left: 8px;
        width: 100%;
      }
    }
  }
}

.params-container {
  border-radius: 4px;
}

.empty-tip {
  padding: 20px;
  color: #909399;
  text-align: center;
}


.drawer-footer {
  flex-shrink: 0;
  width: 100%;
  border-top: 1px solid #e8e8e8;
  padding: 10px 16px;
  text-align: center;
  background: #fff;
}

.info-icon {
  width: 16px;
  height: 16px;
  margin-right: 1vh;
}

.custom-close-btn {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 2px solid #cfcfcf;
  background: none;
  font-size: 30px;
  font-weight: lighter;
  color: #cfcfcf;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  padding: 0;
  outline: none;
  transition: all 0.3s;
}

.custom-close-btn:hover {
  color: #07c160;
  border-color: #07c160;
}

::v-deep .el-checkbox__label {
  display: none;
}

.mcp-access-point {
  border-top: 1px solid #EBEEF5;
  padding: 20px 24px;
  text-align: left;
}

.mcp-header {
  .bold-title {
    font-size: 18px;
    font-weight: bold;
    margin: 5px 0 30px 0;
  }
}

.mcp-container {
  display: flex;
  justify-content: space-between;
  gap: 30px;
}

.mcp-left,
.mcp-right {
  flex: 1;
  padding-bottom: 50px;
}

.url-header {
  margin-bottom: 8px;
  color: black;

  h4 {
    margin: 0 0 15px 0;
    font-size: 16px;
    font-weight: normal;
  }

  .address-desc {
    display: flex;
    align-items: center;
    font-size: 14px;
    margin-bottom: 12px;

    .doc-link {
      color: #07c160;
      text-decoration: none;
      margin-left: 4px;

      &:hover {
        text-decoration: underline;
      }
    }
  }
}

.url-input {
  border-radius: 4px 0 0 4px;
  font-size: 14px;
  height: 36px;
  box-sizing: border-box;

  ::v-deep .el-input__inner {
    background-color: #f5f5f5 !important;
  }

  ::v-deep .el-input__suffix {
    right: 0;
    display: flex;
    align-items: center;
    padding-right: 10px;

    .inner-copy-btn {
      pointer-events: auto;
      border: none;
      background: #07c160;
      color: white;
      padding: 6px;
      margin-top: 4px;
      margin-left: 4px;
    }
  }
}

.mcp-right {
  h4 {
    margin: 0 0 10px 0;
    font-size: 16px;
    font-weight: normal;
    color: black;
  }
}

.status-container {
  display: flex;
  align-items: center;

  .status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;

    &.disconnected {
      background-color: #909399;
      /* 灰色 - 未连接 */
    }

    &.connected {
      background-color: #67C23A;
      /* 绿色 - 已连接 */
    }

    &.loading {
      background-color: #E6A23C;
      /* 橙色 - 加载中 */
      animation: pulse 1.5s infinite;
    }
  }

  .status-text {
    font-size: 14px;
    margin-right: 10px;
  }

  .refresh-btn {
    display: flex;
    align-items: center;
    padding: 2px 10px;
    background: white;
    color: black;
    border: 1px solid #DCDFE6;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s;

    &:hover {
      background: #1677ff;
      color: white;
      border-color: #1677ff;
    }

    .refresh-icon {
      margin-right: 6px;
      font-size: 14px;
    }
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
}

.mcp-tools-list {
  margin-top: 10px;

  .tools-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .tool-btn {
    padding: 6px 12px;
    border-color: #1677ff;
    color: #1677ff;
    background-color: white;
    font-size: 12px;

    &:hover {
      background-color: #1677ff;
      color: white;
      border-color: #1677ff;
    }
  }

  .no-tools {
    text-align: center;
    color: #909399;
    font-size: 14px;
    padding: 10px 0;
  }
}
</style>
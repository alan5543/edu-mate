<template>
  <div class="device-management-page">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h2 class="page-title">
            <i class="el-icon-monitor"></i>
            {{ $t('device.management') }}
          </h2>
          <p class="page-subtitle">{{ $t('device.statusDesc') || 'Manage and monitor your connected devices' }}</p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <el-input 
              :placeholder="$t('device.searchPlaceholder')" 
              v-model="searchKeyword" 
              class="search-input"
              prefix-icon="el-icon-search"
              @keyup.enter.native="handleSearch" 
              clearable 
            >
              <el-button slot="append" type="primary" @click="handleSearch">
                <i class="el-icon-search"></i>
                {{ $t('device.search') }}
              </el-button>
            </el-input>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-container">
      <el-card class="main-card" shadow="never">
        
        <!-- Desktop Table View with Expandable Rows -->
        <div class="hidden-xs-only">
          <el-table 
            ref="deviceTable" 
            :data="paginatedDeviceList" 
            class="device-table"
            :header-cell-class-name="headerCellClassName" 
            v-loading="loading"
            :element-loading-text="$t('deviceManagement.loading')"
            row-key="device_id"
          >
            <!-- Expand Column -->
            <el-table-column type="expand" width="50">
              <template slot-scope="{ row }">
                <div class="expand-content">
                  <div class="expand-grid">
                    <!-- Firmware Version -->
                    <div class="expand-item">
                      <div class="expand-label">
                        <i class="el-icon-cpu"></i>
                        {{ $t('device.firmwareVersion') }}
                      </div>
                      <div class="expand-value">{{ row.firmwareVersion || '-' }}</div>
                    </div>
                    
                    <!-- Last Conversation -->
                    <div class="expand-item">
                      <div class="expand-label">
                        <i class="el-icon-time"></i>
                        {{ $t('device.lastConversation') }}
                      </div>
                      <div class="expand-value">{{ row.lastConversation || '-' }}</div>
                    </div>
                    
                    <!-- Remark (Editable) -->
                    <div class="expand-item">
                      <div class="expand-label">
                        <i class="el-icon-edit-outline"></i>
                        {{ $t('device.remark') }}
                      </div>
                      <div class="expand-value remark-edit">
                        <el-input 
                          v-if="row.isEdit" 
                          v-model="row.remark" 
                          size="small" 
                          maxlength="64" 
                          @blur="onRemarkBlur(row)" 
                          @keyup.enter.native="onRemarkEnter(row)"
                          class="remark-input"
                        />
                        <div v-else class="remark-text" @click="row.isEdit = true">
                        {{ row.remark || '-' }}
                          <i class="el-icon-edit"></i>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Auto Update -->
                    <div class="expand-item">
                      <div class="expand-label">
                        <i class="el-icon-refresh"></i>
                        {{ $t('device.autoUpdate') }}
                      </div>
                      <div class="expand-value">
                        <el-switch 
                          v-model="row.otaSwitch" 
                          size="small" 
                          active-color="#07c160" 
                          @change="handleOtaSwitchChange(row)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            
            <!-- Checkbox -->
            <el-table-column align="center" width="50">
              <template slot-scope="scope">
                <el-checkbox v-model="scope.row.selected"></el-checkbox>
              </template>
            </el-table-column>
            
            <!-- Model -->
            <el-table-column :label="$t('device.model')" prop="model" min-width="140">
              <template slot-scope="scope">
                <span class="model-tag">{{ getFirmwareTypeName(scope.row.model) }}</span>
              </template>
            </el-table-column>
            
            <!-- MAC Address -->
            <el-table-column :label="$t('device.macAddress')" prop="macAddress" min-width="160" show-overflow-tooltip></el-table-column>
            
            <!-- Device Status -->
            <el-table-column v-if="mqttServiceAvailable" :label="$t('device.deviceStatus')" width="120" align="center">
              <template slot-scope="scope">
                <span class="status-badge" :class="scope.row.deviceStatus">
                  <span class="status-dot"></span>
                  {{ scope.row.deviceStatus === 'online' ? $t('device.online') : $t('device.offline') }}
                </span>
              </template>
            </el-table-column>
            
            <!-- Actions -->
            <el-table-column :label="$t('device.operation')" width="200" fixed="right">
              <template slot-scope="scope">
                <div class="action-buttons">
                  <el-button type="text" class="action-link danger" @click="handleUnbind(scope.row.device_id)">
                    <i class="el-icon-delete"></i>
                    {{ $t('device.unbind') }}
                  </el-button>
                  <el-button v-if="isGenerate(scope.row)" type="text" class="action-link primary" @click="handleGenertor(scope.row)">
                    <i class="el-icon-magic-stick"></i>
                    {{ $t('device.deviceThemeGeneration') }}
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- Mobile Card View -->
        <div class="hidden-sm-and-up mobile-list">
          <div v-if="loading" class="loading-placeholder">
            <i class="el-icon-loading"></i> {{ $t('deviceManagement.loading') }}
          </div>
          <div v-else-if="paginatedDeviceList.length === 0" class="empty-placeholder">
             {{ $t('common.noData') }}
          </div>
          <div v-else class="device-card-item" v-for="device in paginatedDeviceList" :key="device.device_id">
            <div class="card-top">
              <div class="card-title">
                <span class="model-badge">{{ getFirmwareTypeName(device.model) }}</span>
                <span v-if="mqttServiceAvailable" class="status-badge" :class="device.deviceStatus">
                  {{ device.deviceStatus === 'online' ? $t('device.online') : $t('device.offline') }}
                </span>
              </div>
              <el-checkbox v-model="device.selected" class="card-checkbox"></el-checkbox>
            </div>
            
            <!-- Collapsible Details -->
            <div class="card-summary" @click="toggleMobileExpand(device.device_id)">
              <span class="mac-text">{{ device.macAddress }}</span>
              <i :class="expandedMobileRows.includes(device.device_id) ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
            </div>
            
            <transition name="slide">
              <div v-if="expandedMobileRows.includes(device.device_id)" class="card-info">
                <div class="info-row">
                  <span class="label">{{ $t('device.firmwareVersion') }}:</span>
                  <span class="value">{{ device.firmwareVersion }}</span>
                </div>
                 <div class="info-row">
                  <span class="label">{{ $t('device.lastConversation') }}:</span>
                  <span class="value">{{ device.lastConversation || '-' }}</span>
                </div>
                <div class="info-row remark-row">
                  <span class="label">{{ $t('device.remark') }}:</span>
                  <div class="value remark-edit">
                     <el-input 
                      v-if="device.isEdit" 
                      v-model="device.remark" 
                      size="mini" 
                      maxlength="64" 
                      @blur="onRemarkBlur(device)" 
                      @keyup.enter.native="onRemarkEnter(device)" 
                    />
                    <span v-else @click="device.isEdit = true">
                      {{ device.remark || '-' }} <i class="el-icon-edit"></i>
                    </span>
                  </div>
                </div>
                <div class="info-row">
                  <span class="label">{{ $t('device.autoUpdate') }}:</span>
                  <el-switch 
                    v-model="device.otaSwitch" 
                    size="mini" 
                    active-color="#07c160" 
                    @change="handleOtaSwitchChange(device)"
                  />
                </div>
              </div>
            </transition>

            <div class="card-actions">
              <el-button size="small" type="danger" plain @click="handleUnbind(device.device_id)">
                {{ $t('device.unbind') }}
              </el-button>
              <el-button v-if="isGenerate(device)" size="small" type="primary" plain @click="handleGenertor(device)">
                {{ $t('device.deviceThemeGeneration') }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- Toolbar & Pagination -->
        <div class="table-footer">
          <div class="toolbar-actions">
            <el-button size="small" @click="handleSelectAll">
              {{ isCurrentPageAllSelected ? $t('common.deselectAll') : $t('common.selectAll') }}
            </el-button>
            <el-button type="primary" size="small" icon="el-icon-plus" @click="handleAddDevice">
              {{ $t('device.bindWithCode') }}
            </el-button>
            <el-button type="success" size="small" icon="el-icon-plus" @click="handleManualAddDevice" class="hidden-xs-only">
              {{ $t('device.manualAdd') }}
            </el-button>
             <el-button type="danger" size="small" icon="el-icon-delete" @click="deleteSelected" :disabled="!hasSelection">
              {{ $t('device.unbind') }}
            </el-button>
          </div>

          <div class="pagination-wrapper">
             <el-pagination
              @size-change="handlePageSizeChange"
              @current-change="goToPage"
              :current-page="currentPage"
              :page-sizes="[10, 20, 50]"
              :page-size="pageSize"
              layout="total, prev, pager, next"
              :total="filteredDeviceList.length"
              small
            />
          </div>
        </div>
      </el-card>
    </div>

    <AddDeviceDialog :visible.sync="addDeviceDialogVisible" :agent-id="currentAgentId" @refresh="fetchBindDevices(currentAgentId)" />
    <ManualAddDeviceDialog :visible.sync="manualAddDeviceDialogVisible" :agent-id="currentAgentId" @refresh="fetchBindDevices(currentAgentId)" />
  </div>
</template>

<script>
import Api from '@/apis/api';
import AddDeviceDialog from "@/components/AddDeviceDialog.vue";
import ManualAddDeviceDialog from "@/components/ManualAddDeviceDialog.vue";

export default {
  name: "DeviceManagementPage",
  components: {
    AddDeviceDialog,
    ManualAddDeviceDialog
  },
  data() {
    return {
      addDeviceDialogVisible: false,
      manualAddDeviceDialogVisible: false,
      searchKeyword: "",
      activeSearchKeyword: "",
      currentAgentId: this.$route.query.agentId || '',
      currentPage: 1,
      pageSize: 10,
      deviceList: [],
      loading: false,
      firmwareTypes: [],
      mqttServiceAvailable: false,
      expandedMobileRows: [],
    };
  },
  computed: {
    filteredDeviceList() {
      const keyword = this.activeSearchKeyword.toLowerCase();
      if (!keyword) return this.deviceList;
      return this.deviceList.filter(device =>
        (device.model && device.model.toLowerCase().includes(keyword)) ||
        (device.macAddress && device.macAddress.toLowerCase().includes(keyword))
      );
    },
    paginatedDeviceList() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredDeviceList.slice(start, end);
    },
    isCurrentPageAllSelected() {
      return this.paginatedDeviceList.length > 0 &&
        this.paginatedDeviceList.every(device => device.selected);
    },
    hasSelection() {
       return this.paginatedDeviceList.some(d => d.selected);
    }
  },
  mounted() {
    const agentId = this.$route.query.agentId;
    if (agentId) {
      this.fetchBindDevices(agentId);
    }
    this.getFirmwareTypes();
  },
  methods: {
    toggleMobileExpand(deviceId) {
      const idx = this.expandedMobileRows.indexOf(deviceId);
      if (idx > -1) {
        this.expandedMobileRows.splice(idx, 1);
      } else {
        this.expandedMobileRows.push(deviceId);
      }
    },
    async getFirmwareTypes() {
      try {
        const res = await Api.dict.getDictDataByType('FIRMWARE_TYPE')
        this.firmwareTypes = res.data
      } catch (error) {
        console.error(error)
      }
    },
    handlePageSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
    },
    goToPage(page) {
      this.currentPage = page;
    },
    handleSearch() {
      this.activeSearchKeyword = this.searchKeyword;
      this.currentPage = 1;
    },
    handleSelectAll() {
      const shouldSelectAll = !this.isCurrentPageAllSelected;
      this.paginatedDeviceList.forEach(row => {
        row.selected = shouldSelectAll;
      });
    },
    deleteSelected() {
      const selectedDevices = this.paginatedDeviceList.filter(device => device.selected);
      if (selectedDevices.length === 0) return;

      this.$confirm(this.$t('device.confirmBatchUnbind').replace('{count}', selectedDevices.length), this.$t('message.warning'), {
        confirmButtonText: this.$t('button.ok'),
        cancelButtonText: this.$t('button.cancel'),
        type: 'warning'
      }).then(() => {
        const deviceIds = selectedDevices.map(device => device.device_id);
        this.batchUnbindDevices(deviceIds);
      });
    },
    batchUnbindDevices(deviceIds) {
      const promises = deviceIds.map(id => {
        return new Promise((resolve, reject) => {
          Api.device.unbindDevice(id, ({ data }) => {
            if (data.code === 0) resolve();
            else reject(data.msg);
          });
        });
      });
      Promise.all(promises)
        .then(() => {
          this.$message.success(this.$t('device.batchUnbindSuccess').replace('{count}', deviceIds.length));
          this.fetchBindDevices(this.currentAgentId);
        })
        .catch(error => {
          this.$message.error(error || this.$t('device.batchUnbindError'));
        });
    },
    handleAddDevice() {
      this.addDeviceDialogVisible = true;
    },
    handleManualAddDevice() {
      this.manualAddDeviceDialogVisible = true;
    },
    submitRemark(row) {
      if (row._submitting) return;
      const text = (row.remark || '').trim();
      if (text.length > 64) {
        this.$message.warning(this.$t('device.remarkTooLong'));
        return;
      }
      if (text === row._originalRemark) return;

      row._submitting = true;
      this.updateDeviceInfo(row.device_id, { alias: text }, (ok, resp) => {
        if (ok) {
          row._originalRemark = text;
          this.$message.success(this.$t('device.remarkSaved'));
        } else {
          row.remark = row._originalRemark;
          this.$message.error(resp.msg || this.$t('device.remarkSaveFailed'));
        }
        row._submitting = false;
      });
    },
    onRemarkBlur(row) {
      row.isEdit = false;
      setTimeout(() => this.submitRemark(row), 100);
    },
    onRemarkEnter(row) {
      row.isEdit = false;
      this.submitRemark(row);
    },
    handleUnbind(device_id) {
      this.$confirm(this.$t('device.confirmUnbind'), this.$t('message.warning'), {
        confirmButtonText: this.$t('button.ok'),
        cancelButtonText: this.$t('button.cancel'),
        type: 'warning'
      }).then(() => {
        Api.device.unbindDevice(device_id, ({ data }) => {
          if (data.code === 0) {
            this.$message.success(this.$t('device.unbindSuccess'));
            this.fetchBindDevices(this.$route.query.agentId);
          } else {
            this.$message.error(data.msg || this.$t('device.unbindFailed'));
          }
        });
      });
    },
    handleGenertor(row) {
      const pathname = window.location.pathname;
      const basePath = pathname.split('/').slice(0, -1).join('/');
      const url = `${window.location.origin}${basePath}/generator/?deviceId=${row.device_id}`;
      sessionStorage.setItem('devicePath', window.location.href);
      window.location.href = url;
    },
    fetchBindDevices(agentId) {
      this.loading = true;
      Api.device.getAgentBindDevices(agentId, ({ data }) => {
        this.loading = false;
        if (data.code === 0) {
          this.deviceList = data.data.map(device => ({
            device_id: device.id,
            model: device.board,
            firmwareVersion: device.appVersion,
            macAddress: device.macAddress,
            bindTime: device.createDate,
            lastConversation: device.lastConnectedAt,
            remark: device.alias,
            _originalRemark: device.alias,
            isEdit: false,
            _submitting: false,
            otaSwitch: device.autoUpdate === 1,
            rawBindTime: new Date(device.createDate).getTime(),
            selected: false,
            deviceStatus: 'offline'
          })).sort((a, b) => a.rawBindTime - b.rawBindTime);
          
          this.fetchDeviceStatus(agentId);
        } else {
          this.$message.error(data.msg || this.$t('device.getListFailed'));
        }
      });
    },
    fetchDeviceStatus(agentId) {
      Api.device.getDeviceStatus(agentId, ({ data }) => {
        if (data.code === 0) {
           try {
            const statusData = JSON.parse(data.data);
            if (statusData && typeof statusData === 'object') {
              this.mqttServiceAvailable = true;
              this.updateDeviceStatusFromResponse(statusData);
            } else {
              this.mqttServiceAvailable = false;
            }
          } catch (error) {
            this.mqttServiceAvailable = false;
          }
        } else {
          this.mqttServiceAvailable = false;
        }
      });
    },
    updateDeviceStatusFromResponse(deviceStatusMap) {
      this.deviceList.forEach(device => {
        const macAddress = device.macAddress ? device.macAddress.replace(/:/g, '_') : 'unknown';
        const groupId = device.model ? device.model.replace(/:/g, '_') : 'GID_default';
        const mqttClientId = `${groupId}@@@${macAddress}@@@${macAddress}`;

        if (deviceStatusMap[mqttClientId]) {
          const statusInfo = deviceStatusMap[mqttClientId];
          let isOnline = statusInfo.isAlive === true || (statusInfo.isAlive === null && statusInfo.exists === true);
          device.deviceStatus = isOnline ? 'online' : 'offline';
        } else {
          device.deviceStatus = 'offline';
        }
      });
    },
    headerCellClassName({ columnIndex }) {
      if (columnIndex === 0) return "custom-selection-header";
      return "";
    },
    getFirmwareTypeName(type) {
      const firmwareType = this.firmwareTypes.find(item => item.key === type)
      return firmwareType ? firmwareType.name : type
    },
    updateDeviceInfo(device_id, payload, callback) {
      return Api.device.updateDeviceInfo(device_id, payload, ({ data }) => {
        callback(data.code === 0, data);
      })
    },
    handleOtaSwitchChange(row) {
      this.updateDeviceInfo(row.device_id, { autoUpdate: row.otaSwitch ? 1 : 0 }, (result, { msg }) => {
        if (result) {
          this.$message.success(row.otaSwitch ? this.$t('device.autoUpdateEnabled') : this.$t('device.autoUpdateDisabled'));
          return;
        }
        row.otaSwitch = !row.otaSwitch
        this.$message.error(msg || this.$t('message.error'))
      })
    },
    isGenerate(row) {
      const version = row.firmwareVersion.replace(/\./g, '');
      return Number(version) >= 200;
    },
  }
};
</script>

<style scoped lang="scss">
$primary: #07c160;
$primary-light: #e8f5e9;
$danger: #ff4d4f;
$border: #ebeef5;
$bg-page: #f5f7fb;
$text-primary: #1a1a2e;
$text-secondary: #606266;
$text-muted: #909399;

.device-management-page {
  min-height: 100vh;
  background: $bg-page;
  padding-bottom: 40px;
}

// Header
.page-header {
  background: white;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  margin-bottom: 24px;
  border-bottom: 1px solid #ebeef5;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.header-left {
  flex: 1;
  text-align: left;
}

.page-title {
  font-size: 22px;
  color: $text-primary;
  margin: 0 0 6px 0;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  
  i {
    color: $primary;
    font-size: 24px;
  }
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  color: $text-muted;
  font-weight: 400;
  text-align: left;
}

.search-box {
  display: flex;
  align-items: center;
  
  .search-input {
    width: 320px;
    
    ::v-deep .el-input__inner {
      border-radius: 8px 0 0 8px;
      border-right: none;
    }
    
    ::v-deep .el-input-group__append {
      border-radius: 0 8px 8px 0;
      background: $primary;
      color: white;
      border-color: $primary;
      padding: 0 20px;
      
      .el-button {
        background: transparent;
        border: none;
        color: white;
        font-weight: 600;
        
        i {
          margin-right: 4px;
        }
      }
    }
  }
}

// Content
.content-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.main-card {
  border-radius: 12px;
  border: 1px solid #ebeef5;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  min-height: 500px;
  display: flex;
  flex-direction: column;
  background: white;
}

// Table Styling
.device-table {
  width: 100%;
  
  ::v-deep .el-table__header th {
    background-color: #f5f7fa;
    color: $text-secondary;
    font-weight: 600;
    height: 48px;
  }
  
  ::v-deep .el-table__row td {
    padding: 12px 0;
    height: 60px;
  }
  
  ::v-deep .el-table__body tr:hover > td {
    background-color: #f0f9f0 !important;
  }
  
  ::v-deep .el-table__expanded-cell {
    padding: 0 !important;
    background: #fafbfc;
  }
}

// Expand Content
.expand-content {
  padding: 20px 24px 20px 70px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  border-top: 1px solid #ebeef5;
}

.expand-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.expand-item {
  .expand-label {
    font-size: 12px;
    color: $text-muted;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    
    i {
      font-size: 14px;
      color: $primary;
    }
  }
  
  .expand-value {
    font-size: 14px;
    color: $text-primary;
    font-weight: 500;
    
    &.remark-edit {
      .remark-text {
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        
        &:hover {
          background: $primary-light;
          color: $primary;
        }
        
        i {
          font-size: 12px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        &:hover i {
          opacity: 1;
        }
      }
      
      .remark-input {
        max-width: 200px;
      }
    }
    
    .switch-label {
      margin-left: 8px;
      font-size: 12px;
      color: $text-muted;
    }
  }
}

.model-tag {
  background: linear-gradient(135deg, #e1f3d8, #c8e6c9);
  color: darken($primary, 10%);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #b8dca8;
  display: inline-block;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  &.online {
    background: linear-gradient(135deg, #e1f3d8, #c8e6c9);
    color: darken($primary, 10%);
    
    .status-dot {
      background: $primary;
      box-shadow: 0 0 0 3px rgba($primary, 0.2);
      animation: pulse 2s infinite;
    }
  }
  
  &.offline {
    background: #f5f5f5;
    color: $text-muted;
    
    .status-dot {
      background: $text-muted;
    }
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-link {
  padding: 4px 8px;
  font-size: 13px;
  
  i {
    margin-right: 4px;
  }
  
  &.danger { 
    color: $danger; 
    &:hover { color: #ff7875; } 
  }
  
  &.primary {
    color: $primary;
    &:hover { color: darken($primary, 10%); }
  }
}

// Footer
.table-footer {
  padding: 16px 20px;
  border-top: 1px solid #ebeef5;
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  background: #fff;
  border-radius: 0 0 12px 12px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

// Mobile Card List
.mobile-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.loading-placeholder,
.empty-placeholder {
  text-align: center;
  padding: 40px;
  color: $text-muted;
}

.device-card-item {
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  
  .card-title {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .model-badge {
    font-size: 15px;
    font-weight: 700;
    color: #303133;
  }
}

.card-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #eef1f6;
  }
  
  .mac-text {
    font-family: monospace;
    font-size: 13px;
    color: $text-secondary;
  }
  
  i {
    color: $text-muted;
    transition: transform 0.3s;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 200px;
  overflow: hidden;
}

.slide-enter,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.card-info {
  margin-bottom: 16px;
  padding: 12px;
  background: #fafbfc;
  border-radius: 8px;
  
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    font-size: 13px;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .label { color: $text-muted; }
    .value { color: $text-primary; font-weight: 500; }
  }
  
  .remark-row {
     align-items: flex-start;
     .value { text-align: right; max-width: 60%; }
  }
}

.card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  
  .el-button {
    width: 100%;
    margin: 0;
  }
}

// Media Queries
@media (max-width: 1200px) {
  .expand-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .search-box {
    width: 100%;
    .search-input { flex: 1; width: 100%; }
  }
  
  .content-container {
    padding: 0 12px;
  }
  
  .table-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 12px;
  }
  
  .toolbar-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    
    .el-button {
      width: 100%;
      margin: 0;
    }
  }
  
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    padding-top: 4px;
  }
}

@media (max-width: 480px) {
  .hidden-xs-only { display: none !important; }
}
</style>

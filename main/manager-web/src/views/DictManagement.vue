<template>
  <div class="dict-management-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ $t('dictManagement.pageTitle') }}</h1>
        <p class="page-subtitle">{{ $t('header.paramDictionary') }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-container">
      <!-- Left Panel: Dict Types -->
      <div class="left-panel card">
        <div class="panel-header">
          <span class="panel-title">{{ $t('dictManagement.dictTypeName') }}</span>
          <div class="panel-actions">
            <el-tooltip :content="$t('dictManagement.addDictType')" placement="top">
              <el-button 
                type="primary" 
                size="mini" 
                icon="el-icon-plus" 
                circle 
                class="action-btn"
                @click="showAddDictTypeDialog"
              ></el-button>
            </el-tooltip>
            <el-tooltip :content="$t('dictManagement.batchDeleteDictType')" placement="top">
              <el-button 
                type="danger" 
                size="mini" 
                icon="el-icon-delete" 
                circle 
                class="action-btn"
                @click="batchDeleteDictType" 
                :disabled="selectedDictTypes.length === 0"
              ></el-button>
            </el-tooltip>
          </div>
        </div>
        
        <div class="panel-content">
          <el-table 
            ref="dictTypeTable" 
            :data="dictTypeList" 
            v-loading="dictTypeLoading"
            :element-loading-text="$t('common.loading')" 
            style="width: 100%"
            height="100%"
            @row-click="handleDictTypeRowClick"
            @selection-change="handleDictTypeSelectionChange" 
            :row-class-name="tableRowClassName"
            class="custom-table" 
            :header-cell-class-name="headerCellClassName"
          >
            <el-table-column type="selection" width="50" align="center" :cell-class-name="selectionCellClassName"></el-table-column>
            <el-table-column prop="dictName" :label="$t('dictManagement.dictTypeName')" show-overflow-tooltip></el-table-column>
            <el-table-column width="60" align="center">
              <template slot-scope="scope">
                <el-button type="text" size="mini" class="edit-text-btn" icon="el-icon-edit" @click.stop="editDictType(scope.row)"></el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>

      <!-- Right Panel: Dict Data -->
      <div class="right-panel card">
        <div class="toolbar">
          <div class="search-wrapper">
            <el-input 
              :placeholder="$t('dictManagement.searchPlaceholder')" 
              v-model="search" 
              prefix-icon="el-icon-search"
              clearable
              class="search-input"
              @keyup.enter.native="handleSearch"
              @clear="handleSearch"
            >
            </el-input>
          </div>
          <div class="toolbar-actions">
            <el-button type="primary" icon="el-icon-plus" class="create-btn" @click="showAddDictDataDialog">
              {{ $t('dictManagement.addDictData') }}
            </el-button>
            <el-button type="danger" icon="el-icon-delete" class="delete-btn" @click="batchDeleteDictData">
              {{ $t('dictManagement.batchDeleteDictData') }}
            </el-button>
          </div>
        </div>

        <div class="data-table-wrapper">
          <el-table 
            ref="dictDataTable" 
            :data="dictDataList" 
            v-loading="dictDataLoading" 
            :element-loading-text="$t('common.loading')"
            style="width: 100%"
            height="100%"
            class="custom-table"
            header-row-class-name="table-header"
          >
            <!-- Using manual selection as per original logic to avoid breaking scripts -->
            <el-table-column :label="$t('modelConfig.select')" align="center" width="70">
                <template slot-scope="scope">
                    <el-checkbox v-model="scope.row.selected"></el-checkbox>
                </template>
            </el-table-column>
            
            <el-table-column :label="$t('dictManagement.dictLabel')" prop="dictLabel" align="center"></el-table-column>
            <el-table-column :label="$t('dictManagement.dictValue')" prop="dictValue" align="center"></el-table-column>
            <el-table-column :label="$t('dictManagement.sort')" prop="sort" align="center" width="80"></el-table-column>
            <el-table-column :label="$t('dictManagement.operation')" align="center" width="180">
              <template slot-scope="scope">
                <el-button type="text" size="mini" class="edit-text-btn" @click="editDictData(scope.row)">
                  {{ $t('dictManagement.edit') }}
                </el-button>
                <el-button type="text" class="delete-text-btn" size="mini" @click="deleteDictData(scope.row)">
                  {{ $t('dictManagement.delete') }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="pagination-footer">
          <div class="batch-select-action">
             <el-button size="mini" @click="selectAllDictData">{{ isAllDictDataSelected ? $t('dictManagement.deselectAll') : $t('dictManagement.selectAll') }}</el-button>
          </div>
          <el-pagination
            background
            :current-page.sync="currentPage"
            :page-sizes="pageSizeOptions"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next"
            :total="total"
            @size-change="handlePageSizeChange"
            @current-change="goToPage"
          />
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <DictTypeDialog 
      :visible.sync="dictTypeDialogVisible" 
      :title="dictTypeDialogTitle" 
      :dictTypeData="dictTypeForm"
      @save="saveDictType" 
    />
    <DictDataDialog 
      :visible.sync="dictDataDialogVisible" 
      :title="dictDataDialogTitle" 
      :dictData="dictDataForm"
      :dictTypeId="selectedDictType && selectedDictType.id" 
      @save="saveDictData" 
    />
  </div>
</template>

<script>
import dictApi from '@/apis/module/dict'
import DictDataDialog from '@/components/DictDataDialog.vue'
import DictTypeDialog from '@/components/DictTypeDialog.vue'
export default {
    name: 'DictManagement',
    components: {
        DictTypeDialog,
        DictDataDialog
    },
    data() {
        return {
            // 字典类型相关
            dictTypeList: [],
            dictTypeLoading: false,
            selectedDictType: null,
            selectedDictTypes: [],  // 恢复多选数组
            dictTypeDialogVisible: false,
            dictTypeDialogTitle: '新增字典类型',
            dictTypeForm: {
                id: null,
                dictName: '',
                dictType: ''
            },

            // 字典数据相关
            dictDataList: [],
            dictDataLoading: false,
            isAllDictDataSelected: false,
            dictDataDialogVisible: false,
            dictDataDialogTitle: '新增字典数据',
            dictDataForm: {
                id: null,
                dictTypeId: null,
                dictLabel: '',
                dictValue: '',
                sort: 0
            },
            search: '',
            // 添加分页相关数据
            pageSizeOptions: [10, 20, 50, 100],
            currentPage: 1,
            pageSize: 10,
            total: 0
        }
    },
    created() {
        this.loadDictTypeList()
    },
    methods: {
        // 字典类型相关方法
        loadDictTypeList() {
            this.dictTypeLoading = true
            dictApi.getDictTypeList({
                page: 1,
                limit: 100,
                dictName: this.search
            }, ({ data }) => {
                if (data.code === 0) {
                    this.dictTypeList = data.data.list
                    if (this.dictTypeList.length > 0) {
                        this.selectedDictType = this.dictTypeList[0]
                        this.loadDictDataList(this.dictTypeList[0].id)
                        this.$nextTick(() => {
                            this.$refs.dictTypeTable.setCurrentRow(this.dictTypeList[0])
                        })
                    }
                }
                this.dictTypeLoading = false
            })
        },
        handleDictTypeRowClick(row) {
            this.selectedDictType = row
            this.loadDictDataList(row.id)
            this.$refs.dictTypeTable.setCurrentRow(row)
        },
        handleDictTypeSelectionChange(val) {
            this.selectedDictTypes = val
        },
        tableRowClassName({ row }) {
            return row === this.selectedDictType ? 'current-row' : ''
        },
        showAddDictTypeDialog() {
            this.dictTypeDialogTitle = this.$t('dictManagement.addDictType')
            this.dictTypeForm = {
                id: null,
                dictName: '',
                dictType: ''
            }
            this.dictTypeDialogVisible = true
        },
        editDictType(row) {
            this.dictTypeDialogTitle = this.$t('dictManagement.editDictType')
            this.dictTypeForm = { ...row }
            this.dictTypeDialogVisible = true
        },
        saveDictType(formData) {
            const api = formData.id ? dictApi.updateDictType : dictApi.addDictType
            api(formData, ({ data }) => {
                if (data.code === 0) {
                    this.$message.success(this.$t('dictManagement.saveSuccess'))
                    this.dictTypeDialogVisible = false
                    this.loadDictTypeList()
                }
            })
        },
        batchDeleteDictType() {
            if (this.selectedDictTypes.length === 0) {
                this.$message.warning(this.$t('dictManagement.selectDictTypeToDelete'))
                return
            }

            this.$confirm(this.$t('dictManagement.confirmDeleteDictType'), this.$t('dictManagement.confirm'), {
                confirmButtonText: this.$t('dictManagement.confirm'),
                cancelButtonText: this.$t('dictManagement.cancel'),
                type: 'warning'
            }).then(() => {
                const ids = this.selectedDictTypes.map(item => item.id)
                dictApi.deleteDictType(ids, ({ data }) => {
                    if (data.code === 0) {
                        this.$message.success(this.$t('dictManagement.deleteSuccess'))
                        this.loadDictTypeList()
                    }
                })
            })
        },

        // 字典数据相关方法
        loadDictDataList(dictTypeId) {
            if (!dictTypeId) return
            this.dictDataLoading = true
            dictApi.getDictDataList({
                dictTypeId,
                page: this.currentPage,
                limit: this.pageSize,
                dictLabel: this.search,
                dictValue: ''
            }, ({ data }) => {
                if (data.code === 0) {
                    this.dictDataList = data.data.list.map(item => ({
                        ...item,
                        selected: false
                    }))
                    this.total = data.data.total
                } else {
                        this.$message.error(data.msg || this.$t('dictManagement.getDictDataFailed'))
                    }
                this.dictDataLoading = false
            })
        },
        selectAllDictData() {
            this.isAllDictDataSelected = !this.isAllDictDataSelected
            this.dictDataList.forEach(row => {
                row.selected = this.isAllDictDataSelected
            })
        },
        showAddDictDataDialog() {
            if (!this.selectedDictType) {
                this.$message.warning(this.$t('dictManagement.selectDictTypeFirst'))
                return
            }
            this.dictDataDialogTitle = this.$t('dictManagement.addDictData')
            this.dictDataForm = {
                id: null,
                dictTypeId: this.selectedDictType.id,
                dictLabel: '',
                dictValue: '',
                sort: 0
            }
            this.dictDataDialogVisible = true
        },
        editDictData(row) {
            this.dictDataDialogTitle = this.$t('dictManagement.editDictData')
            this.dictDataForm = { ...row }
            this.dictDataDialogVisible = true
        },
        saveDictData(formData) {
            const api = formData.id ? dictApi.updateDictData : dictApi.addDictData
            api(formData, ({ data }) => {
                if (data.code === 0) {
                    this.$message.success(this.$t('dictManagement.saveSuccess'))
                    this.dictDataDialogVisible = false
                    this.loadDictDataList(formData.dictTypeId)
                }
            })
        },
        deleteDictData(row) {
            this.$confirm(this.$t('dictManagement.confirmDeleteDictData'), this.$t('dictManagement.confirm'), {
                confirmButtonText: this.$t('dictManagement.confirm'),
                cancelButtonText: this.$t('dictManagement.cancel'),
                type: 'warning'
            }).then(() => {
                dictApi.deleteDictData([row.id], ({ data }) => {
                    if (data.code === 0) {
                        this.$message.success(this.$t('dictManagement.deleteSuccess'))
                        this.loadDictDataList(row.dictTypeId)
                    }
                })
            })
        },
        batchDeleteDictData() {
            const selectedRows = this.dictDataList.filter(row => row.selected)
            if (selectedRows.length === 0) {
                this.$message.warning(this.$t('dictManagement.selectDictDataToDelete'))
                return
            }

            this.$confirm(this.$t('dictManagement.confirmBatchDeleteDictData', { count: selectedRows.length }), this.$t('dictManagement.confirm'), {
                confirmButtonText: this.$t('dictManagement.confirm'),
                cancelButtonText: this.$t('dictManagement.cancel'),
                type: 'warning'
            }).then(() => {
                const ids = selectedRows.map(item => item.id)
                dictApi.deleteDictData(ids, ({ data }) => {
                    if (data.code === 0) {
                        this.$message.success(this.$t('dictManagement.deleteSuccess'))
                        this.loadDictDataList(this.selectedDictType.id)
                    }
                })
            })
        },
        handleSearch() {
            if (!this.selectedDictType) {
                this.$message.warning('请先选择字典类型')
                return
            }
            this.currentPage = 1
            this.loadDictDataList(this.selectedDictType.id)
        },
        // 添加分页相关方法
        handlePageSizeChange(val) {
            this.pageSize = val;
            this.currentPage = 1;
            this.loadDictDataList(this.selectedDictType?.id);
        },
        
        // 更新选择列表头翻译文本
        updateSelectionHeaderText() {
            const thElement = document.querySelector(`.el-table__header th:nth-child(1) .cell`);
            if (thElement) {
                thElement.setAttribute('data-content', this.$t('modelConfig.select'));
            }
        },
        goFirst() {
            this.currentPage = 1;
            this.loadDictDataList(this.selectedDictType?.id);
        },
        goPrev() {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.loadDictDataList(this.selectedDictType?.id);
            }
        },
        goNext() {
            if (this.currentPage < this.pageCount) {
                this.currentPage++;
                this.loadDictDataList(this.selectedDictType?.id);
            }
        },
        goToPage(page) {
            this.currentPage = page;
            this.loadDictDataList(this.selectedDictType?.id);
        },
        // 表头单元格样式类名，用于选择列
        headerCellClassName({ columnIndex }) {
            if (columnIndex === 0) {
                return 'custom-selection-header';
            }
            return '';
        },
        // 单元格样式类名，用于设置选择列表头的翻译文本
        selectionCellClassName({ row, column, rowIndex, columnIndex }) {
            // 只对表头行设置data-content
            if (rowIndex === undefined) {
                setTimeout(() => {
                    this.updateSelectionHeaderText();
                }, 0);
            }
            return '';
        }
    },
    
    mounted() {
        // 在组件挂载后确保表头翻译文本正确显示
        setTimeout(() => {
            this.updateSelectionHeaderText();
        }, 100);
    },
    
    updated() {
        // 在组件更新后重新设置表头翻译文本
        this.updateSelectionHeaderText();
    },
    
    computed: {
        pageCount() {
            return Math.ceil(this.total / this.pageSize);
        },
        visiblePages() {
            const pages = [];
            const maxVisible = 3;
            let start = Math.max(1, this.currentPage - 1);
            let end = Math.min(this.pageCount, start + maxVisible - 1);

            if (end - start + 1 < maxVisible) {
                start = Math.max(1, end - maxVisible + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            return pages;
        }
    }
}
</script>

<style scoped lang="scss">
$primary: #07c160;
$primary-hover: #06ad56;
$text-primary: #101828;
$text-secondary: #344054;
$text-muted: #667085;
$border-color: #eaecf0;
$bg-page: #f9fafb;
$bg-white: #ffffff;
$danger: #f56c6c;

.dict-management-page {
  padding: 0; /* MainLayout provides padding */
  background-color: transparent;
  height: calc(100vh - 108px); /* 100vh - header(60) - layout padding(48) */
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 640px) {
    height: auto;
    overflow: visible;
  }
}

.page-header {
  margin-bottom: 24px;
  flex-shrink: 0; /* Prevent header from shrinking */
  .header-content {
    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: $text-primary;
      margin: 0 0 6px 0;
      
      @media (max-width: 640px) {
        font-size: 22px;
      }
    }
    .page-subtitle {
      color: $text-muted;
      font-size: 15px;
      margin: 0;
    }
  }
}

.content-container {
  display: flex;
  gap: 24px;
  flex: 1;
  min-height: 0; /* Critical for nested flex scrolling */
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
    overflow: visible; /* Allow scrolling on mobile */
    height: auto;
  }
}

.card {
  background: $bg-white;
  border-radius: 16px;
  border: 1px solid $border-color;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%; /* Ensure card takes full height of container */
}

.left-panel {
  width: 320px;
  flex-shrink: 0;
  height: 100%;

  @media (max-width: 768px) {
    width: 100%;
    height: 400px; /* Fixed height for mobile view list */
    min-height: 400px;
  }

  .panel-header {
    padding: 16px 20px;
    border-bottom: 1px solid $border-color;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .panel-title {
        font-weight: 600;
        color: $text-primary;
        font-size: 16px;
    }

    .panel-actions {
        display: flex;
        gap: 8px;
    }
  }

  .panel-content {
     flex: 1;
     overflow: hidden;
  }
}

.right-panel {
  flex: 1;
  min-width: 0;
  
  .toolbar {
    padding: 16px 20px;
    border-bottom: 1px solid $border-color;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    @media (max-width: 640px) {
        flex-direction: column;
        align-items: stretch;
    }
  }

  .search-wrapper {
    width: 280px;
    @media (max-width: 640px) {
        width: 100%;
    }
  }

  .data-table-wrapper {
      flex: 1;
      overflow: hidden;
      padding: 0;
  }

  .pagination-footer {
      padding: 16px 20px;
      border-top: 1px solid $border-color;
      display: flex;
      justify-content: space-between;
      align-items: center;

      @media (max-width: 640px) {
          flex-direction: column;
          gap: 10px;
      }
  }
}

/* Button & Input Overrides */
::v-deep .el-input__inner {
    border-radius: 10px;
    height: 40px;
    line-height: 40px;
    border: 1px solid $border-color;
    &:focus {
        border-color: $primary;
    }
}

.create-btn {
    background: $primary;
    border-color: $primary;
    border-radius: 10px;
    font-weight: 600;
    &:hover {
        background: $primary-hover;
        border-color: $primary-hover;
    }
}

.delete-btn {
    border-radius: 10px;
}

.action-btn {
    transition: all 0.2s;
    &:hover {
        transform: translateY(-1px);
    }
}

.edit-text-btn {
    color: $primary;
    &:hover {
        color: $primary-hover;
    }
}

.delete-text-btn {
    color: $danger;
    &:hover {
        color: darken($danger, 10%);
    }
}

/* Table overrides */
.custom-table {
    ::v-deep .el-table__header-wrapper th {
        background-color: #f8fafc;
        color: $text-secondary;
        font-weight: 600;
        height: 48px;
    }
    ::v-deep .el-table__row {
        td {
            padding: 8px 0;
        }
        &.current-row > td {
            background-color: transparentize($primary, 0.9) !important;
        }
    }
}

/* Scrollbar styling */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
</style>
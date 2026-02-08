<template>
  <div class="agent-management-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">{{ $t('agentTemplateManagement.title') || 'Agent Templates' }}</h1>
        <p class="page-subtitle">{{ $t('home.wish') || 'Manage and configure your AI agent templates efficiently.' }}</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" icon="el-icon-plus" @click="showAddTemplateDialog" class="create-btn">
          {{ $t('agentTemplateManagement.createTemplate') || 'Create Template' }}
        </el-button>
      </div>
    </div>

    <!-- Toolbar Section -->
    <div class="toolbar-section">
      <div class="left-tools">
        <div class="search-wrapper">
          <el-input
            :placeholder="$t('agentTemplateManagement.searchPlaceholder') || 'Search templates...'"
            v-model="search"
            class="search-input"
            prefix-icon="el-icon-search"
            clearable
            @keyup.enter.native="handleSearch"
            @clear="handleSearch"
          >
          </el-input>
        </div>
      </div>
      <div class="right-tools">
        <transition name="slide-fade">
          <div v-if="hasSelected" class="batch-actions">
            <span class="selection-count">{{ templateList.filter(i => i.selected).length }} {{ $t('common.selected') || 'selected' }}</span>
            <el-divider direction="vertical"></el-divider>
            <el-button 
              type="text" 
              class="batch-delete-btn" 
              icon="el-icon-delete"
              @click="batchDeleteTemplate"
            >
              {{ $t("agentTemplateManagement.batchDelete") || 'Delete' }}
            </el-button>
            <el-button 
              type="text" 
              class="cancel-btn"
              @click="handleSelectAll(false)"
            >
              {{ $t("agentTemplateManagement.deselectAll") || 'Cancel' }}
            </el-button>
          </div>
        </transition>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content-wrapper" v-loading="templateLoading">
      <div class="template-grid" v-if="templateList.length > 0">
        <agent-template-item 
          v-for="(item, index) in templateList" 
          :key="item.id || index" 
          :template="item"
          @select="handleRowSelectionChange"
          @edit="editTemplate"
          @delete="deleteTemplate"
        />
      </div>
      
      <!-- Empty State -->
      <div class="empty-state" v-else-if="!templateLoading">
        <div class="empty-content">
          <div class="empty-icon-wrapper">
            <i class="el-icon-folder-opened empty-icon"></i>
          </div>
          <h3>{{ $t('common.noData') || 'No templates found' }}</h3>
          <p>{{ $t('agentTemplateManagement.createFirst') || 'Get started by creating your first agent template.' }}</p>
          <el-button type="primary" @click="showAddTemplateDialog" class="empty-action-btn">
            <i class="el-icon-plus"></i>
            {{ $t('agentTemplateManagement.createTemplate') || 'Create Template' }}
          </el-button>
        </div>
      </div>
      
      <!-- Pagination -->
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          background
          :current-page.sync="currentPage"
          :page-sizes="[12, 24, 48, 96]"
          :page-size="pageSize"
          layout="total, prev, pager, next, sizes"
          :total="total"
          @size-change="handlePageSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import agentApi from "@/apis/module/agent";
import AgentTemplateItem from "@/components/AgentTemplateItem.vue";

export default {
  name: "AgentTemplateManagement",
  components: {
    AgentTemplateItem
  },
  data() {
    return {
      templateList: [],
      templateLoading: false,
      isAllSelected: false,
      search: "",
      currentPage: 1,
      pageSize: 12,
      total: 0
    };
  },
  created() {
    this.loadTemplateList();
  },
  computed: {
    hasSelected() {
      return this.templateList.some(item => item.selected);
    },
    isIndeterminate() {
      const selectedCount = this.templateList.filter(item => item.selected).length;
      return selectedCount > 0 && selectedCount < this.templateList.length;
    }
  },
  methods: {
    loadTemplateList() {
      this.templateLoading = true;
      const params = {
        page: this.currentPage,
        limit: this.pageSize,
      };
      if (this.search) {
        params.agentName = this.search;
      }

      try {
        agentApi.getAgentTemplatesPage(
          params,
          (res) => {
            if (res?.data?.code === 0) {
              const responseData = res.data.data || {};
              this.templateList = Array.isArray(responseData.list)
                ? responseData.list.map((item) => ({ ...item, selected: false }))
                : [];
              this.total = responseData.total || 0;
            } else {
              this.templateList = [];
              this.total = 0;
              this.$message.error(res?.data?.msg || this.$t("agentTemplateManagement.fetchTemplateFailed"));
            }
            this.templateLoading = false;
          },
          (error) => {
            this.templateList = [];
            this.total = 0;
            this.templateLoading = false;
            this.$message.error(this.$t("common.networkError"));
          }
        );
      } catch (error) {
        this.templateList = [];
        this.templateLoading = false;
      }
    },

    handleSearch() {
      this.currentPage = 1;
      this.loadTemplateList();
    },

    showAddTemplateDialog() {
      this.$router.push("/template-quick-config");
    },

    editTemplate(row) {
      this.$router.push({
        path: "/template-quick-config",
        query: { templateId: row.id },
      });
    },

    deleteTemplate(row) {
      this.$confirm(
        this.$t("agentTemplateManagement.confirmSingleDelete"),
        this.$t("common.warning"),
        { type: "warning" }
      )
        .then(() => {
          agentApi.deleteAgentTemplate(row.id, (res) => {
            if (res?.data?.code === 0) {
              this.$message.success(this.$t("agentTemplateManagement.deleteSuccess"));
              this.loadTemplateList();
            } else {
              this.$message.error(res?.data?.msg || this.$t("agentTemplateManagement.deleteFailed"));
            }
          });
        })
        .catch(() => {});
    },

    batchDeleteTemplate() {
      const selectedIds = this.templateList.filter(item => item.selected).map(i => i.id);
      if (selectedIds.length === 0) return;

      this.$confirm(
        this.$t("agentTemplateManagement.confirmBatchDelete", { count: selectedIds.length }),
        this.$t("common.warning"),
        { type: "warning" }
      )
        .then(() => {
          agentApi.batchDeleteAgentTemplate(selectedIds, (res) => {
            if (res?.data?.code === 0) {
              this.$message.success(this.$t("agentTemplateManagement.batchDeleteSuccess"));
              this.loadTemplateList();
            } else {
              this.$message.error(res?.data?.msg || this.$t("agentTemplateManagement.batchDeleteFailed"));
            }
          });
        })
        .catch(() => {});
    },

    handlePageChange(page) {
      this.currentPage = page;
      this.loadTemplateList();
    },

    handlePageSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.loadTemplateList();
    },

    handleSelectAll(val) {
      const isSelected = typeof val === 'boolean' ? val : !this.isAllSelected;
      this.templateList.forEach(row => row.selected = isSelected);
    },

    handleRowSelectionChange() {
      // Vue reactive handles this
    },
  },
};
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

.agent-management-page {
  padding: 0;
  background-color: transparent;
  min-height: calc(100vh - 108px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  gap: 16px;
  
  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }

  .header-content {
    .page-title {
      font-size: 26px;
      font-weight: 700;
      color: $text-primary;
      margin: 0 0 6px 0;
      line-height: 1.3;
      letter-spacing: -0.02em;
      
      @media (max-width: 640px) {
        font-size: 22px;
      }
    }
    
    .page-subtitle {
      color: $text-muted;
      font-size: 15px;
      margin: 0;
      line-height: 1.5;
    }
  }

  .create-btn {
    background: $primary;
    border-color: $primary;
    font-weight: 600;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    transition: all 0.2s ease;
    
    &:hover {
      background: $primary-hover;
      border-color: $primary-hover;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(7, 193, 96, 0.25);
    }
    
    &:active {
      transform: translateY(0);
    }
    
    @media (max-width: 640px) {
      width: 100%;
    }
  }
}

.toolbar-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.search-wrapper {
  width: 280px;
  
  @media (max-width: 640px) {
    width: 100%;
  }
  
  ::v-deep .el-input__inner {
    border-radius: 10px;
    border-color: $border-color;
    height: 42px;
    background: $bg-white;
    transition: all 0.2s ease;
    
    &:focus {
      border-color: $primary;
      box-shadow: 0 0 0 3px rgba(7, 193, 96, 0.1);
    }
  }
  
  ::v-deep .el-input__prefix {
    color: $text-muted;
  }
}

.right-tools {
  display: flex;
  align-items: center;
  
  @media (max-width: 640px) {
    width: 100%;
    justify-content: flex-end;
  }
}

.batch-actions {
  background: $bg-white;
  border: 1px solid $border-color;
  border-radius: 10px;
  padding: 6px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

  .selection-count {
    font-size: 13px;
    color: $text-secondary;
    font-weight: 500;
  }

  .batch-delete-btn {
    color: #ef4444;
    font-weight: 500;
    
    &:hover { 
      color: #dc2626; 
    }
  }
  
  .cancel-btn {
    color: $text-muted;
    
    &:hover {
      color: $text-secondary;
    }
  }
}

.content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding-bottom: 32px;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 80px 20px;
  flex: 1;
  
  .empty-content {
    text-align: center;
    max-width: 360px;
    background: $bg-white;
    padding: 48px 40px;
    border-radius: 20px;
    border: 1px solid $border-color;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    
    .empty-icon-wrapper {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }
    
    .empty-icon {
      font-size: 32px;
      color: $primary;
    }
    
    h3 {
      font-size: 18px;
      color: $text-primary;
      margin: 0 0 8px 0;
      font-weight: 600;
    }
    
    p {
      color: $text-muted;
      margin-bottom: 24px;
      line-height: 1.5;
      font-size: 14px;
    }
    
    .empty-action-btn {
      background: $primary;
      border-color: $primary;
      border-radius: 10px;
      padding: 10px 24px;
      font-weight: 600;
      
      &:hover {
        background: $primary-hover;
        border-color: $primary-hover;
      }
    }
  }
}

.pagination-wrapper {
  margin-top: auto;
  display: flex;
  justify-content: flex-end;
  padding-top: 20px;
  
  @media (max-width: 640px) {
    justify-content: center;
  }
}

// Transitions
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}

.slide-fade-enter,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>

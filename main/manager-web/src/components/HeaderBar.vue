<template>
  <el-header class="header" :class="{ 'layout-header': isLayoutHeader }">
    <div class="header-container">
      <!-- 左侧元素 (仅在非布局模式下显示，或者可以完全移除如果你只在MainLayout使用) -->
      <!-- Refactor: Logo moved to Sidebar, removing from here -->
      
      <!-- 中间导航菜单 (Refactor: Moved to Sidebar) -->
      <div class="header-center"></div>

      <!-- 右侧元素 -->
      <div class="header-right">
        <div class="search-container" v-if="$route.path === '/home' && !(isSuperAdmin && isSmallScreen)">
          <div class="search-wrapper">
            <el-input v-model="search" :placeholder="$t('header.searchPlaceholder')" class="custom-search-input"
              @keyup.enter.native="handleSearch" @focus="showSearchHistory" @blur="hideSearchHistory" clearable
              ref="searchInput">
              <i slot="suffix" class="el-icon-search search-icon" @click="handleSearch"></i>
            </el-input>
            <!-- 搜索历史下拉框 -->
            <div v-if="showHistory && searchHistory.length > 0" class="search-history-dropdown">
              <div class="search-history-header">
                <span>{{ $t("header.searchHistory") }}</span>
                <el-button type="text" size="small" class="clear-history-btn" @click="clearSearchHistory">
                  {{ $t("header.clearHistory") }}
                </el-button>
              </div>
              <div class="search-history-list">
                <div v-for="(item, index) in searchHistory" :key="index" class="search-history-item"
                  @click.stop="selectSearchHistory(item)">
                  <span class="history-text">{{ item }}</span>
                  <i class="el-icon-close clear-item-icon" @click.stop="removeSearchHistory(index)"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <img loading="lazy" alt="" src="@/assets/home/avatar.png" class="avatar-img" @click="handleAvatarClick" />
        <span class="el-user-dropdown" @click="handleAvatarClick">
          {{ userInfo.username || "加载中..." }}
          <i class="el-icon-arrow-down el-icon--right" :class="{ 'rotate-down': userMenuVisible }"></i>
        </span>
        <el-cascader :options="userMenuOptions" trigger="click" :props="cascaderProps"
          style="width: 0px; overflow: hidden" :show-all-levels="false" @change="handleCascaderChange"
          @visible-change="handleUserMenuVisibleChange" ref="userCascader">
          <template slot-scope="{ data }">
            <span>{{ data.label }}</span>
          </template>
        </el-cascader>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <ChangePasswordDialog v-model="isChangePasswordDialogVisible" />
  </el-header>
</template>

<script>
import userApi from "@/apis/module/user";
import i18n, { changeLanguage } from "@/i18n";
import { mapActions, mapGetters } from "vuex";
import ChangePasswordDialog from "./ChangePasswordDialog.vue"; // 引入修改密码弹窗组件

export default {
  name: "HeaderBar",
  components: {
    ChangePasswordDialog,
  },
  props: {
    devices: {
      type: Array,
      default: () => []
    },
    isLayoutHeader: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      search: "",
      userInfo: {
        username: "",
        mobile: "",
      },
      isChangePasswordDialogVisible: false, // 控制修改密码弹窗的显示
      userMenuVisible: false, // 添加用户菜单可见状态
      isSmallScreen: false,
      // 搜索历史相关
      searchHistory: [],
      showHistory: false,
      SEARCH_HISTORY_KEY: "xiaozhi_search_history",
      MAX_HISTORY_COUNT: 3,
      // Cascader 配置
      cascaderProps: {
        expandTrigger: "click",
        value: "value",
        label: "label",
        children: "children",
      },
    };
  },
  computed: {
    ...mapGetters(["getIsSuperAdmin"]),
    isSuperAdmin() {
      return this.getIsSuperAdmin;
    },
    // 获取当前语言
    currentLanguage() {
      return i18n.locale || "zh_CN";
    },
    // 获取当前语言显示文本
    currentLanguageText() {
      const currentLang = this.currentLanguage;
      switch (currentLang) {
        case "zh_CN":
          return this.$t("language.zhCN");
        case "zh_TW":
          return this.$t("language.zhTW");
        case "en":
          return this.$t("language.en");
        case "de":
          return this.$t("language.de");
        case "vi":
          return this.$t("language.vi");
        default:
          return this.$t("language.zhCN");
      }
    },
    // 用户菜单选项
    userMenuOptions() {
      return [
        {
          label: this.currentLanguageText,
          value: "language",
          children: [
            {
              label: this.$t("language.zhCN"),
              value: "zh_CN",
            },
            {
              label: this.$t("language.zhTW"),
              value: "zh_TW",
            },
            {
              label: this.$t("language.en"),
              value: "en",
            },
            {
              label: this.$t("language.de"),
              value: "de",
            },
            {
              label: this.$t("language.vi"),
              value: "vi",
            },
          ],
        },
        {
          label: this.$t("header.changePassword"),
          value: "changePassword",
        },
        {
          label: this.$t("header.logout"),
          value: "logout",
        },
      ];
    },
  },
  async mounted() {
    this.fetchUserInfo();
    this.checkScreenSize();
    window.addEventListener("resize", this.checkScreenSize);
    // 从localStorage加载搜索历史
    this.loadSearchHistory();
  },
  //移除事件监听器
  beforeDestroy() {
    window.removeEventListener("resize", this.checkScreenSize);
  },
  methods: {
    // 获取用户信息
    fetchUserInfo() {
      userApi.getUserInfo(({ data }) => {
        this.userInfo = data.data;
        if (data.data.superAdmin !== undefined) {
          this.$store.commit("setUserInfo", data.data);
        }
      });
    },
    checkScreenSize() {
      this.isSmallScreen = window.innerWidth <= 1386;
    },
    // 处理搜索
    handleSearch() {
      const searchValue = this.search.trim();

      // 如果搜索内容为空，触发重置事件
      if (!searchValue) {
        this.$eventBus.$emit("global-search-reset");
        return;
      }

      // 保存搜索历史
      this.saveSearchHistory(searchValue);

      // 触发搜索事件，将搜索关键词传递给父组件
      this.$eventBus.$emit("global-search", searchValue);

      // 搜索完成后让输入框失去焦点，从而触发blur事件隐藏搜索历史
      if (this.$refs.searchInput) {
        this.$refs.searchInput.blur();
      }
    },

    // 显示搜索历史
    showSearchHistory() {
      this.showHistory = true;
    },

    // 隐藏搜索历史
    hideSearchHistory() {
      // 延迟隐藏，以便点击事件能够执行
      setTimeout(() => {
        this.showHistory = false;
      }, 200);
    },

    // 加载搜索历史
    loadSearchHistory() {
      try {
        const history = localStorage.getItem(this.SEARCH_HISTORY_KEY);
        if (history) {
          this.searchHistory = JSON.parse(history);
        }
      } catch (error) {
        console.error("加载搜索历史失败:", error);
        this.searchHistory = [];
      }
    },

    // 保存搜索历史
    saveSearchHistory(keyword) {
      if (!keyword || this.searchHistory.includes(keyword)) {
        return;
      }

      // 添加到历史记录开头
      this.searchHistory.unshift(keyword);

      // 限制历史记录数量
      if (this.searchHistory.length > this.MAX_HISTORY_COUNT) {
        this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY_COUNT);
      }

      // 保存到localStorage
      try {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(this.searchHistory));
      } catch (error) {
        console.error("保存搜索历史失败:", error);
      }
    },

    // 选择搜索历史项
    selectSearchHistory(keyword) {
      this.search = keyword;
      this.handleSearch();
    },

    // 移除单个搜索历史项
    removeSearchHistory(index) {
      this.searchHistory.splice(index, 1);
      try {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(this.searchHistory));
      } catch (error) {
        console.error("更新搜索历史失败:", error);
      }
    },

    // 清空所有搜索历史
    clearSearchHistory() {
      this.searchHistory = [];
      try {
        localStorage.removeItem(this.SEARCH_HISTORY_KEY);
      } catch (error) {
        console.error("清空搜索历史失败:", error);
      }
    },
    // 显示修改密码弹窗
    showChangePasswordDialog() {
      this.isChangePasswordDialogVisible = true;
      // 添加：显示修改密码弹窗后重置用户菜单可见状态
      this.userMenuVisible = false;
    },
    // 退出登录
    async handleLogout() {
      try {
        // 调用 Vuex 的 logout action
        await this.logout();
        this.$message.success({
          message: this.$t("message.success"),
          showClose: true,
        });
      } catch (error) {
        console.error("退出登录失败:", error);
        this.$message.error({
          message: this.$t("message.error"),
          showClose: true,
        });
      }
    },
    
    // 在data中添加一个key用于强制重新渲染组件
    // 处理 Cascader 选择变化
    handleCascaderChange(value) {
      if (!value || value.length === 0) {
        return;
      }

      const action = value[value.length - 1];

      // 处理语言切换
      if (value.length === 2 && value[0] === "language") {
        this.changeLanguage(action);
      } else {
        // 处理其他操作
        switch (action) {
          case "changePassword":
            this.showChangePasswordDialog();
            break;
          case "logout":
            this.handleLogout();
            break;
        }
      }

      // 操作完成后立即清空选择
      setTimeout(() => {
        this.completeResetCascader();
      }, 300);
    },

    // 切换语言
    changeLanguage(lang) {
      changeLanguage(lang);
      this.$message.success({
        message: this.$t("message.success"),
        showClose: true,
      });
      // 添加：切换语言后重置用户菜单可见状态
      this.userMenuVisible = false;
    },

    // 完全重置级联选择器
    completeResetCascader() {
      if (this.$refs.userCascader) {
        try {
          // 尝试所有可能的方法来清空选择
          // 1. 尝试使用组件提供的clearValue方法
          if (this.$refs.userCascader.clearValue) {
            this.$refs.userCascader.clearValue();
          }

          // 2. 直接清空内部属性
          if (this.$refs.userCascader.$data) {
            this.$refs.userCascader.$data.selectedPaths = [];
            this.$refs.userCascader.$data.displayLabels = [];
            this.$refs.userCascader.$data.inputValue = "";
            this.$refs.userCascader.$data.checkedValue = [];
            this.$refs.userCascader.$data.showAllLevels = false;
          }

          // 3. 操作DOM清除选中状态
          const menuElement = this.$refs.userCascader.$refs.menu;
          if (menuElement && menuElement.$el) {
            const activeItems = menuElement.$el.querySelectorAll(
              ".el-cascader-node.is-active"
            );
            activeItems.forEach((item) => item.classList.remove("is-active"));

            const checkedItems = menuElement.$el.querySelectorAll(
              ".el-cascader-node.is-checked"
            );
            checkedItems.forEach((item) => item.classList.remove("is-checked"));
          }

          console.log("Cascader values cleared");
        } catch (error) {
          console.error("清空选择值失败:", error);
        }
      }
    },

    // 点击头像触发cascader下拉菜单
    handleAvatarClick() {
      if (this.$refs.userCascader) {
        // 切换菜单可见状态
        this.userMenuVisible = !this.userMenuVisible;

        // 菜单收起时清空选择值
        if (!this.userMenuVisible) {
          this.completeResetCascader();
        }

        // 直接设置菜单的显隐状态
        try {
          // 尝试使用toggleDropDownVisible方法
          this.$refs.userCascader.toggleDropDownVisible(this.userMenuVisible);
        } catch (error) {
          // 如果toggle方法失败，尝试直接设置属性
          if (this.$refs.userCascader.$refs.menu) {
            this.$refs.userCascader.$refs.menu.showMenu(this.userMenuVisible);
          } else {
            console.error("Cannot access menu component");
          }
        }
      }
    },

    // 处理用户菜单可见性变化
    handleUserMenuVisibleChange(visible) {
      this.userMenuVisible = visible;

      // 如果菜单关闭了，也要清空选择值
      if (!visible) {
        this.completeResetCascader();
      }
    },

    // 使用 mapActions 引入 Vuex 的 logout action
    ...mapActions(["logout"]),
  },
};
</script>

<style lang="scss" scoped>
.header {
  height: 60px !important;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
  
  &.layout-header {
    padding: 0 20px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,21,41,.08);
  }
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-center {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
  justify-content: flex-end;
}

.search-container {
  margin-right: 15px;
  width: 200px;
}

.search-wrapper {
  position: relative;
}

.search-history-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e4e6ef;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 2px;
}

.search-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
  color: #909399;
}

.clear-history-btn {
  color: #909399;
  font-size: 11px;
  padding: 0;
  height: auto;
}

.clear-history-btn:hover {
  color: #606266;
}

.search-history-list {
  max-height: 200px;
  overflow-y: auto;
}

.search-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  color: #606266;
}

.search-history-item:hover {
  background-color: #f5f7fa;
}

.clear-item-icon {
  font-size: 10px;
  color: #909399;
  visibility: hidden;
}

.avatar-img {
  width: 32px;
  height: 32px;
  cursor: pointer;
  border-radius: 50%;
}

.el-user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #333;
}

/* Fix search icon alignment */
::v-deep .custom-search-input .el-input__suffix {
  display: flex;
  align-items: center;
  height: 100%;
  top: 0;
}

::v-deep .custom-search-input .el-input__suffix-inner {
  display: flex;
  align-items: center;
}

.search-icon {
  cursor: pointer;
  font-size: 16px;
  margin-right: 5px;
}
</style>

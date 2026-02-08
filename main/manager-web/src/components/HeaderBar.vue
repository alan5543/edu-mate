<template>
  <el-header class="header" :class="{ 'layout-header': isLayoutHeader }">
    <div class="header-container">
      <!-- Mobile hamburger menu -->
      <div v-if="isMobile" class="hamburger-btn" @click="$emit('toggle-mobile-menu')">
        <i class="el-icon-s-fold"></i>
      </div>

      <!-- 中间导航菜单 (Spacing) -->
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

        <div class="user-section" @click="handleAvatarClick">
          <img loading="lazy" alt="" src="@/assets/home/avatar.png" class="avatar-img" />
          <span class="username" v-if="!isMobile">
            {{ userInfo.username || "Loading..." }}
            <i class="el-icon-arrow-down" :class="{ 'rotate-down': userMenuVisible }"></i>
          </span>
        </div>
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
import ChangePasswordDialog from "./ChangePasswordDialog.vue";

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
    },
    isMobile: {
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
      isChangePasswordDialogVisible: false,
      userMenuVisible: false,
      isSmallScreen: false,
      searchHistory: [],
      showHistory: false,
      SEARCH_HISTORY_KEY: "xiaozhi_search_history",
      MAX_HISTORY_COUNT: 3,
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
    currentLanguage() {
      return i18n.locale || "zh_CN";
    },
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
    userMenuOptions() {
      return [
        {
          label: this.currentLanguageText,
          value: "language",
          children: [
            { label: this.$t("language.zhCN"), value: "zh_CN" },
            { label: this.$t("language.zhTW"), value: "zh_TW" },
            { label: this.$t("language.en"), value: "en" },
            { label: this.$t("language.de"), value: "de" },
            { label: this.$t("language.vi"), value: "vi" },
          ],
        },
        { label: this.$t("header.changePassword"), value: "changePassword" },
        { label: this.$t("header.logout"), value: "logout" },
      ];
    },
  },
  async mounted() {
    this.fetchUserInfo();
    this.checkScreenSize();
    window.addEventListener("resize", this.checkScreenSize);
    this.loadSearchHistory();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.checkScreenSize);
  },
  methods: {
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
    handleSearch() {
      const searchValue = this.search.trim();
      if (!searchValue) {
        this.$eventBus.$emit("global-search-reset");
        return;
      }
      this.saveSearchHistory(searchValue);
      this.$eventBus.$emit("global-search", searchValue);
      if (this.$refs.searchInput) {
        this.$refs.searchInput.blur();
      }
    },
    showSearchHistory() {
      this.showHistory = true;
    },
    hideSearchHistory() {
      setTimeout(() => {
        this.showHistory = false;
      }, 200);
    },
    loadSearchHistory() {
      try {
        const history = localStorage.getItem(this.SEARCH_HISTORY_KEY);
        if (history) {
          this.searchHistory = JSON.parse(history);
        }
      } catch (error) {
        console.error("Failed to load search history:", error);
        this.searchHistory = [];
      }
    },
    saveSearchHistory(keyword) {
      if (!keyword || this.searchHistory.includes(keyword)) {
        return;
      }
      this.searchHistory.unshift(keyword);
      if (this.searchHistory.length > this.MAX_HISTORY_COUNT) {
        this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY_COUNT);
      }
      try {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(this.searchHistory));
      } catch (error) {
        console.error("Failed to save search history:", error);
      }
    },
    selectSearchHistory(keyword) {
      this.search = keyword;
      this.handleSearch();
    },
    removeSearchHistory(index) {
      this.searchHistory.splice(index, 1);
      try {
        localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(this.searchHistory));
      } catch (error) {
        console.error("Failed to update search history:", error);
      }
    },
    clearSearchHistory() {
      this.searchHistory = [];
      try {
        localStorage.removeItem(this.SEARCH_HISTORY_KEY);
      } catch (error) {
        console.error("Failed to clear search history:", error);
      }
    },
    showChangePasswordDialog() {
      this.isChangePasswordDialogVisible = true;
      this.userMenuVisible = false;
    },
    async handleLogout() {
      try {
        await this.logout();
        this.$message.success({
          message: this.$t("message.success"),
          showClose: true,
        });
      } catch (error) {
        console.error("Logout failed:", error);
        this.$message.error({
          message: this.$t("message.error"),
          showClose: true,
        });
      }
    },
    handleCascaderChange(value) {
      if (!value || value.length === 0) {
        return;
      }
      const action = value[value.length - 1];
      if (value.length === 2 && value[0] === "language") {
        this.changeLanguage(action);
      } else {
        switch (action) {
          case "changePassword":
            this.showChangePasswordDialog();
            break;
          case "logout":
            this.handleLogout();
            break;
        }
      }
      setTimeout(() => {
        this.completeResetCascader();
      }, 300);
    },
    changeLanguage(lang) {
      changeLanguage(lang);
      this.$message.success({
        message: this.$t("message.success"),
        showClose: true,
      });
      this.userMenuVisible = false;
    },
    completeResetCascader() {
      if (this.$refs.userCascader) {
        try {
          if (this.$refs.userCascader.clearValue) {
            this.$refs.userCascader.clearValue();
          }
          if (this.$refs.userCascader.$data) {
            this.$refs.userCascader.$data.selectedPaths = [];
            this.$refs.userCascader.$data.displayLabels = [];
            this.$refs.userCascader.$data.inputValue = "";
            this.$refs.userCascader.$data.checkedValue = [];
            this.$refs.userCascader.$data.showAllLevels = false;
          }
          const menuElement = this.$refs.userCascader.$refs.menu;
          if (menuElement && menuElement.$el) {
            const activeItems = menuElement.$el.querySelectorAll(".el-cascader-node.is-active");
            activeItems.forEach((item) => item.classList.remove("is-active"));
            const checkedItems = menuElement.$el.querySelectorAll(".el-cascader-node.is-checked");
            checkedItems.forEach((item) => item.classList.remove("is-checked"));
          }
        } catch (error) {
          console.error("Failed to clear cascader:", error);
        }
      }
    },
    handleAvatarClick() {
      if (this.$refs.userCascader) {
        this.userMenuVisible = !this.userMenuVisible;
        if (!this.userMenuVisible) {
          this.completeResetCascader();
        }
        try {
          this.$refs.userCascader.toggleDropDownVisible(this.userMenuVisible);
        } catch (error) {
          if (this.$refs.userCascader.$refs.menu) {
            this.$refs.userCascader.$refs.menu.showMenu(this.userMenuVisible);
          }
        }
      }
    },
    handleUserMenuVisibleChange(visible) {
      this.userMenuVisible = visible;
      if (!visible) {
        this.completeResetCascader();
      }
    },
    ...mapActions(["logout"]),
  },
};
</script>

<style lang="scss" scoped>
$primary: #07c160;
$text-primary: #101828;
$text-secondary: #344054;
$text-muted: #667085;
$border-color: #eaecf0;
$bg-hover: #f9fafb;

.header {
  height: 60px !important;
  background: #fff;
  border-bottom: 1px solid $border-color;
  padding: 0 20px;
  
  &.layout-header {
    padding: 0 24px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: 767px) {
    padding: 0 16px;
  }
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  gap: 16px;
}

.hamburger-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  cursor: pointer;
  color: $text-secondary;
  transition: all 0.2s ease;
  
  &:hover {
    background: $bg-hover;
    color: $primary;
  }
  
  i {
    font-size: 20px;
  }
}

.header-center {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
}

.search-container {
  width: 240px;
  
  @media (max-width: 1024px) {
    width: 180px;
  }
  
  @media (max-width: 767px) {
    display: none;
  }
}

.search-wrapper {
  position: relative;
}

::v-deep .custom-search-input {
  .el-input__inner {
    border-radius: 10px;
    border-color: $border-color;
    height: 40px;
    background: #f9fafb;
    transition: all 0.2s ease;
    
    &:focus {
      border-color: $primary;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(7, 193, 96, 0.1);
    }
  }
  
  .el-input__suffix {
    display: flex;
    align-items: center;
    height: 100%;
    top: 0;
  }
  
  .el-input__suffix-inner {
    display: flex;
    align-items: center;
  }
}

.search-icon {
  cursor: pointer;
  font-size: 16px;
  color: $text-muted;
  margin-right: 8px;
  transition: color 0.2s;
  
  &:hover {
    color: $primary;
  }
}

.search-history-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid $border-color;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  overflow: hidden;
}

.search-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid $border-color;
  font-size: 12px;
  color: $text-muted;
}

.clear-history-btn {
  color: $text-muted;
  font-size: 11px;
  padding: 0;
  height: auto;
  
  &:hover {
    color: $primary;
  }
}

.search-history-list {
  max-height: 160px;
  overflow-y: auto;
}

.search-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  color: $text-secondary;
  transition: background 0.15s;
  
  &:hover {
    background: $bg-hover;
    
    .clear-item-icon {
      visibility: visible;
    }
  }
}

.clear-item-icon {
  font-size: 12px;
  color: $text-muted;
  visibility: hidden;
  
  &:hover {
    color: #ef4444;
  }
}

.user-section {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 10px;
  transition: background 0.2s;
  
  &:hover {
    background: $bg-hover;
  }
}

.avatar-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: 4px;
  
  i {
    font-size: 12px;
    color: $text-muted;
    transition: transform 0.2s;
    
    &.rotate-down {
      transform: rotate(180deg);
    }
  }
}
</style>

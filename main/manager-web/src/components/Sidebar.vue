<template>
  <div>
    <!-- Mobile overlay -->
    <transition name="fade">
      <div 
        v-if="isMobileMenuOpen && isMobile" 
        class="mobile-overlay" 
        @click="closeMobileMenu"
      ></div>
    </transition>

    <div 
      class="sidebar-container" 
      :class="{ 
        'collapsed': isCollapsed && !isMobile, 
        'mobile-open': isMobileMenuOpen && isMobile,
        'is-mobile': isMobile 
      }"
    >
      <div class="logo-container" @click="goHome">
        <img loading="lazy" alt="Logo" src="@/assets/xiaozhi-logo.png" class="logo-img" />
        <img v-if="!isCollapsed || isMobile" loading="lazy" alt="Brand" :src="xiaozhiAiIcon" class="brand-img" />
      </div>

      <el-scrollbar wrap-class="scrollbar-wrapper">
        <el-menu
          :default-active="activeMenu"
          :collapse="isCollapsed && !isMobile"
          :background-color="'transparent'"
          :text-color="'#344054'"
          :active-text-color="'#07c160'"
          :unique-opened="false"
          :collapse-transition="false"
          mode="vertical"
          class="sidebar-menu"
        >
          <!-- 智能体管理 (Smart Management) -->
          <el-menu-item index="/home" @click="handleMenuClick('/home')">
            <i class="el-icon-s-home"></i>
            <span slot="title">{{ $t("header.smartManagement") }}</span>
          </el-menu-item>

          <!-- 音色克隆管理 (Voice Clone Management) -->
          <el-menu-item 
            v-if="!isSuperAdmin && featureStatus.voiceClone" 
            index="/voice-clone-management" 
            @click="handleMenuClick('/voice-clone-management')"
          >
            <i class="el-icon-microphone"></i>
            <span slot="title">{{ $t("header.voiceCloneManagement") }}</span>
          </el-menu-item>

          <!-- 超级管理员显示子菜单 -->
          <el-submenu v-if="isSuperAdmin && featureStatus.voiceClone" index="voice-clone">
            <template slot="title">
              <i class="el-icon-microphone"></i>
              <span>{{ $t("header.voiceCloneManagement") }}</span>
            </template>
            <el-menu-item index="/voice-clone-management" @click="handleMenuClick('/voice-clone-management')">
              <span>{{ $t("header.voiceCloneManagement") }}</span>
            </el-menu-item>
            <el-menu-item index="/voice-resource-management" @click="handleMenuClick('/voice-resource-management')">
              <span>{{ $t("header.voiceResourceManagement") }}</span>
            </el-menu-item>
          </el-submenu>

          <!-- 模型配置 (Model Config) - Super Admin Only -->
          <el-menu-item v-if="isSuperAdmin" index="/model-config" @click="handleMenuClick('/model-config')">
            <i class="el-icon-setting"></i>
            <span slot="title">{{ $t("header.modelConfig") }}</span>
          </el-menu-item>

          <!-- 知识库管理 (Knowledge Base) -->
          <el-menu-item 
            v-if="featureStatus.knowledgeBase" 
            index="/knowledge-base-management" 
            @click="handleMenuClick('/knowledge-base-management')"
          >
            <i class="el-icon-document"></i>
            <span slot="title">{{ $t("header.knowledgeBase") }}</span>
          </el-menu-item>

          <!-- 参数字典 (Param Dictionary) - Super Admin Only -->
          <el-submenu v-if="isSuperAdmin" index="param-dictionary">
            <template slot="title">
              <i class="el-icon-menu"></i>
              <span>{{ $t("header.paramDictionary") }}</span>
            </template>
            
            <el-menu-item index="/params-management" @click="handleMenuClick('/params-management')">
              <span>{{ $t("header.paramManagement") }}</span>
            </el-menu-item>
            <el-menu-item index="/user-management" @click="handleMenuClick('/user-management')">
              <span>{{ $t("header.userManagement") }}</span>
            </el-menu-item>
            <el-menu-item index="/ota-management" @click="handleMenuClick('/ota-management')">
              <span>{{ $t("header.otaManagement") }}</span>
            </el-menu-item>
            <el-menu-item index="/dict-management" @click="handleMenuClick('/dict-management')">
              <span>{{ $t("header.dictManagement") }}</span>
            </el-menu-item>
            <el-menu-item index="/provider-management" @click="handleMenuClick('/provider-management')">
              <span>{{ $t("header.providerManagement") }}</span>
            </el-menu-item>
            <el-menu-item index="/agent-template-management" @click="handleMenuClick('/agent-template-management')">
              <span>{{ $t("header.agentTemplate") }}</span>
            </el-menu-item>
            <el-menu-item index="/server-side-management" @click="handleMenuClick('/server-side-management')">
              <span>{{ $t("header.serverSideManagement") }}</span>
            </el-menu-item>
            <el-menu-item index="/feature-management" @click="handleMenuClick('/feature-management')">
              <span>{{ $t("header.featureManagement") }}</span>
            </el-menu-item>
          </el-submenu>

        </el-menu>
      </el-scrollbar>

      <!-- 折叠按钮 (Desktop only) -->
      <div v-if="!isMobile" class="collapse-btn" @click="toggleCollapse">
        <i :class="isCollapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import featureManager from "@/utils/featureManager";
import i18n from "@/i18n";

export default {
  name: "Sidebar",
  data() {
    return {
      isCollapsed: false,
      isMobileMenuOpen: false,
      isMobile: false,
      featureStatus: {
        voiceClone: false,
        knowledgeBase: false,
      },
    };
  },
  computed: {
    ...mapGetters(["getIsSuperAdmin"]),
    isSuperAdmin() {
      return this.getIsSuperAdmin;
    },
    activeMenu() {
      const route = this.$route;
      const { meta, path } = route;
      if (meta.activeMenu) {
        return meta.activeMenu;
      }
      return path;
    },
    currentLanguage() {
      return i18n.locale || "zh_CN";
    },
    xiaozhiAiIcon() {
      const currentLang = this.currentLanguage;
      switch (currentLang) {
        case "zh_CN":
        case "zh_TW":
          return require("@/assets/edumate_ai_zh.png");
        default:
          return require("@/assets/edumate_ai_en.png");
      }
    },
  },
  async mounted() {
    await this.loadFeatureStatus();
    this.checkMobile();
    window.addEventListener("resize", this.checkMobile);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.checkMobile);
  },
  methods: {
    checkMobile() {
      this.isMobile = window.innerWidth < 768;
      if (!this.isMobile) {
        this.isMobileMenuOpen = false;
      }
    },
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      this.$emit('toggle-collapse', this.isCollapsed);
    },
    toggleMobileMenu() {
      this.isMobileMenuOpen = !this.isMobileMenuOpen;
      this.$emit('mobile-menu-toggle', this.isMobileMenuOpen);
    },
    closeMobileMenu() {
      this.isMobileMenuOpen = false;
      this.$emit('mobile-menu-toggle', false);
    },
    handleMenuClick(path) {
      if (this.$route.path !== path) {
        this.$router.push(path);
      }
      if (this.isMobile) {
        this.closeMobileMenu();
      }
    },
    async loadFeatureStatus() {
      await featureManager.waitForInitialization();
      const config = featureManager.getConfig();
      this.featureStatus.voiceClone = config.voiceClone;
      this.featureStatus.knowledgeBase = config.knowledgeBase;
    },
    goHome() {
      this.handleMenuClick('/home');
    },
  },
};
</script>

<style lang="scss" scoped>
$primary: #07c160;
$primary-hover: #06ad56;
$primary-light: rgba(7, 193, 96, 0.1);

$text-primary: #101828;
$text-secondary: #344054;
$text-muted: #98a2b3;

$border-color: #eaecf0;
$bg-hover: #f9fafb;

$sidebar-width: 240px;
$sidebar-collapsed: 72px;

$transition: 0.25s ease;

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.sidebar-container {
  width: $sidebar-width;
  height: 100vh;
  background: #fff;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1001;
  display: flex;
  flex-direction: column;
  transition: all $transition;
  border-right: 1px solid $border-color;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.03);

  &.collapsed {
    width: $sidebar-collapsed;

    .logo-container {
      padding: 0 12px;
      justify-content: center;
      
      .brand-img {
        display: none;
      }
    }
    
    .sidebar-menu {
      ::v-deep .el-menu-item,
      ::v-deep .el-submenu .el-submenu__title {
        padding: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        justify-content: center;
        
        span {
          display: none;
        }
        
        i {
          margin: 0;
        }

        .el-submenu__icon-arrow {
          display: none !important;
        }
      }
    }
  }

  &.is-mobile {
    transform: translateX(-100%);
    box-shadow: none;
    width: 280px;
    
    &.mobile-open {
      transform: translateX(0);
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.12);
    }
  }

  .logo-container {
    height: 80px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    cursor: pointer;
    flex-shrink: 0;
    border-bottom: 1px solid $border-color;
    gap: 10px;
    
    .logo-img {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
    }
    
    .brand-img {
      height: 80px;
      object-fit: contain;
    }
  }

  .el-scrollbar {
    flex: 1;
    overflow: hidden;
    
    ::v-deep .el-scrollbar__wrap {
      overflow-x: hidden;
    }
  }

  .sidebar-menu {
    border: none;
    background: transparent !important;
    padding: 8px;
    
    &:not(.el-menu--collapse) {
      width: 100%;
    }

    ::v-deep .el-menu-item,
    ::v-deep .el-submenu__title {
      height: 44px;
      line-height: 44px;
      margin: 2px 0;
      padding: 0 12px !important;
      border-radius: 8px;
      color: $text-secondary;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      
      i {
        font-size: 18px;
        margin-right: 10px;
        color: $text-muted;
        transition: color 0.2s;
        width: 20px;
        text-align: center;
        flex-shrink: 0;
      }
      
      span {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 14px;
        font-weight: 500;
      }
      
      &:hover {
        background: $bg-hover;
        color: $text-primary;
        
        i {
          color: $text-secondary;
        }
      }
      
      &.is-active {
        background: $primary-light;
        color: $primary;
        font-weight: 600;
        
        i {
          color: $primary;
        }
      }
    }
    
    ::v-deep .el-menu-item.is-active:hover {
      background: rgba(7, 193, 96, 0.15);
      color: $primary;
      
      i {
        color: $primary;
      }
    }

    ::v-deep .el-submenu {
      .el-submenu__title {
        padding-right: 24px !important;
        
        .el-submenu__icon-arrow {
          right: 8px;
        }
      }
      
      .el-menu {
        background: transparent !important;
        
        .el-menu-item {
          padding-left: 44px !important;
          height: 40px;
          line-height: 40px;
          font-size: 13px;
        }
      }
    }
  }

  .collapse-btn {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: $text-muted;
    font-size: 18px;
    transition: all 0.2s ease;
    border-top: 1px solid $border-color;
    flex-shrink: 0;
    
    &:hover {
      background: $bg-hover;
      color: $primary;
    }
  }
}

// Transitions
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>

<style lang="scss">
/* Global styles for Element UI popup menus */
.el-menu--popup {
  background-color: #ffffff !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 5px 0;
  border-radius: 4px;

  .el-menu-item {
    background-color: #ffffff !important;
    color: #344054 !important;

    &:hover {
      background-color: #f9fafb !important;
      color: #101828 !important;
    }

    &.is-active {
      color: #07c160 !important;
      background-color: rgba(7, 193, 96, 0.1) !important;
    }
  }
}
</style>

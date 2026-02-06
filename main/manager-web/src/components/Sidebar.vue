<template>
  <div class="sidebar-container" :class="{ 'collapsed': isCollapsed }">
    <div class="logo-container" @click="goHome">
      <img loading="lazy" alt="Logo" src="@/assets/xiaozhi-logo.png" class="logo-img" />
      <img v-if="!isCollapsed" loading="lazy" alt="Brand" :src="xiaozhiAiIcon" class="brand-img" />
    </div>

    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapsed"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :active-text-color="variables.menuActiveText"
        :unique-opened="false"
        :collapse-transition="false"
        mode="vertical"
        class="sidebar-menu"
      >
        <!-- 智能体管理 (Smart Management) -->
        <el-menu-item index="/home" @click="goHome">
          <i class="el-icon-s-home"></i>
          <span slot="title">{{ $t("header.smartManagement") }}</span>
        </el-menu-item>

        <!-- 音色克隆管理 (Voice Clone Management) -->
        <!-- 普通用户显示单个菜单 -->
        <el-menu-item 
          v-if="!isSuperAdmin && featureStatus.voiceClone" 
          index="/voice-clone-management" 
          @click="goVoiceCloneManagement"
        >
          <i class="el-icon-microphone"></i>
          <span slot="title">{{ $t("header.voiceCloneManagement") }}</span>
        </el-menu-item>

        <!-- 超级管理员显示子菜单 -->
        <el-submenu v-if="isSuperAdmin && featureStatus.voiceClone" index="voice-clone">
          <template slot="title">
            <i class="el-icon-microphone"></i>
            <span slot="title">{{ $t("header.voiceCloneManagement") }}</span>
          </template>
          <el-menu-item index="/voice-clone-management" @click="goVoiceCloneManagement">
            <i class="el-icon-microphone"></i>
            <span slot="title">{{ $t("header.voiceCloneManagement") }}</span>
          </el-menu-item>
          <el-menu-item index="/voice-resource-management" @click="goVoiceResourceManagement">
            <i class="el-icon-headset"></i>
            <span slot="title">{{ $t("header.voiceResourceManagement") }}</span>
          </el-menu-item>
        </el-submenu>

        <!-- 模型配置 (Model Config) - Super Admin Only -->
        <el-menu-item v-if="isSuperAdmin" index="/model-config" @click="goModelConfig">
          <i class="el-icon-setting"></i>
          <span slot="title">{{ $t("header.modelConfig") }}</span>
        </el-menu-item>

        <!-- 知识库管理 (Knowledge Base) -->
        <el-menu-item 
          v-if="featureStatus.knowledgeBase" 
          index="/knowledge-base-management" 
          @click="goKnowledgeBaseManagement"
        >
          <i class="el-icon-document"></i>
          <span slot="title">{{ $t("header.knowledgeBase") }}</span>
        </el-menu-item>

        <!-- 参数字典 (Param Dictionary) - Super Admin Only -->
        <el-submenu v-if="isSuperAdmin" index="param-dictionary">
          <template slot="title">
            <i class="el-icon-menu"></i>
            <span slot="title">{{ $t("header.paramDictionary") }}</span>
          </template>
          
          <el-menu-item index="/params-management" @click="goParamManagement">
            <i class="el-icon-s-operation"></i>
            <span slot="title">{{ $t("header.paramManagement") }}</span>
          </el-menu-item>
          <el-menu-item index="/user-management" @click="goUserManagement">
            <i class="el-icon-user"></i>
            <span slot="title">{{ $t("header.userManagement") }}</span>
          </el-menu-item>
          <el-menu-item index="/ota-management" @click="goOtaManagement">
            <i class="el-icon-upload"></i>
            <span slot="title">{{ $t("header.otaManagement") }}</span>
          </el-menu-item>
          <el-menu-item index="/dict-management" @click="goDictManagement">
            <i class="el-icon-notebook-2"></i>
            <span slot="title">{{ $t("header.dictManagement") }}</span>
          </el-menu-item>
          <el-menu-item index="/provider-management" @click="goProviderManagement">
            <i class="el-icon-connection"></i>
            <span slot="title">{{ $t("header.providerManagement") }}</span>
          </el-menu-item>
          <el-menu-item index="/agent-template-management" @click="goAgentTemplateManagement">
            <i class="el-icon-s-custom"></i>
            <span slot="title">{{ $t("header.agentTemplate") }}</span>
          </el-menu-item>
          <el-menu-item index="/server-side-management" @click="goServerSideManagement">
            <i class="el-icon-s-platform"></i>
            <span slot="title">{{ $t("header.serverSideManagement") }}</span>
          </el-menu-item>
          <el-menu-item index="/feature-management" @click="goFeatureManagement">
            <i class="el-icon-s-grid"></i>
            <span slot="title">{{ $t("header.featureManagement") }}</span>
          </el-menu-item>
        </el-submenu>

      </el-menu>
    </el-scrollbar>

    <!-- 折叠按钮 -->
    <div class="collapse-btn" @click="toggleCollapse">
      <i :class="isCollapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"></i>
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
      // if set path, the sidebar will highlight the path you set
      if (meta.activeMenu) {
        return meta.activeMenu;
      }
      return path;
    },
    variables() {
      return {
        menuBg: "#ffffff",
        menuText: "#3d4566",
        menuActiveText: "#07c160",
      };
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
  },
  methods: {
    toggleCollapse() {
      this.isCollapsed = !this.isCollapsed;
      this.$emit('toggle-collapse', this.isCollapsed);
    },
    async loadFeatureStatus() {
      await featureManager.waitForInitialization();
      const config = featureManager.getConfig();
      this.featureStatus.voiceClone = config.voiceClone;
      this.featureStatus.knowledgeBase = config.knowledgeBase;
    },
    goHome() {
      if (this.$route.path !== '/home') this.$router.push("/home");
    },
    goVoiceCloneManagement() {
      if (this.$route.path !== '/voice-clone-management') this.$router.push("/voice-clone-management");
    },
    goVoiceResourceManagement() {
      if (this.$route.path !== '/voice-resource-management') this.$router.push("/voice-resource-management");
    },
    goModelConfig() {
      if (this.$route.path !== '/model-config') this.$router.push("/model-config");
    },
    goKnowledgeBaseManagement() {
      if (this.$route.path !== '/knowledge-base-management') this.$router.push("/knowledge-base-management");
    },
    goParamManagement() {
      if (this.$route.path !== '/params-management') this.$router.push("/params-management");
    },
    goUserManagement() {
      if (this.$route.path !== '/user-management') this.$router.push("/user-management");
    },
    goOtaManagement() {
      if (this.$route.path !== '/ota-management') this.$router.push("/ota-management");
    },
    goDictManagement() {
      if (this.$route.path !== '/dict-management') this.$router.push("/dict-management");
    },
    goProviderManagement() {
      if (this.$route.path !== '/provider-management') this.$router.push("/provider-management");
    },
    goAgentTemplateManagement() {
      if (this.$route.path !== '/agent-template-management') this.$router.push("/agent-template-management");
    },
    goServerSideManagement() {
      if (this.$route.path !== '/server-side-management') this.$router.push("/server-side-management");
    },
    goFeatureManagement() {
      if (this.$route.path !== '/feature-management') this.$router.push("/feature-management");
    },
  },
};
</script>

<style lang="scss" scoped>
.sidebar-container {
  transition: width 0.28s;
  width: 210px;
  background-color: #ffffff;
  height: 100vh;
  position: fixed;
  font-size: 0px;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;

  &.collapsed {
    width: 64px;
    
    .logo-container {
      padding: 0;
      justify-content: center;
      
      .brand-img {
        display: none;
      }
    }
  }

  .logo-container {
    height: 80px; /* Increased from 60px */
    display: flex;
    align-items: center;
    padding: 0 20px;
    cursor: pointer;
    border-bottom: 1px solid #f0f0f0;
    
    .logo-img {
      width: 40px; /* Slightly larger logo icon */
      height: 40px;
      margin-right: 12px;
    }
    
    .brand-img {
      height: 50px; /* Increased from 40px */
      object-fit: contain;
    }
  }

  .el-scrollbar {
    flex: 1;
    height: 100%;
    
    ::v-deep .el-scrollbar__wrap {
      overflow-x: hidden;
    }
  }

  .sidebar-menu {
    border: none;
    height: 100%;
    width: 100% !important;
    
    &:not(.el-menu--collapse) {
      width: 210px;
    }

    /* Enhance menu item styling */
    ::v-deep .el-menu-item,
    ::v-deep .el-submenu__title {
      height: 50px;
      line-height: 50px;
      margin: 4px 0;
      
      i {
        font-size: 18px;
        margin-right: 10px;
        color: #909399;
      }
      
      &.is-active {
        background-color: #e6f7e9 !important; /* Light green background for active */
        border-right: 3px solid #07c160;
        
        i {
          color: #07c160;
        }
      }
      
      &:hover {
        background-color: #f5f7fa !important;
        color: #07c160 !important;
        
        i {
          color: #07c160;
        }
      }
    }
  }

  .collapse-btn {
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-top: 1px solid #f0f0f0;
    color: #909399;
    font-size: 20px;
    
    &:hover {
      background-color: #f9f9f9;
      color: #07c160;
    }
  }
}
</style>

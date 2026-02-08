<template>
  <div class="app-wrapper">
    <Sidebar 
      ref="sidebar"
      class="sidebar-wrapper" 
      @toggle-collapse="handleSidebarCollapse" 
      @mobile-menu-toggle="handleMobileMenuToggle"
    />
    <div 
      class="main-container" 
      :class="{ 
        'sidebar-collapsed': isSidebarCollapsed,
        'is-mobile': isMobile
      }"
    >
      <div class="fixed-header">
        <HeaderBar 
          :is-layout-header="true" 
          :is-mobile="isMobile"
          @toggle-mobile-menu="toggleMobileMenu"
        />
      </div>
      <section class="app-main">
        <transition name="fade-transform" mode="out-in">
          <router-view />
        </transition>
      </section>
    </div>
  </div>
</template>

<script>
import Sidebar from '@/components/Sidebar.vue';
import HeaderBar from '@/components/HeaderBar.vue';

export default {
  name: 'MainLayout',
  components: {
    Sidebar,
    HeaderBar
  },
  data() {
    return {
      isSidebarCollapsed: false,
      isMobile: false,
      isMobileMenuOpen: false
    };
  },
  mounted() {
    this.checkMobile();
    window.addEventListener('resize', this.checkMobile);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkMobile);
  },
  methods: {
    checkMobile() {
      this.isMobile = window.innerWidth < 768;
    },
    handleSidebarCollapse(isCollapsed) {
      this.isSidebarCollapsed = isCollapsed;
    },
    handleMobileMenuToggle(isOpen) {
      this.isMobileMenuOpen = isOpen;
    },
    toggleMobileMenu() {
      if (this.$refs.sidebar) {
        this.$refs.sidebar.toggleMobileMenu();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
$sidebar-width: 240px;
$sidebar-collapsed: 72px;
$transition: 0.25s ease;

.app-wrapper {
  height: 100%;
  width: 100%;
  
  .sidebar-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    z-index: 1001;
  }
  
  .main-container {
    min-height: 100vh;
    transition: margin-left $transition;
    margin-left: $sidebar-width;
    position: relative;
    background-color: #f9fafb;
    
    &.sidebar-collapsed {
      margin-left: $sidebar-collapsed;
    }
    
    &.is-mobile {
      margin-left: 0;
    }
  }

  .fixed-header {
    position: sticky;
    top: 0;
    z-index: 9;
    width: 100%;
    background: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .app-main {
    min-height: calc(100vh - 60px);
    width: 100%;
    position: relative;
    overflow-x: hidden;
    padding: 24px;
    box-sizing: border-box;
    
    @media (max-width: 767px) {
      padding: 16px;
    }
  }
}

// Page transitions
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.2s ease-out;
}

.fade-transform-enter {
  opacity: 0;
  transform: translateY(6px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

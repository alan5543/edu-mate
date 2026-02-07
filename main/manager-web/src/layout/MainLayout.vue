<template>
  <div class="app-wrapper">
    <Sidebar class="sidebar-container" @toggle-collapse="handleSidebarCollapse" />
    <div class="main-container" :class="{ 'collapsed': isSidebarCollapsed }">
      <div class="fixed-header">
        <HeaderBar :is-layout-header="true" />
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
      isSidebarCollapsed: false
    };
  },
  methods: {
    handleSidebarCollapse(isCollapsed) {
      this.isSidebarCollapsed = isCollapsed;
    }
  }
};
</script>

<style lang="scss" scoped>
.app-wrapper {
  /* display: flex; <- Removed to fix whitespace on right side */
  height: 100%;
  width: 100%;
  
  .sidebar-container {
    transition: width 0.28s;
    /* width: 210px !important;  <- Removed to allow Sidebar component to control its width */
    height: 100%;
    position: fixed;
    font-size: 0px;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 1001;
    overflow: hidden;
  }
  
  .main-container {
    min-height: 100%;
    transition: margin-left 0.28s;
    margin-left: 240px; /* Adjusted to 240px */
    position: relative;
    /* width: 100%; <- Removed to fix overflow */
    background-color: #f0f2f5;
    
    &.collapsed {
      margin-left: 75px;
    }
  }

  .fixed-header {
    position: sticky;
    top: 0;
    z-index: 9;
    width: 100%;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,21,41,.08);
  }

  .app-main {
    /* 50 = navbar  */
    min-height: calc(100vh - 60px);
    width: 100%;
    position: relative;
    overflow: hidden;
    padding: 20px;
    box-sizing: border-box;
  }
}

/* fade-transform */
.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.5s;
}

.fade-transform-enter {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>

<template>
  <div class="welcome">
    <!-- Centered header with logo -->
    <div class="auth-header">
      <img loading="lazy" alt="" src="@/assets/xiaozhi-logo.png" style="width: 48px; height: 48px" />
      <img loading="lazy" alt="" :src="xiaozhiAiIcon" style="height: 22px" />
    </div>

    <!-- Centered login card -->
    <div class="login-box" @keyup.enter="login">
      <!-- Language dropdown in top-right of card -->
      <el-dropdown trigger="click" class="title-language-dropdown"
        @visible-change="handleLanguageDropdownVisibleChange">
        <span class="el-dropdown-link">
          <span class="current-language-text">{{ currentLanguageText }}</span>
          <i class="el-icon-arrow-down el-icon--right" :class="{ 'rotate-down': languageDropdownVisible }"></i>
        </span>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item @click.native="changeLanguage('zh_CN')">
            {{ $t("language.zhCN") }}
          </el-dropdown-item>
          <el-dropdown-item @click.native="changeLanguage('zh_TW')">
            {{ $t("language.zhTW") }}
          </el-dropdown-item>
          <el-dropdown-item @click.native="changeLanguage('en')">
            {{ $t("language.en") }}
          </el-dropdown-item>
          <el-dropdown-item @click.native="changeLanguage('de')">
            {{ $t("language.de") }}
          </el-dropdown-item>
          <el-dropdown-item @click.native="changeLanguage('vi')">
            {{ $t("language.vi") }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>

      <!-- Title section -->
      <div style="text-align: center; margin-bottom: 40px;">
        <div class="login-text">{{ $t("login.title") }}</div>
        <div class="login-welcome">{{ $t("login.welcome") }}</div>
      </div>

      <!-- Form fields -->
      <div>
        <!-- Username login -->
        <template v-if="!isMobileLogin">
          <div class="input-box">
            <img loading="lazy" alt="" class="input-icon" src="@/assets/login/username.png" />
            <el-input v-model="form.username" :placeholder="$t('login.usernamePlaceholder')" />
          </div>
        </template>

        <!-- Mobile login -->
        <template v-else>
          <div class="input-box">
            <div style="display: flex; align-items: center; width: 100%">
              <el-select v-model="form.areaCode" style="width: 220px; margin-right: 10px">
                <el-option v-for="item in mobileAreaList" :key="item.key" :label="`${item.name} (${item.key})`"
                  :value="item.key" />
              </el-select>
              <el-input v-model="form.mobile" :placeholder="$t('login.mobilePlaceholder')" />
            </div>
          </div>
        </template>

        <!-- Password -->
        <div class="input-box">
          <img loading="lazy" alt="" class="input-icon" src="@/assets/login/password.png" />
          <el-input v-model="form.password" :placeholder="$t('login.passwordPlaceholder')" type="password"
            show-password />
        </div>

        <!-- Captcha -->
        <div style="display: flex; align-items: center; margin-top: 24px; width: 100%; gap: 10px;">
          <div class="input-box" style="width: calc(100% - 160px); margin-top: 0;">
            <img loading="lazy" alt="" class="input-icon" src="@/assets/login/shield.png" />
            <el-input v-model="form.captcha" :placeholder="$t('login.captchaPlaceholder')" style="flex: 1" />
          </div>
          <img loading="lazy" v-if="captchaUrl" :src="captchaUrl" alt="验证码"
            style="width: 150px; height: 56px; cursor: pointer; border-radius: 12px; border: 2px solid #e2e8f0;"
            @click="fetchCaptcha" />
        </div>

        <!-- Links -->
        <div style="font-weight: 500; font-size: 14px; display: flex; justify-content: space-between; margin-top: 20px;">
          <div v-if="allowUserRegister" style="cursor: pointer; color: #8b5cf6; transition: color 0.3s;"
            @click="goToRegister" @mouseenter="$event.target.style.color='#7c3aed'"
            @mouseleave="$event.target.style.color='#8b5cf6'">
            {{ $t("login.register") }}
          </div>
          <div style="cursor: pointer; color: #8b5cf6; transition: color 0.3s;" @click="goToForgetPassword"
            v-if="enableMobileRegister" @mouseenter="$event.target.style.color='#7c3aed'"
            @mouseleave="$event.target.style.color='#8b5cf6'">
            {{ $t("login.forgetPassword") }}
          </div>
        </div>
      </div>

      <!-- Login button -->
      <div class="login-btn" @click="login">{{ $t("login.login") }}</div>

      <!-- Login type toggle -->
      <div class="login-type-container" v-if="enableMobileRegister">
        <div style="display: flex; gap: 10px">
          <el-tooltip :content="$t('login.mobileLogin')" placement="bottom">
            <el-button :type="isMobileLogin ? 'primary' : 'default'" icon="el-icon-mobile" circle
              @click="switchLoginType('mobile')"></el-button>
          </el-tooltip>
          <el-tooltip :content="$t('login.usernameLogin')" placement="bottom">
            <el-button :type="!isMobileLogin ? 'primary' : 'default'" icon="el-icon-user" circle
              @click="switchLoginType('username')"></el-button>
          </el-tooltip>
        </div>
      </div>

      <!-- Terms -->
      <div style="font-size: 13px; color: #64748b; text-align: center; line-height: 1.6;">
        {{ $t("login.agreeTo") }}
        <span style="color: #8b5cf6; cursor: pointer; font-weight: 500;">
          {{ $t("login.userAgreement") }}
        </span>
        {{ $t("login.and") }}
        <span style="color: #8b5cf6; cursor: pointer; font-weight: 500;">
          {{ $t("login.privacyPolicy") }}
        </span>
      </div>
    </div>

  </div>
</template>

<script>
import Api from "@/apis/api";
import i18n, { changeLanguage } from "@/i18n";
import { getUUID, goToPage, showDanger, showSuccess, sm2Encrypt, validateMobile } from "@/utils";
import { mapState } from "vuex";
import featureManager from "@/utils/featureManager";

export default {
  name: "login",
  components: {},
  computed: {
    ...mapState({
      allowUserRegister: (state) => state.pubConfig.allowUserRegister,
      enableMobileRegister: (state) => state.pubConfig.enableMobileRegister,
      mobileAreaList: (state) => state.pubConfig.mobileAreaList,
      sm2PublicKey: (state) => state.pubConfig.sm2PublicKey,
    }),
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
    // 根据当前语言获取对应的xiaozhi-ai图标
    xiaozhiAiIcon() {
      const currentLang = this.currentLanguage;
      switch (currentLang) {
        case "zh_CN":
          return require("@/assets/xiaozhi-ai.png");
        case "zh_TW":
          return require("@/assets/xiaozhi-ai_zh_TW.png");
        case "en":
          return require("@/assets/xiaozhi-ai_en.png");
        case "de":
          return require("@/assets/xiaozhi-ai_de.png");
        case "vi":
          return require("@/assets/xiaozhi-ai_vi.png");
        default:
          return require("@/assets/xiaozhi-ai.png");
      }
    },
  },
  data() {
    return {
      activeName: "username",
      form: {
        username: "",
        password: "",
        captcha: "",
        captchaId: "",
        areaCode: "+86",
        mobile: "",
      },
      captchaUuid: "",
      captchaUrl: "",
      isMobileLogin: false,
      languageDropdownVisible: false,
    };
  },
  mounted() {
    this.fetchCaptcha();
    this.$store.dispatch("fetchPubConfig").then(() => {
      // 根据配置决定默认登录方式
      this.isMobileLogin = this.enableMobileRegister;
      
      // pub-config接口调用完成后，重新初始化featureManager以确保使用最新的配置
      featureManager.waitForInitialization().then(() => {
        console.log('featureManager重新初始化完成，使用pub-config配置');
      }).catch(error => {
        console.warn('featureManager重新初始化失败:', error);
      });
    });
  },
  methods: {
    fetchCaptcha() {
      if (this.$store.getters.getToken) {
        if (this.$route.path !== "/home") {
          this.$router.push("/home");
        }
      } else {
        this.captchaUuid = getUUID();

        Api.user.getCaptcha(this.captchaUuid, (res) => {
          if (res.status === 200) {
            const blob = new Blob([res.data], { type: res.data.type });
            this.captchaUrl = URL.createObjectURL(blob);
          } else {
            showDanger("验证码加载失败，点击刷新");
          }
        });
      }
    },

    // 切换语言下拉菜单的可见状态变化
    handleLanguageDropdownVisibleChange(visible) {
      this.languageDropdownVisible = visible;
    },

    // 切换语言
    changeLanguage(lang) {
      changeLanguage(lang);
      this.languageDropdownVisible = false;
      this.$message.success({
        message: this.$t("message.success"),
        showClose: true,
      });
    },

    // 切换登录方式
    switchLoginType(type) {
      this.isMobileLogin = type === "mobile";
      // 清空表单
      this.form.username = "";
      this.form.mobile = "";
      this.form.password = "";
      this.form.captcha = "";
      this.fetchCaptcha();
    },

    // 封装输入验证逻辑
    validateInput(input, messageKey) {
      if (!input.trim()) {
        showDanger(this.$t(messageKey));
        return false;
      }
      return true;
    },

    async login() {
      if (this.isMobileLogin) {
        // 手机号登录验证
        if (!validateMobile(this.form.mobile, this.form.areaCode)) {
          showDanger(this.$t('login.requiredMobile'));
          return;
        }
        // 拼接手机号作为用户名
        this.form.username = this.form.areaCode + this.form.mobile;
      } else {
        // 用户名登录验证
        if (!this.validateInput(this.form.username, 'login.requiredUsername')) {
          return;
        }
      }

      // 验证密码
      if (!this.validateInput(this.form.password, 'login.requiredPassword')) {
        return;
      }
      // 验证验证码
      if (!this.validateInput(this.form.captcha, 'login.requiredCaptcha')) {
        return;
      }
      // 加密密码
      let encryptedPassword;
      try {
        // 拼接验证码和密码
        const captchaAndPassword = this.form.captcha + this.form.password;
        encryptedPassword = sm2Encrypt(this.sm2PublicKey, captchaAndPassword);
      } catch (error) {
        console.error("密码加密失败:", error);
        showDanger(this.$t('sm2.encryptionFailed'));
        return;
      }

      const plainUsername = this.form.username;

      this.form.captchaId = this.captchaUuid;

      // 加密
      const loginData = {
        username: plainUsername,
        password: encryptedPassword,
        captchaId: this.form.captchaId
      };

      Api.user.login(
        loginData,
        ({ data }) => {
          showSuccess(this.$t('login.loginSuccess'));
          this.$store.commit("setToken", JSON.stringify(data.data));
          goToPage("/home");
        },
        (err) => {
          // 直接使用后端返回的国际化消息
          let errorMessage = err.data.msg || "登录失败";

          showDanger(errorMessage);
          if (
            err.data != null &&
            err.data.msg != null &&
            err.data.msg.indexOf("图形验证码") > -1 || err.data.msg.indexOf("Captcha") > -1
          ) {
            this.fetchCaptcha();
          }
        }
      );

      // 重新获取验证码
      setTimeout(() => {
        this.fetchCaptcha();
      }, 1000);
    },

    goToRegister() {
      goToPage("/register");
    },
    goToForgetPassword() {
      goToPage("/retrieve-password");
    }
  },
};
</script>
<style lang="scss" scoped>
@import "./auth-modern.scss";

</style>

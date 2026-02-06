<template>
  <div class="welcome" @keyup.enter="register">
    <!-- Centered header with logo -->
    <div class="auth-header">
      <img loading="lazy" alt="" src="@/assets/xiaozhi-logo.png" style="width: 48px; height: 48px;" />
      <img loading="lazy" alt="" :src="xiaozhiAiIcon" style="height: 22px;" />
    </div>

    <!-- Centered register card -->
    <div class="login-box">
      <!-- Title section -->
      <div style="text-align: center; margin-bottom: 40px;">
        <div class="login-text">{{ $t('register.title') }}</div>
        <div class="login-welcome">{{ $t('register.welcome') }}</div>
      </div>

      <!-- Form fields -->
      <div>
        <form @submit.prevent="register">
          <!-- Username input (non-mobile registration) -->
          <div class="input-box" v-if="!enableMobileRegister">
            <img loading="lazy" alt="" class="input-icon" src="@/assets/login/username.png" />
            <el-input v-model="form.username" :placeholder="$t('register.usernamePlaceholder')" />
          </div>

          <!-- Mobile registration -->
          <template v-if="enableMobileRegister">
            <div class="input-box">
              <div style="display: flex; align-items: center; width: 100%;">
                <el-select v-model="form.areaCode" style="width: 220px; margin-right: 10px;">
                  <el-option v-for="item in mobileAreaList" :key="item.key" :label="`${item.name} (${item.key})`"
                    :value="item.key" />
                </el-select>
                <el-input v-model="form.mobile" :placeholder="$t('register.mobilePlaceholder')" />
              </div>
            </div>

            <!-- Image captcha -->
            <div style="display: flex; align-items: center; margin-top: 24px; width: 100%; gap: 10px;">
              <div class="input-box" style="width: calc(100% - 160px); margin-top: 0;">
                <img loading="lazy" alt="" class="input-icon" src="@/assets/login/shield.png" />
                <el-input v-model="form.captcha" :placeholder="$t('register.captchaPlaceholder')"
                  style="flex: 1;" />
              </div>
              <img loading="lazy" v-if="captchaUrl" :src="captchaUrl" alt="验证码"
                style="width: 150px; height: 56px; cursor: pointer; border-radius: 12px; border: 2px solid #e2e8f0;"
                @click="fetchCaptcha" />
            </div>

            <!-- Mobile verification code -->
            <div style="display: flex; align-items: center; margin-top: 24px; width: 100%; gap: 10px;">
              <div class="input-box" style="width: calc(100% - 130px); margin-top: 0;">
                <img loading="lazy" alt="" class="input-icon" src="@/assets/login/phone.png" />
                <el-input v-model="form.mobileCaptcha" :placeholder="$t('register.mobileCaptchaPlaceholder')"
                  style="flex: 1;" maxlength="6" />
              </div>
              <el-button type="primary" class="send-captcha-btn" :disabled="!canSendMobileCaptcha"
                @click="sendMobileCaptcha">
                <span>
                  {{ countdown > 0 ? `${countdown}${$t('register.secondsLater')}` : $t('register.sendCaptcha') }}
                </span>
              </el-button>
            </div>
          </template>

          <!-- Password -->
          <div class="input-box">
            <img loading="lazy" alt="" class="input-icon" src="@/assets/login/password.png" />
            <el-input v-model="form.password" :placeholder="$t('register.passwordPlaceholder')" type="password"
              show-password />
          </div>

          <!-- Confirm password -->
          <div class="input-box">
            <img loading="lazy" alt="" class="input-icon" src="@/assets/login/password.png" />
            <el-input v-model="form.confirmPassword" :placeholder="$t('register.confirmPasswordPlaceholder')"
              type="password" show-password />
          </div>

          <!-- Image captcha (non-mobile registration) -->
          <div v-if="!enableMobileRegister"
            style="display: flex; align-items: center; margin-top: 24px; width: 100%; gap: 10px;">
            <div class="input-box" style="width: calc(100% - 160px); margin-top: 0;">
              <img loading="lazy" alt="" class="input-icon" src="@/assets/login/shield.png" />
              <el-input v-model="form.captcha" :placeholder="$t('register.captchaPlaceholder')" style="flex: 1;" />
            </div>
            <img loading="lazy" v-if="captchaUrl" :src="captchaUrl" alt="验证码"
              style="width: 150px; height: 56px; cursor: pointer; border-radius: 12px; border: 2px solid #e2e8f0;"
              @click="fetchCaptcha" />
          </div>

          <!-- Link to login -->
          <div style="font-weight: 500; font-size: 14px; margin-top: 20px;">
            <div style="cursor: pointer; color: #8b5cf6; transition: color 0.3s;" @click="goToLogin"
              @mouseenter="$event.target.style.color='#7c3aed'"
              @mouseleave="$event.target.style.color='#8b5cf6'">
              {{ $t('register.goToLogin') }}
            </div>
          </div>
        </form>
      </div>

      <!-- Register button -->
      <div class="login-btn" @click="register">{{ $t('register.registerButton') }}</div>

      <!-- Terms -->
      <div style="font-size: 13px; color: #64748b; text-align: center; line-height: 1.6;">
        {{ $t('register.agreeTo') }}
        <span style="color: #8b5cf6; cursor: pointer; font-weight: 500;">{{ $t('register.userAgreement') }}</span>
        {{ $t('login.and') }}
        <span style="color: #8b5cf6; cursor: pointer; font-weight: 500;">{{ $t('register.privacyPolicy') }}</span>
      </div>
    </div>

  </div>
</template>

<script>
import Api from '@/apis/api';
import { getUUID, goToPage, showDanger, showSuccess, sm2Encrypt, validateMobile } from '@/utils';
import { mapState } from 'vuex';
import i18n from '@/i18n';

// 导入语言切换功能

export default {
  name: 'register',
  components: {},
  computed: {
    ...mapState({
      allowUserRegister: state => state.pubConfig.allowUserRegister,
      enableMobileRegister: state => state.pubConfig.enableMobileRegister,
      mobileAreaList: state => state.pubConfig.mobileAreaList,
      sm2PublicKey: state => state.pubConfig.sm2PublicKey,
    }),
    // 获取当前语言
    currentLanguage() {
      return i18n.locale || "zh_CN";
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
    canSendMobileCaptcha() {
      return this.countdown === 0 && validateMobile(this.form.mobile, this.form.areaCode);
    }
  },
  data() {
    return {
      form: {
        username: '',
        password: '',
        confirmPassword: '',
        captcha: '',
        captchaId: '',
        areaCode: '+86',
        mobile: '',
        mobileCaptcha: ''
      },
      captchaUrl: '',
      countdown: 0,
      timer: null,
    }
  },
  mounted() {
    this.$store.dispatch('fetchPubConfig').then(() => {
      if (!this.allowUserRegister) {
        showDanger(this.$t('register.notAllowRegister'));
        setTimeout(() => {
          goToPage('/login');
        }, 1500);
      }
    });
    this.fetchCaptcha();
  },
  methods: {
    // 复用验证码获取方法
    fetchCaptcha() {
      this.form.captchaId = getUUID();
      Api.user.getCaptcha(this.form.captchaId, (res) => {
        if (res.status === 200) {
          const blob = new Blob([res.data], { type: res.data.type });
          this.captchaUrl = URL.createObjectURL(blob);

        } else {
          console.error('验证码加载异常:', error);
          showDanger(this.$t('register.captchaLoadFailed'));
        }
      });
    },

    // 封装输入验证逻辑
    validateInput(input, message) {
      if (!input.trim()) {
        showDanger(message);
        return false;
      }
      return true;
    },

    // 发送手机验证码
    sendMobileCaptcha() {
      if (!validateMobile(this.form.mobile, this.form.areaCode)) {
        showDanger(this.$t('register.inputCorrectMobile'));
        return;
      }

      // 验证图形验证码
      if (!this.validateInput(this.form.captcha, this.$t('register.inputCaptcha'))) {
        this.fetchCaptcha();
        return;
      }

      // 清除可能存在的旧定时器
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }

      // 开始倒计时
      this.countdown = 60;
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          clearInterval(this.timer);
          this.timer = null;
        }
      }, 1000);

      // 调用发送验证码接口
      Api.user.sendSmsVerification({
        phone: this.form.areaCode + this.form.mobile,
        captcha: this.form.captcha,
        captchaId: this.form.captchaId
      }, (res) => {
        showSuccess(this.$t('register.captchaSendSuccess'));
      }, (err) => {
        showDanger(err.data.msg || this.$t('register.captchaSendFailed'));
        this.countdown = 0;
        this.fetchCaptcha();
      });
    },

    // 注册逻辑
    async register() {
      if (this.enableMobileRegister) {
        // 手机号注册验证
        if (!validateMobile(this.form.mobile, this.form.areaCode)) {
          showDanger(this.$t('register.inputCorrectMobile'));
          return;
        }
        if (!this.form.mobileCaptcha) {
          showDanger(this.$t('register.requiredMobileCaptcha'));
          return;
        }
      } else {
        // 用户名注册验证
        if (!this.validateInput(this.form.username, this.$t('register.requiredUsername'))) {
          return;
        }
      }

      // 验证密码
      if (!this.validateInput(this.form.password, this.$t('register.requiredPassword'))) {
        return;
      }
      if (this.form.password !== this.form.confirmPassword) {
        showDanger(this.$t('register.passwordsNotMatch'))
        return
      }
      // 验证验证码
      if (!this.validateInput(this.form.captcha, this.$t('register.requiredCaptcha'))) {
        return;
      }
      // 加密
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

      let plainUsername;
      if (this.enableMobileRegister) {
        plainUsername = this.form.areaCode + this.form.mobile;
      } else {
        plainUsername = this.form.username;
      }

      // 准备注册数据
      const registerData = {
        username: plainUsername,
        password: encryptedPassword,
        captchaId: this.form.captchaId,
        mobileCaptcha: this.form.mobileCaptcha
      };

      Api.user.register(registerData, ({ data }) => {
        showSuccess(this.$t('register.registerSuccess'))
        goToPage('/login')
      }, (err) => {
        showDanger(err.data.msg || this.$t('register.registerFailed'))
        if (err.data != null && err.data.msg != null && err.data.msg.indexOf('图形验证码') > -1) {
          this.fetchCaptcha()
        }
      })
    },

    goToLogin() {
      goToPage('/login')
    }
  },
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
</script>

<style lang="scss" scoped>
@import './auth-modern.scss';

</style>

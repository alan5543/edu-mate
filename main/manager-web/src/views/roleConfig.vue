<template>
  <div class="role-config-page">
    <!-- Hero Banner Card -->
    <div class="hero-banner">
      <div class="banner-content">
        <button class="back-btn" @click="goToHome">
          <i class="el-icon-arrow-left"></i>
        </button>
        <div class="agent-avatar" :style="{ background: getAvatarGradient(form.agentName) }">
          {{ getAvatarChar(form.agentName) }}
        </div>
        <div class="agent-info">
          <h1 class="agent-name">{{ form.agentName || $t("roleConfig.title") }}</h1>
          <div class="restart-notice">
            <i class="el-icon-warning-outline"></i>
            <span>{{ $t("roleConfig.restartNotice") }}</span>
          </div>
        </div>
        <div class="banner-actions">
          <el-button class="action-btn reset-btn" plain @click="resetConfig">
            <i class="el-icon-refresh-left"></i>
            <span class="btn-text">{{ $t("roleConfig.reset") }}</span>
          </el-button>
          <el-button type="primary" class="action-btn save-btn" @click="saveConfig">
            <i class="el-icon-check"></i>
            <span class="btn-text">{{ $t("roleConfig.saveConfig") }}</span>
          </el-button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <el-form ref="form" :model="form" label-position="left" label-width="140px" class="config-form">
        
        <!-- Two Column Grid -->
        <div class="config-grid">
          
          <!-- Left Column -->
          <div class="config-column">
            
            <!-- Card 1: Identity & Personality -->
            <div class="config-card">
              <div class="card-header">
                <div class="card-icon identity-icon">
                  <i class="el-icon-user"></i>
                </div>
                <div class="card-title-group">
                  <h3>{{ $t('roleConfig.basicInfo') }}</h3>
                  <p>{{ $t('roleConfig.basicInfoDesc') }}</p>
                </div>
              </div>
              <div class="card-body">
                <!-- Inline Agent Name -->
                <div class="form-row inline">
                  <label class="form-label">{{ $t('roleConfig.agentName') }}</label>
                  <el-input v-model="form.agentName" maxlength="10" show-word-limit class="form-input" />
                </div>

                <!-- Templates -->
                <div class="form-row">
                  <label class="form-label">{{ $t('roleConfig.roleTemplate') }}</label>
                  <div class="template-section">
                    <div class="template-hint">
                      <i class="el-icon-magic-stick"></i>
                      <span>{{ $t('roleConfig.templateDesc') }}</span>
                    </div>
                    <div class="template-chips">
                      <div
                        v-for="(template, index) in templates"
                        :key="`template-${index}`"
                        class="template-chip"
                        :class="{ 'template-loading': loadingTemplate }"
                        @click="selectTemplate(template)"
                      >
                        {{ template.agentName }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- System Prompt -->
                <div class="form-row">
                  <label class="form-label">{{ $t('roleConfig.roleIntroduction') }}</label>
                  <el-input
                    type="textarea"
                    :rows="8"
                    resize="vertical"
                    :placeholder="$t('roleConfig.pleaseEnterContent')"
                    v-model="form.systemPrompt"
                    maxlength="2000"
                    show-word-limit
                  />
                </div>
              </div>
            </div>

            <!-- Card 2: Memory & Context -->
            <div class="config-card">
              <div class="card-header">
                <div class="card-icon memory-icon">
                  <i class="el-icon-document-copy"></i>
                </div>
                <div class="card-title-group">
                  <h3>{{ $t('roleConfig.memory') }}</h3>
                  <p>{{ $t('roleConfig.contextProvider') }}</p>
                </div>
              </div>
              <div class="card-body">
                <!-- Memory Mode Inline -->
                <div class="form-row inline">
                  <label class="form-label">{{ $t('roleConfig.memory') }}</label>
                  <el-select
                    v-model="form.model.memModelId"
                    filterable
                    class="form-input"
                    @change="handleModelChange('Memory', $event)"
                  >
                    <el-option
                      v-for="(item, index) in modelOptions['Memory']"
                      v-if="!item.isHidden"
                      :key="`mem-${index}`"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>

                <!-- Chat History Config -->
                <div class="form-row inline" v-if="form.model.memModelId !== 'Memory_nomem'">
                  <label class="form-label">{{ $t('roleConfig.reportText') }}</label>
                  <el-radio-group v-model="form.chatHistoryConf" size="small" @change="updateChatHistoryConf">
                    <el-radio-button :label="1">{{ $t("roleConfig.reportText") }}</el-radio-button>
                    <el-radio-button :label="2">{{ $t("roleConfig.reportTextVoice") }}</el-radio-button>
                  </el-radio-group>
                </div>

                <!-- Context Providers -->
                <div class="form-row">
                  <label class="form-label">{{ $t('roleConfig.contextProvider') }}</label>
                  <div class="context-box">
                    <div class="context-info">
                      <span class="count-badge">{{ currentContextProviders.length }}</span>
                      <span>{{ $t('roleConfig.contextProviderSuccess', { count: currentContextProviders.length }) }}</span>
                    </div>
                    <el-button type="text" @click="openContextProviderDialog">
                      {{ $t('roleConfig.editContextProvider') }} <i class="el-icon-arrow-right"></i>
                    </el-button>
                  </div>
                </div>

                <a href="https://github.com/xinnan-tech/xiaozhi-esp32-server/blob/main/docs/context-provider-integration.md" target="_blank" class="doc-link">
                  <i class="el-icon-document"></i> {{ $t('roleConfig.contextProviderDocLink') }}
                </a>

                <!-- Memory Summary -->
                <div class="form-row" v-if="form.model.memModelId === 'Memory_mem_local_short'">
                  <label class="form-label">{{ $t('roleConfig.memoryHis') }}</label>
                  <el-input
                    type="textarea"
                    :rows="3"
                    resize="none"
                    v-model="form.summaryMemory"
                    maxlength="2000"
                    show-word-limit
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div class="config-column">
            
            <!-- Card 3: Voice & Audio -->
            <div class="config-card">
              <div class="card-header">
                <div class="card-icon voice-icon">
                  <i class="el-icon-microphone"></i>
                </div>
                <div class="card-title-group">
                  <h3>{{ $t('roleConfig.voiceType') }}</h3>
                  <p>{{ $t('roleConfig.tts') }} & {{ $t('roleConfig.asr') }}</p>
                </div>
              </div>
              <div class="card-body">
                <!-- VAD Inline -->
                <div class="form-row inline" v-if="featureStatus.vad">
                  <label class="form-label">{{ $t('roleConfig.vad') }}</label>
                  <el-select
                    v-model="form.model.vadModelId"
                    filterable
                    :placeholder="$t('roleConfig.pleaseSelect')"
                    class="form-input"
                    @change="handleModelChange('VAD', $event)"
                  >
                    <el-option
                      v-for="(item, index) in modelOptions['VAD']"
                      :key="`vad-${index}`"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>

                <!-- ASR Inline -->
                <div class="form-row inline" v-if="featureStatus.asr">
                  <label class="form-label">{{ $t('roleConfig.asr') }}</label>
                  <el-select
                    v-model="form.model.asrModelId"
                    filterable
                    :placeholder="$t('roleConfig.pleaseSelect')"
                    class="form-input"
                    @change="handleModelChange('ASR', $event)"
                  >
                    <el-option
                      v-for="(item, index) in modelOptions['ASR']"
                      :key="`asr-${index}`"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>

                <!-- TTS Model Inline -->
                <div class="form-row inline">
                  <label class="form-label">{{ $t('roleConfig.tts') }}</label>
                  <el-select
                    v-model="form.model.ttsModelId"
                    filterable
                    :placeholder="$t('roleConfig.pleaseSelect')"
                    class="form-input"
                    @change="handleModelChange('TTS', $event)"
                  >
                    <el-option
                      v-for="(item, index) in modelOptions['TTS']"
                      :key="`tts-model-${index}`"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>

                <!-- Voice Type Inline -->
                <div class="form-row inline">
                  <label class="form-label">{{ $t('roleConfig.voiceType') }}</label>
                  <el-select
                    v-model="form.ttsVoiceId"
                    filterable
                    :placeholder="$t('roleConfig.pleaseSelect')"
                    class="form-input"
                  >
                    <el-option
                      v-for="(item, index) in voiceOptions"
                      :key="`voice-${index}`"
                      :label="item.label"
                      :value="item.value"
                    >
                      <div class="voice-option">
                        <span>{{ item.label }}</span>
                        <el-button
                          v-if="hasAudioPreview(item)"
                          type="text"
                          :icon="playingVoice && currentPlayingVoiceId === item.value && !isPaused ? 'el-icon-video-pause' : 'el-icon-video-play'"
                          @click.stop="toggleAudioPlayback(item.value)"
                          class="play-btn"
                        />
                      </div>
                    </el-option>
                  </el-select>
                </div>
              </div>
            </div>

            <!-- Card 4: AI Models -->
            <div class="config-card">
              <div class="card-header">
                <div class="card-icon ai-icon">
                  <i class="el-icon-cpu"></i>
                </div>
                <div class="card-title-group">
                  <h3>{{ $t('roleConfig.modelConfig') }}</h3>
                  <p>{{ $t('roleConfig.modelConfigDesc') }}</p>
                </div>
              </div>
              <div class="card-body">
                <!-- LLM Inline -->
                <div class="form-row inline">
                  <label class="form-label">{{ $t('roleConfig.llm') }}</label>
                  <el-select
                    v-model="form.model.llmModelId"
                    filterable
                    class="form-input"
                    @change="handleModelChange('LLM', $event)"
                  >
                    <el-option
                      v-for="(item, index) in modelOptions['LLM']"
                      v-if="!item.isHidden"
                      :key="`llm-${index}`"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>

                <!-- VLLM Inline -->
                <div class="form-row inline">
                  <label class="form-label">{{ $t('roleConfig.vllm') }}</label>
                  <el-select
                    v-model="form.model.vllmModelId"
                    filterable
                    class="form-input"
                    @change="handleModelChange('VLLM', $event)"
                  >
                    <el-option
                      v-for="(item, index) in modelOptions['VLLM']"
                      v-if="!item.isHidden"
                      :key="`vllm-${index}`"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>

                <!-- Intent Inline -->
                <div class="form-row inline">
                  <label class="form-label">{{ $t('roleConfig.intent') }}</label>
                  <el-select
                    v-model="form.model.intentModelId"
                    filterable
                    class="form-input"
                    @change="handleModelChange('Intent', $event)"
                  >
                    <el-option
                      v-for="(item, index) in modelOptions['Intent']"
                      v-if="!item.isHidden"
                      :key="`intent-${index}`"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </div>

                <!-- Function Calling Config -->
                <div v-if="showFunctionIcons('Intent')" class="function-config">
                  <div class="func-chips">
                    <el-tooltip
                      v-for="func in currentFunctions"
                      :key="func.name"
                      effect="dark"
                      placement="top"
                    >
                      <div slot="content">{{ func.name }}</div>
                      <div class="func-dot">{{ getFunctionDisplayChar(func.name) }}</div>
                    </el-tooltip>
                  </div>
                  <el-button size="small" plain class="edit-func-btn" @click="openFunctionDialog">
                    <i class="el-icon-edit"></i>
                    {{ $t("roleConfig.editFunctions") }}
                  </el-button>
                </div>
              </div>
            </div>

          </div>
        </div>

      </el-form>
    </div>

    <!-- Dialogs -->
    <function-dialog
      v-model="showFunctionDialog"
      :functions="currentFunctions"
      :all-functions="allFunctions"
      :agent-id="$route.query.agentId"
      @update-functions="handleUpdateFunctions"
      @dialog-closed="handleDialogClosed"
    />
    <context-provider-dialog
      :visible.sync="showContextProviderDialog"
      :providers="currentContextProviders"
      @confirm="handleUpdateContext"
    />
  </div>
</template>

<script>
import Api from "@/apis/api";
import { getServiceUrl } from "@/apis/api";
import RequestService from "@/apis/httpRequest";
import FunctionDialog from "@/components/FunctionDialog.vue";
import ContextProviderDialog from "@/components/ContextProviderDialog.vue";
import i18n from "@/i18n";
import featureManager from "@/utils/featureManager";

export default {
  name: "RoleConfigPage",
  components: { FunctionDialog, ContextProviderDialog },
  data() {
    return {
      showContextProviderDialog: false,
      form: {
        agentCode: "",
        agentName: "",
        ttsVoiceId: "",
        chatHistoryConf: 0,
        systemPrompt: "",
        summaryMemory: "",
        langCode: "",
        language: "",
        sort: "",
        model: {
          ttsModelId: "",
          vadModelId: "",
          asrModelId: "",
          llmModelId: "",
          vllmModelId: "",
          memModelId: "",
          intentModelId: "",
        },
      },
      models: [
        { label: this.$t("roleConfig.vad"), key: "vadModelId", type: "VAD" },
        { label: this.$t("roleConfig.asr"), key: "asrModelId", type: "ASR" },
        { label: this.$t("roleConfig.llm"), key: "llmModelId", type: "LLM" },
        { label: this.$t("roleConfig.vllm"), key: "vllmModelId", type: "VLLM" },
        { label: this.$t("roleConfig.intent"), key: "intentModelId", type: "Intent" },
        { label: this.$t("roleConfig.memory"), key: "memModelId", type: "Memory" },
        { label: this.$t("roleConfig.tts"), key: "ttsModelId", type: "TTS" },
      ],
      llmModeTypeMap: new Map(),
      modelOptions: {},
      templates: [],
      loadingTemplate: false,
      voiceOptions: [],
      voiceDetails: {},
      showFunctionDialog: false,
      currentFunctions: [],
      currentContextProviders: [],
      allFunctions: [],
      originalFunctions: [],
      playingVoice: false,
      isPaused: false,
      currentAudio: null,
      currentPlayingVoiceId: null,
      featureStatus: {
        vad: false,
        asr: false,
      },
    };
  },
  watch: {
    "form.model.ttsModelId": {
      handler(newVal, oldVal) {
        if (oldVal && newVal !== oldVal) {
          this.form.ttsVoiceId = "";
          this.fetchVoiceOptions(newVal);
        } else {
          this.fetchVoiceOptions(newVal);
        }
      },
      immediate: true,
    },
    voiceOptions: {
      handler(newVal) {
        if (newVal && newVal.length > 0 && !this.form.ttsVoiceId) {
          this.form.ttsVoiceId = newVal[0].value;
        }
      },
      immediate: true,
    },
  },
  async mounted() {
    const agentId = this.$route.query.agentId;
    if (agentId) {
      this.fetchAgentConfig(agentId);
      this.fetchAllFunctions();
    }
    this.fetchModelOptions();
    this.fetchTemplates();
    await this.loadFeatureStatus();
  },
  methods: {
    getAvatarGradient(name) {
      const colors = [
        ['#667eea', '#764ba2'],
        ['#f093fb', '#f5576c'],
        ['#4facfe', '#00f2fe'],
        ['#43e97b', '#38f9d7'],
        ['#fa709a', '#fee140'],
        ['#a8edea', '#fed6e3'],
        ['#ff9a9e', '#fecfef'],
      ];
      const hash = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const [c1, c2] = colors[hash % colors.length];
      return `linear-gradient(135deg, ${c1}, ${c2})`;
    },
    getAvatarChar(name) {
      if (!name) return '?';
      for (let i = 0; i < name.length; i++) {
        const char = name[i];
        if (/[\u4e00-\u9fa5a-zA-Z0-9]/.test(char)) {
          return char.toUpperCase();
        }
      }
      return name.charAt(0).toUpperCase();
    },
    goToHome() {
      this.$router.push("/home");
    },
    saveConfig() {
      const configData = {
        agentCode: this.form.agentCode,
        agentName: this.form.agentName,
        asrModelId: this.form.model.asrModelId,
        vadModelId: this.form.model.vadModelId,
        llmModelId: this.form.model.llmModelId,
        vllmModelId: this.form.model.vllmModelId,
        ttsModelId: this.form.model.ttsModelId,
        ttsVoiceId: this.form.ttsVoiceId,
        chatHistoryConf: this.form.chatHistoryConf,
        memModelId: this.form.model.memModelId,
        intentModelId: this.form.model.intentModelId,
        systemPrompt: this.form.systemPrompt,
        summaryMemory: this.form.summaryMemory,
        langCode: this.form.langCode,
        language: this.form.language,
        sort: this.form.sort,
        functions: this.currentFunctions.map((item) => {
          return {
            pluginId: item.id,
            paramInfo: item.params,
          };
        }),
        contextProviders: this.currentContextProviders,
      };
      Api.agent.updateAgentConfig(this.$route.query.agentId, configData, ({ data }) => {
        if (data.code === 0) {
          this.$message.success({
            message: i18n.t("roleConfig.saveSuccess"),
            showClose: true,
          });
        } else {
          this.$message.error({
            message: data.msg || i18n.t("roleConfig.saveFailed"),
            showClose: true,
          });
        }
      });
    },
    resetConfig() {
      this.$confirm(i18n.t("roleConfig.confirmReset"), i18n.t("message.info"), {
        confirmButtonText: i18n.t("button.ok"),
        cancelButtonText: i18n.t("button.cancel"),
        type: "warning",
      })
        .then(() => {
          this.form = {
            agentCode: "",
            agentName: "",
            ttsVoiceId: "",
            chatHistoryConf: 0,
            systemPrompt: "",
            summaryMemory: "",
            langCode: "",
            language: "",
            sort: "",
            model: {
              ttsModelId: "",
              vadModelId: "",
              asrModelId: "",
              llmModelId: "",
              vllmModelId: "",
              memModelId: "",
              intentModelId: "",
            },
          };
          this.currentFunctions = [];
          this.$message.success({
            message: i18n.t("roleConfig.resetSuccess"),
            showClose: true,
          });
        })
        .catch(() => {});
    },
    fetchTemplates() {
      Api.agent.getAgentTemplate(({ data }) => {
        if (data.code === 0) {
          this.templates = data.data;
        } else {
          this.$message.error(data.msg || i18n.t("roleConfig.fetchTemplatesFailed"));
        }
      });
    },
    selectTemplate(template) {
      if (this.loadingTemplate) return;
      this.loadingTemplate = true;
      try {
        this.applyTemplateData(template);
        this.$message.success({
          message: `${template.agentName}${i18n.t("roleConfig.templateApplied")}`,
          showClose: true,
        });
      } catch (error) {
        this.$message.error({
          message: i18n.t("roleConfig.applyTemplateFailed"),
          showClose: true,
        });
        console.error("应用模板失败:", error);
      } finally {
        this.loadingTemplate = false;
      }
    },
    applyTemplateData(templateData) {
      this.form = {
        ...this.form,
        agentName: templateData.agentName || this.form.agentName,
        ttsVoiceId: templateData.ttsVoiceId || this.form.ttsVoiceId,
        chatHistoryConf: templateData.chatHistoryConf || this.form.chatHistoryConf,
        systemPrompt: templateData.systemPrompt || this.form.systemPrompt,
        summaryMemory: templateData.summaryMemory || this.form.summaryMemory,
        langCode: templateData.langCode || this.form.langCode,
        model: {
          ttsModelId: templateData.ttsModelId || this.form.model.ttsModelId,
          vadModelId: templateData.vadModelId || this.form.model.vadModelId,
          asrModelId: templateData.asrModelId || this.form.model.asrModelId,
          llmModelId: templateData.llmModelId || this.form.model.llmModelId,
          vllmModelId: templateData.vllmModelId || this.form.model.vllmModelId,
          memModelId: templateData.memModelId || this.form.model.memModelId,
          intentModelId: templateData.intentModelId || this.form.model.intentModelId,
        },
      };
    },
    fetchAgentConfig(agentId) {
      Api.agent.getDeviceConfig(agentId, ({ data }) => {
        if (data.code === 0) {
          this.form = {
            ...this.form,
            ...data.data,
            model: {
              ttsModelId: data.data.ttsModelId,
              vadModelId: data.data.vadModelId,
              asrModelId: data.data.asrModelId,
              llmModelId: data.data.llmModelId,
              vllmModelId: data.data.vllmModelId,
              memModelId: data.data.memModelId,
              intentModelId: data.data.intentModelId,
            },
          };
          const savedMappings = data.data.functions || [];
          this.currentContextProviders = data.data.contextProviders || [];

          const ensureFuncs = this.allFunctions.length
            ? Promise.resolve()
            : this.fetchAllFunctions();

          ensureFuncs.then(() => {
            this.currentFunctions = savedMappings.map((mapping) => {
              const meta = this.allFunctions.find((f) => f.id === mapping.pluginId);
              if (!meta) {
                return { id: mapping.pluginId, name: mapping.pluginId, params: {} };
              }
              return {
                id: mapping.pluginId,
                name: meta.name,
                params: mapping.paramInfo || { ...meta.params },
                fieldsMeta: meta.fieldsMeta,
              };
            });
            this.originalFunctions = JSON.parse(JSON.stringify(this.currentFunctions));
            this.updateIntentOptionsVisibility();
          });
        } else {
          this.$message.error(data.msg || i18n.t("roleConfig.fetchConfigFailed"));
        }
      });
    },
    fetchModelOptions() {
      this.models.forEach((model) => {
        if (model.type != "LLM") {
          Api.model.getModelNames(model.type, "", ({ data }) => {
            if (data.code === 0) {
              this.$set(
                this.modelOptions,
                model.type,
                data.data.map((item) => ({
                  value: item.id,
                  label: item.modelName,
                  isHidden: false,
                }))
              );
              if (model.type === "Intent") {
                this.updateIntentOptionsVisibility();
              }
            } else {
              this.$message.error(data.msg || i18n.t("roleConfig.fetchModelsFailed"));
            }
          });
        } else {
          Api.model.getLlmModelCodeList("", ({ data }) => {
            if (data.code === 0) {
              let LLMdata = [];
              data.data.forEach((item) => {
                LLMdata.push({
                  value: item.id,
                  label: item.modelName,
                  isHidden: false,
                });
                this.llmModeTypeMap.set(item.id, item.type);
              });
              this.$set(this.modelOptions, model.type, LLMdata);
            } else {
              this.$message.error(data.msg || "获取LLM模型列表失败");
            }
          });
        }
      });
    },
    fetchVoiceOptions(modelId) {
      if (!modelId) {
        this.voiceOptions = [];
        this.voiceDetails = {};
        return;
      }
      Api.model.getModelVoices(modelId, "", ({ data }) => {
        if (data.code === 0 && data.data) {
          this.voiceOptions = data.data.map((voice) => ({
            value: voice.id,
            label: voice.name,
            voiceDemo: voice.voiceDemo,
            voice_demo: voice.voice_demo,
            isClone: Boolean(voice.isClone),
            train_status: voice.trainStatus,
          }));
          this.voiceDetails = data.data.reduce((acc, voice) => {
            acc[voice.id] = voice;
            return acc;
          }, {});
        } else {
          this.voiceOptions = [];
          this.voiceDetails = {};
        }
      });
    },
    getFunctionDisplayChar(name) {
      if (!name || name.length === 0) return "";
      for (let i = 0; i < name.length; i++) {
        const char = name[i];
        if (/[\u4e00-\u9fa5a-zA-Z0-9]/.test(char)) {
          return char;
        }
      }
      return name.charAt(0);
    },
    showFunctionIcons(type) {
      return type === "Intent" && this.form.model.intentModelId !== "Intent_nointent";
    },
    handleModelChange(type, value) {
      if (type === "Intent" && value !== "Intent_nointent") {
        this.fetchAllFunctions();
      }
      if (type === "Memory") {
        if (value === "Memory_nomem") {
          this.form.chatHistoryConf = 0;
        } else {
          this.form.chatHistoryConf = 2;
        }
      }
      if (type === "LLM") {
        this.updateIntentOptionsVisibility();
      }
    },
    fetchAllFunctions() {
      return new Promise((resolve, reject) => {
        Api.model.getPluginFunctionList(null, ({ data }) => {
          if (data.code === 0) {
            this.allFunctions = data.data.map((item) => {
              const meta = JSON.parse(item.fields || "[]");
              const params = meta.reduce((m, f) => {
                m[f.key] = f.default;
                return m;
              }, {});
              return { ...item, fieldsMeta: meta, params };
            });
            resolve();
          } else {
            this.$message.error(data.msg || i18n.t("roleConfig.fetchPluginsFailed"));
            reject();
          }
        });
      });
    },
    openFunctionDialog() {
      if (this.allFunctions.length === 0) {
        this.fetchAllFunctions().then(() => (this.showFunctionDialog = true));
      } else {
        this.showFunctionDialog = true;
      }
    },
    openContextProviderDialog() {
      this.showContextProviderDialog = true;
    },
    handleUpdateContext(providers) {
      this.currentContextProviders = providers;
    },
    handleUpdateFunctions(selected) {
      this.currentFunctions = selected;
    },
    handleDialogClosed(saved) {
      if (!saved) {
        this.currentFunctions = JSON.parse(JSON.stringify(this.originalFunctions));
      } else {
        this.originalFunctions = JSON.parse(JSON.stringify(this.currentFunctions));
      }
      this.showFunctionDialog = false;
    },
    updateIntentOptionsVisibility() {
      const currentLlmId = this.form.model.llmModelId;
      if (!currentLlmId || !this.modelOptions["Intent"]) return;

      const llmType = this.llmModeTypeMap.get(currentLlmId);
      if (!llmType) return;

      this.modelOptions["Intent"].forEach((item) => {
        if (item.value === "Intent_function_call") {
          if (llmType === "openai" || llmType === "ollama" || llmType === "perplexity") {
            item.isHidden = false;
          } else {
            item.isHidden = true;
          }
        } else {
          item.isHidden = false;
        }
      });

      if (
        this.form.model.intentModelId === "Intent_function_call" &&
        llmType !== "openai" &&
        llmType !== "ollama" &&
        llmType !== "perplexity"
      ) {
        const firstVisibleOption = this.modelOptions["Intent"].find(
          (item) => !item.isHidden
        );
        if (firstVisibleOption) {
          this.form.model.intentModelId = firstVisibleOption.value;
        } else {
          this.form.model.intentModelId = "Intent_nointent";
        }
      }
    },
    hasAudioPreview(item) {
      const isCloneAudio = Boolean(item.isClone);
      const hasValidAudioUrl = !!((item.voice_demo || item.voiceDemo)?.trim());
      return isCloneAudio || hasValidAudioUrl;
    },
    toggleAudioPlayback(voiceId) {
      if (this.playingVoice && this.currentPlayingVoiceId === voiceId) {
        if (this.isPaused) {
          this.currentAudio.play().catch((error) => {
            console.error("恢复播放失败:", error);
            this.$message.warning(this.$t('roleConfig.cannotResumeAudio'));
          });
          this.isPaused = false;
        } else {
          this.currentAudio.pause();
          this.isPaused = true;
        }
        return;
      }
      this.playVoicePreview(voiceId);
    },
    playVoicePreview(voiceId = null) {
      const targetVoiceId = voiceId || this.form.ttsVoiceId;
      if (!targetVoiceId) {
        this.$message.warning(this.$t('roleConfig.selectVoiceFirst'));
        return;
      }

      if (this.currentAudio) {
        this.currentAudio.pause();
        this.currentAudio = null;
      }

      this.isPaused = false;
      this.currentPlayingVoiceId = targetVoiceId;

      try {
        const voiceDetail = this.voiceDetails[targetVoiceId];
        let audioUrl = null;
        let isCloneAudio = false;

        if (voiceDetail) {
          isCloneAudio = Boolean(voiceDetail.isClone);

          if (isCloneAudio && voiceDetail.id) {
            // Clone audio: fetch URL via API
            const getCloneAudioUrl = () => {
              return new Promise((resolve) => {
                RequestService.sendRequest()
                  .url(`${getServiceUrl()}/voiceClone/audio/${voiceDetail.id}`)
                  .method("POST")
                  .success((res) => {
                    if (res.data.code === 0 && res.data.data) {
                      const audioId = res.data.data;
                      const playUrl = `${getServiceUrl()}/voiceClone/play/${audioId}`;
                      resolve(playUrl);
                    } else {
                      resolve(null);
                    }
                  })
                  .networkFail(() => {
                    resolve(null);
                  })
                  .send();
              });
            };

            this.playingVoice = true;
            this.currentAudio = new Audio();
            this.currentAudio.volume = 1.0;

            const timeoutId = setTimeout(() => {
              if (this.currentAudio && this.playingVoice) {
                this.$message.warning(this.$t('roleConfig.audioLoadTimeout'));
                this.playingVoice = false;
              }
            }, 10000);

            this.currentAudio.onerror = () => {
              clearTimeout(timeoutId);
              this.$message.warning(this.$t('roleConfig.cloneAudioPlayFailed'));
              this.playingVoice = false;
            };

            this.currentAudio.onplay = () => {
              clearTimeout(timeoutId);
            };

            this.currentAudio.onended = () => {
              this.playingVoice = false;
              this.currentPlayingVoiceId = null;
            };

            getCloneAudioUrl().then((url) => {
              if (url) {
                this.currentAudio.src = url;
                this.currentAudio.play().catch(() => {
                  clearTimeout(timeoutId);
                  this.$message.warning(this.$t('roleConfig.cannotPlayCloneAudio'));
                  this.playingVoice = false;
                });
              } else {
                clearTimeout(timeoutId);
                this.$message.warning(this.$t('roleConfig.getCloneAudioFailed'));
                this.playingVoice = false;
              }
            });
            return;
          } else {
            audioUrl = voiceDetail.voiceDemo || voiceDetail.voice_demo;
          }

          if (!audioUrl) {
            for (const key in voiceDetail) {
              const value = voiceDetail[key];
              if (
                typeof value === "string" &&
                (value.startsWith("http://") ||
                  value.startsWith("https://") ||
                  value.endsWith(".mp3") ||
                  value.endsWith(".wav") ||
                  value.endsWith(".ogg"))
              ) {
                audioUrl = value;
                break;
              }
            }
          }
        }

        if (!audioUrl) {
          this.$message.warning(this.$t('roleConfig.noPreviewAudio'));
          return;
        }

        // Non-clone audio playback
        this.playingVoice = true;
        this.currentAudio = new Audio();
        this.currentAudio.src = audioUrl;
        this.currentAudio.volume = 1.0;

        const timeoutId = setTimeout(() => {
          if (this.currentAudio && this.playingVoice) {
            this.$message.warning(this.$t('roleConfig.audioLoadTimeout'));
            this.playingVoice = false;
          }
        }, 10000);

        this.currentAudio.onerror = () => {
          clearTimeout(timeoutId);
          this.$message.warning(this.$t('roleConfig.audioPlayFailed'));
          this.playingVoice = false;
        };

        this.currentAudio.onplay = () => {
          clearTimeout(timeoutId);
        };

        this.currentAudio.onended = () => {
          this.playingVoice = false;
          this.currentPlayingVoiceId = null;
        };

        this.currentAudio.play().catch(() => {
          clearTimeout(timeoutId);
          this.$message.warning(this.$t('roleConfig.cannotPlayAudio'));
          this.playingVoice = false;
        });
      } catch (error) {
        console.error("播放音频过程出错:", error);
        this.$message.error(this.$t('roleConfig.audioPlayError'));
        this.playingVoice = false;
      }
    },
    updateChatHistoryConf() {
      if (this.form.model.memModelId === "Memory_nomem") {
        this.form.chatHistoryConf = 0;
      }
    },
    async loadFeatureStatus() {
      try {
        await featureManager.waitForInitialization();
        const config = featureManager.getConfig();
        this.featureStatus.vad = config.vad || false;
        this.featureStatus.asr = config.asr || false;
      } catch (error) {
        console.error("加载功能状态失败:", error);
      }
    },
  },
};
</script>

<style scoped lang="scss">
$primary: #07c160;
$primary-dark: #059652;
$primary-light: #e8f5e9;
$text-primary: #1a1a2e;
$text-secondary: #4a4a68;
$text-muted: #8e8ea9;
$border: #e8e8f0;
$bg-page: #f5f7fb;
$bg-card: #ffffff;

.role-config-page {
  min-height: 100vh;
  background: $bg-page;
  padding-bottom: 60px;
}

// ===== HERO BANNER =====
.hero-banner {
  background: linear-gradient(135deg, #ffffff 0%, #f8fffe 100%);
  border-bottom: 1px solid $border;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.banner-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 2px solid $border;
  background: $bg-card;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;

  &:hover {
    background: $primary-light;
    color: $primary;
    border-color: rgba($primary, 0.3);
    transform: translateX(-2px);
  }
}

.agent-avatar {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.agent-info {
  flex: 1;
  min-width: 0;
  
  .agent-name {
    font-size: 24px;
    font-weight: 700;
    color: $text-primary;
    margin: 0 0 6px 0;
    line-height: 1.2;
  }
}

.restart-notice {
  font-size: 13px;
  color: #e6a23c;
  display: flex;
  align-items: center;
  gap: 6px;
  
  i {
    font-size: 14px;
  }
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.action-btn {
  border-radius: 12px;
  font-weight: 600;
  padding: 12px 20px;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reset-btn {
  border-color: $border;
  color: $text-secondary;
  background: $bg-card;
  
  &:hover {
    border-color: $text-muted;
    background: #f5f5f5;
  }
}

.save-btn {
  background: $primary;
  border-color: $primary;
  box-shadow: 0 4px 12px rgba($primary, 0.25);
  
  &:hover {
    background: $primary-dark;
    border-color: $primary-dark;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba($primary, 0.3);
  }
}

// ===== MAIN CONTENT =====
.main-content {
  max-width: 1200px;
  margin: 28px auto;
  padding: 0 24px;
}

// ===== TWO COLUMN GRID =====
.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}

.config-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

// ===== CONFIG CARDS =====
.config-card {
  background: $bg-card;
  border-radius: 20px;
  border: 2px solid transparent;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  transition: all 0.25s ease;
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    border-color: rgba($primary, 0.1);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #fafbfc 0%, #f5f7fa 100%);
  border-bottom: 1px solid $border;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  
  &.identity-icon {
    background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
    color: $primary;
  }
  
  &.voice-icon {
    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
    color: #1976d2;
  }
  
  &.ai-icon {
    background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
    color: #7b1fa2;
  }
  
  &.memory-icon {
    background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
    color: #f57c00;
  }
}

.card-title-group {
  h3 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 700;
    color: $text-primary;
  }
  
  p {
    margin: 0;
    font-size: 13px;
    color: $text-muted;
  }
}

.card-body {
  padding: 24px;
}

// ===== FORM ROWS =====
.form-row {
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.inline {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .form-label {
      width: 100px;
      flex-shrink: 0;
      margin-bottom: 0;
    }
    
    .form-input,
    .el-select,
    .el-radio-group {
      flex: 1;
    }
  }
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 10px;
}

// ===== INPUTS =====
::v-deep .el-input__inner,
::v-deep .el-textarea__inner {
  border-radius: 12px;
  border: 2px solid $border;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 4px rgba($primary, 0.1);
  }
}

::v-deep .el-select .el-input__inner {
  height: 44px;
}

.form-input {
  width: 100%;
}

// ===== TEMPLATES =====
.template-section {
  width: 100%;
}

.template-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, $primary-light 0%, #f1f8e9 100%);
  border-left: 4px solid $primary;
  border-radius: 8px;
  margin-bottom: 14px;
  font-size: 13px;
  color: $text-secondary;
  
  i {
    color: $primary;
    font-size: 15px;
  }
}

.template-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.template-chip {
  background: #f8f9fc;
  border: 2px solid $border;
  padding: 10px 18px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: $primary-light;
    color: $primary;
    border-color: $primary;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba($primary, 0.15);
  }
  
  &.template-loading {
    opacity: 0.5;
    pointer-events: none;
  }
}

// ===== VOICE OPTIONS =====
.voice-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.play-btn {
  padding: 4px 8px;
  font-size: 18px;
  color: $primary;
  
  &:hover {
    color: $primary-dark;
  }
}

// ===== CONTEXT BOX =====
.context-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(135deg, $primary-light 0%, #f1f8e9 100%);
  border: 1px solid rgba($primary, 0.2);
  border-radius: 12px;
}

.context-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: $text-secondary;
}

.count-badge {
  background: $primary;
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 16px;
  box-shadow: 0 2px 6px rgba($primary, 0.3);
}

.doc-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: $text-muted;
  text-decoration: none;
  margin-top: 12px;
  transition: color 0.2s;
  
  &:hover {
    color: $primary;
  }
}

// ===== FUNCTION CONFIG =====
.function-config {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #f0f2f5 100%);
  padding: 14px 18px;
  border-radius: 12px;
  margin-top: 14px;
}

.func-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.func-dot {
  width: 28px;
  height: 28px;
  background: $primary;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba($primary, 0.3);
}

.edit-func-btn {
  border-radius: 10px;
  font-weight: 500;
  
  i {
    margin-right: 4px;
  }
}

// ===== MEMORY OPTIONS =====
::v-deep .el-radio-button__inner {
  border-radius: 10px;
  border-color: $border;
  font-weight: 500;
  padding: 8px 16px;
}

::v-deep .el-radio-button__orig-radio:checked + .el-radio-button__inner {
  background: $primary;
  border-color: $primary;
  box-shadow: 0 2px 8px rgba($primary, 0.3);
}

// ===== RESPONSIVE =====
@media (max-width: 900px) {
  .config-grid {
    grid-template-columns: 1fr;
  }
  
  .banner-content {
    flex-wrap: wrap;
  }
  
  .agent-info {
    flex: 1 1 calc(100% - 140px);
  }
  
  .banner-actions {
    width: 100%;
    margin-top: 12px;
    
    .action-btn {
      flex: 1;
    }
  }
}

@media (max-width: 640px) {
  .hero-banner {
    padding: 16px;
  }
  
  .banner-content {
    gap: 14px;
  }
  
  .back-btn {
    width: 40px;
    height: 40px;
  }
  
  .agent-avatar {
    width: 52px;
    height: 52px;
    font-size: 22px;
    border-radius: 14px;
  }
  
  .agent-info .agent-name {
    font-size: 20px;
  }
  
  .main-content {
    padding: 0 16px;
    margin: 16px auto;
  }
  
  .config-card {
    border-radius: 16px;
  }
  
  .card-header {
    padding: 16px;
  }
  
  .card-body {
    padding: 16px;
  }
  
  .form-row.inline {
    flex-direction: column;
    align-items: stretch;
    
    .form-label {
      width: 100%;
      margin-bottom: 8px;
    }
  }
  
  .action-btn .btn-text {
    display: none;
  }
  
  .action-btn {
    padding: 12px;
    
    i {
      margin: 0;
    }
  }
}
</style>

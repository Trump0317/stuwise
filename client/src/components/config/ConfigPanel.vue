<script setup lang="ts">
import { ref, onMounted } from "vue";

defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const provider = ref("");
const modelId = ref("");
const hasKey = ref(false);
const saving = ref(false);
const message = ref("");

onMounted(async () => {
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    if (data.ok) {
      hasKey.value = data.data.hasApiKey;
      provider.value = data.data.provider || "";
      modelId.value = data.data.modelId || "";
    }
  } catch { /* ignore */ }
});

async function save() {
  saving.value = true;
  try {
    const body: Record<string, string> = { modelId: modelId.value };
    if (provider.value) body.provider = provider.value;
    if (apiKey.value) body.apiKey = apiKey.value;
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.ok) {
      message.value = "保存成功";
      apiKey.value = "";
    } else {
      message.value = data.error || "保存失败";
    }
  } catch (e) {
    message.value = "网络错误";
  }
  saving.value = false;
}
</script>

<template>
  <div v-if="show" class="modal-backdrop" @click="emit('close')">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>设置</h3>
        <button class="btn-close" @click="emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <label class="field">
          <span class="field-label">API Key</span>
          <input
            v-model="apiKey"
            type="password"
            class="field-input"
            :placeholder="hasKey ? '已设置（输入新 Key 替换）' : '请输入 API Key'"
          />
        </label>
        <label class="field">
          <span class="field-label">Provider</span>
          <input
            v-model="provider"
            type="text"
            class="field-input"
            placeholder="如 deepseek / anthropic"
          />
        </label>
        <label class="field">
          <span class="field-label">模型 ID</span>
          <input
            v-model="modelId"
            type="text"
            class="field-input"
                        placeholder="如 deepseek-v4-flash"
          />
        </label>
        <div v-if="message" class="msg">{{ message }}</div>
      </div>
      <div class="modal-footer">
        <button class="btn-cancel" @click="emit('close')">取消</button>
        <button class="btn-save" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
  overflow: hidden;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 { font-size: 16px; font-weight: 600; color: #333; }

.btn-close {
  border: none; background: transparent;
  font-size: 18px; color: #bbb; cursor: pointer;
  padding: 4px; border-radius: 4px;
}
.btn-close:hover { background: #f5f5f5; color: #666; }

.modal-body {
  padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}

.field {
  display: flex; flex-direction: column; gap: 6px;
}

.field-label {
  font-size: 13px; color: #666; font-weight: 500;
}

.field-input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px; font-family: inherit;
  outline: none;
}
.field-input:focus { border-color: #4f46e5; }

.msg {
  font-size: 13px; color: #22c55e;
  padding: 4px 0;
}

.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff; color: #666;
  font-size: 13px; cursor: pointer;
}
.btn-cancel:hover { background: #f5f5f5; }

.btn-save {
  padding: 8px 20px;
  border: none; border-radius: 8px;
  background: #4f46e5; color: #fff;
  font-size: 13px; cursor: pointer;
}
.btn-save:hover { background: #4338ca; }
.btn-save:disabled { opacity: 0.5; cursor: default; }
</style>

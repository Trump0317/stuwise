<script setup lang="ts">
import { ref, onMounted } from "vue";

const apiKey = ref("");
const modelId = ref("");
const hasApiKey = ref(false);
const showForm = ref(false);
const saving = ref(false);

onMounted(async () => {
  try {
    const res = await fetch("/api/config");
    const cfg = await res.json();
    hasApiKey.value = cfg.hasApiKey;
    modelId.value = cfg.modelId;
    apiKey.value = cfg.hasApiKey ? "••••••••" : "";
  } catch { /* ignore */ }
});

async function saveConfig() {
  saving.value = true;
  try {
    const body: Record<string, string> = {};
    if (apiKey.value && apiKey.value !== "••••••••") {
      body.apiKey = apiKey.value;
    }
    if (modelId.value) {
      body.modelId = modelId.value;
    }

    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.ok) {
      hasApiKey.value = data.config.hasApiKey;
      apiKey.value = data.config.hasApiKey ? "••••••••" : "";
      showForm.value = false;
    }
  } catch { /* ignore */ }
  finally {
    saving.value = false;
  }
}

function clearPlaceholder() {
  if (apiKey.value === "••••••••") apiKey.value = "";
}
</script>

<template>
  <div class="config-panel">
    <button class="config-toggle" @click="showForm = !showForm" title="配置">
      ⚙ {{ hasApiKey ? '已配置' : '未配置' }}
    </button>

    <div v-if="showForm" class="config-form">
      <label>
        API Key
        <input
          v-model="apiKey"
          type="password"
          placeholder="sk-..."
          @focus="clearPlaceholder"
        />
      </label>
      <label>
        模型
        <input v-model="modelId" type="text" placeholder="claude-3-7-sonnet-20250219" />
      </label>
      <div class="config-actions">
        <button class="btn-save" :disabled="saving" @click="saveConfig">
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <button class="btn-cancel" @click="showForm = false">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.config-panel {
  position: relative;
}

.config-toggle {
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  color: #666;
  white-space: nowrap;
}
.config-toggle:hover {
  background: #f5f5f5;
}

.config-form {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  width: 260px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.config-form input {
  padding: 6px 10px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}
.config-form input:focus {
  border-color: #6366f1;
}

.config-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-save {
  padding: 6px 14px;
  background: #4f46e5;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
.btn-save:disabled {
  opacity: 0.6;
  cursor: default;
}
.btn-save:hover:not(:disabled) {
  background: #4338ca;
}

.btn-cancel {
  padding: 6px 14px;
  background: #f3f4f6;
  color: #666;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}
</style>

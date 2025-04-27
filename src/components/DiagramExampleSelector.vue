<!-- DiagramExampleSelector.vue -->
<template>
    <div class="diagram-example-selector">
      <div class="selector-header">
        <h3>Примеры диаграмм Mermaid</h3>
        <p>Выберите тип диаграммы для просмотра примера</p>
      </div>
      
      <div class="selector-content">
        <div class="type-selector">
          <label for="diagram-type">Тип диаграммы:</label>
          <select 
            id="diagram-type" 
            v-model="selectedExampleId"
            @change="onExampleSelected"
          >
            <option 
              v-for="example in examplesList" 
              :key="example.id" 
              :value="example.id"
            >
              {{ example.title }}
            </option>
          </select>
        </div>
        
        <div class="example-details" v-if="currentExample">
          <div class="example-description">
            <h4>{{ currentExample.title }}</h4>
            <p>{{ currentExample.description }}</p>
          </div>
          
          <div class="code-preview">
            <div class="code-preview-header">
              <span>Код Mermaid</span>
              <button @click="applyExample" class="apply-button">Применить этот пример</button>
            </div>
            <pre class="code-block"><code>{{ currentExample.code }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue';
  import { getDiagramExamplesList, getDiagramExample } from '@/DiagramExamples';
  
  const props = defineProps({
    initialExampleId: {
      type: String,
      default: 'flowchart'
    }
  });
  
  const emit = defineEmits(['example-selected']);
  
  // Список всех доступных примеров
  const examplesList = ref([]);
  
  // ID выбранного примера
  const selectedExampleId = ref(props.initialExampleId);
  
  // Текущий выбранный пример
  const currentExample = computed(() => {
    return getDiagramExample(selectedExampleId.value);
  });
  
  // Инициализация при монтировании компонента
  onMounted(() => {
    // Загрузка списка примеров
    examplesList.value = getDiagramExamplesList();
    
    // Выбор начального примера
    if (currentExample.value) {
      emit('example-selected', currentExample.value);
    }
  });
  
  // Обработчик выбора примера
  function onExampleSelected() {
    if (currentExample.value) {
      emit('example-selected', currentExample.value);
    }
  }
  
  // Применение выбранного примера
  function applyExample() {
    emit('example-selected', currentExample.value);
  }
  </script>
  
  <style scoped>
  .diagram-example-selector {
    background-color: #f8f9fa;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  }
  
  .selector-header {
    margin-bottom: 16px;
  }
  
  .selector-header h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: #333;
  }
  
  .selector-header p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
  
  .selector-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .type-selector {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .type-selector label {
    font-weight: 500;
    color: #444;
    min-width: 120px;
  }
  
  .type-selector select {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background-color: white;
    font-size: 14px;
    cursor: pointer;
    outline: none;
  }
  
  .type-selector select:focus {
    border-color: #2196F3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  }
  
  .example-details {
    background-color: white;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 16px;
  }
  
  .example-description {
    margin-bottom: 16px;
  }
  
  .example-description h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #2196F3;
  }
  
  .example-description p {
    margin: 0;
    color: #555;
    font-size: 14px;
    line-height: 1.5;
  }
  
  .code-preview {
    background-color: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .code-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background-color: #eee;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .code-preview-header span {
    font-weight: 500;
    font-size: 14px;
    color: #555;
  }
  
  .apply-button {
    background-color: #2196F3;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .apply-button:hover {
    background-color: #1976D2;
  }
  
  .code-block {
    margin: 0;
    padding: 12px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #333;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-x: auto;
    max-height: 300px;
    overflow-y: auto;
  }
  </style>
<!-- SideMenu.vue -->
<template>
    <div class="side-menu" :class="{ 'open': isOpen }" :style="menuStyle">
      <div class="side-menu-header">
        <h2>Настройки диаграммы</h2>
        <button class="close-button" @click="close">✕</button>
      </div>
      
      <div class="side-menu-content">
        <div class="tab-buttons">
          <button 
            @click="activeTab = 'code'" 
            :class="{ 'active': activeTab === 'code' }"
          >
            Редактор кода
          </button>
          <button 
            @click="activeTab = 'settings'" 
            :class="{ 'active': activeTab === 'settings' }"
          >
            Настройки
          </button>
        </div>
        
        <div class="tab-content">
          <!-- Редактор кода -->
          <div v-if="activeTab === 'code'" class="code-editor-container">
            <textarea 
              class="code-editor" 
              v-model="localDiagramCode" 
              placeholder="Введите код Mermaid диаграммы..."
              spellcheck="false"
            ></textarea>
            <div class="editor-buttons">
              <button @click="applyChanges" class="apply-button">Применить изменения</button>
              <button @click="resetChanges" class="reset-button">Отменить изменения</button>
            </div>
          </div>
          
          <!-- Настройки диаграммы -->
          <div v-if="activeTab === 'settings'" class="settings-container">
            <div class="setting-group">
              <h3>Основные настройки</h3>
              
              <div class="setting-item">
                <label for="theme">Тема:</label>
                <select id="theme" v-model="settings.theme">
                  <option value="default">По умолчанию</option>
                  <option value="forest">Лесная</option>
                  <option value="dark">Темная</option>
                  <option value="neutral">Нейтральная</option>
                </select>
              </div>
              
              <div class="setting-item">
                <label for="background-color">Цвет фона:</label>
                <input type="color" id="background-color" v-model="settings.backgroundColor">
              </div>
              
              <div class="setting-item">
                <label for="font-family">Шрифт:</label>
                <select id="font-family" v-model="settings.fontFamily">
                  <option value="sans-serif">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                  <option value="Arial">Arial</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Tahoma">Tahoma</option>
                </select>
              </div>
              
              <div class="setting-item">
                <label for="font-size">Размер шрифта:</label>
                <input type="range" id="font-size" v-model="settings.fontSize" min="10" max="20" step="1">
                <span>{{ settings.fontSize }}px</span>
              </div>
            </div>
            
            <div class="setting-group">
              <h3>Настройки цветов</h3>
              
              <div class="setting-item">
                <label for="primary-color">Основной цвет:</label>
                <input type="color" id="primary-color" v-model="settings.primaryColor">
              </div>
              
              <div class="setting-item">
                <label for="secondary-color">Вторичный цвет:</label>
                <input type="color" id="secondary-color" v-model="settings.secondaryColor">
              </div>
              
              <div class="setting-item">
                <label for="text-color">Цвет текста:</label>
                <input type="color" id="text-color" v-model="settings.textColor">
              </div>
              
              <div class="setting-item">
                <label for="line-color">Цвет линий:</label>
                <input type="color" id="line-color" v-model="settings.lineColor">
              </div>
            </div>
            
            <div class="setting-group">
              <h3>Дополнительные настройки</h3>
              
              <div class="setting-item checkbox">
                <input type="checkbox" id="use-maxwidth" v-model="settings.useMaxWidth">
                <label for="use-maxwidth">Ограничить максимальную ширину</label>
              </div>
              
              <div class="setting-item checkbox">
                <input type="checkbox" id="enable-animations" v-model="settings.enableAnimations">
                <label for="enable-animations">Включить анимации</label>
              </div>
              
              <div class="setting-item">
                <label for="curve-type">Тип линий:</label>
                <select id="curve-type" v-model="settings.curve">
                  <option value="basis">Сглаженные</option>
                  <option value="linear">Прямые</option>
                  <option value="step">Ступенчатые</option>
                </select>
              </div>
            </div>
            
            <div class="editor-buttons">
              <button @click="applySettings" class="apply-button">Применить настройки</button>
              <button @click="resetSettings" class="reset-button">Сбросить настройки</button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Ресайзер для изменения размера меню -->
      <div 
        class="resizer" 
        @mousedown.prevent="startResize" 
        :class="{ 'resizing': isResizing }"
        title="Перетащите для изменения размера"
      ></div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  
  const props = defineProps({
    isOpen: {
      type: Boolean,
      default: false
    },
    diagramCode: {
      type: String,
      default: ''
    },
    mermaidConfig: {
      type: Object,
      default: () => ({})
    }
  });
  
  const emit = defineEmits(['close', 'update:diagramCode', 'update:mermaidConfig']);
  
  const activeTab = ref('code');
  const localDiagramCode = ref('');
  const defaultSettings = {
    theme: 'default',
    backgroundColor: '#ffffff',
    fontFamily: 'sans-serif',
    fontSize: 14,
    primaryColor: '#1f77b4',
    secondaryColor: '#ff7f0e',
    textColor: '#333333',
    lineColor: '#666666',
    useMaxWidth: true,
    enableAnimations: true,
    curve: 'basis'
  };
  
  // Настройки размера меню
  const menuWidth = ref(400); // Начальная ширина в пикселях
  const isResizing = ref(false);
  const minWidth = 300; // Минимальная ширина
  const maxWidth = 800; // Максимальная ширина
  
  // Вычисляемый стиль для меню с динамической шириной
  const menuStyle = computed(() => ({
    width: `${menuWidth.value}px`
  }));
  
  // Объединяем настройки по умолчанию с текущими настройками
  const settings = ref({...defaultSettings, ...props.mermaidConfig});
  
  // При изменении diagramCode извне обновляем localDiagramCode
  watch(() => props.diagramCode, (newCode) => {
    localDiagramCode.value = newCode;
  }, { immediate: true });
  
  // При изменении mermaidConfig извне обновляем settings
  watch(() => props.mermaidConfig, (newConfig) => {
    settings.value = {...defaultSettings, ...newConfig};
  }, { immediate: true });
  
  // Закрыть меню
  function close() {
    emit('close');
  }
  
  // Применить изменения кода диаграммы
  function applyChanges() {
    emit('update:diagramCode', localDiagramCode.value);
  }
  
  // Сбросить изменения кода диаграммы
  function resetChanges() {
    localDiagramCode.value = props.diagramCode;
  }
  
  // Применить настройки диаграммы
  function applySettings() {
    emit('update:mermaidConfig', {...settings.value});
  }
  
  // Сбросить настройки диаграммы
  function resetSettings() {
    settings.value = {...defaultSettings};
  }
  
  // Начало изменения размера меню
  function startResize(event) {
    isResizing.value = true;
    
    // Добавляем обработчики для отслеживания движения мыши и отпускания кнопки
    window.addEventListener('mousemove', onResize);
    window.addEventListener('mouseup', stopResize);
    
    // Предотвращаем выделение текста при перетаскивании
    event.preventDefault();
  }
  
  // Процесс изменения размера меню
  function onResize(event) {
    if (!isResizing.value) return;
    
    // Рассчитываем новую ширину (расстояние от правого края экрана до курсора)
    const newWidth = window.innerWidth - event.clientX;
    
    // Ограничиваем ширину минимальным и максимальным значениями
    menuWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth));
  }
  
  // Завершение изменения размера меню
  function stopResize() {
    isResizing.value = false;
    
    // Удаляем обработчики событий
    window.removeEventListener('mousemove', onResize);
    window.removeEventListener('mouseup', stopResize);
  }
  
  // Удаляем обработчики событий при уничтожении компонента
  onUnmounted(() => {
    window.removeEventListener('mousemove', onResize);
    window.removeEventListener('mouseup', stopResize);
  });
  </script>
  
  <style scoped>
  .side-menu {
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100%;
    background-color: white;
    box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
    transition: right 0.3s ease;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .side-menu.open {
    right: 0;
  }
  
  .side-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
  }
  
  .side-menu-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  .close-button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  }
  
  .close-button:hover {
    color: #333;
  }
  
  .side-menu-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  /* Добавляем стили для ресайзера */
  .resizer {
    position: absolute;
    top: 0;
    left: 0;
    width: 8px;
    height: 100%;
    cursor: ew-resize;
    background-color: transparent;
    transition: background-color 0.2s ease;
  }
  
  .resizer:hover, 
  .resizer.resizing {
    background-color: rgba(0, 120, 255, 0.2);
  }
  
  .resizer::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 2px;
    height: 100%;
    background-color: #eee;
  }
  
  .resizer:hover::before,
  .resizer.resizing::before {
    background-color: #0078FF;
  }
  
  .tab-buttons {
    display: flex;
    border-bottom: 1px solid #eee;
  }
  
  .tab-buttons button {
    flex: 1;
    padding: 12px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  .tab-buttons button.active {
    border-bottom-color: #1f77b4;
    color: #1f77b4;
  }
  
  .tab-buttons button:hover:not(.active) {
    background-color: #f8f8f8;
  }
  
  .tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }
  
  .code-editor-container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .code-editor {
    flex: 1;
    min-height: 300px;
    padding: 10px;
    font-family: monospace;
    font-size: 14px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: none;
    margin-bottom: 15px;
  }
  
  .editor-buttons {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  
  .apply-button, .reset-button {
    padding: 8px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s ease;
  }
  
  .apply-button {
    background-color: #1f77b4;
    color: white;
  }
  
  .apply-button:hover {
    background-color: #166fa8;
  }
  
  .reset-button {
    background-color: #f0f0f0;
    color: #333;
  }
  
  .reset-button:hover {
    background-color: #e0e0e0;
  }
  
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .setting-group {
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 15px;
  }
  
  .setting-group h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 16px;
    font-weight: 600;
    color: #444;
  }
  
  .setting-item {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .setting-item label {
    flex: 0 0 120px;
    font-size: 14px;
    color: #555;
  }
  
  .setting-item input[type="color"] {
    width: 40px;
    height: 25px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .setting-item input[type="range"] {
    flex: 1;
    margin-right: 10px;
  }
  
  .setting-item select {
    flex: 1;
    padding: 5px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
  }
  
  .setting-item.checkbox {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  
  .setting-item.checkbox input[type="checkbox"] {
    margin-right: 10px;
  }
  
  .setting-item.checkbox label {
    flex: auto;
  }
  </style>
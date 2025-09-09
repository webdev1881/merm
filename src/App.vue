<!-- App.vue -->
<template>
  <div class="app">
    <h1>SMK диаграммы</h1>
    <div class="viewer-container">
      <MermaidViewer :diagramPath="diagramPath" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import MermaidViewer from './components/MermaidViewer.vue';

// Путь к файлу с Mermaid диаграммой
// В реальном приложении нужно создать папку public/diagrams и положить туда файл flowchart.mmd
const diagramPath = ref('/diagram.mmd');
</script>

<style>
.app {
  width: 1324px;
  height: 100vh;
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
}

h1 {
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
}

.viewer-container {
  width: 100%;
  height: calc(100vh - 100px);
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
</style>
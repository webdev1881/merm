<!-- MermaidViewer.vue -->
<template>
    <!-- Добавлен селектор типов диаграмм -->
    <div class="diagram-selector">
        <label for="diagram-type">Типы диаграмм:</label>
        <select id="diagram-type" v-model="selectedDiagramType" @change="loadSelectedDiagram">
            <option v-for="diagram in diagramTypes" :key="diagram.id" :value="diagram.id">
                {{ diagram.name }}
            </option>
        </select>
    </div>
    <div class="mermaid-viewer-container">
        <div class="notification" v-if="notification.visible" :class="notification.type">
            {{ notification.message }}
        </div>



        <!-- <button @click="openShareDialog" class="control-button" title="Поделиться диаграммой">
            <span class="share-icon">🔗</span>
        </button> -->




        <div class="share-dialog" v-if="shareDialog">
            <div class="share-dialog-content">
                <div class="share-dialog-header">
                    <h3>Создать короткую ссылку</h3>
                    <button class="close-button" @click="closeShareDialog">✕</button>
                </div>
                <div class="share-dialog-body">

                    <div class="share-link-container" v-if="shareLink">
                        <input type="text" class="share-link-input" v-model="shareLink" readonly />
                        <button class="copy-button" @click="copyShareLink">
                            {{ isCopied ? 'Скопировано!' : 'Копировать' }}
                        </button>
                    </div>

                    <div class="share-actions">
                        <button class="generate-link-button" @click="generateShareLink" :disabled="isGeneratingLink">
                            {{ shareLink ? 'Обновить ссылку' : 'Создать ссылку' }}
                        </button>
                        <button class="export-config-button" @click="exportDiagramConfig">
                            Экспорт в файл
                        </button>
                    </div>

                    <div class="share-info">
                        <p class="note">Примечание: Ссылка будет доступна в Odoo.</p>
                    </div>
                </div>
            </div>
        </div>

















        <div class="controls">
            <button @click="openShareDialog" class="control-button" title="Поделиться диаграммой">
            <span class="share-icon">🔗</span>
        </button>
            <button @click="exportAsSvg" class="control-button" title="Экспорт в SVG">
                <span class="export-icon">SVG</span>
            </button>
            <button @click="exportAsPng" class="control-button" title="Экспорт в PNG">
                <span class="export-icon">PNG</span>
            </button>
            <button @click="zoomIn" class="control-button" title="Увеличить">+</button>
            <button @click="zoomOut" class="control-button" title="Уменьшить">-</button>
            <button @click="centerDiagram" class="control-button reloader" title="Сбросить вид">↻</button>
            <button @click="toggleQuality" class="control-button"
            :title="isHighQuality ? 'Переключить на низкое качество' : 'Переключить на высокое качество'">
            {{ isHighQuality ? 'HQ' : 'LQ' }}
        </button>
        <button @click="toggleMenu" class="control-button menu-button" title="Настройки диаграммы">⚙️</button>
    </div>
        <div ref="containerRef" class="diagram-container" @wheel.prevent="handleWheel" @mousedown="startDrag"
            @mouseup="stopDrag" @mouseleave="stopDrag" @mousemove="onDrag">
            <div class="loading-overlay" v-if="isLoading">
                <div class="loading-spinner"></div>
            </div>
            <div ref="diagramRef" class="mermaid-diagram"
                :class="{ 'low-quality': !isHighQuality && isDragging, 'hidden': isLoading }" :style="transformStyle">
            </div>

            <div ref="diagramRef" class="mermaid-diagram"
                :class="{ 'low-quality': !isHighQuality && isDragging, 'initialized': isInitialized }"
                :style="transformStyle"></div>
        </div>

        <SideMenu :is-open="isMenuOpen" :diagram-code="diagramContent" :mermaid-config="mermaidConfig"
            @close="isMenuOpen = false" @update:diagram-code="updateDiagramCode"
            @update:mermaid-config="updateMermaidConfig" />

    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';


// import mermaid from 'mermaid';
// import * as mermaid from 'mermaid';
// import { initialize, run } from 'mermaid';
const mermaid = window.mermaid;


import SideMenu from './SideMenu.vue';
// Импортируем плагин подсветки
import HighlightPlugin from './HighlightPlugin.js';

// 1. Импортировать плагин экспорта в начале файла:
import SvgExportPlugin from '@/SvgExportPlugin.js';

// 2. Добавить ref для экземпляра плагина экспорта:
const svgExportPlugin = ref(null);


// 2. Добавьте следующие ref-переменные в компонент
const shareDialog = ref(false); // Состояние диалога с короткой ссылкой
const shareLink = ref(''); // Короткая ссылка для публикации
const isCopied = ref(false); // Состояние копирования ссылки
const isGeneratingLink = ref(false); // Состояние генерации ссылки




const props = defineProps({
    diagramPath: {
        type: String,
        required: true
    }
});

// Примеры диаграмм разных типов
const diagramTypes = ref([
    {
        id: 'sequence',
        name: 'Диаграмма последовательности (Sequence)',
        code: `sequenceDiagram
    participant Пользователь
    participant Система
    participant База данных
    Пользователь->>Система: Авторизация
    Система->>База данных: Проверка данных
    База данных-->>Система: Результат проверки
    Система-->>Пользователь: Ответ системы`
    },
    {
        id: 'flowchart',
        name: 'Блок-схема (Flowchart)',
        code: `flowchart TD
    A[Начало] --> B{Условие?}
    B -->|Да| C[Процесс 1]
    B -->|Нет| D[Процесс 2]
    B -->|Да| X[Процесс 1]
    B -->|Нет| Y[Процесс 2]
    B -->|Нет| Z[Процесс 2]
    C --> E[Конец]
    D --> E`
    },
    {
        id: 'classDiagram',
        name: 'Диаграмма классов (Class)',
        code: `classDiagram
    class Manager0 {
        +List~Employee~ team
        +assignTask()
    }
    class Manager4 {
        +List~Employee~ team
        +assignTask()
    }
    class Manager5 {
        +List~Employee~ team
        +assignTask()
    }
    class Person {
        +String namee
        +int age
        +getDetails()
    }
    class Employee {
        +String position
        +int salary
        +work()
    }
    class Manager {
        +List~Employee~ team
        +assignTask()
    }
    class Manager2 {
        +List~Employee~ team
        +assignTask()
    }
    class Manager3 {
        +List~Employee~ team
        +assignTask()
    }
    Person <|-- Employee
    Employee <|-- Manager
    Person <|-- Manager2
    Person <|-- Manager3
    Employee <|-- Manager4
    Employee <|-- Manager5
    Employee <|-- Manager0
    `
    },
    {
        id: 'stateDiagram',
        name: 'Диаграмма состояний (State)',
        code: `stateDiagram-v2
    [*] --> Ожидание
    Ожидание --> Обработка: Получить запрос
    Обработка --> Завершено: Успех
    Обработка --> Ошибка: Сбой
    Обработка2 --> Состояние: Сбой
    Обработка3 --> Состояние: Сбой
    Обработка4 --> Состояние: Сбой
    Обработка5 --> Состояние: Сбой
    Завершено --> Ожидание: Новый запрос
    Ошибка --> Ожидание: Повторить
    Ожидание --> [*]: Выключение`
    },
    {
        id: 'entityRelationship',
        name: 'Диаграмма сущность-связь (ER)',
        code: `erDiagram
    Clients ||--o{ Cards : "имеет"
    Clients ||--o{ Operations : "совершает"
    
    Merchants ||--o{ Locations : "содержит"
    Locations ||--o{ Terminals : "имеет"
    Terminals ||--o{ Operations : "обслуживает"
    
    Product_Groups ||--o{ Products : "включает"
    Products ||--o{ Sale_Items : "продается"
    
    Operations ||--o{ Sale_Items : "содержит"
    Sale_Items ||--o{ Item_Discounts : "имеет_скидки"
    
    Clients {
        int client_id PK
        datetime created_at
    }
    
    Cards {
        int card_id PK
        int client_id FK
        varchar card_code
        varchar card_category_name
    }
    
    Merchants {
        int merchant_id PK
        varchar merchant_identifier
        varchar merchant_name
    }
    
    Locations {
        int location_id PK
        int merchant_id FK
        varchar location_identifier
        varchar location_name
        varchar location_address
    }
    
    Terminals {
        int terminal_id PK
        int location_id FK
        varchar terminal_identifier
        varchar terminal_name
    }
    
    Product_Groups {
        varchar ext_sku_group_id PK
        varchar ext_sku_group_name
    }
    
    Products {
        varchar ext_sku_id PK
        varchar ext_sku_group_id FK
        varchar product_name
    }
    
    Operations {
        int operation_id PK
        int sale_id
        int receipt_id
        varchar operation_type
        datetime purchase_datetime
        int client_id FK
        varchar card_code
        int terminal_id FK
        decimal total_price
        decimal discount_sum
        decimal bonus_recall_sum
        decimal bonus_achievement
    }
    
    Sale_Items {
        int sale_item_id PK
        int operation_id FK
        varchar ext_sku_id FK
        decimal quantity
        decimal price
        decimal amount
        decimal discount
        decimal bonus
    }
    
    Item_Discounts {
        int discount_id PK
        int sale_item_id FK
        varchar discount_type
        decimal discount_value
        decimal discount_percentage
    }`
    },
    {
        id: 'gantt',
        name: 'Диаграмма Ганта (Gantt)',
        code: `gantt
    title График проекта
    dateFormat YYYY-MM-DD
    section План
    Анализ требований  :a1, 2025-01-01, 7d
    Проектирование     :a2, after a1, 10d
    section Разработка
    Реализация         :a3, after a2, 15d
    Тестирование       :a4, after a3, 7d
    section Релиз
    Развертывание      :a5, after a4, 3d`
    },
    {
        id: 'pieChart',
        name: 'Круговая диаграмма (Pie)',
        code: `pie
    title Распределение времени проекта
    "Разработка" : 40
    "Тестирование" : 20
    "Документация" : 15
    "Встречи" : 15
    "Прочее" : 10`
    },
    {
        id: 'journey',
        name: 'Карта взаимодействия (Journey)',
        code: `journey
    title Путь пользователя
    section Регистрация
      Заполнение формы: 5: Юзер
      Подтверждение почты: 3: Юзер, Система
    section Использование
      Авторизация: 5: Юзер
      Работа с системой: 4: Юзер
      Получение результатов: 5: Юзер, Система`
    }
]);

// Выбранный тип диаграммы
const selectedDiagramType = ref('entityRelationship');


// Refs
const isInitialized = ref(false);
const isMenuOpen = ref(false); // Состояние бокового меню
const highlightPlugin = ref(null); // Плагин подсветки

const containerRef = ref(null);
const diagramRef = ref(null);
const scale = ref(1);
const translateX = ref(0);
const translateY = ref(0);
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const diagramContent = ref('');
const isHighQuality = ref(false); // По умолчанию высокое качество
const isLoading = ref(true); // Добавляем состояние загрузки



// Настройки mermaid
const mermaidConfig = ref({
    theme: 'default',
    backgroundColor: '#fafafa',
    fontFamily: 'sans-serif',
    fontSize: 14,
    primaryColor: '#1f77b4',
    secondaryColor: '#ff7f0e',
    textColor: '#333333',
    lineColor: '#666666',
    useMaxWidth: true,
    enableAnimations: true,
    curve: 'basis'
});

// Computed styles
const transformStyle = computed(() => {
    return {
        transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
        transformOrigin: 'center center'
    };
});

// Цвет фона контейнера диаграммы
const containerBackgroundColor = computed(() => {
    return mermaidConfig.value.backgroundColor || '#fafafa';
});

const notification = ref({
    visible: false,
    message: '',
    type: 'info',
    timeout: null
});

// Открыть диалог с настройками публикации и ссылкой
function openShareDialog() {
    shareDialog.value = true;
    shareLink.value = ''; // Сбрасываем предыдущую ссылку
    isCopied.value = false;
}

// Закрыть диалог публикации
function closeShareDialog() {
    shareDialog.value = false;
}



async function generateShareLink() {
    try {
        isGeneratingLink.value = true;

        // Собираем данные для публикации
        const diagramData = {
            content: diagramContent.value,
            config: mermaidConfig.value,
            type: selectedDiagramType.value,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        // Вариант 1: Используем внешний сервис сокращения ссылок
        // Можно использовать существующие API для сокращения ссылок (TinyURL, Bitly и т.д.)
        // или создать собственный сервис на бэкенде

        // Пример с использованием Firebase Realtime Database или Firestore
        const uniqueId = (Math.random() + 1).toString(36).substring(7); // Генерируем короткий уникальный ID

        // Здесь должен быть код для сохранения данных в вашем бэкенде
        // Примерная структура:
        /*
        await firebase.database().ref(`diagrams/${uniqueId}`).set(diagramData);
        
        // Или с использованием Firestore
        await firebase.firestore().collection('diagrams').doc(uniqueId).set(diagramData);
        */

        // Вариант 2: Использование localStorage или sessionStorage для демонстрации
        // Этот вариант подойдет для демонстрации или при отсутствии бэкенда
        localStorage.setItem(`mermaid-diagram-${uniqueId}`, JSON.stringify(diagramData));

        // Формирование короткой ссылки
        const baseUrl = window.location.origin + window.location.pathname;
        shareLink.value = `${baseUrl}?diagram=${uniqueId}`;

        // Показываем уведомление об успешной генерации ссылки
        showNotification('Короткая ссылка на диаграмму успешно создана!', 'success');
    } catch (error) {
        console.error('Ошибка при генерации ссылки:', error);
        showNotification('Ошибка при создании ссылки на диаграмму', 'error');
    } finally {
        isGeneratingLink.value = false;
    }
}

// Загрузка выбранной диаграммы
function loadSelectedDiagram() {
    const selectedDiagram = diagramTypes.value.find(d => d.id === selectedDiagramType.value);
    if (selectedDiagram) {
        isLoading.value = true;
        diagramContent.value = selectedDiagram.code;
        // Перерисовка будет запущена через watch на diagramContent
    }
    setTimeout(() => {
        
        centerDiagram();
    }, 100);
}

function copyShareLink() {
    if (!shareLink.value) return;

    navigator.clipboard.writeText(shareLink.value)
        .then(() => {
            isCopied.value = true;
            showNotification('Ссылка скопирована в буфер обмена', 'success');

            // Сбрасываем индикатор копирования через 2 секунды
            setTimeout(() => {
                isCopied.value = false;
            }, 2000);
        })
        .catch(error => {
            console.error('Ошибка при копировании ссылки:', error);
            showNotification('Не удалось скопировать ссылку', 'error');
        });
}

// Экспорт диаграммы с настройками в файл (для резервного копирования)
function exportDiagramConfig() {
    const diagramData = {
        content: diagramContent.value,
        config: mermaidConfig.value,
        type: selectedDiagramType.value,
        timestamp: new Date().toISOString(),
        version: '1.0'
    };

    const blob = new Blob([JSON.stringify(diagramData, null, 2)], { type: 'application/json' });
    //   saveAs(blob, `mermaid-diagram-${new Date().toISOString().slice(0, 10)}.json`);

    //   showNotification('Конфигурация диаграммы экспортирована в файл', 'success');
}

// 4. Добавьте функцию для загрузки диаграммы по ID из URL
async function loadDiagramFromId(diagramId) {
    try {
        // Показываем индикатор загрузки
        isLoading.value = true;

        // Вариант 1: Загрузка с бэкенда
        /*
        // Получаем данные диаграммы из Firebase или другого бэкенда
        const snapshot = await firebase.database().ref(`diagrams/${diagramId}`).once('value');
        const diagramData = snapshot.val();
        
        // Или с использованием Firestore
        const doc = await firebase.firestore().collection('diagrams').doc(diagramId).get();
        const diagramData = doc.data();
        */

        // Вариант 2: Загрузка из localStorage (для демонстрации)
        const storedData = localStorage.getItem(`mermaid-diagram-${diagramId}`);

        if (!storedData) {
            showNotification('Диаграмма не найдена или срок ее хранения истек', 'error');
            return;
        }

        const diagramData = JSON.parse(storedData);

        // Устанавливаем загруженные данные
        if (diagramData.type && diagramTypes.value.find(d => d.id === diagramData.type)) {
            selectedDiagramType.value = diagramData.type;
        }

        diagramContent.value = diagramData.content;

        if (diagramData.config) {
            updateMermaidConfig(diagramData.config);
        }

        showNotification('Диаграмма успешно загружена', 'success');
    } catch (error) {
        console.error('Ошибка при загрузке диаграммы:', error);
        showNotification('Ошибка при загрузке диаграммы', 'error');
    } finally {
        isLoading.value = false;
    }
}





// 4. Инициализировать плагин экспорта вместе с плагином подсветки:
function initExportPlugin() {
    // Создаем экземпляр плагина экспорта с настройками
    svgExportPlugin.value = new SvgExportPlugin({
        fileName: 'mermaid-diagram',
        background: mermaidConfig.value.backgroundColor,
        addWatermark: false,
        includeStyles: true,
        scale: 2 // Масштаб для PNG экспорта
    });
}





async function updateDiagramCode(newCode) {
    diagramContent.value = newCode;
    // await renderDiagram();
    setTimeout(() => {
         renderDiagram();
        
    }, 100);
}

// Открыть/закрыть боковое меню
function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value;
}


// Обновление настроек Mermaid из меню
function updateMermaidConfig(newConfig) {
    mermaidConfig.value = newConfig;


    // Обновление настроек плагина экспорта
    if (svgExportPlugin.value) {
        svgExportPlugin.value.updateSettings({
            background: newConfig.backgroundColor
        });
    }

    // Обновляем конфигурацию mermaid
    mermaid.initialize({
        startOnLoad: false,
        theme: newConfig.theme,
        securityLevel: 'loose',
        fontFamily: newConfig.fontFamily,
        fontSize: newConfig.fontSize,
        logLevel: 'error',
        flowchart: {
            curve: newConfig.curve,
            useMaxWidth: newConfig.useMaxWidth
        }
    });

    // Перерисовка диаграммы с новыми настройками
    renderDiagram();
}




// Initialize mermaid
onMounted(async () => {
    // Конфигурация mermaid
    mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: 'sans-serif',
        logLevel: 'error'
    });

    // Установка обработчика событий до загрузки диаграммы
    window.addEventListener('resize', resetView);

    // Устанавливаем стиль курсора для контейнера
    if (containerRef.value) {
        containerRef.value.style.cursor = 'grab';
    }

    // Загрузка примера диаграммы по умолчанию (вместо загрузки из файла)
    try {
        // Если задан путь к файлу, загружаем из него
        if (props.diagramPath && props.diagramPath !== 'demo') {
            const response = await fetch(props.diagramPath);
            if (!response.ok) throw new Error('Не удалось загрузить диаграмму');
            diagramContent.value = await response.text();
        } else {
            // Иначе используем выбранный пример диаграммы
            loadSelectedDiagram();
        }

        // Рендеринг диаграммы после небольшой задержки для полной инициализации DOM
        setTimeout(() => {
            renderDiagram();
        }, 100);
    } catch (error) {
        console.error('Ошибка загрузки диаграммы:', error);
        if (diagramRef.value) {
            diagramRef.value.innerHTML = `<div class="error-message">Ошибка загрузки диаграммы: ${error.message}</div>`;
        }
    }

    // Уничтожаем плагин подсветки
    if (highlightPlugin.value) {
        highlightPlugin.value.destroy();
    }


    // Проверяем URL на наличие параметра diagram
    const urlParams = new URLSearchParams(window.location.search);
    const diagramId = urlParams.get('diagram');

    if (diagramId) {
        await loadDiagramFromId(diagramId);
    } else {

    }



});

onUnmounted(() => {
    window.removeEventListener('resize', resetView);
    // window.removeEventListener('resize', handleResize);

    // Уничтожаем плагины
    if (highlightPlugin.value) {
        highlightPlugin.value.destroy();
    }

    // Очищаем таймаут уведомления если он активен
    if (notification.value.timeout) {
        clearTimeout(notification.value.timeout);
    }
});

// Перерисовка при изменении содержимого диаграммы
watch(diagramContent, () => {
    renderDiagram();
});

// Функция переключения качества
function toggleQuality() {
    isHighQuality.value = !isHighQuality.value;
}

// Функции управления масштабом и перемещением
function zoomIn() {
    // Увеличиваем масштаб на 10%
    const newScale = Math.min(scale.value * 1.1, 5); // Максимальный масштаб 5x
    zoomAtCenter(newScale);
}

function zoomOut() {
    // Уменьшаем масштаб на 10%
    const newScale = Math.max(scale.value * 0.9, 0.1); // Минимальный масштаб 0.1x
    zoomAtCenter(newScale);
}

function resetView() {
    if (!containerRef.value || !diagramRef.value) return;

    const svgElement = diagramRef.value.querySelector('svg');
    if (!svgElement) {
        console.warn('SVG-элемент не найден, откладываем центрирование...');
        setTimeout(resetView, 100); // Повторная попытка через 100 мс
        return;
    }

    // Проверка, что SVG полностью инициализирован
    try {
        // Проверка работоспособности getBBox
        svgElement.getBBox();
    } catch (error) {
        console.warn('SVG не готов для получения размеров, откладываем центрирование...', error);
        setTimeout(resetView, 100); // Повторная попытка через 100 мс
        return;
    }

    // Получаем размеры контейнера и диаграммы
    const containerRect = containerRef.value.getBoundingClientRect();
    const diagramRect = diagramRef.value.getBoundingClientRect();


    // Вычисляем масштаб только по высоте для вписывания диаграммы по высоте контейнера
    const containerHeight = containerRect.height;
    const diagramHeight = diagramRect.height / scale.value;

    const newScale = (containerHeight / diagramHeight)  // 90% от высоты контейнера для небольшого отступа

    // console.log('containerRect', containerRect);
    // console.log('diagramRect', diagramRect);

    // Устанавливаем масштаб и центрируем
    scale.value = newScale;
    centerDiagram();


    // Показываем диаграмму после завершения всех преобразований
    setTimeout(() => {
        isInitialized.value = true;
        if (diagramRef.value) {
            diagramRef.value.classList.add('initialized');
        }
    }, 50);

}

async function centerDiagram() {
    if (!containerRef.value || !diagramRef.value) return;

    // Проверка наличия SVG-элемента в диаграмме
    const svgElement = diagramRef.value.querySelector('svg');
    if (!svgElement) {
        console.warn('SVG-элемент не найден, откладываем центрирование...');
        return; // Просто выходим, resetView вызовет centerDiagram позже
    }

    // Проверка, что SVG полностью инициализирован
    try {
        // Проверка работоспособности getBBox
        svgElement.getBBox();
    } catch (error) {
        console.warn('SVG не готов для получения размеров, откладываем центрирование...', error);
        return; // Просто выходим, resetView вызовет centerDiagram позже
    }
    // Получаем размеры контейнера и диаграммы
    const containerRect = containerRef.value.getBoundingClientRect();
    const diagramRect = diagramRef.value.getBoundingClientRect();

    // Вычисляем смещение для центрирования по горизонтали и вертикали
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;
    const diagramCenterX = diagramRect.width / (2 * scale.value);
    const diagramCenterY = diagramRect.height / (2 * scale.value);

    translateX.value = containerCenterX - diagramCenterX;
    translateY.value = containerCenterY - diagramCenterY;
    scale.value = 1
}



function handleWheel(event) {
    // Определяем направление прокрутки и коэффициент масштабирования
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale.value * delta));

    // Получаем позицию курсора относительно текущего положения диаграммы
    const containerRect = containerRef.value.getBoundingClientRect();
    const mouseX = event.clientX - containerRect.left;
    const mouseY = event.clientY - containerRect.top;

    // Масштабирование относительно позиции курсора
    zoomAtPoint(newScale, mouseX, mouseY);
}

function zoomAtPoint(newScale, x, y) {
    // Рассчитываем новое положение для масштабирования относительно позиции курсора
    const scaleFactor = newScale / scale.value;

    // Позиция точки до масштабирования
    const pointXBeforeZoom = (x - translateX.value) / scale.value;
    const pointYBeforeZoom = (y - translateY.value) / scale.value;

    // Новое положение после масштабирования
    translateX.value = x - pointXBeforeZoom * newScale;
    translateY.value = y - pointYBeforeZoom * newScale;

    // Применяем новый масштаб
    scale.value = newScale;
}

function zoomAtCenter(newScale) {
    if (!containerRef.value) return;

    const containerRect = containerRef.value.getBoundingClientRect();
    const centerX = containerRect.width / 2;
    const centerY = containerRect.height / 2;

    zoomAtPoint(newScale, centerX, centerY);
}

function startDrag(event) {
    // Начало перетаскивания только при нажатии левой кнопки мыши
    if (event.button !== 0) return;

    // Устанавливаем флаг перетаскивания и сохраняем начальные координаты
    isDragging.value = true;
    dragStartX.value = event.clientX - translateX.value;
    dragStartY.value = event.clientY - translateY.value;

    // Изменяем стиль курсора
    if (containerRef.value) {
        containerRef.value.style.cursor = 'grabbing';
    }
}

function stopDrag() {
    // Завершение перетаскивания
    isDragging.value = false;

    // Восстанавливаем стиль курсора
    if (containerRef.value) {
        containerRef.value.style.cursor = 'grab';
    }
}

function onDrag(event) {
    // Перемещение диаграммы при перетаскивании
    if (!isDragging.value) return;

    translateX.value = event.clientX - dragStartX.value;
    translateY.value = event.clientY - dragStartY.value;
}

async function renderDiagram() {
    if (!diagramRef.value || !diagramContent.value) return;

    try {
        // Очистка предыдущей диаграммы
        diagramRef.value.innerHTML = '';

        // Создаем элемент для диаграммы с правильным классом для mermaid
        const diagramElement = document.createElement('div');
        diagramElement.className = 'mermaid';
        diagramElement.textContent = diagramContent.value;
        diagramRef.value.appendChild(diagramElement);

        // Рендеринг диаграммы
        await mermaid.run({
            nodes: [diagramElement]
        });
        initHighlightPlugin();

        initExportPlugin()
        // После рендеринга сбрасываем вид и скрываем индикатор загрузки
        setTimeout(() => {
            resetView();
            isLoading.value = false;
        }, 0);
    } catch (error) {
        console.error('Ошибка рендеринга диаграммы:', error);
        diagramRef.value.innerHTML = `<div class="error-message">Ошибка рендеринга диаграммы: ${error.message}</div>`;
        isLoading.value = false;
    }
}



// 5. Добавить методы для экспорта:
function exportAsSvg() {
    if (!svgExportPlugin.value || !diagramRef.value) return;

    // Показываем индикатор загрузки или уведомление
    showNotification('Экспорт SVG...');

    // Используем плагин для экспорта SVG
    svgExportPlugin.value.downloadSvg(diagramRef.value)
        .then(() => {
            showNotification('SVG успешно экспортирован', 'success');
        })
        .catch(error => {
            console.error('Ошибка экспорта SVG:', error);
            showNotification('Ошибка при экспорте SVG', 'error');
        });
}

function exportAsPng() {
    if (!svgExportPlugin.value || !diagramRef.value) return;

    // Показываем индикатор загрузки или уведомление
    showNotification('Экспорт PNG...');

    // Используем плагин для экспорта PNG
    svgExportPlugin.value.downloadPng(diagramRef.value)
        .then(() => {
            showNotification('PNG успешно экспортирован', 'success');
        })
        .catch(error => {
            console.error('Ошибка экспорта PNG:', error);
            showNotification('Ошибка при экспорте PNG', 'error');
        });
}






// Инициализация плагина подсветки элементов диаграммы
function initHighlightPlugin() {
    // Сначала уничтожаем предыдущий экземпляр, если он существует
    if (highlightPlugin.value) {
        highlightPlugin.value.destroy();
    }

    // Создаем новый экземпляр плагина с настройками
    highlightPlugin.value = new HighlightPlugin({
        highlightColor: mermaidConfig.value.primaryColor || '#ff9900',
        highlightOpacity: 0.3,
        pulseEffect: true,
        tooltips: true,
        resetOnClickOutside: true,
        onClick: (element, event) => {
            // Дополнительная логика при клике на элемент (если нужно)
            console.log('Выбран элемент:', element);
        }
    });

    // Инициализируем плагин, указывая контейнер с диаграммой
    highlightPlugin.value.init(diagramRef.value);
}



// Генерация CSS-стилей для SVG на основе пользовательских настроек
function generateSvgStyles() {
    const config = mermaidConfig.value;
    return `
    .mermaid svg {
      background-color: ${config.backgroundColor} !important;
      font-family: ${config.fontFamily} !important;
      font-size: ${config.fontSize}px !important;
    }
    .mermaid .node rect, .mermaid .node circle, .mermaid .node ellipse, .mermaid .node polygon, .mermaid .node path {
      fill: ${config.primaryColor} !important;
      stroke: ${config.lineColor} !important;
    }
    .mermaid .edgePath .path {
      stroke: ${config.lineColor} !important;
    }
    .mermaid .edgeLabel {
      background-color: ${config.backgroundColor} !important;
      color: ${config.textColor} !important;
    }
    .mermaid .label {
      color: ${config.textColor} !important;
    }
    .mermaid .cluster rect {
      fill: ${config.secondaryColor} !important;
      stroke: ${config.lineColor} !important;
      opacity: 0.2 !important;
    }
    ${!config.enableAnimations ? '.mermaid * { transition: none !important; }' : ''}
  `;
}



function showNotification(message, type = 'info', duration = 3000) {
    // Очищаем предыдущий таймаут если есть
    if (notification.value.timeout) {
        clearTimeout(notification.value.timeout);
    }

    // Устанавливаем новое уведомление
    notification.value = {
        visible: true,
        message,
        type,
        timeout: setTimeout(() => {
            notification.value.visible = false;
        }, duration)
    };
}















</script>

<style scoped>
.export-icon {
    font-size: 12px;
    font-weight: bold;
}

.notification {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    transition: all 0.3s ease;
    font-size: 14px;
}

.notification.info {
    background-color: #2196F3;
    color: white;
}

.notification.success {
    background-color: #4CAF50;
    color: white;
}

.notification.error {
    background-color: #F44336;
    color: white;
}

/* Стили для селектора диаграмм */
.diagram-selector {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.diagram-selector label {
    font-weight: 500;
    font-size: 14px;
    color: #333;
}

.diagram-selector select {
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: white;
    font-size: 14px;
    min-width: 200px;
}



.mermaid-viewer-container {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}

.diagram-container {
    padding-top: 50px;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    cursor: grab;
    background-color: #fafafa;
}

.mermaid-diagram {
    position: absolute;
    transform-origin: 0 0;
    transition: transform 0.05s ease;
    user-select: none;
    overflow: visible;
    max-width: none;
    width: 100%;
    height: 100%;
    opacity: 0;
    /* Скрыть диаграмму по умолчанию */
    transition: opacity 0.3s ease, transform 0.05s ease;
    /* Плавное появление */
}

.mermaid-diagram.initialized {
    opacity: 1;
    /* Показать диаграмму после инициализации */
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(250, 250, 250, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.loading-spinner {
    width: 50px;
    height: 50px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

.mermaid-diagram.low-quality {
    image-rendering: optimizeSpeed;
    shape-rendering: optimizeSpeed;
    text-rendering: optimizeSpeed;
    transition: none;
}

.mermaid-diagram.low-quality :deep(svg) {
    filter: none !important;
}

.mermaid-diagram :deep(.mermaid) {
    overflow: visible !important;
    width: auto !important;
    height: auto !important;
}

.mermaid-diagram :deep(svg) {
    overflow: visible !important;
    max-width: none !important;
    shape-rendering: geometricPrecision;
    text-rendering: optimizeLegibility;
}

.error-message {
    color: red;
    padding: 20px;
    background-color: rgba(255, 0, 0, 0.1);
    border-radius: 5px;
    border: 1px solid red;
    margin: 20px;
}

.controls {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    display: flex;
    gap: 5px;
}

.control-button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: white;
    border: 1px solid #ddd;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    transition: all 0.2s ease;
}

.control-button:hover {
    background-color: #f0f0f0;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.control-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}




/* Стили для диалога публикации */
.share-dialog {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1100;
}

.share-dialog-content {
    background-color: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}

.share-dialog-header {
    color: black;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #eee;
}

.share-dialog-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
}

.share-dialog-body {
    padding: 20px;
}

.share-link-container {
    display: flex;
    margin: 15px 0;
    border: 1px solid #ddd;
    border-radius: 4px;
    overflow: hidden;
}

.share-link-input {
    flex: 1;
    padding: 10px;
    border: none;
    font-size: 14px;
    background-color: #f8f8f8;
}

.copy-button {
    padding: 10px 15px;
    background-color: #2196F3;
    color: white;
    border: none;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
}

.copy-button:hover {
    background-color: #0b7dda;
}

.share-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.generate-link-button, .export-config-button {
    flex: 1;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
}

.generate-link-button {
    background-color: #4CAF50;
    color: white;
}

.generate-link-button:hover {
    background-color: #45a049;
}

.generate-link-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.export-config-button {
    background-color: #f0f0f0;
    color: #333;
}

.export-config-button:hover {
    background-color: #e0e0e0;
}

.share-info {
    margin-top: 20px;
}

.note {
    font-size: 12px;
    color: #666;
    margin: 0;
}
.reloader {
    border: 1px solid black;
}
</style>
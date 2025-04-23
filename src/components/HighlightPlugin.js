// HighlightPlugin.js
// Плагин для подсвечивания элементов Mermaid-диаграммы по клику

export class HighlightPlugin {
    constructor(options = {}) {
        // Настройки по умолчанию
        this.settings = {
            highlightColor: options.highlightColor || '#ff9900',
            highlightOpacity: options.highlightOpacity || 0.3,
            transitionDuration: options.transitionDuration || 300,
            pulseEffect: options.pulseEffect !== undefined ? options.pulseEffect : true,
            tooltips: options.tooltips !== undefined ? options.tooltips : true,
            onClick: options.onClick || null, // callback для пользовательской логики
            resetOnClickOutside: options.resetOnClickOutside !== undefined ? options.resetOnClickOutside : true,
            selectors: options.selectors || {
                nodes: '.node',
                edges: '.edgePath',
                clusters: '.cluster'
            }
        };

        // Состояние плагина
        this.state = {
            diagramContainer: null,
            highlightedElement: null,
            originalStyles: new Map(),
            styleElement: null,
            clickHandler: null,
            tooltipElement: null
        };

        // Внедрение необходимых стилей
        this._injectStyles();
    }

    // Инициализация плагина для конкретного контейнера диаграммы
    init(diagramContainer) {
        if (!diagramContainer) {
            console.error('Не указан контейнер диаграммы');
            return;
        }

        // Сохраняем контейнер
        this.state.diagramContainer = diagramContainer;

        // Добавляем слушатель событий клика
        this.state.clickHandler = this._handleClick.bind(this);
        diagramContainer.addEventListener('click', this.state.clickHandler);

        // Если настроен сброс при клике вне элемента
        if (this.settings.resetOnClickOutside) {
            document.addEventListener('click', this._handleOutsideClick.bind(this));
        }

        console.log('Плагин HighlightPlugin инициализирован');
        return this;
    }

    // Внедрение необходимых стилей
    _injectStyles() {
        if (document.getElementById('mermaid-highlight-plugin-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'mermaid-highlight-plugin-styles';
        style.textContent = `
        @keyframes highlight-pulse {
          0% { opacity: ${this.settings.highlightOpacity}; }
          50% { opacity: ${this.settings.highlightOpacity * 0.7}; }
          100% { opacity: ${this.settings.highlightOpacity}; }
        }
        
        .mermaid-highlighted-element {
          transition: all ${this.settings.transitionDuration}ms ease;
        }
        
        .mermaid-highlighted-element.pulse {
          animation: highlight-pulse 1.5s infinite ease-in-out;
        }
  
        .mermaid-tooltip {
          position: absolute;
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 12px;
          pointer-events: none;
          z-index: 1500;
          transition: opacity 0.2s ease;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .mermaid-tooltip::after {
          content: '';
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid rgba(0, 0, 0, 0.8);
        }
      `;
        document.head.appendChild(style);
        this.state.styleElement = style;
    }

    // Обработчик события клика по диаграмме
    _handleClick(event) {
        // Сначала сбрасываем предыдущее выделение
        this.resetHighlight();

        // Находим ближайший подходящий элемент диаграммы
        const element = this._findDiagramElement(event.target);

        if (element) {
            // Подсвечиваем элемент
            this.highlightElement(element);

            // Показываем подсказку если нужно
            if (this.settings.tooltips) {
                this._showTooltip(element, event.clientX, event.clientY);
            }

            // Вызываем пользовательский callback если он существует
            if (typeof this.settings.onClick === 'function') {
                this.settings.onClick(element, event);
            }

            // Предотвращаем всплытие события, чтобы избежать сброса при клике вне
            event.stopPropagation();
        }
    }

    // Обработчик клика вне диаграммы
    _handleOutsideClick(event) {
        // Проверяем, был ли клик вне контейнера диаграммы
        if (
            this.state.diagramContainer &&
            !this.state.diagramContainer.contains(event.target)
        ) {
            this.resetHighlight();
        }
    }

    // Поиск ближайшего элемента диаграммы
    _findDiagramElement(target) {
        const { selectors } = this.settings;

        // Проверяем все типы элементов
        for (const type in selectors) {
            if (selectors.hasOwnProperty(type)) {
                const selector = selectors[type];
                const element = target.closest(selector);
                if (element) {
                    return element;
                }
            }
        }

        return null;
    }

    // Подсветка элемента
    highlightElement(element) {
        // Сохраняем ссылку на текущий подсвеченный элемент
        this.state.highlightedElement = element;

        // Добавляем класс для анимации
        element.classList.add('mermaid-highlighted-element');

        // Если включен эффект пульсации
        if (this.settings.pulseEffect) {
            element.classList.add('pulse');
        }

        // Определяем тип элемента и применяем соответствующие стили
        if (element.classList.contains('node')) {
            this._highlightNode(element);
        } else if (element.classList.contains('edgePath')) {
            this._highlightEdge(element);
        } else if (element.classList.contains('cluster')) {
            this._highlightCluster(element);
        }
    }

    // Подсветка узла
    _highlightNode(element) {
        // Сохраняем оригинальные стили
        const rect = element.querySelector('rect, circle, ellipse, polygon');
        if (rect) {
            this.state.originalStyles.set(rect, {
                fill: rect.getAttribute('fill'),
                stroke: rect.getAttribute('stroke'),
                strokeWidth: rect.getAttribute('stroke-width'),
                filter: rect.getAttribute('filter')
            });

            // Применяем новые стили
            rect.setAttribute('fill', this.settings.highlightColor);
            rect.setAttribute('fill-opacity', this.settings.highlightOpacity);
            rect.setAttribute('stroke', this.settings.highlightColor);
            rect.setAttribute('stroke-width', '2px');
            rect.setAttribute('filter', 'drop-shadow(0 0 5px ' + this.settings.highlightColor + ')');
        }
    }

    // Подсветка связи
    _highlightEdge(element) {
        // Сохраняем оригинальные стили
        const path = element.querySelector('path');
        if (path) {
            this.state.originalStyles.set(path, {
                stroke: path.getAttribute('stroke'),
                strokeWidth: path.getAttribute('stroke-width'),
                filter: path.getAttribute('filter')
            });

            // Применяем новые стили
            path.setAttribute('stroke', this.settings.highlightColor);
            path.setAttribute('stroke-width', '3px');
            path.setAttribute('filter', 'drop-shadow(0 0 3px ' + this.settings.highlightColor + ')');
        }

        // Подсветка стрелки если есть
        const marker = element.querySelector('marker path');
        if (marker) {
            this.state.originalStyles.set(marker, {
                fill: marker.getAttribute('fill'),
                stroke: marker.getAttribute('stroke')
            });

            marker.setAttribute('fill', this.settings.highlightColor);
            marker.setAttribute('stroke', this.settings.highlightColor);
        }
    }

    // Подсветка кластера
    _highlightCluster(element) {
        // Сохраняем оригинальные стили
        const rect = element.querySelector('rect');
        if (rect) {
            this.state.originalStyles.set(rect, {
                fill: rect.getAttribute('fill'),
                stroke: rect.getAttribute('stroke'),
                strokeWidth: rect.getAttribute('stroke-width'),
                fillOpacity: rect.getAttribute('fill-opacity')
            });

            // Применяем новые стили
            rect.setAttribute('fill', this.settings.highlightColor);
            rect.setAttribute('fill-opacity', this.settings.highlightOpacity / 2);
            rect.setAttribute('stroke', this.settings.highlightColor);
            rect.setAttribute('stroke-width', '2px');
        }
    }

    // Показ всплывающей подсказки
    _showTooltip(element, x, y) {
        // Удаляем предыдущую подсказку если есть
        this._hideTooltip();

        // Получаем текст для подсказки
        let text = this._getElementTooltipText(element);
        if (!text) return;

        // Создаем элемент подсказки
        const tooltip = document.createElement('div');
        tooltip.className = 'mermaid-tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);

        // Позиционируем подсказку над элементом
        const tooltipRect = tooltip.getBoundingClientRect();
        tooltip.style.left = `${x - tooltipRect.width / 2}px`;
        tooltip.style.top = `${y - tooltipRect.height - 15}px`;

        // Сохраняем ссылку на элемент подсказки
        this.state.tooltipElement = tooltip;
    }

    // Скрытие подсказки
    _hideTooltip() {
        if (this.state.tooltipElement) {
            document.body.removeChild(this.state.tooltipElement);
            this.state.tooltipElement = null;
        }
    }

    // Получение текста для подсказки
    _getElementTooltipText(element) {
        // Узел
        if (element.classList.contains('node')) {
            const label = element.querySelector('text tspan');
            return label ? `Узел: ${label.textContent}` : 'Узел';
        }
        // Связь
        else if (element.classList.contains('edgePath')) {
            const label = element.querySelector('.edgeLabel text tspan');
            return label ? `Связь: ${label.textContent}` : 'Связь';
        }
        // Кластер
        else if (element.classList.contains('cluster')) {
            const label = element.querySelector('.cluster-label text tspan');
            return label ? `Группа: ${label.textContent}` : 'Группа';
        }

        return 'Элемент диаграммы';
    }

    // Сброс подсветки
    resetHighlight() {
        if (!this.state.highlightedElement) {
            return;
        }

        // Удаляем классы анимации
        this.state.highlightedElement.classList.remove('mermaid-highlighted-element', 'pulse');

        // Восстанавливаем оригинальные стили
        this.state.originalStyles.forEach((styles, element) => {
            Object.entries(styles).forEach(([prop, value]) => {
                if (value) {
                    element.setAttribute(prop, value);
                } else {
                    element.removeAttribute(prop);
                }
            });
        });

        // Очищаем сохраненные стили
        this.state.originalStyles.clear();

        // Скрываем подсказку
        this._hideTooltip();

        // Очищаем текущий выделенный элемент
        this.state.highlightedElement = null;
    }

    // Изменение настроек плагина
    updateSettings(newSettings) {
        this.settings = {
            ...this.settings,
            ...newSettings
        };

        // Обновляем стили если уже были внедрены
        if (this.state.styleElement) {
            this._injectStyles();
        }

        return this;
    }

    // Отключение плагина
    destroy() {
        // Сбрасываем текущую подсветку
        this.resetHighlight();

        // Удаляем обработчики событий
        if (this.state.diagramContainer && this.state.clickHandler) {
            this.state.diagramContainer.removeEventListener('click', this.state.clickHandler);
        }

        if (this.settings.resetOnClickOutside) {
            document.removeEventListener('click', this._handleOutsideClick.bind(this));
        }

        // Удаляем внедренные стили
        if (this.state.styleElement) {
            document.head.removeChild(this.state.styleElement);
        }

        // Сбрасываем состояние
        this.state = {
            diagramContainer: null,
            highlightedElement: null,
            originalStyles: new Map(),
            styleElement: null,
            clickHandler: null,
            tooltipElement: null
        };

        console.log('Плагин HighlightPlugin отключен');
    }
}

// Экспорт для использования в других модулях
export default HighlightPlugin;
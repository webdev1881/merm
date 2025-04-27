// SvgExportPlugin.js
// Плагин для экспорта Mermaid-диаграммы в формат SVG

export class SvgExportPlugin {
    constructor(options = {}) {
      // Настройки по умолчанию
      this.settings = {
        fileName: options.fileName || 'mermaid-diagram',
        includeStyles: options.includeStyles !== undefined ? options.includeStyles : true,
        includeDefs: options.includeDefs !== undefined ? options.includeDefs : true,
        removeInlineStyles: options.removeInlineStyles !== undefined ? options.removeInlineStyles : false,
        scale: options.scale || 1,
        customCSS: options.customCSS || '',
        beforeExport: options.beforeExport || null, // Callback перед экспортом
        afterExport: options.afterExport || null, // Callback после экспорта
        addWatermark: options.addWatermark || false,
        watermarkText: options.watermarkText || 'Created with Mermaid',
        background: options.background || null // null для прозрачного фона или цвет (#ffffff)
      };
    }
  
    /**
     * Экспорт SVG из контейнера с диаграммой
     * @param {HTMLElement} container - DOM-элемент, содержащий диаграмму
     * @returns {Promise<string>} - Promise с SVG-кодом
     */
    async exportSvg(container) {
      if (!container) {
        throw new Error('Не указан контейнер с диаграммой');
      }
  
      // Найти SVG в контейнере
      const svgElement = container.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG-элемент не найден в указанном контейнере');
      }
  
      // Вызываем callback перед экспортом если он задан
      if (typeof this.settings.beforeExport === 'function') {
        await this.settings.beforeExport(svgElement, container);
      }
  
      // Клонируем SVG для изменений, чтобы не затронуть оригинал
      const svgClone = this._cloneSvg(svgElement);
  
      // Применяем параметры экспорта
      this._applySvgExportSettings(svgClone);
  
      // Собираем SVG строку
      const svgString = this._getSvgString(svgClone);
  
      // Вызываем callback после экспорта если он задан
      if (typeof this.settings.afterExport === 'function') {
        await this.settings.afterExport(svgString, svgClone);
      }
  
      return svgString;
    }
  
    /**
     * Скачивание SVG как файл
     * @param {HTMLElement} container - DOM-элемент, содержащий диаграмму
     * @param {string} [fileName] - Опциональное имя файла (переопределяет имя из настроек)
     * @returns {Promise<void>}
     */
    async downloadSvg(container, fileName) {
      const svgString = await this.exportSvg(container);
      const downloadFileName = fileName || this.settings.fileName;
      
      // Создаем Blob из SVG строки
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      
      // Создаем URL для скачивания
      const url = URL.createObjectURL(blob);
      
      // Создаем ссылку для скачивания
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${downloadFileName}.svg`;
      
      // Добавляем ссылку в DOM, кликаем по ней и удаляем
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // Освобождаем URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  
    /**
     * Создает PNG из SVG и скачивает его
     * @param {HTMLElement} container - DOM-элемент, содержащий диаграмму
     * @param {string} [fileName] - Опциональное имя файла
     * @param {number} [scale] - Масштаб для PNG (по умолчанию из настроек)
     * @returns {Promise<void>}
     */
    async downloadPng(container, fileName, scale) {
      const svgString = await this.exportSvg(container);
      const downloadFileName = fileName || this.settings.fileName;
      const exportScale = scale || this.settings.scale;
      
      // Создаем новое изображение
      const img = new Image();
      
      // Создаем Blob из SVG строки и получаем URL
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      // Возвращаем Promise, который разрешится, когда изображение загрузится
      return new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            // Создаем canvas для рендеринга
            const canvas = document.createElement('canvas');
            
            // Устанавливаем размеры canvas с учетом масштаба
            canvas.width = img.width * exportScale;
            canvas.height = img.height * exportScale;
            
            // Получаем контекст и рисуем изображение
            const ctx = canvas.getContext('2d');
            
            // Если задан фон, заполняем canvas этим цветом
            if (this.settings.background) {
              ctx.fillStyle = this.settings.background;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // Масштабируем canvas
            ctx.scale(exportScale, exportScale);
            
            // Рисуем SVG
            ctx.drawImage(img, 0, 0);
            
            // Экспортируем canvas как PNG
            canvas.toBlob((pngBlob) => {
              // Создаем URL для скачивания
              const pngUrl = URL.createObjectURL(pngBlob);
              
              // Создаем ссылку для скачивания
              const downloadLink = document.createElement('a');
              downloadLink.href = pngUrl;
              downloadLink.download = `${downloadFileName}.png`;
              
              // Скачиваем
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              
              // Освобождаем ресурсы
              URL.revokeObjectURL(url);
              URL.revokeObjectURL(pngUrl);
              
              resolve();
            }, 'image/png');
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = (error) => {
          URL.revokeObjectURL(url);
          reject(new Error('Не удалось загрузить SVG в изображение'));
        };
        
        // Загружаем SVG в изображение
        img.src = url;
      });
    }
  
    /**
     * Клонирование SVG-элемента
     * @param {SVGElement} svgElement - Исходный SVG-элемент
     * @returns {SVGElement} - Клонированный SVG-элемент
     * @private
     */
    _cloneSvg(svgElement) {
      // Клонируем SVG
      const clone = svgElement.cloneNode(true);
      
      // Убеждаемся, что у клона есть viewBox
      if (!clone.getAttribute('viewBox') && (clone.getAttribute('width') && clone.getAttribute('height'))) {
        const width = clone.getAttribute('width');
        const height = clone.getAttribute('height');
        clone.setAttribute('viewBox', `0 0 ${width} ${height}`);
      }
      
      return clone;
    }
  
    /**
     * Применение настроек экспорта к SVG
     * @param {SVGElement} svgElement - SVG-элемент для модификации
     * @private
     */
    _applySvgExportSettings(svgElement) {
      // Добавление стилей если нужно
      if (this.settings.includeStyles) {
        this._inlineStyles(svgElement);
      }
      
      // Удаление встроенных стилей если нужно
      if (this.settings.removeInlineStyles) {
        this._removeInlineStyles(svgElement);
      }
      
      // Добавление пользовательских стилей если указаны
      if (this.settings.customCSS) {
        this._addCustomStyles(svgElement, this.settings.customCSS);
      }
      
      // Добавление фона если нужно
      if (this.settings.background) {
        this._addBackground(svgElement, this.settings.background);
      }
      
      // Добавление водяного знака если нужно
      if (this.settings.addWatermark) {
        this._addWatermark(svgElement, this.settings.watermarkText);
      }
      
      // Удаление ненужных атрибутов
      this._cleanupAttributes(svgElement);
    }
  
    /**
     * Добавление встроенных стилей в SVG
     * @param {SVGElement} svgElement - SVG-элемент
     * @private
     */
    _inlineStyles(svgElement) {
      // Получаем все стили из документа, которые могут влиять на SVG
      const styleSheets = document.styleSheets;
      let cssRules = [];
      
      // Извлекаем CSS-правила из всех таблиц стилей
      for (let i = 0; i < styleSheets.length; i++) {
        try {
          const rules = styleSheets[i].cssRules || styleSheets[i].rules;
          if (rules) {
            for (let j = 0; j < rules.length; j++) {
              cssRules.push(rules[j].cssText);
            }
          }
        } catch (e) {
          // Пропускаем таблицы стилей, к которым нет доступа из-за CORS
          console.warn('Не удалось получить доступ к таблице стилей', e);
        }
      }
      
      // Создаем элемент style и добавляем в него собранные правила
      const styleElement = document.createElement('style');
      styleElement.setAttribute('type', 'text/css');
      styleElement.innerHTML = cssRules.join('\n');
      
      // Добавляем стили в SVG
      const defs = svgElement.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      if (!svgElement.querySelector('defs')) {
        svgElement.insertBefore(defs, svgElement.firstChild);
      }
      defs.appendChild(styleElement);
    }
  
    /**
     * Удаление встроенных стилей из SVG
     * @param {SVGElement} svgElement - SVG-элемент
     * @private
     */
    _removeInlineStyles(svgElement) {
      // Находим все элементы с атрибутом style
      const elementsWithStyle = svgElement.querySelectorAll('[style]');
      
      // Удаляем атрибут style у всех найденных элементов
      elementsWithStyle.forEach(element => {
        element.removeAttribute('style');
      });
    }
  
    /**
     * Добавление пользовательских стилей в SVG
     * @param {SVGElement} svgElement - SVG-элемент
     * @param {string} css - CSS-код
     * @private
     */
    _addCustomStyles(svgElement, css) {
      const styleElement = document.createElement('style');
      styleElement.setAttribute('type', 'text/css');
      styleElement.innerHTML = css;
      
      // Добавляем в defs или создаем его если нет
      const defs = svgElement.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      if (!svgElement.querySelector('defs')) {
        svgElement.insertBefore(defs, svgElement.firstChild);
      }
      defs.appendChild(styleElement);
    }
  
    /**
     * Добавление фона к SVG
     * @param {SVGElement} svgElement - SVG-элемент
     * @param {string} color - Цвет фона
     * @private
     */
    _addBackground(svgElement, color) {
      // Получаем размеры SVG
      const width = svgElement.getAttribute('width') || svgElement.viewBox.baseVal.width;
      const height = svgElement.getAttribute('height') || svgElement.viewBox.baseVal.height;
      
      // Создаем прямоугольник для фона
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', color);
      
      // Добавляем прямоугольник в начало SVG
      svgElement.insertBefore(rect, svgElement.firstChild);
    }
  
    /**
     * Добавление водяного знака в SVG
     * @param {SVGElement} svgElement - SVG-элемент
     * @param {string} text - Текст водяного знака
     * @private
     */
    _addWatermark(svgElement, text) {
      // Получаем размеры SVG
      const svgWidth = svgElement.getAttribute('width') || svgElement.viewBox.baseVal.width;
      const svgHeight = svgElement.getAttribute('height') || svgElement.viewBox.baseVal.height;
      
      // Создаем группу для водяного знака
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Создаем текстовый элемент
      const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textElement.setAttribute('x', svgWidth - 10);
      textElement.setAttribute('y', svgHeight - 10);
      textElement.setAttribute('text-anchor', 'end');
      textElement.setAttribute('font-family', 'Arial, sans-serif');
      textElement.setAttribute('font-size', '12px');
      textElement.setAttribute('fill', 'rgba(0,0,0,0.3)');
      textElement.textContent = text;
      
      // Добавляем текст в группу
      g.appendChild(textElement);
      
      // Добавляем группу в SVG
      svgElement.appendChild(g);
    }
  
    /**
     * Очистка ненужных атрибутов из SVG
     * @param {SVGElement} svgElement - SVG-элемент
     * @private
     */
    _cleanupAttributes(svgElement) {
      // Список атрибутов для удаления
      const attributesToRemove = [
        'data-mermaid-id',
        'class'
      ];
      
      // Удаляем атрибуты у корневого SVG
      attributesToRemove.forEach(attr => {
        if (svgElement.hasAttribute(attr)) {
          svgElement.removeAttribute(attr);
        }
      });
      
      // Проставляем правильные размеры
      if (!svgElement.hasAttribute('width') && svgElement.viewBox.baseVal) {
        svgElement.setAttribute('width', svgElement.viewBox.baseVal.width);
      }
      
      if (!svgElement.hasAttribute('height') && svgElement.viewBox.baseVal) {
        svgElement.setAttribute('height', svgElement.viewBox.baseVal.height);
      }
      
      // Добавляем xmlns для standalone SVG
      svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      if (this.settings.includeDefs) {
        svgElement.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      }
    }
  
    /**
     * Преобразование SVG-элемента в строку
     * @param {SVGElement} svgElement - SVG-элемент
     * @returns {string} - SVG в виде строки
     * @private
     */
    _getSvgString(svgElement) {
      // Получаем XML-строку из SVG-элемента
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgElement);
      
      // Добавляем XML-заголовок
      svgString = '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n' + svgString;
      
      return svgString;
    }
  
    /**
     * Обновление настроек плагина
     * @param {Object} newSettings - Новые настройки
     * @returns {SvgExportPlugin} - Текущий экземпляр плагина
     */
    updateSettings(newSettings) {
      this.settings = {
        ...this.settings,
        ...newSettings
      };
      return this;
    }
  }
  
  // Экспорт для использования в других модулях
  export default SvgExportPlugin;
// DiagramExamples.js
// Модуль с примерами различных типов Mermaid диаграмм

export const DIAGRAM_EXAMPLES = {
    // Блок-схемы
    flowchart: {
      title: 'Блок-схема',
      description: 'Блок-схема с различными типами узлов и связей',
      code: `flowchart TD
      A[Начало] --> B{Условие}
      B -->|Да| C[Процесс 1]
      B -->|Нет| D[Процесс 2]
      C --> E[Процесс 3]
      D --> E
      E --> F[Конец]
      
      subgraph Подпроцесс
      G[Шаг 1] --> H[Шаг 2]
      H --> I[Шаг 3]
      end
      
      F --> G
      I --> A`
    },
    
    // Диаграмма последовательности
    sequence: {
      title: 'Диаграмма последовательности',
      description: 'Показывает последовательность взаимодействия между объектами',
      code: `sequenceDiagram
      participant Клиент
      participant Сервер
      participant БД
      
      Клиент->>Сервер: Отправить запрос
      activate Сервер
      Сервер->>БД: Запрос данных
      activate БД
      БД-->>Сервер: Результат запроса
      deactivate БД
      Сервер-->>Клиент: Ответ
      deactivate Сервер
      
      Note right of Клиент: Пользователь получает<br>результат запроса
      
      Клиент->>Сервер: Новый запрос
      activate Сервер
      Сервер-->>Клиент: Быстрый ответ
      deactivate Сервер`
    },
    
    // Диаграмма классов
    classDiagram: {
      title: 'Диаграмма классов',
      description: 'Структура классов, их атрибуты, методы и взаимосвязи',
      code: `classDiagram
      class Animal {
        +String name
        +int age
        +makeSound()
      }
      
      class Dog {
        +String breed
        +bark()
      }
      
      class Cat {
        +String color
        +meow()
      }
      
      class Owner {
        +String name
        +feedPet(Animal)
      }
      
      Animal <|-- Dog : наследует
      Animal <|-- Cat : наследует
      Owner "1" --> "*" Animal : владеет`
    },
    
    // ER-диаграмма
    entityRelationship: {
      title: 'ER-диаграмма',
      description: 'Диаграмма отношений между сущностями (для проектирования баз данных)',
      code: `erDiagram
      CUSTOMER ||--o{ ORDER : places
      ORDER ||--|{ ORDER_ITEM : contains
      CUSTOMER {
          int id PK
          string name
          string email
      }
      ORDER {
          int id PK
          int customer_id FK
          date order_date
          string status
      }
      ORDER_ITEM {
          int order_id PK, FK
          int product_id PK, FK
          int quantity
          float price
      }
      PRODUCT {
          int id PK
          string name
          float price
      }
      ORDER_ITEM }|--|| PRODUCT : references`
    },
    
    // Диаграмма состояний
    stateDiagram: {
      title: 'Диаграмма состояний',
      description: 'Показывает состояния объекта и переходы между ними',
      code: `stateDiagram-v2
      [*] --> Выключено
      Выключено --> Включено : Нажать кнопку
      Включено --> Воспроизведение : Нажать Play
      Воспроизведение --> Пауза : Нажать Pause
      Пауза --> Воспроизведение : Нажать Play
      Пауза --> Выключено : Нажать кнопку
      Воспроизведение --> Выключено : Нажать кнопку
      
      state Включено {
        [*] --> Ожидание
        Ожидание --> Загрузка : Выбрать файл
        Загрузка --> Готово : Загрузка завершена
        Готово --> Ожидание : Сбросить
      }
      
      Выключено --> [*]`
    },
    
    // Диаграмма Ганта
    gantt: {
      title: 'Диаграмма Ганта',
      description: 'Визуализация графика проекта и распределения задач',
      code: `gantt
      title Проект: Разработка веб-приложения
      dateFormat  YYYY-MM-DD
      
      section Планирование
      Анализ требований      :done, a1, 2023-01-01, 7d
      Проектирование         :active, a2, after a1, 10d
      
      section Разработка
      Разработка Backend     :b1, after a2, 15d
      Разработка Frontend    :b2, after a2, 12d
      
      section Тестирование
      Модульное тестирование :c1, after b1, 5d
      Интеграционное тестирование :c2, after c1, 5d
      
      section Развертывание
      Развертывание          :d1, after c2, 2d
      Обучение               :d2, after d1, 3d`
    },
    
    // Круговая диаграмма
    pie: {
      title: 'Круговая диаграмма',
      description: 'Визуализация пропорций частей целого',
      code: `pie
      title Распределение времени проекта
      "Разработка" : 40
      "Тестирование" : 20
      "Документация" : 15
      "Управление проектом" : 10
      "Развертывание" : 15`
    },
    
    // Диаграмма Git истории
    gitGraph: {
      title: 'Git-граф',
      description: 'Визуализация истории Git репозитория',
      code: `gitGraph LR:
      commit id: "A"
      commit id: "B"
      branch develop
      checkout develop
      commit id: "C"
      commit id: "D"
      checkout main
      commit id: "E"
      merge develop id: "F" tag: "v1.0.0"
      branch feature
      checkout feature
      commit id: "G"
      commit id: "H"
      checkout develop
      commit id: "I"
      checkout main
      merge develop id: "J"
      checkout feature
      commit id: "K"
      checkout main
      merge feature id: "L" tag: "v2.0.0"`
    },
    
    // Требования (новая диаграмма)
    requirement: {
      title: 'Диаграмма требований',
      description: 'Визуализация требований к системе',
      code: `requirementDiagram
      requirement high_level {
      id: 1
      text: Система должна поддерживать аутентификацию пользователей
      risk: high
      verifymethod: test
      }
      
      element auth_system {
      type: system
      }
      
      element db {
      type: database
      }
      
      high_level - satisfies -> auth_system
      auth_system - contains -> db`
    },
    
    // C4 Модель
    c4: {
      title: 'C4 диаграмма',
      description: 'Визуализация архитектуры программного обеспечения',
      code: `C4Context
      title Контекстная диаграмма для интернет-магазина
      
      Person(customer, "Покупатель", "Желает приобрести товары")
      Person(admin, "Администратор", "Управляет товарами и заказами")
      
      System(shop, "Интернет-магазин", "Предоставляет возможность просматривать и заказывать товары")
      
      System_Ext(payment, "Платежная система", "Обрабатывает платежи")
      System_Ext(delivery, "Система доставки", "Обрабатывает доставку товаров")
      
      Rel(customer, shop, "Использует")
      Rel(admin, shop, "Управляет")
      Rel(shop, payment, "Отправляет запросы на оплату")
      Rel(shop, delivery, "Отправляет данные о заказах")`
    },
    
    // Блок-схема с расширенными возможностями
    flowchartAdvanced: {
      title: 'Расширенная блок-схема',
      description: 'Демонстрация дополнительных возможностей для блок-схем',
      code: `flowchart TD
      A[Начало] --> B{Проверка<br>условий}
      B -->|Успех| C[Стандартная<br>обработка]
      B -->|Ошибка| D[Обработка<br>ошибки]
      
      C --> E[[Обработчик API]]
      D --> F[[Логирование]]
      
      E --> G[(База<br>данных)]
      F --> G
      
      G --> H{{Формирование<br>ответа}}
      H --> I[/Возврат<br>результата/]
      I --> J([Конец])
      
      style A fill:#f9f,stroke:#333,stroke-width:2px
      style B fill:#bbf,stroke:#33f,stroke-width:2px
      style C fill:#bfb,stroke:#3a3,stroke-width:2px
      style D fill:#fbb,stroke:#a33,stroke-width:2px
      style E fill:#fdd,stroke:#333,stroke-width:1px
      style F fill:#fdd,stroke:#333,stroke-width:1px
      style G fill:#dfd,stroke:#333,stroke-width:1px
      style H fill:#ddf,stroke:#333,stroke-width:1px
      style I fill:#ddd,stroke:#333,stroke-width:1px
      style J fill:#ffd,stroke:#333,stroke-width:1px
      
      linkStyle 0 stroke:#0ff,stroke-width:2px
      linkStyle 1 stroke:#0f0,stroke-width:1.5px
      linkStyle 2 stroke:#f00,stroke-width:1.5px`
    },
    
    // Диаграмма сетевой инфраструктуры
    mindmap: {
      title: 'Интеллект-карта',
      description: 'Визуализация иерархической структуры идей',
      code: `mindmap
      root((Проект<br>веб-приложения))
          Фронтенд
              HTML/CSS
                  Bootstrap
                  Tailwind
              JavaScript
                  React
                      Компоненты
                      Хуки
                  Vue
                  Angular
          Бэкенд
              Python
                  Django
                  Flask
              Node.js
                  Express
                  Koa
              PHP
                  Laravel
                  Symfony
          База данных
              Реляционные
                  MySQL
                  PostgreSQL
              NoSQL
                  MongoDB
                  Redis
          DevOps
              CI/CD
              Docker
              Kubernetes`
    },
    
    // Диаграмма последовательности с петлями
    sequenceAdvanced: {
      title: 'Расширенная диаграмма последовательности',
      description: 'Демонстрация циклов и альтернатив в диаграмме последовательности',
      code: `sequenceDiagram
      actor User as Пользователь
      participant Client as Клиент
      participant Server as Сервер
      participant DB as База данных
      
      User->>Client: Вводит данные
      Client->>Client: Валидирует данные
      
      alt Данные валидны
          Client->>Server: Отправляет запрос
          activate Server
          
          Server->>DB: Запрос к БД
          activate DB
          
          loop Для каждого элемента
              DB->>DB: Обработка запроса
          end
          
          DB-->>Server: Возвращает данные
          deactivate DB
          
          Server-->>Client: Успешный ответ
          deactivate Server
          Client-->>User: Отображает результат
          
      else Данные невалидны
          Client-->>User: Показывает ошибку валидации
      end
      
      opt Дополнительный запрос
          User->>Client: Запрашивает больше данных
          Client->>Server: Отправляет доп. запрос
          Server-->>Client: Возвращает доп. данные
          Client-->>User: Отображает доп. данные
      end`
    }
  };
  
  // Функция для получения списка доступных примеров
  export function getDiagramExamplesList() {
    return Object.keys(DIAGRAM_EXAMPLES).map(key => ({
      id: key,
      title: DIAGRAM_EXAMPLES[key].title
    }));
  }
  
  // Функция для получения конкретного примера по id
  export function getDiagramExample(id) {
    return DIAGRAM_EXAMPLES[id] || null;
  }
  
  // Экспорт по умолчанию
  export default DIAGRAM_EXAMPLES;
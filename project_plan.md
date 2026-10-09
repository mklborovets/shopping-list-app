# План розробки: Спільні списки покупок

Цей документ описує архітектуру, структуру проєкту та покроковий план комітів для виконання тестового завдання.

## 1. Архітектура бази даних (Firestore)

Оскільки клієнтський SDK Firebase не дозволяє шукати користувачів в Auth за email, ми будемо дублювати базові дані користувачів у колекцію `users` при реєстрації.

### Колекція `users`
Використовується для пошуку користувачів при шерингу.
- **Document ID**: `uid` (такий самий, як в Auth)
- `email`: string
- `createdAt`: timestamp

### Колекція `lists`
- **Document ID**: auto-generated
- `name`: string
- `ownerId`: string (uid власника)
- `sharedWith`: array of strings (масив `uid` користувачів, яким надано доступ)
- `createdAt`: timestamp

### Підколекція `items` (всередині конкретного документа списку `lists/{listId}/items`)
- **Document ID**: auto-generated
- `name`: string
- `quantity`: string (опціонально)
- `isBought`: boolean
- `createdAt`: timestamp (для сортування)

---

## 2. Структура проєкту (Expo + expo-router)

Використовуємо `expo-router` для зручної файлової навігації.

```text
/
├── app/                      # Екрани та навігація (expo-router)
│   ├── _layout.tsx           # Кореневий layout (Провайдер авторизації)
│   ├── (auth)/               # Група екранів без авторизації
│   │   ├── login.tsx         # Вхід
│   │   └── register.tsx      # Реєстрація
│   └── (main)/               # Група екранів для авторизованих
│       ├── _layout.tsx       # Захищений layout (редирект якщо не авторизований)
│       ├── index.tsx         # Головний екран (Мої списки + розшарені мені)
│       └── list/
│           └── [id].tsx      # Екран конкретного списку (Елементи)
├── components/               # Перевикористовувані UI компоненти
│   ├── ui/                   # Базові (Button, Input, Loader, ErrorMessage)
│   └── lists/                # Специфічні (ListCard, ListItem, ShareModal)
├── services/                 # Робота з Firebase
│   ├── firebase.ts           # Ініціалізація Firebase та підключення до емуляторів
│   ├── auth.ts               # Функції логіну, реєстрації, логауту
│   └── firestore.ts          # CRUD операції для списків та елементів
├── hooks/                    # Кастомні хуки (напр. useAuth, useLists)
├── types/                    # TypeScript інтерфейси та типи
├── firestore.rules           # Правила безпеки Firestore
├── firebase.json             # Конфігурація Firebase емуляторів
└── README.md                 # Документація проєкту
```

---

## 3. План комітів (Ітеративна розробка)

Щоб уникнути одного великого коміту в кінці, розробку варто розбити на логічні кроки. Кожен з цих кроків має бути окремим комітом.

1. **`init: setup Expo project with TypeScript and expo-router`**
   - Створення базового застосунку, налаштування лінтерів (eslint/prettier), базової структури папок.

2. **`chore: configure Firebase SDK and Emulator Suite`**
   - Додавання конфігів `firebase.json`, ініціалізація застосунку Firebase в коді, налаштування динамічного підключення до емуляторів (локалхост або IP комп'ютера для фізичного пристрою).

3. **`feat: implement Auth flow`**
   - Екрани реєстрації та логіну. Стан авторизації (Context або хук `useAuth`). Обробка типових помилок.

4. **`feat: sync users collection in Firestore on registration`**
   - Створення запису в колекції `users` одразу після успішної реєстрації в Firebase Auth, щоб пізніше використовувати це для шерингу.

5. **`feat: implement Shopping Lists CRUD`**
   - Створення, читання, перейменування та видалення списків. Відображення на головному екрані.

6. **`feat: implement List Items with realtime updates`**
   - Екран списку, додавання покупок (назва, кількість). Зміна статусу (куплено/ні) та видалення. Підписка на оновлення в реальному часі за допомогою `onSnapshot`. Підрахунок прогресу.

7. **`feat: implement List sharing by email`**
   - Логіка пошуку `uid` за email в колекції `users` та додавання цього `uid` в масив `sharedWith` списку. UI модалки для додавання учасників.

8. **`chore: write and enforce Firestore Security Rules`**
   - Написання `firestore.rules`, щоб власник мав повний доступ, учасники — тільки до елементів списку, інші — взагалі нічого.

9. **`test: add rules-unit-testing for Firestore rules`**
   - Написання тестів у папці `tests/` для перевірки `firestore.rules` (allow/deny для власника, учасника, аноніма).

10. **`refactor: handle loading, empty states and UI polish`**
   - Додавання індикаторів завантаження, порожніх станів (empty states), обробка відсутності мережі, блокування подвійного відправлення форм.

11. **`docs: update README with setup instructions and architecture notes`**
   - Написання інструкції із запуску (для емуляторів та фізичних пристроїв), опис моделі даних та роботи з правилами.

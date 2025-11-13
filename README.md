# OmniLens AI

OmniLens AI is a cross-platform React Native (Expo) application that turns physical captures into searchable, well-organized digital knowledge. The MVP delivers the full capture → analyze → organize workflow outlined in the OmniLens PRD, including camera and gallery intake, LLM-powered enrichment, local storage, offline-safe queuing, and actionable library management.

## ✨ Core Capabilities

- **Capture anything**: take photos directly inside the app or import existing images from the gallery.
- **LLM-backed understanding**: send captures to an LLM API for OCR, object recognition, suggested titles, categories, and tags.
- **Smart library**: browse a responsive feed with search, keyword filtering, tag/category filters, and collection management.
- **Rich detail view**: review AI insights, edit metadata, share, export, or delete individual items.
- **Offline friendly**: captures taken without connectivity are stored locally, surfaced as "Queued", and processed automatically when the device reconnects.

## 🧱 Project Structure

```
.
├── App.tsx                   # App bootstrap, fonts, navigation, providers
├── app.json                  # Expo configuration
├── assets/                   # Placeholder icons/splash (replace for production)
├── src/
│   ├── components/           # Reusable UI elements (cards, filters, FAB, tag chips)
│   ├── context/              # LibraryProvider state + orchestration
│   ├── navigation/           # Native stack navigator definitions
│   ├── screens/              # Camera, Library, Item detail, Metadata, Collections screens
│   ├── services/             # LLM API client
│   ├── storage/              # SQLite persistence helpers & offline queue
│   ├── theme/                # Color + typography tokens
│   ├── utils/                # File-system helpers for capture storage
│   └── types.ts              # Shared domain models
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## ⚙️ Setup & Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure the LLM endpoint**
   Create an `.env` file (or use Expo CLI `--config`) to expose the backend endpoint:
   ```bash
   echo "EXPO_PUBLIC_LLM_ENDPOINT=https://your-llm-endpoint.example.com/analyze" > .env
   ```

3. **Run the app**
   ```bash
   npm run start
   ```
   Use the Expo CLI output to launch on iOS Simulator, Android emulator, or a device via Expo Go.

4. **Type checking & linting**
   ```bash
   npm run lint
   ```

## Design mode & mock data

- The app now boots with curated mock collections/items so UI/UX can be finalized without wiring storage or the LLM endpoint. This mode is enabled by default via the new `EXPO_PUBLIC_USE_MOCK_DATA` flag.
- To keep design data active, ensure your `.env` contains `EXPO_PUBLIC_USE_MOCK_DATA=true`. Remote image URLs in `src/data/mockData.ts` drive the gallery cards.
- When you're ready to integrate the real SQLite + LLM flow, set `EXPO_PUBLIC_USE_MOCK_DATA=false`, provide a valid `EXPO_PUBLIC_LLM_ENDPOINT`, and restart Expo (`npm run start -- --clear`) so Metro picks up the new env vars.

## 📱 Feature Walkthrough

1. **Library (default)**
   - Search across titles, notes, and OCR text.
   - Filter using categories, tags, or collections.
   - Create and manage collections, see queued captures, and tap any card for details.

2. **Camera**
   - Capture new photos or import from the gallery.
   - Successful captures instantly appear in the library.
   - When offline, items are marked as "Queued" and processed automatically later.

3. **Item details**
   - Review the AI-enhanced summary, notes, OCR text, and identified objects.
   - Edit metadata, export the content as a `.txt`, or share via the system share sheet.
   - Delete unwanted items safely.

4. **Metadata editing & Collections**
   - Update titles, notes, categories, and tags.
   - Create, rename, or delete collections and assign captures accordingly.

## 🗄️ Storage & Offline Strategy

- **SQLite** persists items, collections, and queued scan metadata (via Expo SQLite Async API).
- **Document storage** keeps capture images inside the app sandbox (`FileSystem.documentDirectory/captures`).
- **Offline queue** keeps track of pending scans (with references to placeholder items). When connectivity returns, the queue is processed and items are updated in place.

## 🧪 Testing Notes

- Physical camera functionality requires a simulator with camera support or a real device.
- Sharing/export leverages native modules (`expo-sharing`, `expo-file-system`), which are no-ops on the web target.

## 🚀 Next Steps (beyond MVP)

- Integrate analytics to measure capture frequency and search behaviour.
- Add background sync with progress indicators.
- Support batch actions (multi-select, bulk export) and collaboration features.
- Layer in richer AI summaries, reminders, or cross-collection suggestions.

Happy scanning! 🎯

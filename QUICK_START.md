# 🚀 Quick Start

**3ステップで始める QA Automation Framework**

---

## ⚡ 最速セットアップ

### ステップ1: セットアップ（1コマンド）

```bash
npm run setup
```

**実行内容:**
- ✅ npm install
- ✅ Playwright browsers install
- ✅ .env file creation

**所要時間: 3-5分**

---

### ステップ2: 環境変数編集

```bash
# Windowsの場合
notepad .env

# Mac/Linuxの場合
nano .env
```

**最低限の設定:**
```env
BASE_URL=https://your-app.com
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=password123
```

---

### ステップ3: テスト実行

```bash
npm test
```

**完了！🎉**

---

## 📊 レポート確認

```bash
npm run report
```

ブラウザで自動表示されます。

---

## 🎯 よく使うコマンド

```bash
# UIモード（推奨）
npm run test:ui

# E2Eテストのみ
npm run test:e2e

# APIテストのみ
npm run test:api

# 特定テスト
npm run test:inventory

# デバッグモード
npm run test:debug
```

---

## 🔧 トラブル時

```bash
# 状態確認
npm run check

# クリーンアップ
npm run clean

# 完全再インストール
npm run clean:all
npm run setup
```

---

## 📚 詳細ドキュメント

- [README.md](README.md) - プロジェクト概要
- [SETUP.md](SETUP.md) - 詳細セットアップ
- [COMMANDS.md](COMMANDS.md) - 全コマンド
- [WINDOWS-SETUP.md](WINDOWS-SETUP.md) - Windows専用

---

**これだけ！簡単でしょ？🚀**

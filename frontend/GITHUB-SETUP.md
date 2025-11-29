# 📤 رفع المشروع على GitHub

## الخطوات الكاملة لرفع المشروع:

### 1️⃣ إنشاء Repository على GitHub

1. اذهب إلى [GitHub](https://github.com)
2. اضغط على زر **"New"** أو **"+"** في الأعلى
3. اختر **"New repository"**
4. أدخل المعلومات التالية:
   - **Repository name:** `abdulsalam-app` (أو أي اسم تريده)
   - **Description:** `تطبيق عبدالسلام لإدارة أعمال خياطة وتوزيع الأكياس`
   - **Privacy:** اختر `Private` أو `Public` حسب رغبتك
   - ⚠️ **لا تختر** "Initialize with README" (لأن لدينا README بالفعل)
5. اضغط **"Create repository"**

---

### 2️⃣ ربط المشروع المحلي بـ GitHub

بعد إنشاء الـ repository، ستظهر لك صفحة بها تعليمات. استخدم هذه الأوامر:

```bash
# انتقل إلى مجلد المشروع
cd /path/to/frontend

# أضف remote repository (استبدل YOUR_USERNAME باسم المستخدم الخاص بك)
git remote add origin https://github.com/YOUR_USERNAME/abdulsalam-app.git

# غيّر اسم الفرع إلى main (اختياري)
git branch -M main

# ارفع المشروع
git push -u origin main
```

---

### 3️⃣ إدخال بيانات الدخول

عند تنفيذ أمر `git push`، سيُطلب منك:

**الطريقة 1: استخدام Personal Access Token (موصى بها)**

1. اذهب إلى GitHub Settings
2. Developer settings → Personal access tokens → Tokens (classic)
3. انقر على "Generate new token"
4. اختر الصلاحيات المطلوبة (على الأقل: `repo`)
5. انسخ الـ Token
6. استخدمه بدلاً من كلمة المرور

**الطريقة 2: استخدام GitHub CLI**

```bash
# تثبيت GitHub CLI
# على macOS
brew install gh

# على Linux
sudo apt install gh

# تسجيل الدخول
gh auth login

# رفع المشروع
git push -u origin main
```

---

### 4️⃣ التحديثات المستقبلية

بعد الرفع الأول، لإضافة تحديثات جديدة:

```bash
# إضافة التغييرات
git add .

# عمل commit
git commit -m "وصف التحديثات هنا"

# رفع التحديثات
git push
```

---

## 📋 أوامر Git مفيدة

```bash
# معرفة حالة المشروع
git status

# رؤية التعديلات
git diff

# رؤية سجل الـ commits
git log --oneline

# إلغاء التغييرات في ملف معين
git checkout -- filename

# إنشاء فرع جديد
git checkout -b feature-name

# دمج فرع
git merge feature-name

# سحب آخر التحديثات من GitHub
git pull
```

---

## 🔐 حماية البيانات الحساسة

تأكد من أن ملف `.env` **غير** مرفوع على GitHub إذا احتوى على بيانات حساسة:

```bash
# تحقق من .gitignore
cat .gitignore | grep .env

# إذا لم يكن موجوداً، أضفه
echo ".env" >> .gitignore
```

⚠️ **ملاحظة:** الملف الحالي `.env` يحتوي فقط على متغيرات بيئة Expo وليس بيانات حساسة، لكن من الأفضل استبعاده.

---

## 🌟 إضافة Badges إلى README

بعد الرفع، يمكنك إضافة badges جميلة:

```markdown
![GitHub](https://img.shields.io/github/license/YOUR_USERNAME/abdulsalam-app)
![GitHub last commit](https://img.shields.io/github/last-commit/YOUR_USERNAME/abdulsalam-app)
![GitHub repo size](https://img.shields.io/github/repo-size/YOUR_USERNAME/abdulsalam-app)
```

---

## 📱 GitHub Actions (CI/CD) - اختياري

يمكنك إعداد GitHub Actions لاختبار المشروع تلقائياً:

```yaml
# .github/workflows/test.yml
name: Test App

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: yarn install
      - run: yarn lint
```

---

## 🤝 دعوة المساهمين

لدعوة آخرين للمساهمة:

1. اذهب إلى Settings في الـ repository
2. Collaborators
3. Add people
4. أدخل اسم المستخدم أو البريد الإلكتروني

---

## 📦 إنشاء Release

لإنشاء نسخة Release:

1. اذهب إلى "Releases" في الـ repository
2. انقر "Create a new release"
3. اختر Tag version (مثال: v1.0.0)
4. أضف عنوان ووصف
5. يمكنك رفع ملف `.apk` أو `.ipa` إذا توفر

---

## 🆘 حل المشاكل

**المشكلة: Permission denied**
```bash
# تأكد من صلاحيات SSH أو استخدم HTTPS
git remote set-url origin https://github.com/YOUR_USERNAME/abdulsalam-app.git
```

**المشكلة: Repository already exists**
```bash
# استخدم force push (حذر!)
git push -f origin main
```

**المشكلة: Large files**
```bash
# استخدم Git LFS للملفات الكبيرة
git lfs install
git lfs track "*.zip"
git add .gitattributes
```

---

## ✅ التحقق من النجاح

بعد `git push`، اذهب إلى:
```
https://github.com/YOUR_USERNAME/abdulsalam-app
```

يجب أن ترى جميع الملفات مرفوعة بنجاح! ✨

---

**🎉 مبروك! مشروعك الآن على GitHub!**

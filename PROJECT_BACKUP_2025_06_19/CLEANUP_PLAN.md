# 🧹 Cleanup Plan - Files to Remove

## 📁 **SAFE TO DELETE**

### **1. Development Dependencies**
```bash
# Frontend
frontend/node_modules/          # 500MB+ - Will reinstall
frontend/.next/                 # Build cache
frontend/build/                 # Old build files
frontend/.cache/                # Cache files

# Backend  
backend/node_modules/           # 200MB+ - Will reinstall
backend/.cache/                 # Cache files
```

### **2. Log Files**
```bash
backend/*.log
frontend/*.log
*.debug.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### **3. Test Files (Created during development)**
```bash
test-quiz-scoring.js           # Our test file
test-*.js                      # Any other test files
debug-*.js                     # Debug files
temp-*.js                      # Temporary files
```

### **4. OS Generated Files**
```bash
.DS_Store                      # Mac
Thumbs.db                      # Windows
desktop.ini                    # Windows
*.tmp                          # Temporary files
*.swp                          # Vim swap files
```

### **5. Duplicate/Old Files**
```bash
# Check for duplicates in migrations
backend/src/migrations/005_enhance_questions_table.js
backend/src/migrations/005_game_formats_schema.js  
backend/src/migrations/005_recreate_questions_table.js
# Keep only the latest working version

# Old backup files
*.bak
*.backup
*~
```

### **6. Development Tools**
```bash
.vscode/                       # VSCode settings (optional)
.idea/                         # IntelliJ settings
.cursor/                       # Cursor AI settings (keep if you use it)
```

### **7. Package Lock Files (Optional - will regenerate)**
```bash
frontend/package-lock.json     # Can regenerate
backend/package-lock.json      # Can regenerate
frontend/yarn.lock             # If using npm instead
backend/yarn.lock              # If using npm instead
```

---

## ⚠️ **DO NOT DELETE - CRITICAL FILES**

### **Source Code**
- All `.js`, `.jsx`, `.ts`, `.tsx` files in src/
- All React components
- All backend controllers and services
- All database migrations (keep latest versions)

### **Configuration**
- `package.json` files
- `.env` files
- Database configuration
- Build configuration files

### **User Data**
- Database files (`.db`, `.sqlite`)
- Uploaded files in uploads/
- Any user-generated content

### **Documentation**
- README files
- API documentation
- Setup instructions

---

## 🎯 **RECOMMENDED CLEANUP ACTIONS**

1. **Remove Node Modules** (2GB+ space saved)
2. **Clear Log Files** (Variable space)
3. **Remove Test Files** (Small but clean)
4. **Clean OS Files** (Small but clean)
5. **Optimize Migrations** (Keep only necessary ones)

Would you like me to execute these cleanup actions?

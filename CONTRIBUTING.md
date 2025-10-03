# 🤝 Hướng dẫn đóng góp

Cảm ơn bạn quan tâm đến việc đóng góp cho Hệ thống Quản lý Công việc! 

## 📋 Cách đóng góp

### 1. Fork và Clone
```bash
# Fork repository trên GitHub
# Sau đó clone về máy
git clone https://github.com/YOUR_USERNAME/job-management-system.git
cd job-management-system
```

### 2. Tạo Branch
```bash
# Tạo branch mới cho feature
git checkout -b feature/your-feature-name

# Hoặc cho bug fix
git checkout -b fix/your-bug-description
```

### 3. Cài đặt Dependencies
```bash
npm install
```

### 4. Chạy Development
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend  
npm start
```

## 🎯 Loại đóng góp

### 🐛 Bug Reports
- Mô tả chi tiết bug
- Các bước tái tạo
- Screenshots nếu có
- Environment info

### ✨ Feature Requests
- Mô tả tính năng mong muốn
- Use case cụ thể
- Mockups/wireframes nếu có

### 📚 Documentation
- Cải thiện README
- Thêm comments trong code
- Tạo tutorials
- Translation

### 🎨 UI/UX Improvements
- Cải thiện giao diện
- Responsive design
- Accessibility
- User experience

## 📝 Coding Standards

### JavaScript/React
```javascript
// Sử dụng functional components
const MyComponent = ({ prop1, prop2 }) => {
  const [state, setState] = useState('');
  
  // Event handlers
  const handleClick = () => {
    // Logic here
  };
  
  return (
    <div>
      {/* JSX here */}
    </div>
  );
};
```

### CSS
```css
/* Sử dụng BEM methodology */
.component-name {
  /* Base styles */
}

.component-name__element {
  /* Element styles */
}

.component-name--modifier {
  /* Modifier styles */
}
```

### Naming Conventions
- **Files**: `kebab-case.js` (my-component.js)
- **Components**: `PascalCase` (MyComponent)
- **Variables**: `camelCase` (myVariable)
- **Constants**: `UPPER_SNAKE_CASE` (MY_CONSTANT)

## 🧪 Testing

### Chạy Tests
```bash
npm test
```

### Test Coverage
- Unit tests cho utility functions
- Integration tests cho API endpoints
- Component tests cho React components

## 📤 Pull Request Process

### 1. Commit Messages
```bash
# Format: type(scope): description
git commit -m "feat(auth): add login validation"
git commit -m "fix(ui): resolve mobile layout issue"
git commit -m "docs(readme): update installation guide"
```

### 2. PR Template
```markdown
## 📝 Description
Mô tả ngắn gọn về thay đổi

## 🎯 Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## ✅ Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
```

## 🔍 Code Review

### Review Checklist
- [ ] Code quality và readability
- [ ] Performance implications
- [ ] Security considerations
- [ ] Error handling
- [ ] Documentation updates

### Feedback Guidelines
- Constructive và respectful
- Specific suggestions
- Explain reasoning
- Offer alternatives

## 🚀 Release Process

### Versioning
- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes

### Changelog
- Document all changes
- Group by type (Added, Changed, Fixed, Removed)
- Include migration notes

## 📞 Communication

### Channels
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Code Review**: Pull Request comments

### Guidelines
- Be respectful và professional
- Use clear language
- Provide context
- Ask questions when needed

## 🎉 Recognition

Contributors sẽ được:
- Listed trong README
- Mentioned trong release notes
- Invited to maintainer team (nếu phù hợp)

## 📚 Resources

- [React Documentation](https://reactjs.org/docs)
- [Express.js Guide](https://expressjs.com/guide)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Conventional Commits](https://conventionalcommits.org/)

---

Cảm ơn bạn đã đóng góp! 🙏

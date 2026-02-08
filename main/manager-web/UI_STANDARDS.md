# Manager-Web UI Standards

A simple guide for consistent UI development.

---

## Colors

```scss
// Primary
$primary: #07c160;
$primary-dark: #059652;
$primary-light: #e8f5e9;

// Text
$text-primary: #1a1a2e;
$text-secondary: #4a4a68;
$text-muted: #8e8ea9;

// UI
$border: #e8e8f0;
$bg-page: #f5f7fb;
$bg-card: #ffffff;
$danger: #f56c6c;
```

---

## Spacing & Sizing

| Element | Value |
|---------|-------|
| Page padding | `24px` (mobile: `16px`) |
| Card padding | `20px-24px` |
| Card gap | `24px` (mobile: `16px`) |
| Border radius (cards) | `20px` |
| Border radius (buttons) | `10px-14px` |
| Border radius (inputs) | `14px` |

---

## Typography

```scss
// Headings
h1 { font-size: 28px; font-weight: 700; }
h2 { font-size: 22px; font-weight: 700; }
h3 { font-size: 17px; font-weight: 700; }

// Body
body { font-size: 14px; }
small { font-size: 12px; }
```

---

## Components

### Cards
```scss
.card {
  background: #fff;
  border-radius: 20px;
  padding: 20px;
  border: 2px solid transparent;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba($primary, 0.3);
    box-shadow: 0 12px 32px rgba($primary, 0.12);
  }
}
```

### Buttons
```scss
// Primary
.btn-primary {
  background: $primary;
  color: white;
  border-radius: 14px;
  padding: 12px 24px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba($primary, 0.3);
}

// Secondary
.btn-secondary {
  background: #f0f2f5;
  color: $text-secondary;
  border: 1px solid $border;
  border-radius: 10px;
}

// Icon button
.btn-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
}
```

### Inputs
```scss
.input {
  height: 48px;
  border: 2px solid $border;
  border-radius: 14px;
  padding: 0 16px;
  
  &:focus {
    border-color: $primary;
    box-shadow: 0 0 0 4px rgba($primary, 0.1);
  }
}
```

---

## Responsive Breakpoints

```scss
@media (max-width: 768px) { /* Tablet */ }
@media (max-width: 640px) { /* Mobile */ }
@media (max-width: 480px) { /* Small mobile */ }
```

### Grid Pattern
```scss
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
  
  @media (max-width: 767px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
```

---

## Dialogs/Modals

```scss
// Responsive width
computed: {
  dialogWidth() {
    if (this.windowWidth < 500) return '90%';
    if (this.windowWidth < 768) return '80%';
    return '420px';
  }
}

// Style
.dialog {
  border-radius: 24px;
  
  @media (max-width: 500px) {
    margin: 16px;
    border-radius: 20px;
  }
}
```

---

## Avatars

Dynamic gradient based on name:
```javascript
const colors = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140']
];
const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
const [c1, c2] = colors[hash % colors.length];
return `linear-gradient(135deg, ${c1}, ${c2})`;
```

---

## Animations

```scss
// Standard transition
transition: all 0.2s ease;

// Hover lift
&:hover {
  transform: translateY(-4px);
}

// Pulse (for active indicators)
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba($primary, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba($primary, 0); }
}
```

---

## i18n

Always use translation keys:
```vue
{{ $t('home.greeting') }}
{{ $t('common.delete') }}
```

Add new keys to both:
- `src/i18n/en.js`
- `src/i18n/zh_CN.js`

---

## Quick Checklist

- [ ] Use `$primary` (#07c160) for main actions
- [ ] Cards have 20px border-radius, hover lift effect
- [ ] Buttons have 10-14px border-radius
- [ ] Mobile responsive at 768px and 480px breakpoints
- [ ] All text uses i18n translation keys
- [ ] Dialogs use dynamic width for mobile
- [ ] Use `box-shadow` for depth, not borders

# 🎨 Pocket Mint — Design Specification (design.md Format)

Document Type: Design System Guidelines
Status: Approved
Target Framework: Next.js + Tailwind CSS

---

## 🛑 1. Design Tokens (Aturan Baku)

### Colors (Sistem Warna)
```css
:root {
  --color-bg-main: #f8fafc;        /* slate-50/50 */
  --color-surface: #ffffff;        /* white */
  --color-text-primary: #0f172a;   /* slate-900 */
  --color-text-secondary: #64748b; /* slate-500 */
  
  /* Financial Context Tokens */
  --color-income-text: #059669;    /* emerald-600 */
  --color-income-bg: #ecfdf5;      /* emerald-50 */
  --color-expense-text: #e11d48;   /* rose-600 */
  --color-expense-bg: #fff1f2;     /* rose-50 */
  
  --color-brand: #4f46e5;          /* indigo-600 (Primary Brand) */
}
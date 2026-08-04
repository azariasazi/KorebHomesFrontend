# CSS addition — add to apps/web/app/globals.css

Add this rule anywhere in the Sign Up section (near the other .su- rules):

```css
/* Sign Up — first/last name row */
.su-name-row { display: flex; gap: 12px; margin-bottom: 4px; }
@media (max-width: 460px) { .su-name-row { flex-direction: column; gap: 0; } }
```

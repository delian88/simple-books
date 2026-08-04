# 🎬 Landing Page Text Animations

## Hero Section Text Effects

### 1. **Badge Text Animation** 
"Accounting for Small Business"
- **Effect**: Character-by-character fade-in cascade
- **Duration**: Each character animates in 20ms apart
- **Delay**: Starts at 100ms
- **Creates**: Typewriter-like reveal effect

### 2. **Main Headline Animation**
"Keep your books without keeping an accountant on retainer."
- **Effect**: Word-by-word slide-up reveal
- **Animation**: Each word:
  - Starts: `opacity: 0, translateY: 16px`
  - Ends: `opacity: 1, translateY: 0`
- **Timing**: 200ms between each word
- **Special Feature**: Characters bounce subtly on reveal
- **Highlight Effect**: Words 4-6 ("without keeping an") get emerald underline that expands

### 3. **Character Hover Effect**
- **Interactive**: Each character in headline becomes interactive
- **On Hover**: 
  - Color changes to emerald-500
  - Scales to 110%
  - Smooth 200ms transition

### 4. **Description Paragraph**
"Inflows come straight from your bank statement..."
- **Effect**: Live typing animation
- **Speed**: 30ms per character (realistic typing speed)
- **Cursor**: Blinking emerald cursor follows the text
- **Total Duration**: ~5 seconds for full paragraph

## Technical Implementation

### State Management
```javascript
const [displayedText, setDisplayedText] = useState("");
const [wordIndex, setWordIndex] = useState(0);
const heroWords = ["Keep", "your", "books", ...];
const fullText = "Inflows come straight...";
```

### Animation Timers
1. **Chart Animation**: Every 3000ms (chart bars)
2. **Typing Animation**: Every 30ms (description)
3. **Word Animation**: Every 200ms (headline words)

### Custom CSS Keyframes
```css
@keyframes bounce-subtle {
  0% { transform: translateY(10px); opacity: 0; }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0); opacity: 1; }
}
```

## User Experience Benefits

✅ **Progressive Disclosure**: Information reveals gradually, maintaining user attention
✅ **Visual Hierarchy**: Animations guide eye movement through content
✅ **Brand Personality**: Typing effect suggests precision and accounting accuracy
✅ **Engagement**: Interactive hover effects encourage exploration
✅ **Performance**: All animations use CSS transforms (GPU-accelerated)
✅ **Accessibility**: Animations respect `prefers-reduced-motion` via Tailwind

## Animation Sequence Timeline

| Time | Element | Effect |
|------|---------|--------|
| 0ms | Page load | Background blobs start floating |
| 100ms | Badge | Character cascade begins |
| 200ms | Headline | First word appears |
| 400ms | Headline | Second word appears |
| ... | ... | ... |
| 1800ms | Headline | Final word appears |
| 2000ms | Description | Typing starts |
| 7000ms | Description | Typing completes |
| Continuous | Chart | Bars animate every 3s |
| On Hover | Characters | Scale and color change |

## Performance Notes

- All animations use `requestAnimationFrame` internally
- CSS transforms used for smooth 60fps animation
- Intervals are cleaned up on component unmount
- No layout thrashing or reflows during animation
- Minimal JavaScript - most effects are CSS-based

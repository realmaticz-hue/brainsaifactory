// Professional font configurations for video and ads

export interface FontConfig {
  id: string;
  name: string;
  family: string;
  weights: number[];
  style: 'modern' | 'classic' | 'bold' | 'elegant' | 'playful';
  bestFor: string[];
}

export const PROFESSIONAL_FONTS: FontConfig[] = [
  {
    id: 'inter',
    name: 'Inter',
    family: 'Inter, sans-serif',
    weights: [400, 600, 700, 900],
    style: 'modern',
    bestFor: ['tech', 'startup', 'saas']
  },
  {
    id: 'poppins',
    name: 'Poppins',
    family: 'Poppins, sans-serif',
    weights: [400, 600, 700, 800],
    style: 'modern',
    bestFor: ['ecommerce', 'fashion', 'lifestyle']
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: 'Montserrat, sans-serif',
    weights: [400, 600, 700, 900],
    style: 'bold',
    bestFor: ['fitness', 'sports', 'automotive']
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    family: 'Playfair Display, serif',
    weights: [400, 700, 900],
    style: 'elegant',
    bestFor: ['luxury', 'fashion', 'beauty']
  },
  {
    id: 'roboto',
    name: 'Roboto',
    family: 'Roboto, sans-serif',
    weights: [400, 500, 700, 900],
    style: 'modern',
    bestFor: ['tech', 'corporate', 'general']
  },
  {
    id: 'oswald',
    name: 'Oswald',
    family: 'Oswald, sans-serif',
    weights: [400, 600, 700],
    style: 'bold',
    bestFor: ['sports', 'news', 'impact']
  },
  {
    id: 'lato',
    name: 'Lato',
    family: 'Lato, sans-serif',
    weights: [400, 700, 900],
    style: 'classic',
    bestFor: ['corporate', 'finance', 'professional']
  },
  {
    id: 'raleway',
    name: 'Raleway',
    family: 'Raleway, sans-serif',
    weights: [400, 600, 700, 800],
    style: 'elegant',
    bestFor: ['luxury', 'design', 'creative']
  },
  {
    id: 'bebas',
    name: 'Bebas Neue',
    family: 'Bebas Neue, sans-serif',
    weights: [400],
    style: 'bold',
    bestFor: ['sports', 'automotive', 'action']
  },
  {
    id: 'quicksand',
    name: 'Quicksand',
    family: 'Quicksand, sans-serif',
    weights: [400, 600, 700],
    style: 'playful',
    bestFor: ['kids', 'fun', 'casual']
  }
];

export function getFontForBusiness(businessType: string): FontConfig {
  const font = PROFESSIONAL_FONTS.find(f => 
    f.bestFor.includes(businessType)
  );
  return font || PROFESSIONAL_FONTS[0]; // Default to Inter
}

export function loadGoogleFonts() {
  const fontFamilies = PROFESSIONAL_FONTS.map(font => {
    const weights = font.weights.join(';');
    return `${font.name.replace(/\s/g, '+')}:wght@${weights}`;
  }).join('&family=');

  const link = document.createElement('link');
  link.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
  link.rel = 'stylesheet';
  
  if (!document.querySelector(`link[href*="fonts.googleapis.com"]`)) {
    document.head.appendChild(link);
  }
}

export interface TextStyle {
  fontSize: number;
  fontWeight: number;
  color: string;
  align: 'left' | 'center' | 'right';
  shadow: boolean;
  stroke: boolean;
  uppercase: boolean;
  letterSpacing: number;
}

export const TEXT_PRESETS = {
  headline: {
    fontSize: 48,
    fontWeight: 900,
    color: '#ffffff',
    align: 'center' as const,
    shadow: true,
    stroke: false,
    uppercase: true,
    letterSpacing: 2
  },
  subheadline: {
    fontSize: 32,
    fontWeight: 700,
    color: '#ffffff',
    align: 'center' as const,
    shadow: true,
    stroke: false,
    uppercase: false,
    letterSpacing: 1
  },
  body: {
    fontSize: 24,
    fontWeight: 400,
    color: '#ffffff',
    align: 'center' as const,
    shadow: true,
    stroke: false,
    uppercase: false,
    letterSpacing: 0
  },
  cta: {
    fontSize: 28,
    fontWeight: 700,
    color: '#FFD700',
    align: 'center' as const,
    shadow: true,
    stroke: true,
    uppercase: true,
    letterSpacing: 2
  },
  caption: {
    fontSize: 18,
    fontWeight: 400,
    color: '#f0f0f0',
    align: 'center' as const,
    shadow: true,
    stroke: false,
    uppercase: false,
    letterSpacing: 0
  }
};

export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: FontConfig,
  style: TextStyle,
  maxWidth?: number
) {
  // Set font
  ctx.font = `${style.fontWeight} ${style.fontSize}px ${font.family}`;
  ctx.textAlign = style.align;
  ctx.textBaseline = 'middle';
  
  const displayText = style.uppercase ? text.toUpperCase() : text;
  
  // Apply shadow
  if (style.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
  }
  
  // Apply stroke
  if (style.stroke) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(displayText, x, y, maxWidth);
  }
  
  // Draw text
  ctx.fillStyle = style.color;
  ctx.fillText(displayText, x, y, maxWidth);
  
  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

export function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: FontConfig,
  style: TextStyle,
  maxWidth: number,
  lineHeight: number = style.fontSize * 1.4
) {
  ctx.font = `${style.fontWeight} ${style.fontSize}px ${font.family}`;
  const lines = wrapText(ctx, text, maxWidth, lineHeight);
  
  const totalHeight = lines.length * lineHeight;
  const startY = y - (totalHeight / 2) + (lineHeight / 2);
  
  lines.forEach((line, i) => {
    drawText(ctx, line, x, startY + (i * lineHeight), font, style, maxWidth);
  });
}

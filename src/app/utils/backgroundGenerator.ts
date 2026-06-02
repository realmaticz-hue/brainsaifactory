// Dynamic background generation based on website content

export interface BackgroundStyle {
  id: string;
  name: string;
  type: 'gradient' | 'pattern' | 'image' | 'video' | 'animated';
  config: any;
}

export const BACKGROUND_THEMES = {
  ecommerce: {
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'],
    gradients: [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    ]
  },
  tech: {
    colors: ['#00D9FF', '#7B2FFF', '#00FFA3', '#FF006E'],
    gradients: [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)',
      'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    ]
  },
  restaurant: {
    colors: ['#FF6347', '#FFD700', '#FF8C00', '#DC143C'],
    gradients: [
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
      'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    ]
  },
  fitness: {
    colors: ['#00B4DB', '#0083B0', '#00D084', '#00E676'],
    gradients: [
      'linear-gradient(135deg, #56ab2f 0%, #a8e063 100%)',
      'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)',
      'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    ]
  },
  fashion: {
    colors: ['#FF1744', '#F50057', '#D500F9', '#651FFF'],
    gradients: [
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    ]
  },
  default: {
    colors: ['#6B46C1', '#805AD5', '#9F7AEA', '#B794F4'],
    gradients: [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    ]
  }
};

export function getBackgroundForBusiness(businessType: string): BackgroundStyle[] {
  const theme = BACKGROUND_THEMES[businessType as keyof typeof BACKGROUND_THEMES] || BACKGROUND_THEMES.default;
  
  const backgrounds: BackgroundStyle[] = [
    // Gradient backgrounds
    ...theme.gradients.map((gradient, i) => ({
      id: `gradient-${i}`,
      name: `Gradient ${i + 1}`,
      type: 'gradient' as const,
      config: { gradient }
    })),
    
    // Animated gradient
    {
      id: 'animated-gradient',
      name: 'Animated Gradient',
      type: 'animated' as const,
      config: {
        colors: theme.colors,
        animation: 'wave'
      }
    },
    
    // Pattern backgrounds
    {
      id: 'dots-pattern',
      name: 'Dots Pattern',
      type: 'pattern' as const,
      config: {
        pattern: 'dots',
        color: theme.colors[0],
        backgroundColor: '#ffffff'
      }
    },
    
    {
      id: 'grid-pattern',
      name: 'Grid Pattern',
      type: 'pattern' as const,
      config: {
        pattern: 'grid',
        color: theme.colors[1],
        backgroundColor: '#f8f9fa'
      }
    }
  ];
  
  return backgrounds;
}

export function renderBackground(canvas: HTMLCanvasElement, style: BackgroundStyle, animated: boolean = false) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  switch (style.type) {
    case 'gradient':
      renderGradient(ctx, canvas, style.config.gradient);
      break;
    case 'animated':
      if (animated) {
        renderAnimatedGradient(ctx, canvas, style.config.colors);
      } else {
        renderGradient(ctx, canvas, `linear-gradient(135deg, ${style.config.colors[0]} 0%, ${style.config.colors[1]} 100%)`);
      }
      break;
    case 'pattern':
      renderPattern(ctx, canvas, style.config);
      break;
  }
}

function renderGradient(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, gradientString: string) {
  // Parse gradient string (simplified)
  const colors = gradientString.match(/#[0-9a-fA-F]{6}/g) || ['#667eea', '#764ba2'];
  
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1] || colors[0]);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderAnimatedGradient(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: string[]) {
  const time = Date.now() / 1000;
  const gradient = ctx.createLinearGradient(
    0,
    0,
    canvas.width + Math.sin(time) * 100,
    canvas.height + Math.cos(time) * 100
  );
  
  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color);
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function renderPattern(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, config: any) {
  // Fill background
  ctx.fillStyle = config.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = config.color || '#667eea';
  
  if (config.pattern === 'dots') {
    const spacing = 30;
    const radius = 3;
    
    for (let x = spacing; x < canvas.width; x += spacing) {
      for (let y = spacing; y < canvas.height; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (config.pattern === 'grid') {
    const spacing = 40;
    ctx.lineWidth = 1;
    ctx.strokeStyle = config.color;
    
    for (let x = 0; x < canvas.width; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += spacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }
}

export function addEffects(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  effects: string[]
) {
  effects.forEach(effect => {
    switch (effect) {
      case 'vignette':
        addVignette(ctx, canvas);
        break;
      case 'shine':
        addShine(ctx, canvas);
        break;
      case 'particles':
        addParticles(ctx, canvas);
        break;
      case 'glow':
        addGlow(ctx, canvas);
        break;
    }
  });
}

function addVignette(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const gradient = ctx.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 4,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 1.5
  );
  
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function addShine(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(canvas.width * 0.3, 0, canvas.width * 0.4, canvas.height);
}

function addParticles(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const particleCount = 30;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  
  for (let i = 0; i < particleCount; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 2 + 1;
    
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function addGlow(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

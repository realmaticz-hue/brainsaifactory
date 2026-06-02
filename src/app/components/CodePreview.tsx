// Real Live Code Preview - Executes generated code in iframe
import { useEffect, useRef, useState } from 'react';
import { Loader } from 'lucide-react';

interface CodePreviewProps {
  code: string;
  refreshKey?: number;
}

export function CodePreview({ code, refreshKey = 0 }: CodePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    if (!iframeRef.current || !code) {
      setIsLoading(false);
      return;
    }

    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) {
      setIsLoading(false);
      return;
    }

    // Extract component code (remove export default)
    const componentCode = code.replace(/export default /g, 'const AppComponent = ');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- React -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  
  <!-- Babel for JSX transformation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Recharts for charts -->
  <script src="https://unpkg.com/recharts@2.5.0/dist/Recharts.js"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <script type="text/babel">
    const { useState, useEffect, useRef, useCallback, useMemo } = React;
    const { createRoot } = ReactDOM;
    
    // Import all Lucide icons
    const {
      Plus, Trash2, Check, X, Mail, Lock, Eye, EyeOff, Github, Chrome,
      Star, Search, ShoppingCart, Heart, Filter, Download, ChevronUp,
      ChevronDown, TrendingUp, Users, DollarSign, ArrowUp, ArrowDown,
      Zap, Shield, Menu, Settings, Bell, User, ArrowRight, RefreshCw,
      FileCode, Terminal, Sparkles, Code, Layout, Palette, Type, Image,
      Box, Grid, List, Table, Loader, Copy, Save, Share2, Upload,
      Send, Edit, Play, Pause, MoreVertical, ChevronLeft, ChevronRight,
      Calendar, Clock, MapPin, Phone, Briefcase, Home, Database, Cloud
    } = lucide;
    
    // Import Recharts components
    const {
      BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie,
      XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
      Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
    } = Recharts;
    
    // User's component code
    ${componentCode}
    
    // Render the app with error boundary
    try {
      const root = createRoot(document.getElementById('root'));
      root.render(<AppComponent />);
    } catch (error) {
      console.error('Render error:', error);
      document.getElementById('root').innerHTML = 
        '<div style="padding: 20px; background: #fee2e2; border: 2px solid #ef4444; border-radius: 8px; margin: 20px;">' +
        '<h3 style="color: #dc2626; margin: 0 0 10px 0;">⚠️ Render Error</h3>' +
        '<p style="margin: 0; font-family: monospace; font-size: 14px; color: #991b1b;">' + error.toString() + '</p>' +
        '</div>';
    }
  </script>
  
  <script>
    // Error handling
    window.onerror = function(msg, url, lineNo, columnNo, error) {
      console.error('Error: ', msg, '\\nLine: ', lineNo, '\\nColumn: ', columnNo);
      document.getElementById('root').innerHTML = 
        '<div style="padding: 20px; background: #fee; border: 2px solid #f00; border-radius: 8px; margin: 20px;">' +
        '<h3 style="color: #c00; margin: 0 0 10px 0;">Preview Error</h3>' +
        '<p style="margin: 0; font-family: monospace; font-size: 14px;">' + msg + '</p>' +
        '<p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Line ' + lineNo + ', Column ' + columnNo + '</p>' +
        '</div>';
      return false;
    };
  </script>
</body>
</html>
    `;

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    setIsLoading(false);
  }, [code, refreshKey]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="Live Preview"
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
    />
  );
}
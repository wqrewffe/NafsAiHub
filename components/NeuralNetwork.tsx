import React, { useEffect, useRef, useState } from 'react';

interface Node {
  x: number;
  y: number;
  layer: number;
  phase: number;
}

interface Connection {
  from: number;
  to: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface NeuralNetworkProps {
  width?: number;
  height?: number;
  className?: string;
}

const NeuralNetwork: React.FC<NeuralNetworkProps> = ({ 
  width = 600, 
  height = 400,
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isMobile, setIsMobile] = useState(false);
  const timeRef = useRef(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width || width, height: rect.height || height });
      }
    };

    checkMobile();
    updateDimensions();
    
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        checkMobile();
        updateDimensions();
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [width, height]);

  useEffect(() => {
    const layers = isMobile ? [3, 5, 6, 5, 3] : [4, 6, 8, 6, 4];
    const nodeSpacing = dimensions.height / (Math.max(...layers) + 1);
    const layerSpacing = dimensions.width / (layers.length + 1);
    
    const newNodes: Node[] = [];
    const newConnections: Connection[] = [];
    let nodeId = 0;
    const layerNodes: number[][] = [];
    
    layers.forEach((nodeCount, layerIndex) => {
      const layerNodeIds: number[] = [];
      const startY = (dimensions.height - (nodeCount - 1) * nodeSpacing) / 2;
      
      for (let i = 0; i < nodeCount; i++) {
        newNodes.push({
          x: layerSpacing * (layerIndex + 1),
          y: startY + i * nodeSpacing,
          layer: layerIndex,
          phase: Math.random() * Math.PI * 2
        });
        layerNodeIds.push(nodeId++);
      }
      layerNodes.push(layerNodeIds);
    });
    
    const density = isMobile ? 0.5 : 0.65;
    for (let i = 0; i < layers.length - 1; i++) {
      layerNodes[i].forEach(fromId => {
        layerNodes[i + 1].forEach(toId => {
          if (Math.random() < density) {
            const from = newNodes[fromId];
            const to = newNodes[toId];
            newConnections.push({
              from: fromId,
              to: toId,
              x1: from.x,
              y1: from.y,
              x2: to.x,
              y2: to.y
            });
          }
        });
      });
    }
    
    nodesRef.current = newNodes;
    connectionsRef.current = newConnections;
  }, [dimensions.width, dimensions.height, isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(dpr, dpr);

    const colors = [
      { r: 96, g: 165, b: 250 },   // Soft blue
      { r: 167, g: 139, b: 250 },  // Soft purple
      { r: 244, g: 114, b: 182 },  // Soft pink
      { r: 251, g: 146, b: 60 },   // Soft orange
      { r: 52, g: 211, b: 153 }    // Soft teal
    ];

    const animate = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;

      // Clear with dark background
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const nodes = nodesRef.current;
      const connections = connectionsRef.current;

      // Draw connections
      connections.forEach(conn => {
        const from = nodes[conn.from];
        const to = nodes[conn.to];
        if (!from || !to) return;

        const activation = (Math.sin(t * 0.5 + from.phase) + Math.sin(t * 0.5 + to.phase)) * 0.25 + 0.5;
        const opacity = 0.15 + activation * 0.25;

        const fromColor = colors[from.layer];
        const toColor = colors[to.layer];

        const gradient = ctx.createLinearGradient(conn.x1, conn.y1, conn.x2, conn.y2);
        gradient.addColorStop(0, `rgba(${fromColor.r}, ${fromColor.g}, ${fromColor.b}, ${opacity})`);
        gradient.addColorStop(1, `rgba(${toColor.r}, ${toColor.g}, ${toColor.b}, ${opacity})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1 + activation * 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(conn.x1, conn.y1);
        ctx.lineTo(conn.x2, conn.y2);
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach(node => {
        const activation = Math.sin(t * 0.5 + node.phase) * 0.5 + 0.5;
        const baseSize = isMobile ? 7 : 9;
        const size = baseSize + activation * 8;
        const color = colors[node.layer];

        // Main node
        const nodeGradient = ctx.createRadialGradient(
          node.x - size * 0.3, node.y - size * 0.3, 0,
          node.x, node.y, size
        );
        nodeGradient.addColorStop(0, `rgba(${Math.min(255, color.r + 60)}, ${Math.min(255, color.g + 60)}, ${Math.min(255, color.b + 60)}, 0.95)`);
        nodeGradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, 0.95)`);
        nodeGradient.addColorStop(1, `rgba(${color.r * 0.7}, ${color.g * 0.7}, ${color.b * 0.7}, 0.95)`);

        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, size, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        const highlight = ctx.createRadialGradient(
          node.x - size * 0.25, node.y - size * 0.25, 0,
          node.x, node.y, size * 0.6
        );
        highlight.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(node.x - size * 0.2, node.y - size * 0.2, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions.width, dimensions.height, isMobile]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
      style={{ 
        background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default NeuralNetwork;

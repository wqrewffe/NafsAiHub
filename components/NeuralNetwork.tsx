import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';

interface Node {
  x: number;
  y: number;
  layer: number;
  activation: number;
  targetActivation: number;
  connections: number[];
}

interface Connection {
  from: number;
  to: number;
  weight: number;
  pulseOffset: number;
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
  const svgRef = useRef<SVGSVGElement>(null);
  const animationFrameRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [dimensions, setDimensions] = useState({ width, height });
  const [isMobile, setIsMobile] = useState(false);
  const timeRef = useRef(0);
  const frameCountRef = useRef(0);

  // Detect mobile and handle responsive sizing with throttling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = rect.width || width;
        const newHeight = rect.height || height;
        
        setDimensions({
          width: newWidth,
          height: newHeight
        });
      }
    };

    checkMobile();
    updateDimensions();
    
    // Throttle resize events for better performance
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

  // Initialize neural network structure - adaptive based on screen size
  useEffect(() => {
    // Reduce complexity on mobile for better performance
    const layers = isMobile 
      ? [3, 4, 5, 4, 3]  // Smaller network on mobile
      : [4, 6, 8, 6, 4]; // Full network on desktop
    
    const nodeSpacing = dimensions.height / (Math.max(...layers) + 1);
    const layerSpacing = dimensions.width / (layers.length + 1);
    
    const newNodes: Node[] = [];
    const newConnections: Connection[] = [];
    
    let nodeId = 0;
    const layerNodes: number[][] = [];
    
    // Create nodes for each layer
    layers.forEach((nodeCount, layerIndex) => {
      const layerNodeIds: number[] = [];
      const startY = (dimensions.height - (nodeCount - 1) * nodeSpacing) / 2;
      
      for (let i = 0; i < nodeCount; i++) {
        const y = startY + i * nodeSpacing;
        const x = layerSpacing * (layerIndex + 1);
        
        newNodes.push({
          x,
          y,
          layer: layerIndex,
          activation: Math.random(),
          targetActivation: Math.random(),
          connections: []
        });
        
        layerNodeIds.push(nodeId);
        nodeId++;
      }
      
      layerNodes.push(layerNodeIds);
    });
    
    // Create connections between layers
    // On mobile, reduce connection density for performance
    const connectionDensity = isMobile ? 0.7 : 1.0;
    
    for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex++) {
      const currentLayer = layerNodes[layerIndex];
      const nextLayer = layerNodes[layerIndex + 1];
      
      // Create connections
      currentLayer.forEach((fromNodeId, fromIdx) => {
        nextLayer.forEach((toNodeId, toIdx) => {
          // Skip some connections on mobile for performance
          if (isMobile && Math.random() > connectionDensity) return;
          
          const weight = (Math.random() - 0.5) * 2;
          newConnections.push({
            from: fromNodeId,
            to: toNodeId,
            weight,
            pulseOffset: Math.random() * Math.PI * 2
          });
        });
      });
    }
    
    nodesRef.current = newNodes;
    connectionsRef.current = newConnections;
    setRenderTrigger(prev => prev + 1);
  }, [dimensions.width, dimensions.height, isMobile]);

  // Optimized animation loop - smooth 60fps on desktop, 30fps on mobile
  useEffect(() => {
    let lastTime = performance.now();
    const targetFPS = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;
    
    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap deltaTime
      lastTime = currentTime;
      
      // Throttle to target FPS for consistent performance
      if (currentTime - lastFrameTime >= frameInterval) {
        lastFrameTime = currentTime;
        timeRef.current += deltaTime;
        frameCountRef.current += 1;
        
        // Update nodes directly in ref for performance
        if (nodesRef.current.length > 0) {
          nodesRef.current = nodesRef.current.map(node => {
            // Smooth activation animation with sine wave
            const wave = Math.sin(timeRef.current * 0.4 + node.layer * 0.6) * 0.5 + 0.5;
            const newTargetActivation = wave;
            
            // Smooth interpolation for fluid motion (faster on desktop)
            const lerpSpeed = isMobile ? 0.1 : 0.15;
            const newActivation = node.activation + (newTargetActivation - node.activation) * lerpSpeed;
            
            return {
              ...node,
              activation: Math.max(0, Math.min(1, newActivation)),
              targetActivation: newTargetActivation
            };
          });
          
          // Trigger re-render every frame for smooth animation
          setRenderTrigger(frameCountRef.current);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMobile]);
  
  // Memoize nodes and connections for rendering
  const nodes = useMemo(() => nodesRef.current, [renderTrigger]);
  const connections = useMemo(() => connectionsRef.current, [renderTrigger]);

  // Memoized connection style calculation
  const getConnectionStyle = useCallback((connection: Connection, fromNode: Node, toNode: Node) => {
    const avgActivation = (fromNode.activation + toNode.activation) / 2;
    const pulse = Math.sin(timeRef.current * 2 + connection.pulseOffset) * 0.3 + 0.7;
    const opacity = Math.max(0.15, avgActivation * pulse * 0.5);
    const strokeWidth = isMobile 
      ? 1 + avgActivation * 1.5  // Thinner lines on mobile
      : 1.5 + avgActivation * 2.5;
    
    // Enhanced color based on weight and activation
    const weightFactor = Math.abs(connection.weight);
    const isPositive = connection.weight > 0;
    
    // More vibrant colors
    const weightColor = isPositive 
      ? `rgba(59, 130, 246, ${opacity * (0.7 + weightFactor * 0.3)})` // blue for positive
      : `rgba(147, 51, 234, ${opacity * (0.7 + weightFactor * 0.3)})`; // purple for negative
    
    // Calculate data flow position (0 to 1)
    const flowPosition = (timeRef.current * 0.5 + connection.pulseOffset * 0.3) % 1;
    
    return {
      stroke: weightColor,
      strokeWidth: strokeWidth,
      opacity: opacity,
      flowPosition: flowPosition,
      showFlow: avgActivation > 0.3 && !isMobile // Disable flow particles on mobile for performance
    };
  }, [isMobile]);

  // Memoized node style calculation
  const getNodeStyle = useCallback((node: Node) => {
    const baseSize = isMobile ? 6 : 10; // Smaller nodes on mobile
    const size = baseSize + node.activation * (isMobile ? 8 : 14);
    const glowSize = size + node.activation * (isMobile ? 15 : 25);
    const opacity = 0.7 + node.activation * 0.3;
    const pulse = Math.sin(timeRef.current * 3 + node.layer) * 0.1 + 1;
    
    // Enhanced color palette based on layer
    const colors = [
      'rgba(59, 130, 246, 1)',   // Input - blue
      'rgba(147, 51, 234, 1)',   // Hidden 1 - purple
      'rgba(236, 72, 153, 1)',   // Hidden 2 - pink
      'rgba(251, 146, 60, 1)',   // Hidden 3 - orange
      'rgba(34, 197, 94, 1)'     // Output - green
    ];
    
    const glowColors = [
      'rgba(59, 130, 246, 0.4)',   // Input - blue glow
      'rgba(147, 51, 234, 0.4)',   // Hidden 1 - purple glow
      'rgba(236, 72, 153, 0.4)',   // Hidden 2 - pink glow
      'rgba(251, 146, 60, 0.4)',   // Hidden 3 - orange glow
      'rgba(34, 197, 94, 0.4)'     // Output - green glow
    ];
    
    const color = colors[node.layer] || colors[0];
    const glowColor = glowColors[node.layer] || glowColors[0];
    
    return {
      size: size * pulse,
      glowSize: glowSize * pulse,
      color,
      glowColor,
      opacity,
      useStrongGlow: node.activation > 0.7
    };
  }, [isMobile]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full ${className}`}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ 
          overflow: 'visible',
          willChange: 'transform',
          transform: 'translateZ(0)' // GPU acceleration
        }}
      >
        <defs>
          {/* Glow filter for nodes */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Stronger glow for active nodes */}
          <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Gradient definitions for connections */}
          <linearGradient id="connectionGradientBlue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.6)" />
            <stop offset="50%" stopColor="rgba(147, 51, 234, 0.8)" />
            <stop offset="100%" stopColor="rgba(236, 72, 153, 0.6)" />
          </linearGradient>
          
          <linearGradient id="connectionGradientPurple" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(147, 51, 234, 0.6)" />
            <stop offset="50%" stopColor="rgba(236, 72, 153, 0.8)" />
            <stop offset="100%" stopColor="rgba(251, 146, 60, 0.6)" />
          </linearGradient>
          
          {/* Radial gradient for nodes */}
          <radialGradient id="nodeGradientBlue">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <stop offset="70%" stopColor="rgba(59, 130, 246, 1)" />
            <stop offset="100%" stopColor="rgba(37, 99, 235, 1)" />
          </radialGradient>
          
          <radialGradient id="nodeGradientPurple">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
            <stop offset="70%" stopColor="rgba(147, 51, 234, 1)" />
            <stop offset="100%" stopColor="rgba(126, 34, 206, 1)" />
          </radialGradient>
          
          {/* Animated gradient for data flow */}
          <linearGradient id="dataFlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" stopOpacity="0">
              <animate attributeName="offset" values="0;1;0" dur="2s" repeatCount="indefinite"/>
            </stop>
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.8)" stopOpacity="1">
              <animate attributeName="offset" values="0;1;0" dur="2s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" stopOpacity="0">
              <animate attributeName="offset" values="0;1;0" dur="2s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>
        </defs>
        
        {/* Render connections */}
        {connections.map((connection, index) => {
          const fromNode = nodes[connection.from];
          const toNode = nodes[connection.to];
          
          if (!fromNode || !toNode) return null;
          
          const style = getConnectionStyle(connection, fromNode, toNode);
          const dx = toNode.x - fromNode.x;
          const dy = toNode.y - fromNode.y;
          
          // Calculate flow position along the line
          const flowX = fromNode.x + dx * style.flowPosition;
          const flowY = fromNode.y + dy * style.flowPosition;
          
          return (
            <g key={`conn-${index}`}>
              {/* Main connection line */}
              <line
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                opacity={style.opacity}
                strokeLinecap="round"
                style={{
                  willChange: 'opacity, stroke-width'
                }}
              />
              {/* Animated data flow particle - disabled on mobile for performance */}
              {style.showFlow && !isMobile && (
                <circle
                  cx={flowX}
                  cy={flowY}
                  r={2 + style.strokeWidth * 0.2}
                  fill="rgba(255, 255, 255, 0.9)"
                  opacity={0.8}
                  style={{
                    filter: 'url(#glow)',
                    willChange: 'transform'
                  }}
                >
                  <animate
                    attributeName="opacity"
                    values="0.3;1;0.3"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          );
        })}
        
        {/* Render nodes */}
        {nodes.map((node, index) => {
          const style = getNodeStyle(node);
          
          return (
            <g key={`node-${index}`}>
              {/* Outer glow effect - reduced opacity on mobile */}
              {!isMobile && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={style.glowSize * 1.5}
                  fill={style.glowColor}
                  opacity={style.opacity * 0.12}
                  filter={style.useStrongGlow ? "url(#strongGlow)" : "url(#glow)"}
                  style={{
                    willChange: 'r, opacity'
                  }}
                />
              )}
              {/* Middle glow - lighter on mobile */}
              <circle
                cx={node.x}
                cy={node.y}
                r={style.glowSize}
                fill={style.color}
                opacity={style.opacity * (isMobile ? 0.15 : 0.25)}
                filter="url(#glow)"
                style={{
                  willChange: 'r, opacity'
                }}
              />
              {/* Main node */}
              <circle
                cx={node.x}
                cy={node.y}
                r={style.size}
                fill={style.color}
                opacity={style.opacity}
                filter={style.useStrongGlow ? "url(#strongGlow)" : "url(#glow)"}
                style={{
                  willChange: 'r, opacity',
                  cursor: 'pointer'
                }}
              />
              {/* Inner highlight */}
              <circle
                cx={node.x}
                cy={node.y}
                r={style.size * 0.6}
                fill="rgba(255, 255, 255, 0.7)"
                opacity={style.opacity}
                style={{
                  willChange: 'r, opacity'
                }}
              />
              {/* Core highlight */}
              <circle
                cx={node.x}
                cy={node.y}
                r={style.size * 0.3}
                fill="rgba(255, 255, 255, 0.9)"
                opacity={style.opacity}
                style={{
                  willChange: 'r, opacity'
                }}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Animated background particles - disabled on mobile for performance */}
      {!isMobile && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => {
            const delay = Math.random() * 5;
            const duration = 10 + Math.random() * 10;
            const startX = Math.random() * 100;
            const startY = Math.random() * 100;
            
            return (
              <div
                key={i}
                className="absolute w-1 h-1 bg-accent rounded-full opacity-30"
                style={{
                  left: `${startX}%`,
                  top: `${startY}%`,
                  animation: `float ${duration}s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                  boxShadow: '0 0 6px rgba(59, 130, 246, 0.5)',
                  willChange: 'transform'
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NeuralNetwork;


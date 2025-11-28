
import React, { useEffect, useRef } from 'react';

export const BackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Disable premultipliedAlpha to handle transparency manually in shader
    const gl = canvas.getContext('webgl2', { 
      alpha: true, 
      antialias: true, 
      premultipliedAlpha: false 
    });
    
    if (!gl) {
      console.error('WebGL2 not supported');
      return;
    }

    // Enable Blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // --- Shader Sources ---
    
    const vertexShaderSource = `#version 300 es
      in vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

    const fragmentShaderSource = `#version 300 es
      precision highp float;
      
      uniform vec2 uResolution;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec2 uMouse;
      
      out vec4 fragColor;

      // Pseudo-random function
      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      // HSL to RGB color conversion
      // h: hue (0-1), s: saturation (0-1), l: lightness (0-1)
      // Returns RGB vec3 with values in range (0-1)
      vec3 hsl2rgb(float h, float s, float l) {
          // Wrap hue to [0, 1] range
          h = fract(h);
          
          // Calculate chroma
          float c = (1.0 - abs(2.0 * l - 1.0)) * s;
          
          // Calculate intermediate value
          float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
          
          // Calculate match value
          float m = l - c * 0.5;
          
          vec3 rgb;
          
          // Determine RGB based on hue sector
          if (h < 1.0 / 6.0) {
              rgb = vec3(c, x, 0.0);
          } else if (h < 2.0 / 6.0) {
              rgb = vec3(x, c, 0.0);
          } else if (h < 3.0 / 6.0) {
              rgb = vec3(0.0, c, x);
          } else if (h < 4.0 / 6.0) {
              rgb = vec3(0.0, x, c);
          } else if (h < 5.0 / 6.0) {
              rgb = vec3(x, 0.0, c);
          } else {
              rgb = vec3(c, 0.0, x);
          }
          
          // Add match value to get final RGB
          return rgb + m;
      }

      // SDF Primitives
      float sdCircle(vec2 p, float r) {
          return length(p) - r;
      }

      float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
      }

      // Musical Note SDF (Simple elegant note)
      float sdNote(vec2 p) {
          // Note head (filled circle)
          float head = sdCircle(p - vec2(0.0, -0.15), 0.18);
          
          // Stem (vertical line)
          float stem = sdBox(p - vec2(0.15, 0.25), vec2(0.035, 0.45));
          
          // Combine head and stem
          float d = min(head, stem);
          
          return d;
      }

      void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
          
          // Camera / Ray setup for background grid
          float camX = (uMouse.x / uResolution.x - 0.5) * 0.5;
          float camY = (uMouse.y / uResolution.y - 0.5) * 0.5;
          
          float speed = 1.5;
          vec3 ro = vec3(camX, 1.0 + camY, uTime * speed); 
          vec3 rd = normalize(vec3(uv.x, uv.y - 0.3, 1.0)); 
          
          // Ground Plane Intersection
          float t = -(ro.y) / rd.y;
          
          vec3 color = vec3(0.0);
          float alpha = 0.0;

          // --- Terrain Grid ---
          if (t > 0.0) {
              vec3 p = ro + rd * t; // Intersection point
              vec2 gridPos = p.xz;
              
              // Terrain height
              float terrainHeight = sin(gridPos.x * 0.5) * 0.3 + sin(gridPos.y * 0.3) * 0.3;
              gridPos.x += terrainHeight * 0.5;
              
              // Grid Lines
              vec2 grid = abs(fract(gridPos) - 0.5) / fwidth(gridPos);
              float line = min(grid.x, grid.y);
              float thickness = 1.0 - smoothstep(0.0, 1.5, line);
              
              // Effects
              float fog = 1.0 / (1.0 + t * t * 0.02);
              float horizon = smoothstep(0.0, 0.15, abs(rd.y));
              float pulse = exp(-abs(fract(p.z * 0.1 - uTime * 0.2) - 0.5) * 10.0);
              
              // Composition
              vec3 gridColor = uColor;
              gridColor += uColor * pulse * 2.0;
              
              if (thickness > 0.8) {
                 gridColor += vec3(0.5) * 0.3; 
              }

              color = gridColor;
              alpha = (thickness * 0.8 + pulse * 0.2) * fog * horizon;
              alpha = clamp(alpha, 0.0, 1.0);
          }

          // --- Floating Notes Layer (Gentle & Soft) ---
          vec3 noteLayerAcc = vec3(0.0);
          float noteAlphaAcc = 0.0;
          
          // Collision data storage (for particle system)
          // We'll store up to 8 collisions (32 particles / 4 particles per collision)
          vec2 collisionPositions[8];
          float collisionTimes[8];
          int collisionEdges[8]; // 0:left, 1:right, 2:top, 3:bottom
          int collisionCount = 0;
          
          // Performance optimization: Pre-calculate aspect ratio once
          float aspectRatio = uResolution.x / uResolution.y;
          float edgeThreshold = 0.05;
          
          // Note Loop - Only 4 notes
          for(int i = 0; i < 4; i++) { 
              float fi = float(i);
              // Random seed per particle
              float rnd = fract(sin(fi * 12.9898) * 43758.5453); 
              
              // --- Gentle Floating Motion ---
              
              // Very slow, smooth speed
              float noteSpeed = 0.08 + rnd * 0.05; 
              float tGlobal = uTime * noteSpeed + fi * 8.0;
              
              float jumpIdx = floor(tGlobal);
              float progress = fract(tGlobal);
              
              // Smooth easing for more gentle motion
              float eased = progress * progress * (3.0 - 2.0 * progress); // Smoothstep easing
              
              // Generate positions
              float seedCurrent = jumpIdx;
              float seedNext = jumpIdx + 1.0;
              
              float r1 = fract(sin(seedCurrent * 12.9898 + fi) * 43758.5453);
              float r2 = fract(sin(seedNext * 12.9898 + fi) * 43758.5453);
              
              // Narrower X range for more centered appearance
              float x1 = (r1 - 0.5) * 2.4; 
              float x2 = (r2 - 0.5) * 2.4;
              
              float groundY = -0.6;
              vec2 P0 = vec2(x1, groundY);
              vec2 P2 = vec2(x2, groundY);
              
              // Gentler arc height
              float rHeight = fract(sin(seedCurrent * 78.233 + fi) * 43758.5453);
              float jumpHeight = 0.4 + rHeight * 0.5; 
              vec2 P1 = vec2((x1 + x2) * 0.5, groundY + jumpHeight);
              
              // Quadratic Bezier with eased progress
              vec2 A = mix(P0, P1, eased);
              vec2 B = mix(P1, P2, eased);
              vec2 notePos = mix(A, B, eased);
              
              // --- Collision Detection (Optimized) ---
              
              // Performance optimization: Early exit if collision pool is full
              // This prevents unnecessary collision checks when we can't store more
              if (collisionCount < 8) {
                  // Collision trigger condition: only trigger at start or end of trajectory
                  // to avoid repeated triggers (progress < 0.1 or progress > 0.9)
                  // Check this first as it's cheaper than distance calculations
                  bool canTrigger = progress < 0.1 || progress > 0.9;
                  
                  if (canTrigger) {
                      // Calculate distances to each edge (optimized calculations)
                      float distToLeft = notePos.x + aspectRatio;
                      float distToRight = aspectRatio - notePos.x;
                      float distToTop = 1.0 - notePos.y;
                      float distToBottom = notePos.y + 1.0;
                      
                      // Check if note is within collision threshold of any edge
                      // Use early evaluation to skip unnecessary checks
                      bool hitLeft = distToLeft < edgeThreshold;
                      bool hitRight = !hitLeft && distToRight < edgeThreshold;
                      bool hitTop = !hitLeft && !hitRight && distToTop < edgeThreshold;
                      bool hitBottom = !hitLeft && !hitRight && !hitTop && distToBottom < edgeThreshold;
                      
                      // Detect collision
                      bool collision = hitLeft || hitRight || hitTop || hitBottom;
                      
                      // Record collision data if collision detected
                      if (collision) {
                          // Store collision position
                          collisionPositions[collisionCount] = notePos;
                          
                          // Store collision time
                          collisionTimes[collisionCount] = uTime;
                          
                          // Determine which edge was hit (already determined by priority)
                          int edgeType = 3; // default to bottom
                          if (hitLeft) {
                              edgeType = 0;
                          } else if (hitRight) {
                              edgeType = 1;
                          } else if (hitTop) {
                              edgeType = 2;
                          }
                          collisionEdges[collisionCount] = edgeType;
                          
                          collisionCount++;
                      }
                  }
              }
              
              // Gentle rotation
              float rotAngle = (eased - 0.5) * 0.8; 
              float c = cos(rotAngle);
              float s = sin(rotAngle);
              mat2 matRot = mat2(c, -s, s, c);
              
              // --- Drawing the Note ---
              
              // Slightly larger, softer notes
              float scale = 35.0; 
              
              vec2 p = uv - notePos;
              p = matRot * p;
              
              float dist = sdNote(p * scale);
              
              // Softer rendering with more blur
              float shape = 1.0 - smoothstep(0.0, 0.2, dist);
              float glow = (1.0 - smoothstep(0.0, 0.8, dist)) * 0.3;
              
              // Soft pastel colors based on theme
              vec3 noteColor = uColor * 0.6 + vec3(0.4);
              
              vec3 nCol = noteColor;
              float nAlpha = shape * 0.4 + glow; // Much more transparent
              
              // Longer, smoother fade
              float fade = smoothstep(0.0, 0.2, progress) * (1.0 - smoothstep(0.8, 1.0, progress));
              nAlpha *= fade;

              noteLayerAcc = mix(noteLayerAcc, nCol, nAlpha);
              noteAlphaAcc = max(noteAlphaAcc, nAlpha);
          }

          // Composite Notes over Grid
          color = mix(color, noteLayerAcc, noteAlphaAcc);
          alpha = max(alpha, noteAlphaAcc);


          // --- Custom Cursor (Apple-style Round Pointer) ---
          // We need screen pixel coordinates for exact sizing
          vec2 mPos = vec2(uMouse.x, uResolution.y - uMouse.y); // Flip Y for GL
          float dCursor = length(gl_FragCoord.xy - mPos);
          
          // Apple cursor: ~9px radius, smooth circle
          float cRadius = 9.0;
          float cShape = 1.0 - smoothstep(cRadius - 1.0, cRadius + 1.0, dCursor);
          
          // Soft shadow/glow/border
          float cGlow = 1.0 - smoothstep(cRadius, cRadius + 6.0, dCursor);
          
          // Color: Semi-transparent grey/white with slight dark border feel
          vec4 cursorFill = vec4(0.95, 0.95, 0.95, 0.5);
          vec4 cursorBorder = vec4(0.1, 0.1, 0.1, 0.2);
          
          // Mix glow and shape
          vec3 cRGB = mix(cursorBorder.rgb, cursorFill.rgb, cShape);
          float cA = max(cShape * cursorFill.a, cGlow * cursorBorder.a * 0.5);
          
          // Composite Cursor on top of everything
          vec3 finalRGB = mix(color, cRGB, cA);
          float finalA = max(alpha, cA);
          
          fragColor = vec4(finalRGB, finalA); 
      }
    `;

    // --- WebGL Setup ---

    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Buffer Setup (Full screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Uniform Locations
    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uColor = gl.getUniformLocation(program, 'uColor');
    const uMouse = gl.getUniformLocation(program, 'uMouse');

    // State
    let startTime = performance.now();
    let mouseX = 0;
    let mouseY = 0;

    // Resize Handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Mouse Handler
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;
    
    const render = () => {
      const currentTime = performance.now();
      const time = (currentTime - startTime) / 1000;

      // Clear with transparency
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Check Theme for Color
      const isDark = document.documentElement.classList.contains('dark');
      
      if (isDark) {
        // Cyber Blue/Green (Neon)
        gl.uniform3f(uColor, 0.1, 0.8, 0.7); 
      } else {
        // Technical Deep Blue/Grey
        gl.uniform3f(uColor, 0.2, 0.3, 0.5);
      }

      gl.uniform1f(uTime, time);
      gl.uniform2f(uMouse, mouseX, mouseY);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none opacity-80 mix-blend-multiply dark:mix-blend-screen"
      style={{ cursor: 'none' }} // Hide default cursor since we draw our own
    />
  );
};

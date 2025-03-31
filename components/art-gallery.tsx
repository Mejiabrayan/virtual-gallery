"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { Tables } from '@/database.types'

interface GalleryImage {
  url: string
  featured: boolean
  userId: string
  frameId: string
}

// Update the interface to match the database table
type FramePosition = Tables<'frame_positions'>

interface ArtGalleryProps {
  images: GalleryImage[]
  framePositions: FramePosition[]
}

export default function ArtGallery({ images, framePositions }: ArtGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    
    // Store ref value locally to use in cleanup
    const container = containerRef.current;

    // Initialize scene
    const scene = new THREE.Scene()
    sceneRef.current = scene
    scene.background = new THREE.Color(0xffffff) // White background

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    cameraRef.current = camera
    camera.position.set(0, 1.6, 5)

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    rendererRef.current = renderer
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controlsRef.current = controls
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.minDistance = 1.5
    controls.maxDistance = 15
    controls.maxPolarAngle = Math.PI / 1.5  // Allow more vertical rotation
    controls.minPolarAngle = Math.PI / 6    // Prevent looking too far down
    controls.enablePan = true               // Allow panning
    controls.panSpeed = 1.0                 // Increase pan speed
    controls.rotateSpeed = 1.0              // Increase rotation speed
    controls.zoomSpeed = 1.5                // Increase zoom speed
    controls.enableZoom = true              // Explicitly enable zoom
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN
    }
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN
    }
    controls.screenSpacePanning = true      // Pan in screen space instead of camera space
    controls.target.set(0, 1.2, 0)          // Look at center of gallery
    
    // Make controls more responsive to touchpad pinch
    renderer.domElement.addEventListener('gesturestart', function(e) {
      e.preventDefault();
    });
    
    renderer.domElement.addEventListener('gesturechange', function(e) {
      e.preventDefault();
    });
    
    // Enable trackpad/touchpad pinch-to-zoom
    renderer.domElement.addEventListener('wheel', function(e) {
      // If the event is a touchpad/trackpad pinch gesture
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY || e.detail || 0;
        if (delta > 0) {
          // Zoom out - move camera away from target
          const zoomOutVector = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
          camera.position.add(zoomOutVector.multiplyScalar(0.2));
        } else {
          // Zoom in - move camera closer to target
          const zoomInVector = new THREE.Vector3().subVectors(controls.target, camera.position).normalize();
          camera.position.add(zoomInVector.multiplyScalar(0.2));
        }
        camera.lookAt(controls.target);
        controls.update();
      }
    }, { passive: false });
    
    // Enable auto-rotation with gentle speed
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.3
    
    // Add event listeners to stop auto-rotation when user interacts
    const stopAutoRotation = () => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }
    };
    
    // Stop auto-rotation on any user interaction
    renderer.domElement.addEventListener('pointerdown', stopAutoRotation);
    renderer.domElement.addEventListener('wheel', stopAutoRotation);
    renderer.domElement.addEventListener('touchstart', stopAutoRotation);
    
    // Add keyboard controls
    window.addEventListener('keydown', (event) => {
      if (!controlsRef.current) return;
      
      stopAutoRotation();
      
      const ROTATION_SPEED = 0.1;
      const ZOOM_FACTOR = 0.2;
      
      // Arrow keys for rotation
      switch(event.key) {
        case 'ArrowLeft':
          // Move camera position to rotate around target
          camera.position.x = camera.position.x * Math.cos(ROTATION_SPEED) - camera.position.z * Math.sin(ROTATION_SPEED);
          camera.position.z = camera.position.x * Math.sin(ROTATION_SPEED) + camera.position.z * Math.cos(ROTATION_SPEED);
          break;
        case 'ArrowRight':
          camera.position.x = camera.position.x * Math.cos(-ROTATION_SPEED) - camera.position.z * Math.sin(-ROTATION_SPEED);
          camera.position.z = camera.position.x * Math.sin(-ROTATION_SPEED) + camera.position.z * Math.cos(-ROTATION_SPEED);
          break;
        case 'ArrowUp':
          // Adjust camera height (polar angle)
          if (camera.position.y < 6) camera.position.y += ROTATION_SPEED;
          break;
        case 'ArrowDown':
          if (camera.position.y > 0.5) camera.position.y -= ROTATION_SPEED;
          break;
        case '+':
        case '=':
          // Zoom in - move camera closer to target
          const zoomInVector = new THREE.Vector3().subVectors(controlsRef.current.target, camera.position).normalize();
          camera.position.add(zoomInVector.multiplyScalar(ZOOM_FACTOR));
          break;
        case '-':
        case '_':
          // Zoom out - move camera away from target
          const zoomOutVector = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target).normalize();
          camera.position.add(zoomOutVector.multiplyScalar(ZOOM_FACTOR));
          break;
        case 'r':
          // Reset view
          camera.position.set(0, 1.6, 5);
          controlsRef.current.target.set(0, 1.2, 0);
          break;
      }
      
      // Update camera
      camera.lookAt(controlsRef.current.target);
      controlsRef.current.update();
    });
    
    // Add orbit indicator with touchpad-specific instructions
    const orbitIndicator = document.createElement('div');
    orbitIndicator.style.position = 'absolute';
    orbitIndicator.style.bottom = '20px';
    orbitIndicator.style.right = '20px';
    orbitIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    orbitIndicator.style.color = 'white';
    orbitIndicator.style.padding = '12px 16px';
    orbitIndicator.style.borderRadius = '8px';
    orbitIndicator.style.fontSize = '14px';
    orbitIndicator.style.fontFamily = 'Arial, sans-serif';
    orbitIndicator.style.transition = 'opacity 0.5s';
    orbitIndicator.style.zIndex = '1000';
    orbitIndicator.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    orbitIndicator.style.lineHeight = '1.6';
    orbitIndicator.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px; text-align: center;">Gallery Controls</div>
      <div><b>Mouse:</b> Click + Drag to Orbit | Scroll to Zoom</div>
      <div><b>Touchpad:</b> Two-finger Drag to Pan | Pinch to Zoom</div>
      <div><b>Right-click + Drag:</b> Pan the Camera</div>
      <div><b>Keyboard:</b> Arrow keys to Rotate | +/- to Zoom</div>
    `;
    
    // Fade out the indicator after 12 seconds to give users more time to read
    setTimeout(() => {
      orbitIndicator.style.opacity = '0';
    }, 12000);
    
    container.appendChild(orbitIndicator);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xf0f0f0, 0.6)
    scene.add(hemisphereLight)

    // Add spotlight helper
    const addSpotlight = (
      x: number,
      y: number,
      z: number,
      targetX: number,
      targetY: number,
      targetZ: number,
      intensity = 1.5,
    ) => {
      const spotlight = new THREE.SpotLight(0xffffff, intensity)
      spotlight.position.set(x, y, z)
      spotlight.angle = Math.PI / 6
      spotlight.penumbra = 0.3
      spotlight.decay = 1.5
      spotlight.distance = 15
      spotlight.castShadow = true
      spotlight.shadow.bias = -0.0001

      const target = new THREE.Object3D()
      target.position.set(targetX, targetY, targetZ)
      scene.add(target)
      spotlight.target = target

      scene.add(spotlight)
      return spotlight
    }

    // Create room
    const createRoom = () => {
      // Floor
      const floorGeometry = new THREE.PlaneGeometry(10, 10)
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0xfafafa,
        roughness: 0.1,
        metalness: 0.05,
      })
      const floor = new THREE.Mesh(floorGeometry, floorMaterial)
      floor.rotation.x = -Math.PI / 2
      floor.receiveShadow = true
      scene.add(floor)

      // Ceiling
      const ceilingGeometry = new THREE.PlaneGeometry(10, 10)
      const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.05,
      })
      const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
      ceiling.rotation.x = Math.PI / 2
      ceiling.position.y = 3
      scene.add(ceiling)

      // Walls
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.05,
        metalness: 0.02,
      })

      // Back wall
      const backWallGeometry = new THREE.PlaneGeometry(10, 3)
      const backWall = new THREE.Mesh(backWallGeometry, wallMaterial)
      backWall.position.z = -5
      backWall.position.y = 1.5
      scene.add(backWall)

      // Front wall with opening
      const frontWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), wallMaterial)
      frontWallLeft.position.z = 5
      frontWallLeft.position.x = -3.5
      frontWallLeft.position.y = 1.5
      frontWallLeft.rotation.y = Math.PI
      scene.add(frontWallLeft)

      const frontWallRight = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), wallMaterial)
      frontWallRight.position.z = 5
      frontWallRight.position.x = 3.5
      frontWallRight.position.y = 1.5
      frontWallRight.rotation.y = Math.PI
      scene.add(frontWallRight)

      // Left wall
      const leftWallGeometry = new THREE.PlaneGeometry(10, 3)
      const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial)
      leftWall.position.x = -5
      leftWall.position.y = 1.5
      leftWall.rotation.y = Math.PI / 2
      scene.add(leftWall)

      // Right wall
      const rightWallGeometry = new THREE.PlaneGeometry(10, 3)
      const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial)
      rightWall.position.x = 5
      rightWall.position.y = 1.5
      rightWall.rotation.y = -Math.PI / 2
      scene.add(rightWall)

      return {
        leftWall,
        rightWall,
        backWall,
        frontWallLeft,
        frontWallRight,
      }
    }

    const room = createRoom()
    
    // Log room for debugging
    console.debug('Room created:', room);

    // Add track lighting
    const createTrackLighting = () => {
      // Create track system
      const trackGeometry = new THREE.BoxGeometry(8, 0.08, 0.08)
      const trackMaterial = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.2, 
        metalness: 0.8,
      })

      // Main track
      const mainTrack = new THREE.Mesh(trackGeometry, trackMaterial)
      mainTrack.position.set(0, 2.95, 0)
      scene.add(mainTrack)

      // Add lights along the track
      const positions = [-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5]
      positions.forEach((pos) => {
        // Light fixture
        const fixtureGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.2, 16)
        const fixtureMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          roughness: 0.2,
          metalness: 0.8,
        })
        const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial)
        fixture.position.set(pos, 2.8, 0)
        scene.add(fixture)

        // Add spotlight with dramatic lighting
        if (pos < -1) {
          // Lights for left wall
          addSpotlight(pos, 2.8, 0, -4.9, 1.5, pos * 1.3)
        } else if (pos > 1) {
          // Lights for right wall
          addSpotlight(pos, 2.8, 0, 4.9, 1.5, -pos * 1.3)
        } else {
          // Center lights for back wall
          addSpotlight(pos - 0.5, 2.8, 0, pos - 1, 1.5, -4.9)
          addSpotlight(pos + 0.5, 2.8, 0, pos + 1, 1.5, -4.9)
        }
      })

      // Additional fill lights
      const fillLight1 = new THREE.PointLight(0xffffff, 0.8)
      fillLight1.position.set(0, 2, 0)
      scene.add(fillLight1)

      const fillLight2 = new THREE.PointLight(0xffffff, 0.5)
      fillLight2.position.set(-3, 2, -3)
      scene.add(fillLight2)

      const fillLight3 = new THREE.PointLight(0xffffff, 0.5)
      fillLight3.position.set(3, 2, -3)
      scene.add(fillLight3)

      // Special spotlight for featured image
      const featuredSpot = new THREE.SpotLight(0xffffff, 2.0)
      featuredSpot.position.set(0, 2.8, -2)
      featuredSpot.angle = Math.PI / 5
      featuredSpot.penumbra = 0.2
      featuredSpot.decay = 1.0
      featuredSpot.distance = 10

      const featuredTarget = new THREE.Object3D()
      featuredTarget.position.set(0, 1.5, -4.95)
      scene.add(featuredTarget)
      featuredSpot.target = featuredTarget

      scene.add(featuredSpot)
    }

    createTrackLighting()

    // Define frame positions
    const getFramePosition = (frameId: string) => {
      // Default position
      let position = { x: 0, y: 1.5, z: -4.95, rotationY: 0, width: 1.5, height: 2 }

      // Map positions based on frame ID
      if (frameId === "center") {
        position = { x: 0, y: 1.5, z: -4.95, rotationY: 0, width: 2.5, height: 2.5 }
      }
      // Back wall positions
      else if (frameId === "backLeft") {
        position = { x: -3, y: 1.5, z: -4.95, rotationY: 0, width: 1.5, height: 2 }
      } else if (frameId === "backRight") {
        position = { x: 3, y: 1.5, z: -4.95, rotationY: 0, width: 1.5, height: 2 }
      }
      // Left wall positions
      else if (frameId === "leftWall1") {
        position = { x: -4.95, y: 1.5, z: -3, rotationY: -Math.PI / 2, width: 1.5, height: 2 }
      } else if (frameId === "leftWall2") {
        position = { x: -4.95, y: 1.5, z: 0, rotationY: -Math.PI / 2, width: 1.5, height: 2 }
      }
      // Right wall positions
      else if (frameId === "rightWall1") {
        position = { x: 4.95, y: 1.5, z: -3, rotationY: Math.PI / 2, width: 1.5, height: 2 }
      } else if (frameId === "rightWall2") {
        position = { x: 4.95, y: 1.5, z: 0, rotationY: Math.PI / 2, width: 1.5, height: 2 }
      }

      return position
    }

    // Add paintings
    const addPaintings = () => {
      const frameDepth = 0.05
      const frameBorderWidth = 0.1

      const createFrame = (
        width: number,
        height: number,
        texture: THREE.Texture,
        featured: boolean,
        userId: string,
      ) => {
        const group = new THREE.Group()

        // Canvas/Image
        const canvasGeometry = new THREE.BoxGeometry(width, height, 0.01)
        const canvasMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          emissive: featured ? 0x555555 : 0x333333,
          emissiveIntensity: featured ? 0.4 : 0.2,
        })
        const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial)
        canvas.position.z = frameDepth / 2
        canvas.castShadow = true
        canvas.receiveShadow = true
        group.add(canvas)

        // Frame material
        const frameMaterial = new THREE.MeshStandardMaterial({
          color: featured ? 0xffd700 : 0xd4af37,  // Gold for featured, darker gold for others
          roughness: featured ? 0.2 : 0.3,
          metalness: featured ? 0.9 : 0.7,
          emissive: featured ? 0x996515 : 0x553311,
          emissiveIntensity: featured ? 0.4 : 0.2,
        })

        // Make frame thicker for featured images
        const borderWidth = featured ? frameBorderWidth * 2 : frameBorderWidth
        const frameDepthActual = featured ? frameDepth * 1.5 : frameDepth

        // Top frame border
        const topFrameGeometry = new THREE.BoxGeometry(width + borderWidth * 2, borderWidth, frameDepthActual)
        const topFrame = new THREE.Mesh(topFrameGeometry, frameMaterial)
        topFrame.position.y = height / 2 + borderWidth / 2
        group.add(topFrame)

        // Bottom frame border
        const bottomFrameGeometry = new THREE.BoxGeometry(width + borderWidth * 2, borderWidth, frameDepthActual)
        const bottomFrame = new THREE.Mesh(bottomFrameGeometry, frameMaterial)
        bottomFrame.position.y = -height / 2 - borderWidth / 2
        group.add(bottomFrame)

        // Left frame border
        const leftFrameGeometry = new THREE.BoxGeometry(borderWidth, height + borderWidth * 2, frameDepthActual)
        const leftFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial)
        leftFrame.position.x = -width / 2 - borderWidth / 2
        group.add(leftFrame)

        // Right frame border
        const rightFrameGeometry = new THREE.BoxGeometry(borderWidth, height + borderWidth * 2, frameDepthActual)
        const rightFrame = new THREE.Mesh(rightFrameGeometry, frameMaterial)
        rightFrame.position.x = width / 2 + borderWidth / 2
        group.add(rightFrame)

        // Add user ID label
        if (!featured) {
          const canvas = document.createElement("canvas")
          canvas.width = 256
          canvas.height = 64
          const context = canvas.getContext("2d")
          if (context) {
            context.fillStyle = "#333333"
            context.fillRect(0, 0, canvas.width, canvas.height)
            context.fillStyle = "white"
            context.font = "24px Arial"
            context.textAlign = "center"
            context.textBaseline = "middle"
            context.fillText(userId, canvas.width / 2, canvas.height / 2)

            const texture = new THREE.CanvasTexture(canvas)
            const labelGeometry = new THREE.PlaneGeometry(0.4, 0.1)
            const labelMaterial = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
            })
            const label = new THREE.Mesh(labelGeometry, labelMaterial)
            label.position.set(0, -height / 2 - borderWidth - 0.1, frameDepthActual / 2)
            group.add(label)
          }
        } else {
          // Featured label
          const canvas = document.createElement("canvas")
          canvas.width = 512
          canvas.height = 128
          const context = canvas.getContext("2d")
          if (context) {
            context.fillStyle = "#ffd700"
            context.fillRect(0, 0, canvas.width, canvas.height)
            context.fillStyle = "black"
            context.font = "bold 48px Arial"
            context.textAlign = "center"
            context.textBaseline = "middle"
            context.fillText("FEATURED", canvas.width / 2, canvas.height / 2)

            const texture = new THREE.CanvasTexture(canvas)
            const labelGeometry = new THREE.PlaneGeometry(0.8, 0.2)
            const labelMaterial = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
            })
            const label = new THREE.Mesh(labelGeometry, labelMaterial)
            label.position.set(0, height / 2 + borderWidth + 0.15, frameDepthActual / 2)
            group.add(label)

            // User ID for featured
            const userCanvas = document.createElement("canvas")
            userCanvas.width = 256
            userCanvas.height = 64
            const userContext = userCanvas.getContext("2d")
            if (userContext) {
              userContext.fillStyle = "#333333"
              userContext.fillRect(0, 0, userCanvas.width, userCanvas.height)
              userContext.fillStyle = "white"
              userContext.font = "24px Arial"
              userContext.textAlign = "center"
              userContext.textBaseline = "middle"
              userContext.fillText(`By: ${userId}`, userCanvas.width / 2, userCanvas.height / 2)

              const userTexture = new THREE.CanvasTexture(userCanvas)
              const userLabelGeometry = new THREE.PlaneGeometry(0.4, 0.1)
              const userLabelMaterial = new THREE.MeshBasicMaterial({
                map: userTexture,
                transparent: true,
              })
              const userLabel = new THREE.Mesh(userLabelGeometry, userLabelMaterial)
              userLabel.position.set(0, -height / 2 - borderWidth - 0.1, frameDepthActual / 2)
              group.add(userLabel)
            }
          }
        }

        return group
      }

      const textureLoader = new THREE.TextureLoader()
      const paintings: THREE.Group[] = []

      // Add images to frames
      for (const image of images) {
        const framePos = getFramePosition(image.frameId)
        
        console.log(`Loading image: ${image.url} for frame: ${image.frameId} (Featured: ${image.featured})`);

        textureLoader.load(
          image.url, 
          (texture) => {
            console.log(`Successfully loaded texture for ${image.frameId}`);
            const aspectRatio = texture.image.width / texture.image.height
            let width = framePos.width
            let height = framePos.height

            // Adjust for aspect ratio
            if (aspectRatio > 1) {
              height = width / aspectRatio
            } else {
              width = height * aspectRatio
            }

            const painting = createFrame(width, height, texture, image.featured, image.userId)
            painting.position.set(framePos.x, framePos.y, framePos.z)
            painting.rotation.y = framePos.rotationY
            scene.add(painting)
            paintings.push(painting)

            // Add spotlight for each painting
            const intensity = image.featured ? 2.5 : 1.5
            const paintingSpot = new THREE.SpotLight(image.featured ? 0xfffaf0 : 0xffffff, intensity)

            if (framePos.rotationY === 0) {
              paintingSpot.position.set(framePos.x, framePos.y + 0.5, framePos.z + 1.5)
              paintingSpot.target.position.set(framePos.x, framePos.y, framePos.z)
            } else if (framePos.rotationY === Math.PI / 2) {
              paintingSpot.position.set(framePos.x - 1.5, framePos.y + 0.5, framePos.z)
              paintingSpot.target.position.set(framePos.x, framePos.y, framePos.z)
            } else if (framePos.rotationY === -Math.PI / 2) {
              paintingSpot.position.set(framePos.x + 1.5, framePos.y + 0.5, framePos.z)
              paintingSpot.target.position.set(framePos.x, framePos.y, framePos.z)
            }

            paintingSpot.angle = Math.PI / 8
            paintingSpot.penumbra = 0.5
            paintingSpot.decay = 1.5
            paintingSpot.distance = 5
            scene.add(paintingSpot)
            scene.add(paintingSpot.target)
          },
          undefined, // onProgress callback not needed
          (error) => {
            console.error(`Error loading texture for ${image.frameId}:`, error);
            // Create frame with error texture
            const errorTexture = createErrorTexture(image.userId);
            const aspectRatio = 1; // Default to square for error texture
            let width = framePos.width;
            let height = framePos.height;
            
            // Adjust for aspect ratio
            if (aspectRatio > 1) {
              height = width / aspectRatio;
            } else {
              width = height * aspectRatio;
            }
            
            const painting = createFrame(width, height, errorTexture, image.featured, image.userId);
            painting.position.set(framePos.x, framePos.y, framePos.z);
            painting.rotation.y = framePos.rotationY;
            scene.add(painting);
            paintings.push(painting);
          }
        );
      }
      
      // Create error texture for failed images
      const createErrorTexture = (userId: string) => {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext("2d");
        
        if (context) {
          // Fill background
          context.fillStyle = "#f8f8f8";
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw error message
          context.fillStyle = "#e74c3c";
          context.font = "bold 32px Arial";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.fillText("Image Load Error", canvas.width / 2, canvas.height / 2 - 40);
          
          // Draw user ID
          context.fillStyle = "#333";
          context.font = "24px Arial";
          context.fillText(`User: ${userId}`, canvas.width / 2, canvas.height / 2 + 40);
          
          // Draw border
          context.strokeStyle = "#e74c3c";
          context.lineWidth = 8;
          context.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
        }
        
        return new THREE.CanvasTexture(canvas);
      }

      // Add empty frames for available positions
      const takenFrameIds = images.map((img) => img.frameId)

      framePositions.forEach((framePos) => {
        if (!takenFrameIds.includes(framePos.id)) {
          const pos = getFramePosition(framePos.id)
          const featured = framePos.id === "center";

          // Create empty frame
          const group = new THREE.Group()

          // Frame with darker color
          const frameMaterial = new THREE.MeshStandardMaterial({
            color: featured ? 0xb0b0b0 : 0x909090,
            roughness: 0.4,
            metalness: 0.6,
            emissive: featured ? 0x555555 : 0x333333,
            emissiveIntensity: 0.2,
          })

          const width = pos.width
          const height = pos.height
          const borderWidth = featured ? frameBorderWidth * 2 : frameBorderWidth
          const frameDepth = featured ? 0.075 : 0.05

          // Add placeholder canvas
          const placeHolderGeometry = new THREE.PlaneGeometry(width, height)
          const placeHolderMaterial = new THREE.MeshStandardMaterial({
            color: 0xf5f5f5,
            roughness: 0.9,
            metalness: 0.1,
          })
          const placeHolder = new THREE.Mesh(placeHolderGeometry, placeHolderMaterial)
          placeHolder.position.z = frameDepth / 2 - 0.01
          group.add(placeHolder)

          // Top frame border
          const topFrameGeometry = new THREE.BoxGeometry(width + borderWidth * 2, borderWidth, frameDepth)
          const topFrame = new THREE.Mesh(topFrameGeometry, frameMaterial)
          topFrame.position.y = height / 2 + borderWidth / 2
          group.add(topFrame)

          // Bottom frame border
          const bottomFrameGeometry = new THREE.BoxGeometry(width + borderWidth * 2, borderWidth, frameDepth)
          const bottomFrame = new THREE.Mesh(bottomFrameGeometry, frameMaterial)
          bottomFrame.position.y = -height / 2 - borderWidth / 2
          group.add(bottomFrame)

          // Left frame border
          const leftFrameGeometry = new THREE.BoxGeometry(borderWidth, height + borderWidth * 2, frameDepth)
          const leftFrame = new THREE.Mesh(leftFrameGeometry, frameMaterial)
          leftFrame.position.x = -width / 2 - borderWidth / 2
          group.add(leftFrame)

          // Right frame border
          const rightFrameGeometry = new THREE.BoxGeometry(borderWidth, height + borderWidth * 2, frameDepth)
          const rightFrame = new THREE.Mesh(rightFrameGeometry, frameMaterial)
          rightFrame.position.x = width / 2 + borderWidth / 2
          group.add(rightFrame)

          // "Available" label
          const labelCanvas = document.createElement("canvas")
          labelCanvas.width = 512
          labelCanvas.height = 128
          const labelContext = labelCanvas.getContext("2d")
          if (labelContext) {
            // Create gradient background
            const gradient = labelContext.createLinearGradient(0, 0, 0, labelCanvas.height)
            gradient.addColorStop(0, featured ? "#f0f0f0" : "#e0e0e0")
            gradient.addColorStop(1, featured ? "#d0d0d0" : "#c0c0c0")
            labelContext.fillStyle = gradient
            labelContext.fillRect(0, 0, labelCanvas.width, labelCanvas.height)
            
            // Add border
            labelContext.strokeStyle = featured ? "#888888" : "#666666"
            labelContext.lineWidth = 10
            labelContext.strokeRect(10, 10, labelCanvas.width - 20, labelCanvas.height - 20)
            
            // Add text
            labelContext.fillStyle = featured ? "#555555" : "#444444"
            labelContext.font = featured ? "bold 40px Arial" : "bold 32px Arial"
            labelContext.textAlign = "center"
            labelContext.textBaseline = "middle"
            labelContext.fillText(featured ? "FEATURED FRAME" : "AVAILABLE FRAME", labelCanvas.width / 2, labelCanvas.height / 2)

            const texture = new THREE.CanvasTexture(labelCanvas)
            const labelGeometry = new THREE.PlaneGeometry(featured ? 1.2 : 0.8, featured ? 0.3 : 0.2)
            const labelMaterial = new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
            })
            const label = new THREE.Mesh(labelGeometry, labelMaterial)
            label.position.set(0, 0, frameDepth / 2 + 0.01)
            group.add(label)
          }

          group.position.set(pos.x, pos.y, pos.z)
          group.rotation.y = pos.rotationY
          scene.add(group)
          paintings.push(group)
        }
      })

      return paintings
    }

    const paintings = addPaintings()
    
    // Log paintings for debugging
    console.debug('Paintings added:', paintings.length);

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return

      cameraRef.current.aspect = window.innerWidth / window.innerHeight
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener("resize", handleResize)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      if (controlsRef.current) {
        controlsRef.current.update()
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    animate()

    // Create a button to toggle auto-rotation
    const rotationToggle = document.createElement('button');
    rotationToggle.style.position = 'absolute';
    rotationToggle.style.bottom = '20px';
    rotationToggle.style.left = '20px';
    rotationToggle.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    rotationToggle.style.color = 'white';
    rotationToggle.style.border = 'none';
    rotationToggle.style.padding = '10px 16px';
    rotationToggle.style.borderRadius = '8px';
    rotationToggle.style.fontSize = '14px';
    rotationToggle.style.fontFamily = 'Arial, sans-serif';
    rotationToggle.style.cursor = 'pointer';
    rotationToggle.style.zIndex = '1000';
    rotationToggle.style.display = 'flex';
    rotationToggle.style.alignItems = 'center';
    rotationToggle.style.transition = 'background-color 0.3s';
    rotationToggle.innerHTML = '⟳ Auto-rotate: ON';
    rotationToggle.title = 'Toggle auto-rotation';
    
    rotationToggle.addEventListener('click', () => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
        rotationToggle.innerHTML = controlsRef.current.autoRotate ? '⟳ Auto-rotate: ON' : '⟳ Auto-rotate: OFF';
        rotationToggle.style.backgroundColor = controlsRef.current.autoRotate ? 'rgba(0, 128, 0, 0.8)' : 'rgba(0, 0, 0, 0.8)';
      }
    });
    
    container.appendChild(rotationToggle);
    
    // Prevent default touch behaviors that might interfere with controls
    renderer.domElement.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    renderer.domElement.addEventListener('touchmove', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // Add additional handling for two-finger gestures on touchpad
    renderer.domElement.addEventListener('pointermove', function(e) {
      if (e.isPrimary === false && e.pointerType === 'touch') {
        stopAutoRotation();
      }
    });

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)

      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement)
      }

      // Dispose geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose()
          }

          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => {
                if (material.map) material.map.dispose()
                material.dispose()
              })
            } else {
              if (object.material.map) object.material.map.dispose()
              object.material.dispose()
            }
          }
        }
      })
    }
  }, [images, framePositions])

  return <div ref={containerRef} className="h-full w-full bg-black" />
}


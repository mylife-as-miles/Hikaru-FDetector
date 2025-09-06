import { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { LoadingScreen } from './components/LoadingScreen';
import { LandingPage } from './components/LandingPage';
import { CameraPreview } from './components/CameraPreview';
import { FruitDetection } from './components/FruitDetection';
import { InstallPrompt } from './components/InstallPrompt';
import { useMobileDetection } from './hooks/useMobileDetection';
import { useFruitDetection } from './hooks/useFruitDetection';
import { CameraFacing } from './types/media';

function App() {
  const { isMobile, isMobileUserAgent, isMobileScreen, viewportHeight, isPWA } = useMobileDetection();
  
  // Detect if running in an iframe
  const [isInIframe, setIsInIframe] = useState(false);
  
  useEffect(() => {
    // Check if the app is running inside an iframe
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);
    console.log('App running in iframe:', inIframe);
  }, []);
  
  // Helper function to determine if front camera should be used
  const shouldUseFrontCamera = (isMobileUserAgent: boolean, isMobileScreen: boolean): boolean => {
    return !isMobileUserAgent && isMobileScreen;
  };
  
  // Set initial camera facing based on device type and screen size
  const initialCameraFacing = (isInIframe && shouldUseFrontCamera(isMobileUserAgent, isMobileScreen))
    ? 'user' 
    : 'environment';

  const [cameraFacing, setCameraFacing] = useState<CameraFacing>(initialCameraFacing);
  const [permissionState, setPermissionState] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [initialPermissionChecked, setInitialPermissionChecked] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [showLandingPage, setShowLandingPage] = useState(true);
  
  // Check if loading screen is disabled via environment variable
  const isLoadingScreenDisabled = import.meta.env.VITE_APP_DISABLE_LOADING_SCREEN === 'true';
  
  // Dynamic camera facing: update when device type or screen size changes
  useEffect(() => {
    // Only apply special camera facing logic when running in an iframe
    if (!isInIframe) return;
    
    const newCameraFacing = shouldUseFrontCamera(isMobileUserAgent, isMobileScreen) 
      ? 'user' 
      : 'environment';
    
    // Only update if the camera facing should actually change
    if (newCameraFacing !== cameraFacing) {
      setCameraFacing(newCameraFacing);
    }
  }, [isInIframe, isMobileUserAgent, isMobileScreen, cameraFacing]);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const fruitDetection = useFruitDetection();
  const [isFruitDetectionActive, setIsFruitDetectionActive] = useState(false);
  const cameraRef = useRef<{ video: HTMLVideoElement | null }>(null);
  const [detailPopupResult, setDetailPopupResult] = useState<any>(null);

  // Initial permission check - runs once when app mounts
  useEffect(() => {
    const checkInitialPermissions = async () => {
      try {
        // Check if the Permissions API is available
        if ('permissions' in navigator) {
          console.log('PWA: Checking initial camera permissions...');
          
          const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
          
          console.log('PWA: Initial camera permission state:', permission.state);
          
          switch (permission.state) {
            case 'granted':
              // Permission already granted, bypass loading screen
              setPermissionState('granted');
              break;
            case 'denied':
              // Permission denied, show denial screen
              setPermissionState('denied');
              break;
            case 'prompt':
            default:
              // Permission needs to be requested, keep loading state
              setPermissionState('loading');
              break;
          }
        } else {
          // Permissions API not available, fall back to getUserMedia test
          console.log('PWA: Permissions API not available, testing with getUserMedia...');
          
          try {
            const nav = navigator as Navigator;
            if (!nav.mediaDevices?.getUserMedia) {
              throw new Error('getUserMedia not supported');
            }
            const stream = await nav.mediaDevices.getUserMedia({ 
              video: true, 
              audio: false 
            });
            
            // If we get here, permission is granted
            stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            setPermissionState('granted');
            
          } catch (error) {
            // Permission might be denied or need prompting
            const errorName = (error as Error)?.name;
            if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
              setPermissionState('denied');
            } else {
              // Other errors (like device not found) - still need to prompt
              setPermissionState('loading');
            }
          }
        }
      } catch (error) {
        console.error('PWA: Error checking initial permissions:', error);
        // On error, default to loading state to show permission prompt
        setPermissionState('loading');
      } finally {
        setInitialPermissionChecked(true);
      }
    };

    checkInitialPermissions();
  }, []); // Run only once on mount

  // If loading screen is disabled, automatically request permissions
  useEffect(() => {
    if (isLoadingScreenDisabled && permissionState === 'loading' && initialPermissionChecked) {
      const requestPermissions = async () => {
        try {
          // Add a longer delay for PWA to ensure proper initialization
          await new Promise(resolve => setTimeout(resolve, isPWA ? 500 : 100));
          
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
          });
          stream.getTracks().forEach(track => track.stop());
          handlePermissionGranted();
        } catch (error) {
          console.error('Permission denied:', error);
          handlePermissionDenied();
        }
      };
      
      requestPermissions();
    }
  }, [isLoadingScreenDisabled, permissionState, isPWA, initialPermissionChecked]);

  const handleCapture = async (blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      await fruitDetection.detectFruits(base64data);
      setDetailPopupResult(fruitDetection.detectionResults);
    };
  };

  const toggleCameraFacing = () => {
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handlePermissionGranted = () => {
    setPermissionState('granted');
  };

  const handlePermissionDenied = () => {
    setPermissionState('denied');
  };

  // Show landing page first
  if (showLandingPage) {
    return (
      <LandingPage 
        onGetStarted={() => setShowLandingPage(false)}
      />
    );
  }

  // Show loading screen until permission is checked and granted
  if ((!initialPermissionChecked || permissionState === 'loading') && !isLoadingScreenDisabled) {
    return (
      <LoadingScreen
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
        isPWA={isPWA}
        isInitialCheck={!initialPermissionChecked}
      />
    );
  }

  // Show permission denied state
  if (permissionState === 'denied') {
    return (
      <div className="bg-zinc-950 flex items-center justify-center p-6" style={{ height: viewportHeight }}>
        <div className="text-center text-gray-100 max-w-md">
          <Camera className="h-16 w-16 mx-auto mb-6 text-zinc-400" />
          <h1 className="text-2xl font-bold mb-4">Camera Access Required</h1>
          <p className="text-zinc-400 mb-6">
            This app needs access to your camera to identify fruits.
            Please enable permissions in your browser settings and refresh the page.
          </p>
          <button
            onClick={() => setPermissionState('loading')}
            className="bg-[#FF4D00] hover:bg-[#E63E00] text-white px-6 py-3 rounded-xl transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`text-gray-100 bg-zinc-950 ${isMobile ? 'flex flex-col' : ''}`}
      style={{ 
        height: isMobile ? viewportHeight : 'auto', 
        minHeight: isMobile ? 'auto' : '100vh',
      }}
    >
      {/* Main Content */}
      <main className={`${isMobile ? 'relative flex-1' : 'flex items-center justify-center min-h-screen'}`}>
        <div className={`${isMobile ? 'h-full flex flex-col' : 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          <div className="relative h-full flex flex-col space-y-6">
            {/* Camera Preview */}
            <div className={`${isMobile ? 'flex-1' : 'w-full'} ${isMobile ? 'h-full' : 'flex-grow'}`}>
              <CameraPreview
                facing={cameraFacing}
                selectedDeviceId={selectedDeviceId}
                setSelectedDeviceId={setSelectedDeviceId}
                onCapture={handleCapture}
                onFacingChange={toggleCameraFacing}
                isCapturing={isCapturing}
                setIsCapturing={setIsCapturing}
                isPWA={isPWA}
                ref={cameraRef}
              />
            </div>
            <FruitDetection
              videoRef={cameraRef}
              isActive={isFruitDetectionActive}
              onToggle={() => setIsFruitDetectionActive(!isFruitDetectionActive)}
              className="absolute inset-0"
              {...fruitDetection}
              detailPopupResult={detailPopupResult}
              onCloseDetailPopup={() => setDetailPopupResult(null)}
            />
          </div>
        </div>
      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default App;
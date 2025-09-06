import React, { useRef, useCallback, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import Webcam from 'react-webcam';
import { gsap } from 'gsap';
import { Camera, SwitchCamera } from 'lucide-react';
import { useMobileDetection } from '../hooks/useMobileDetection';
import { CameraFacing } from '../types/media';

interface CameraPreviewProps {
  facing: CameraFacing;
  selectedDeviceId: string;
  setSelectedDeviceId: (deviceId: string) => void;
  onCapture: (blob: Blob) => void;
  onFacingChange: () => void;
  isCapturing: boolean;
  setIsCapturing: (capturing: boolean) => void;
  isPWA?: boolean;
}

export const CameraPreview = forwardRef<
  { video: HTMLVideoElement | null },
  CameraPreviewProps
>(({
  facing,
  selectedDeviceId,
  setSelectedDeviceId,
  onCapture,
  onFacingChange,
  isCapturing,
  setIsCapturing,
  isPWA = false
}, ref) => {
  const webcamRef = useRef<Webcam>(null);
  const switchCameraIconRef = useRef<SVGSVGElement>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);
  const initTimeoutRef = useRef<number | null>(null);
  const [showCameraTransitionOverlay, setShowCameraTransitionOverlay] = useState(false);
  const transitionOverlayRef = useRef<HTMLDivElement>(null);
  const [showInitialLoadOverlay, setShowInitialLoadOverlay] = useState(true);
  const initialLoadOverlayRef = useRef<HTMLDivElement>(null);

  const { isMobile, isMobileUserAgent, isMobileScreen } = useMobileDetection();

  // Calculate camera height based on device type and PWA status
  const cameraPreviewHeightStyle = useMemo(() => {
    // Special case: Desktop browser with mobile screen width (narrow window)
    if (!isMobileUserAgent && isMobileScreen) {
      return { height: isPWA ? '90vh' : '88vh' };
    }
    
    // Mobile devices (actual mobile user agent or mobile screen width)
    if (isMobile) {
      return { height: isPWA ? '82vh' : '76vh' };
    }
    
    // Desktop with wide window - use flexbox
    return {};
  }, [isMobileUserAgent, isMobileScreen, isMobile, isPWA]);

  // Enumerate video devices for desktop
  useEffect(() => {
    if (!isMobile) {
      const getVideoDevices = async () => {
        try {
          // Request permissions first to ensure device enumeration works
          await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(stream => {
              stream.getTracks().forEach(track => track.stop());
            })
            .catch(() => {
              // Ignore permission errors here, will be handled by main camera logic
            });

          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoInputs = devices.filter(device => device.kind === 'videoinput');
          setVideoDevices(videoInputs);
          
          // Set default device if none selected
          if (!selectedDeviceId && videoInputs.length > 0) {
            setSelectedDeviceId(videoInputs[0].deviceId);
          }
        } catch (error) {
          console.error('Error enumerating devices:', error);
        }
      };

      getVideoDevices();
    }
  }, [isMobile, selectedDeviceId, setSelectedDeviceId]);

  // Calculate video constraints with optimized settings
  const getVideoConstraints = useCallback(() => {
    const baseConstraints = {
      frameRate: { ideal: 30, max: 60 }
    };

    if (isMobile) {
      return {
        ...baseConstraints,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: facing,
        aspectRatio: 16/9
      };
    } else {
      return {
        ...baseConstraints,
        width: { ideal: 1920, max: 2560 },
        height: { ideal: 1080, max: 1440 },
        aspectRatio: 16/9,
        deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
      };
    }
  }, [isMobile, facing, selectedDeviceId]);

  // Function to shorten device names
  const shortenDeviceName = useCallback((deviceName: string, index: number) => {
    if (!deviceName) return `Camera ${index + 1}`;
    
    // Clean up device name while preserving "Camera"
    let shortened = deviceName
      .replace(/\s+\([^)]+\)$/, '') // Remove parenthetical info
      .replace(/\s+HD$/, '')
      .replace(/\s+\d+p$/, '')
      .replace(/\s+USB$/, '')
      .replace(/\s+Video$/, '')
      .replace(/\s+Device$/, '')
      .trim();
    
    // Ensure "Camera" is in the name
    if (!shortened.toLowerCase().includes('camera')) {
      shortened = `Camera ${index + 1}`;
    }
    
    // If too long, truncate and add ellipsis
    if (shortened.length > 20) {
      shortened = shortened.substring(0, 17) + '...';
    }
    
    return shortened;
  }, []);
  const videoConstraints = getVideoConstraints();

  // Reset state when facing or mobile detection changes
  useEffect(() => {
    setShowInitialLoadOverlay(true);
    setIsInitializing(true);
    setIsReady(false);
    setError(null);
    setMediaStream(null);
    setRetryCount(0);
  }, [facing, isMobile, selectedDeviceId]);

  // Show initial load overlay when component first mounts or when switching views
  useEffect(() => {
    setShowInitialLoadOverlay(true);
    if (initialLoadOverlayRef.current) {
      gsap.set(initialLoadOverlayRef.current, { opacity: 1 });
    }
  }, []); // Only on mount

  const capturePhoto = useCallback(() => {
    if (!webcamRef.current) return;
    
    setIsCapturing(true);
    
    setTimeout(() => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (imageSrc) {
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            onCapture(blob);
            setIsCapturing(false);
          })
          .catch(err => {
            console.error('Error converting photo:', err);
            setIsCapturing(false);
          });
      } else {
        setIsCapturing(false);
      }
    }, 100);
  }, [onCapture, setIsCapturing]);

  const handleUserMedia = useCallback((stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      console.log('Video track settings:', settings);
      console.log(`Device type: ${isMobile ? 'Mobile' : 'Desktop'}, Constraints:`, videoConstraints);
    }
    
    setIsInitializing(false);
    setIsReady(true);
    setError(null);
    setMediaStream(stream);
    setRetryCount(0);
    
    // Hide camera transition overlay with delay and fade out animation on mobile
    if (isMobile && showCameraTransitionOverlay) {
      console.log('Camera loaded, will hide overlay after 1 second...');
      // Wait 0.5 seconds for camera to stabilize, then fade out over 0.5 seconds
      setTimeout(() => {
        if (transitionOverlayRef.current) {
          console.log('Fading out camera transition overlay...');
          gsap.to(transitionOverlayRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
              console.log('Camera transition overlay hidden');
              setShowCameraTransitionOverlay(false);
            }
          });
        }
      }, 500);
    }
    
    // Hide initial load overlay with fade animation
    if (showInitialLoadOverlay) {
      console.log('Camera loaded, will hide initial overlay after 1 second...');
      setTimeout(() => {
        if (initialLoadOverlayRef.current) {
          console.log('Fading out initial load overlay...');
          gsap.to(initialLoadOverlayRef.current, {
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            onComplete: () => {
              console.log('Initial load overlay hidden');
              setShowInitialLoadOverlay(false);
            }
          });
        }
      }, 500);
    }
  }, [isMobile, showCameraTransitionOverlay, showInitialLoadOverlay, videoConstraints]);

  const handleUserMediaError = useCallback((error: string | DOMException) => {
    console.error('Camera error:', error);
    setIsInitializing(false);
    setIsReady(false);
    setMediaStream(null);
    
    // Implement retry logic for common initialization issues, especially in PWA
    if (retryCount < 3) {
      console.log(`Retrying camera initialization (attempt ${retryCount + 1}/3)`);
      setRetryCount(prev => prev + 1);
      
      // Progressive delay for retries
      const delay = isPWA ? (retryCount + 1) * 1500 : (retryCount + 1) * 1000;
      
      initTimeoutRef.current = setTimeout(() => {
        setError(null);
        setIsInitializing(true);
      }, delay);
    } else {
      setError(isPWA 
        ? 'Camera initialization failed. Please close and reopen the app, or refresh the page.'
        : 'Unable to access camera. Please check permissions and try refreshing the page.'
      );
    }
  }, [retryCount, isPWA]);

  // Add visibility change and pagehide listeners for PWA camera safety
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('PWA: App went into background, stopping camera tracks');
        
        // Stop all active media tracks
        if (mediaStream) {
          mediaStream.getTracks().forEach(track => {
            console.log('PWA: Stopping track:', track.kind, track.label);
            track.stop();
          });
        }
        
        // Reset camera state
        setIsReady(false);
        setMediaStream(null);
      } else if (document.visibilityState === 'visible' && !isReady && !error) {
        console.log('PWA: App came back to foreground, re-initializing camera');
        
        // Force complete re-initialization by incrementing retry count
        // This triggers a Webcam component remount via the key prop
        setTimeout(() => {
          setError(null);
          setIsInitializing(true);
          setRetryCount(prev => prev + 1); // This forces Webcam remount
          
          // The webcam component will handle setting isInitializing to false
          // via onUserMedia or onUserMediaError callbacks
        }, 200);
      }
    };

    const handlePageHide = () => {
      console.log('PWA: Page hide event, stopping all camera resources');
      
      // Stop all active media tracks
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    
    // Also listen for beforeunload as additional safety
    const handleBeforeUnload = () => {
      console.log('PWA: Before unload, cleaning up camera resources');
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [mediaStream, isReady, error, isInitializing]); // Dependencies for proper re-attachment

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  // Handle camera switch with animation
  const handleSwitchCameraClick = useCallback(() => {
    // Show transition overlay before camera switch on mobile
    if (isMobile && !showCameraTransitionOverlay) {
      console.log('Starting camera transition overlay...');
      setShowCameraTransitionOverlay(true);
      
      // Fade in the overlay quickly
      setTimeout(() => {
        if (transitionOverlayRef.current) {
          gsap.fromTo(transitionOverlayRef.current, 
            { opacity: 0 }, 
            { opacity: 1, duration: 0.1, ease: "power2.out" }
          );
        }
      }, 10);
      
      // Small delay to ensure the overlay is rendered, then trigger camera switch
      setTimeout(() => {
        console.log('Triggering camera switch...');
        onFacingChange();
      }, 50);
    } else {
      // Desktop or overlay already showing
      onFacingChange();
    }
    
    // Animate the icon
    if (switchCameraIconRef.current) {
      const tl = gsap.timeline();
      
      tl.to(switchCameraIconRef.current, {
        scale: 1.3,
        duration: 0.15,
        ease: "power2.out"
      })
      .to(switchCameraIconRef.current, {
        scale: 1,
        duration: 0.25,
        ease: "power2.out"
      });
    }
  }, [isMobile, showCameraTransitionOverlay, onFacingChange]);

  // Force camera reinitialization for PWA
  const handlePWARetry = useCallback(() => {
    setError(null);
    setIsReady(false);
    setRetryCount(0);
    setIsInitializing(true);
    
    // Clear any existing timeouts
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
    }
    
    // Force a complete reinitialization
    setTimeout(() => {
      setIsInitializing(false);
    }, 1000);
  }, []);

  useImperativeHandle(ref, () => ({
    get video() {
      return webcamRef.current?.video || null;
    }
  }));

  return (
    <div className={`relative ${isMobile ? 'space-y-1' : 'flex flex-col h-full space-y-1'}`}>
      {/* Camera Preview */}
      <div className={`relative w-full bg-black overflow-hidden shadow-2xl ${
        isMobile ? 'mx-auto' : 'rounded-2xl border border-zinc-700 flex-grow flex-shrink-0'
      }`} style={cameraPreviewHeightStyle}>
        {/* Camera Component */}
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          key={`webcam-${facing}-${selectedDeviceId}-${retryCount}`}
          className="w-full h-full object-cover"
          style={{
            aspectRatio: '16/9'
          }}
          mirrored={isMobile ? facing === 'user' : true}
        />


        {/* Initial Load Overlay - Shows on first camera load and view switches */}
        {showInitialLoadOverlay && (
          <div
            ref={initialLoadOverlayRef}
            className="absolute inset-0 z-20 bg-zinc-900 flex items-center justify-center"
          >
            <div className="text-gray-100 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100 mx-auto mb-3"></div>
              <p className="text-sm font-medium">Loading camera...</p>
            </div>
          </div>
        )}

        {/* Camera Transition Overlay - Mobile Only */}
        {isMobile && showCameraTransitionOverlay && (
          <div
            ref={transitionOverlayRef}
            className="absolute inset-0 z-10 opacity-0 bg-zinc-900"
          />
        )}

        {/* Loading State */}
        {((!isReady && !error) || isInitializing) && (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center p-6">
            <div className="text-gray-100 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-100 mx-auto mb-4"></div>
              <p className="font-medium">
                {retryCount > 0 ? `Retrying camera... (${retryCount}/3)` : 'Initializing camera...'}
              </p>
              <p className="text-xs text-zinc-400 mt-2 max-w-xs">
                Device: {isMobile ? 'Mobile' : 'Desktop'} {isPWA ? '(PWA)' : ''} | 
                Resolution: {videoConstraints.width.ideal}×{videoConstraints.height.ideal}
              </p>
              {retryCount > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  {isPWA ? 'PWA camera initialization in progress...' : 'Try reloading the page to initialize camera'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Camera Error State */}
        {error && (
          <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
            <div className="text-gray-100 text-center px-6">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Camera className="h-8 w-8 text-zinc-400" />
              </div>
              <p className="text-lg font-semibold mb-2">Camera Error</p>
              <p className="text-sm text-zinc-400 mb-6">{error}</p>
              <button
                onClick={isPWA ? handlePWARetry : () => window.location.reload()}
                className="bg-zinc-700 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-zinc-600 transition-all duration-200 shadow-lg"
              >
                {isPWA ? 'Retry Camera' : 'Try Again'}
              </button>
            </div>
          </div>
        )}

        {/* Capture Flash Effect */}
        {isCapturing && (
          <div className="absolute inset-0 bg-white animate-pulse" style={{ animationDuration: '200ms' }} />
        )}

        {/* Top Left Controls - Desktop Camera Selection Only */}
        {!isMobile && videoDevices.length > 1 && (
          <div className="absolute top-4 left-4">
            <div className="relative">
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                disabled={isCapturing}
                className="appearance-none bg-zinc-900/90 text-gray-100 px-3 py-1.5 pr-8 rounded-xl text-xs backdrop-blur-2xl border border-zinc-700 hover:border-zinc-600 hover:bg-zinc-900 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px] font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00]"
                style={{
                  background: 'rgba(24, 24, 27, 0.9)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                }}
              >
                {videoDevices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId} className="bg-zinc-900 text-gray-100 py-1">
                    {shortenDeviceName(device.label, index)}
                  </option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="w-3 h-3 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* Capture Controls - Inside camera feed */}
        <div
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          style={{ zIndex: 100 }}
        >
          <button
            onClick={capturePhoto}
            disabled={!isReady || isCapturing}
            className={`
              ${isMobile ? 'w-20 h-20' : 'w-20 h-20'} rounded-full border-2 flex items-center justify-center transition-all duration-200 shadow-2xl backdrop-blur-md relative z-50
              ${!isReady || isCapturing
                ? 'opacity-50 cursor-not-allowed bg-zinc-700/50 border-white/20'
                : 'cursor-pointer bg-zinc-700/70 hover:bg-zinc-600/80 hover:scale-105 active:scale-95 border-white/30 hover:border-white/50'
              }
            `}
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 100
            }}
          >
            <Camera className={`${isMobile ? 'h-8 w-8' : 'h-8 w-8'} text-white/80`} />
          </button>
        </div>
      </div>

      {/* Controls Section - Below camera feed */}
      <div className={`flex items-center justify-center px-6 pt-4 pb-4 ${!isMobile ? 'flex-shrink' : ''}`}>
        {/* Spacer for mobile layout */}
        {isMobile && <div className="flex-1" />}

        {/* Spacer for mobile layout */}
        {isMobile && <div className="flex-1" />}

        {/* Camera Switch for Mobile - Right */}
        {isMobile && (
          <button
            onClick={handleSwitchCameraClick}
            className="bg-zinc-800/80 text-gray-100 p-4 rounded-full hover:bg-zinc-700 transition-all duration-200 backdrop-blur-xl border border-zinc-700 shadow-lg relative z-50"
            disabled={isCapturing}
            style={{ position: 'relative', zIndex: 50 }}
          >
            <SwitchCamera ref={switchCameraIconRef} className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
});
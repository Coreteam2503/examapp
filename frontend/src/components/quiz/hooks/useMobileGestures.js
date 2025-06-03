import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for handling mobile touch gestures in quiz components
 */
export const useMobileGestures = (onSwipeLeft, onSwipeRight, options = {}) => {
  const {
    threshold = 50,
    velocity = 0.3,
    enableSwipe = true,
    enablePullToRefresh = false,
    onPullToRefresh
  } = options;

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const elementRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    if (!enableSwipe && !enablePullToRefresh) return;
    
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
      time: Date.now()
    });
  }, [enableSwipe, enablePullToRefresh]);

  const onTouchMove = useCallback((e) => {
    if (!touchStart) return;

    const currentTouch = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };

    // Handle pull to refresh
    if (enablePullToRefresh && elementRef.current?.scrollTop === 0) {
      const pullY = currentTouch.y - touchStart.y;
      if (pullY > 0) {
        e.preventDefault();
        setIsPulling(true);
        setPullDistance(Math.min(pullY, 120));
      }
    }

    setTouchEnd(currentTouch);
  }, [touchStart, enablePullToRefresh]);

  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const deltaTime = Date.now() - touchStart.time;
    const velocityX = Math.abs(deltaX) / deltaTime;

    // Handle pull to refresh
    if (isPulling) {
      if (pullDistance > 60 && onPullToRefresh) {
        onPullToRefresh();
      }
      setIsPulling(false);
      setPullDistance(0);
    }

    // Handle swipe gestures
    if (enableSwipe && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > threshold && velocityX > velocity) {
        if (deltaX > 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, threshold, velocity, enableSwipe, onSwipeLeft, onSwipeRight, isPulling, pullDistance, onPullToRefresh]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    elementRef,
    isPulling,
    pullDistance
  };
};

/**
 * Custom hook for handling long press gestures
 */
export const useLongPress = (onLongPress, options = {}) => {
  const { threshold = 500, onStart, onFinish, onCancel } = options;
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef();
  const target = useRef();

  const start = useCallback(
    (event) => {
      if (onStart) {
        onStart(event);
      }
      target.current = event.target;
      timeout.current = setTimeout(() => {
        onLongPress(event);
        setLongPressTriggered(true);
      }, threshold);
    },
    [onLongPress, threshold, onStart]
  );

  const clear = useCallback(
    (event, shouldTriggerOnFinish = true) => {
      timeout.current && clearTimeout(timeout.current);
      shouldTriggerOnFinish && longPressTriggered && onFinish && onFinish(event);
      setLongPressTriggered(false);
      if (onCancel && event && !longPressTriggered) {
        onCancel(event);
      }
    },
    [longPressTriggered, onFinish, onCancel]
  );

  return {
    onMouseDown: (e) => start(e),
    onTouchStart: (e) => start(e),
    onMouseUp: (e) => clear(e),
    onMouseLeave: (e) => clear(e, false),
    onTouchEnd: (e) => clear(e),
  };
};

/**
 * Custom hook for handling viewport height changes on mobile
 */
export const useViewportHeight = () => {
  const [vh, setVh] = useState(window.innerHeight * 0.01);

  useEffect(() => {
    const updateVh = () => {
      const newVh = window.innerHeight * 0.01;
      setVh(newVh);
      document.documentElement.style.setProperty('--vh', `${newVh}px`);
    };

    updateVh();
    window.addEventListener('resize', updateVh);
    window.addEventListener('orientationchange', updateVh);

    return () => {
      window.removeEventListener('resize', updateVh);
      window.removeEventListener('orientationchange', updateVh);
    };
  }, []);

  return vh;
};

/**
 * Custom hook for detecting mobile device and touch capabilities
 */
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const checkDevice = () => {
      // Check if device supports touch
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      setIsTouch(hasTouch);

      // Check if device is mobile based on screen size and user agent
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isMobileScreen = window.innerWidth <= 768;
      setIsMobile(isMobileUA || (isMobileScreen && hasTouch));

      // Check orientation
      const isPortrait = window.innerHeight > window.innerWidth;
      setOrientation(isPortrait ? 'portrait' : 'landscape');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return { isMobile, isTouch, orientation };
};

/**
 * Custom hook for haptic feedback simulation
 */
export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type = 'light') => {
    // Try to use native haptic feedback if available
    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate([50, 30, 50]);
          break;
        case 'success':
          navigator.vibrate([50, 50, 50]);
          break;
        case 'error':
          navigator.vibrate([100, 50, 100, 50, 100]);
          break;
        default:
          navigator.vibrate(10);
      }
    }
  }, []);

  return { triggerHaptic };
};

/**
 * Custom hook for managing mobile keyboard behavior
 */
export const useMobileKeyboard = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const heightDifference = initialViewportHeight - currentHeight;
        
        if (heightDifference > 150) { // Keyboard is likely open
          setIsKeyboardOpen(true);
          setKeyboardHeight(heightDifference);
        } else {
          setIsKeyboardOpen(false);
          setKeyboardHeight(0);
        }
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      };
    }
  }, []);

  return { isKeyboardOpen, keyboardHeight };
};

/**
 * Custom hook for scroll behavior optimization on mobile
 */
export const useMobileScroll = (elementRef) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState(null);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef();

  useEffect(() => {
    const element = elementRef?.current;
    if (!element) return;

    const handleScroll = () => {
      const currentScrollY = element.scrollTop;
      
      setIsScrolling(true);
      setScrollDirection(currentScrollY > lastScrollY.current ? 'down' : 'up');
      lastScrollY.current = currentScrollY;

      // Clear previous timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Set new timeout to detect end of scrolling
      scrollTimeout.current = setTimeout(() => {
        setIsScrolling(false);
        setScrollDirection(null);
      }, 150);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [elementRef]);

  return { isScrolling, scrollDirection };
};

/**
 * Custom hook for toast notifications
 */
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    const toast = { id, message, type, duration };

    setToasts(prev => [...prev, toast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
  const showWarning = useCallback((message) => showToast(message, 'warning'), [showToast]);

  return {
    toasts,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning
  };
};

/**
 * Custom hook for managing loading states
 */
export const useLoading = () => {
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const startLoading = useCallback((message = 'Loading...') => {
    setLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = useCallback(() => {
    setLoading(false);
    setLoadingMessage('');
  }, []);

  return {
    loading,
    loadingMessage,
    startLoading,
    stopLoading
  };
};

/**
 * Custom hook for managing bottom sheets
 */
export const useBottomSheet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState(null);

  const openBottomSheet = useCallback((sheetContent) => {
    setContent(sheetContent);
    setIsOpen(true);
  }, []);

  const closeBottomSheet = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setContent(null), 300); // Wait for animation
  }, []);

  return {
    isOpen,
    content,
    openBottomSheet,
    closeBottomSheet
  };
};

export default {
  useMobileGestures,
  useLongPress,
  useViewportHeight,
  useMobileDetection,
  useHapticFeedback,
  useMobileKeyboard,
  useMobileScroll,
  useToast,
  useLoading,
  useBottomSheet
};
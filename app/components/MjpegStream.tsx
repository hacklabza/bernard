import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { createOptimalStreamUrl, type CameraStreamOptions } from '../../services/api';

interface MjpegStreamProps {
  streamUrl?: string; // Now optional, can use baseUrl + options instead
  baseUrl?: string; // Base camera endpoint URL
  streamOptions?: CameraStreamOptions; // Camera stream options (quality, fps, width, height)
  containerWidth?: number; // Container width for optimal sizing
  containerHeight?: number; // Container height for optimal sizing
  style?: object;
  fallbackText?: string;
  onError?: (error: string) => void;
  onLoad?: () => void;
  showRefreshButton?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'scale-down';
  autoOptimizeDimensions?: boolean; // Auto-calculate optimal width/height
}

const MjpegStream: React.FC<MjpegStreamProps> = ({
  streamUrl,
  baseUrl,
  streamOptions,
  containerWidth,
  containerHeight,
  style,
  fallbackText = 'Camera Stream',
  onError,
  onLoad,
  showRefreshButton = true,
  objectFit = 'cover',
  autoOptimizeDimensions = true,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [isLandscape, setIsLandscape] = useState(
    screenData.width > screenData.height
  );

  // Calculate the actual stream URL to use - memoized to prevent constant refreshing
  const actualStreamUrl = useMemo(() => {
    // If streamUrl is provided directly, use it
    if (streamUrl) {
      return streamUrl;
    }

    // If we have container dimensions and auto-optimization is enabled
    if (autoOptimizeDimensions && containerWidth && containerHeight) {
      return createOptimalStreamUrl(containerWidth, containerHeight, streamOptions);
    }

    // Fallback: use base URL with any provided options
    if (baseUrl) {
      // This would need the cameraService.getStreamUrl method, but for now just return baseUrl
      // You could import cameraService here if needed
      return baseUrl;
    }

    // Last resort fallback
    return '';
  }, [streamUrl, containerWidth, containerHeight, streamOptions, baseUrl, autoOptimizeDimensions]);

  useEffect(() => {
    // Reset state when URL changes
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');
    console.log('MjpegStream URL changed to:', actualStreamUrl);

    // Set the orientation
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData(window);
      setIsLandscape(window.width > window.height);
    });

    // Set a timeout to hide loading after a reasonable time if onLoad doesn't fire
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // 1 second timeout

    return () => {
      clearTimeout(loadingTimeout);
      subscription?.remove();
    };
  }, [actualStreamUrl, refreshKey]);

  const webViewRef = useRef<WebView>(null);

  const handleWebViewLoad = () => {
    console.log('WebView loaded successfully');
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleWebViewError = (error: any) => {
    console.log('WebView error occurred:', error);
    setIsLoading(false);
    setHasError(true);
    const errorMsg = 'Failed to load camera stream';
    setErrorMessage(errorMsg);
    onError?.(errorMsg);
  };

  const handleRefresh = () => {
    console.log('Refreshing camera stream...');
    setIsLoading(true);
    setHasError(false);
    setErrorMessage('');

    // Always use the refreshKey method to force a complete reload
    setRefreshKey(prev => prev + 1);
  };

  // Dynamic refresh button positioning based on orientation
  const getRefreshButtonStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      top: 80,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      opacity: 0.5,
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      zIndex: 2,
    };

    if (isLandscape) {
      // In landscape: position in bottom-right, but further from edge
      return {
        ...baseStyle,
        top: 30,
        right: 60, // More space from right edge in landscape
      };
    } else {
      // In portrait: standard bottom-right positioning
      return {
        ...baseStyle,
        top: 80,
        right: 30,
      };
    }
  };

  // Get the final URL with refresh parameter if needed
  const finalUrl = useMemo(() => {
    return refreshKey > 0
      ? `${actualStreamUrl}${actualStreamUrl.includes('?') ? '&' : '?'}refresh=${refreshKey}`
      : actualStreamUrl;
  }, [actualStreamUrl, refreshKey]);

  const renderContent = () => {
    if (hasError) {
      return (
        <View style={[styles.fallbackContainer, style]}>
          <Text style={styles.fallbackText}>{fallbackText}</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Text style={styles.urlText}>URL: {actualStreamUrl}</Text>
          {showRefreshButton && (
            <TouchableOpacity style={getRefreshButtonStyle()} onPress={handleRefresh}>
              <Text style={styles.refreshButtonText}>↻ Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={[styles.streamContainer, style]}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading camera...</Text>
          </View>
        )}
        <WebView
          key={refreshKey} // Force re-render on refresh
          ref={webViewRef}
          source={{ uri: finalUrl }}
          onLoad={handleWebViewLoad}
          onLoadStart={() => {
            setIsLoading(true);
          }}
          onLoadEnd={() => {
            setIsLoading(false);
          }}
          onError={handleWebViewError}
          onHttpError={handleWebViewError}
          onMessage={(event) => {
            console.log('WebView message:', event.nativeEvent.data);
          }}
          javaScriptEnabled={false}
          domStorageEnabled={false}
          startInLoadingState={false}
          scalesPageToFit={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          bounces={false}
          scrollEnabled={false}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
        />
        {showRefreshButton && !isLoading && (
          <TouchableOpacity style={getRefreshButtonStyle()} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>↻</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return renderContent();
};

const styles = StyleSheet.create({
  streamContainer: {
    backgroundColor: '#000',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 1,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  fallbackContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  fallbackText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 10,
  },
  urlText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default MjpegStream;

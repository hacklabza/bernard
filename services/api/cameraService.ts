import { API_CONFIG } from './drivetrainService';

// Camera stream configuration
export const CAMERA_CONFIG = {
  streamEndpoint: '/sensor/camera/stream',
  defaultTimeout: 10000, // 10 seconds
} as const;

// Type definitions for camera service
export interface CameraStreamOptions {
  width?: number;
  height?: number;
}

export interface CameraService {
  getStreamUrl: (options?: CameraStreamOptions) => string;
}

// Camera API service
export const cameraService: CameraService = {
  getStreamUrl(options?: CameraStreamOptions): string {
    const baseUrl = `${API_CONFIG.baseURL}${CAMERA_CONFIG.streamEndpoint}`;

    // Add query parameters if options are provided
    if (options) {
      const params = new URLSearchParams();
      if (options.width) params.append('width', options.width.toString());
      if (options.height) params.append('height', options.height.toString());

      const queryString = params.toString();
      return queryString ? `${baseUrl}?${queryString}` : baseUrl;
    }

    return baseUrl;
  },
};

// Utility function to create stream URL with timestamp (prevents caching)
export const createFreshStreamUrl = (options?: CameraStreamOptions): string => {
  const baseUrl = cameraService.getStreamUrl(options);
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}t=${Date.now()}`;
};

// Utility function to calculate optimal stream dimensions
export interface StreamDimensions {
  width: number;
  height: number;
}

export const calculateOptimalDimensions = (
  containerWidth: number,
  containerHeight: number,
  maxWidth: number = 1920,
  maxHeight: number = 1080
): StreamDimensions => {
  // Calculate dimensions that fill the container while respecting max limits
  const targetWidth = Math.min(containerWidth, maxWidth);
  const targetHeight = Math.min(containerHeight, maxHeight);

  // Round to even numbers (some cameras prefer even dimensions)
  return {
    width: Math.floor(targetWidth / 2) * 2,
    height: Math.floor(targetHeight / 2) * 2,
  };
};

// Utility to create stream URL with optimal dimensions for container
export const createOptimalStreamUrl = (
  containerWidth: number,
  containerHeight: number,
  additionalOptions?: Omit<CameraStreamOptions, 'width' | 'height'>
): string => {
  const dimensions = calculateOptimalDimensions(containerWidth, containerHeight);

  const options: CameraStreamOptions = {
    ...additionalOptions,
    width: dimensions.width,
    height: dimensions.height,
  };

  return cameraService.getStreamUrl(options);
};

// Utility to create stream URL with optimal dimensions and fresh timestamp
export const createOptimalStreamUrlWithTimestamp = (
  containerWidth: number,
  containerHeight: number,
  additionalOptions?: Omit<CameraStreamOptions, 'width' | 'height'>
): string => {
  const dimensions = calculateOptimalDimensions(containerWidth, containerHeight);

  const options: CameraStreamOptions = {
    ...additionalOptions,
    width: dimensions.width,
    height: dimensions.height,
  };

  return createFreshStreamUrl(options);
};

// Export camera configuration for potential use in other components
export { API_CONFIG };

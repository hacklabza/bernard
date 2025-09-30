// API configuration
const API_CONFIG = {
  baseURL: 'http://192.168.68.103:8000/api',
  timeout: 5000,
} as const;

// Type definitions
export interface DriveCommand {
  direction: 'forward' | 'back' | 'left' | 'right';
  duration: number;
  speed: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface DrivetrainService {
  sendGoCommand: (command: DriveCommand) => Promise<ApiResponse>;
  sendStopCommand: () => Promise<ApiResponse>;
}

// Error handling
class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP client utility
const apiClient = {
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_CONFIG.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new ApiError(
          `HTTP error! status: ${response.status}`,
          response.status,
          response
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

// Drivetrain API service
export const drivetrainService: DrivetrainService = {
  async sendGoCommand(command: DriveCommand): Promise<ApiResponse> {
    try {
      console.log(`Sending go command: ${command.direction} for ${command.duration}s at speed ${command.speed}`);

      const result = await apiClient.request<ApiResponse>('/motion/drivetrain/go', {
        method: 'POST',
        body: JSON.stringify(command),
      });

      console.log('Go command sent successfully:', command);
      return result;
    } catch (error) {
      console.error('Error sending go command:', error);
      throw error;
    }
  },

  async sendStopCommand(): Promise<ApiResponse> {
    try {
      console.log('Sending stop command');

      const result = await apiClient.request<ApiResponse>('/motion/drivetrain/stop', {
        method: 'POST',
      });

      console.log('Stop command sent successfully');
      return result;
    } catch (error) {
      console.error('Error sending stop command:', error);
      throw error;
    }
  }
};

// Export API configuration for potential use in other services
export { API_CONFIG };

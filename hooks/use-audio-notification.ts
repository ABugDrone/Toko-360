import { useRef, useState, useEffect, useCallback } from 'react';

/**
 * Options for configuring audio notifications
 * 
 * **Validates: Requirements 9.1**
 */
export interface UseAudioNotificationOptions {
  /** Whether audio notifications are enabled */
  enabled: boolean;
  /** Debounce time in milliseconds (default: 3000) */
  debounceMs?: number;
}

/**
 * Controls returned by the audio notification hook
 * 
 * **Validates: Requirements 9.1**
 */
export interface AudioNotificationControls {
  /** Play the notification sound */
  play: () => void;
  /** Whether the audio can be played (loaded and ready) */
  canPlay: boolean;
}

/**
 * Custom hook for playing notification sounds with debouncing
 * 
 * This hook manages audio playback for notifications, handling:
 * - Audio element lifecycle
 * - Debouncing to prevent sound spam
 * - Browser autoplay restrictions
 * - Cleanup on unmount
 * 
 * **Validates: Requirements 9.1, 9.4**
 * 
 * @param options - Configuration options for audio notifications
 * @returns Controls for playing audio and checking readiness
 * 
 * @example
 * ```typescript
 * const { play, canPlay } = useAudioNotification({ enabled: true });
 * 
 * // Play sound when new message arrives
 * useEffect(() => {
 *   if (newMessageCount > previousCount && canPlay) {
 *     play();
 *   }
 * }, [newMessageCount]);
 * ```
 */
export function useAudioNotification(
  options: UseAudioNotificationOptions
): AudioNotificationControls {
  const { enabled, debounceMs = 3000 } = options;
  
  // Reference to the audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Track the last time the sound was played for debouncing
  const lastPlayedRef = useRef<number>(0);
  
  // Track whether the audio is loaded and ready to play
  const [canPlay, setCanPlay] = useState(false);
  
  // Initialize audio element on mount
  useEffect(() => {
    // Create audio element
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.5; // Set to 50% volume for pleasant listening
    
    // Set up event listeners
    const handleCanPlay = () => {
      setCanPlay(true);
    };
    
    const handleError = (e: ErrorEvent) => {
      console.error('Failed to load notification sound:', e);
      setCanPlay(false);
    };
    
    audio.addEventListener('canplaythrough', handleCanPlay);
    audio.addEventListener('error', handleError);
    
    // Store reference
    audioRef.current = audio;
    
    // Cleanup on unmount
    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.removeEventListener('error', handleError);
      
      // Pause if playing
      if (!audio.paused) {
        audio.pause();
      }
      
      // Clear reference
      audioRef.current = null;
    };
  }, []);
  
  /**
   * Play the notification sound with debouncing
   * 
   * **Validates: Requirements 9.1, 9.4**
   */
  const play = useCallback(() => {
    // Check if enabled
    if (!enabled) {
      return;
    }
    
    // Check if audio is ready
    if (!audioRef.current || !canPlay) {
      return;
    }
    
    // Check debounce - don't play if played within debounceMs
    const now = Date.now();
    const timeSinceLastPlay = now - lastPlayedRef.current;
    
    if (timeSinceLastPlay < debounceMs) {
      return;
    }
    
    // Attempt to play the sound
    const audio = audioRef.current;
    
    // Reset audio to start if already playing
    audio.currentTime = 0;
    
    // Play and handle errors
    audio.play().catch((error) => {
      // Handle autoplay restrictions
      if (error.name === 'NotAllowedError') {
        console.warn('Audio playback blocked by browser. User interaction required.');
      } else {
        console.error('Failed to play notification sound:', error);
      }
    });
    
    // Update last played timestamp
    lastPlayedRef.current = now;
  }, [enabled, canPlay, debounceMs]);
  
  return {
    play,
    canPlay,
  };
}

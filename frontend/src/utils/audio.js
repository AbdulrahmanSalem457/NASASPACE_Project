// Audio completely disabled per user preference - 100% silent system
class SoundFX {
  constructor() {
    this.isSirenPlaying = false;
  }
  init() {}
  playWarningChime() {}
  playTelemetryBeep() {}
  startEmergencySiren() {}
  stopEmergencySiren() {}
}

export const soundFX = new SoundFX();

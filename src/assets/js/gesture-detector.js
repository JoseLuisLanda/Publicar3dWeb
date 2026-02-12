// Gesture Detector for A-Frame AR
// Enables pinch-to-zoom and rotation gestures on AR objects

/* global AFRAME, THREE */

function getGestureDebug() {
  if (typeof window === 'undefined') return null;
  window.__PUBLICAR3D_GESTURE_DEBUG = window.__PUBLICAR3D_GESTURE_DEBUG || {
    counters: { touchstart: 0, touchmove: 0, touchend: 0 },
    touch: {},
    gesture: {},
    handler: { rotateCalls: 0, scaleCalls: 0 }
  };
  return window.__PUBLICAR3D_GESTURE_DEBUG;
}

if (typeof AFRAME !== 'undefined') {
  console.log('✅ Registering gesture components...');

  // Gesture Detector Component
  AFRAME.registerComponent('gesture-detector', {
  schema: {
    element: { default: '' }
  },

  init: function () {
    this.internalState = {
      previousState: null
    };

    this.emitGestureEvent = this.emitGestureEvent.bind(this);
    this.bindToTarget = this.bindToTarget.bind(this);

    // Prefer listening on the <canvas> to reliably receive touch events.
    // If a selector is provided, use it; otherwise use the canvas when available.
    this.targetElement = this.data.element && document.querySelector(this.data.element);

    // Try to bind immediately and also after the scene is loaded (canvas is created then)
    this.bindToTarget();
    if (this.el && this.el.addEventListener) {
      this.el.addEventListener('loaded', this.bindToTarget);
    }
  },

  bindToTarget: function () {
    const canvas = this.el && this.el.canvas ? this.el.canvas : (this.el && this.el.sceneEl && this.el.sceneEl.canvas);
    const nextTarget = this.targetElement || canvas || this.el;

    if (!nextTarget) return;
    if (this._boundTarget === nextTarget) return;

    // Unbind previous
    if (this._boundTarget) {
      this._boundTarget.removeEventListener('touchstart', this.emitGestureEvent);
      this._boundTarget.removeEventListener('touchend', this.emitGestureEvent);
      this._boundTarget.removeEventListener('touchmove', this.emitGestureEvent);
    }

    this._boundTarget = nextTarget;

    // Use passive:false so we can preventDefault on touchmove (avoid page scroll/zoom)
    const opts = { passive: false };
    this._boundTarget.addEventListener('touchstart', this.emitGestureEvent, opts);
    this._boundTarget.addEventListener('touchend', this.emitGestureEvent, opts);
    this._boundTarget.addEventListener('touchmove', this.emitGestureEvent, opts);
  },

  remove: function () {
    if (this.el && this.el.removeEventListener) {
      this.el.removeEventListener('loaded', this.bindToTarget);
    }

    if (this._boundTarget) {
      this._boundTarget.removeEventListener('touchstart', this.emitGestureEvent);
      this._boundTarget.removeEventListener('touchend', this.emitGestureEvent);
      this._boundTarget.removeEventListener('touchmove', this.emitGestureEvent);
      this._boundTarget = null;
    }
  },

  emitGestureEvent(event) {
    // Prevent browser scroll/zoom gesture handling
    if (event && event.cancelable) {
      event.preventDefault();
    }

    const dbg = getGestureDebug();
    if (dbg && event && event.type) {
      if (event.type === 'touchstart') dbg.counters.touchstart++;
      if (event.type === 'touchmove') dbg.counters.touchmove++;
      if (event.type === 'touchend') dbg.counters.touchend++;
      dbg.touch = {
        type: event.type,
        count: event.touches ? event.touches.length : 0,
        cancelable: !!event.cancelable
      };
    }

    const currentState = this.getTouchState(event);
    const previousState = this.internalState.previousState;

    const gestureContinues =
      previousState &&
      currentState &&
      currentState.touchCount == previousState.touchCount;

    const gestureEnded = previousState && !gestureContinues;
    const gestureStarted = currentState && !gestureContinues;

    if (gestureEnded) {
      const prefix = this.getEventPrefix(previousState.touchCount);
      // Standard events expected by gesture-handler
      this.el.emit(prefix + 'end', previousState);
      // Back-compat
      this.el.emit(prefix + 'ended', previousState);

      if (dbg) {
        dbg.gesture = { name: prefix + 'end' };
      }
      this.internalState.previousState = null;
    }

    if (gestureStarted) {
      currentState.startTime = performance.now();
      currentState.startPosition = currentState.position;
      currentState.startSpread = currentState.spread;
      const prefix = this.getEventPrefix(currentState.touchCount);
      // Standard events expected by gesture-handler
      this.el.emit(prefix + 'start', currentState);
      // Back-compat
      this.el.emit(prefix + 'started', currentState);

      if (dbg) {
        dbg.gesture = { name: prefix + 'start' };
      }
      this.internalState.previousState = currentState;
    }

    if (gestureContinues) {
      const eventDetail = {
        positionChange: {
          x: currentState.position.x - previousState.position.x,
          y: currentState.position.y - previousState.position.y
        }
      };

      if (currentState.spread) {
        eventDetail.spreadChange = currentState.spread - previousState.spread;
      }

      // Update state with new data
      Object.assign(previousState, currentState);

      // Add state data to event detail
      Object.assign(eventDetail, previousState);

      const prefix = this.getEventPrefix(currentState.touchCount);
      // Standard events expected by gesture-handler
      this.el.emit(prefix + 'move', eventDetail);
      // Back-compat
      this.el.emit(prefix + 'moved', eventDetail);

      if (dbg) {
        dbg.gesture = {
          name: prefix + 'move',
          spreadChange: typeof eventDetail.spreadChange === 'number' ? eventDetail.spreadChange.toFixed(3) : null,
          dx: eventDetail.positionChange ? eventDetail.positionChange.x : null,
          dy: eventDetail.positionChange ? eventDetail.positionChange.y : null
        };
      }
    }
  },

  getTouchState: function (event) {
    if (event.touches.length === 0) {
      return null;
    }

    // Convert event.touches to an array so we can use reduce
    const touchList = [];
    for (let i = 0; i < event.touches.length; i++) {
      touchList.push(event.touches[i]);
    }

    const touchState = {
      touchCount: touchList.length
    };

    // Calculate center of all touches
    const centerPositionRawX =
      touchList.reduce((sum, touch) => sum + touch.clientX, 0) /
      touchList.length;
    const centerPositionRawY =
      touchList.reduce((sum, touch) => sum + touch.clientY, 0) /
      touchList.length;

    touchState.position = { x: centerPositionRawX, y: centerPositionRawY };

    // Calculate average spread of touches from the center point
    if (touchList.length >= 2) {
      const spread =
        touchList.reduce((sum, touch) => {
          return (
            sum +
            Math.sqrt(
              Math.pow(centerPositionRawX - touch.clientX, 2) +
                Math.pow(centerPositionRawY - touch.clientY, 2)
            )
          );
        }, 0) / touchList.length;

      touchState.spread = spread;
    }

    return touchState;
  },

  getEventPrefix(touchCount) {
    const prefixes = ['onefinger', 'twofinger', 'threefinger', 'manyfinger'];
    return prefixes[Math.min(touchCount, 4) - 1];
  }
});

// Gesture Handler Component
AFRAME.registerComponent('gesture-handler', {
  schema: {
    enabled: { default: true },
    // positionChange is in pixels; use small factor to avoid huge jumps
    rotationFactor: { default: 0.01 },
    minScale: { default: 0.3 },
    maxScale: { default: 8 }
  },

  init: function () {
    this.handleScale = this.handleScale.bind(this);
    this.handleRotation = this.handleRotation.bind(this);

    this.initialScale = this.el.object3D.scale.clone();
    this.scaleFactor = 1;
  },

  play: function () {
    this.el.sceneEl.addEventListener('onefingermove', this.handleRotation);
    this.el.sceneEl.addEventListener('twofingermove', this.handleScale);
  },

  pause: function () {
    this.el.sceneEl.removeEventListener('onefingermove', this.handleRotation);
    this.el.sceneEl.removeEventListener('twofingermove', this.handleScale);
  },

  handleRotation: function (event) {
    if (!this.data.enabled) return;
    if (!this.el.object3D || !this.el.object3D.visible) return;

      this.el.object3D.rotation.y +=
        event.detail.positionChange.x * this.data.rotationFactor;
      this.el.object3D.rotation.x +=
        event.detail.positionChange.y * this.data.rotationFactor;

    const dbg = getGestureDebug();
    if (dbg) {
      dbg.handler.rotateCalls = (dbg.handler.rotateCalls || 0) + 1;
      dbg.handler.visible = !!this.el.object3D.visible;
      dbg.handler.rotX = Number(this.el.object3D.rotation.x).toFixed(3);
      dbg.handler.rotY = Number(this.el.object3D.rotation.y).toFixed(3);
    }
  },

  handleScale: function (event) {
    if (!this.data.enabled) return;
    if (!this.el.object3D || !this.el.object3D.visible) return;

      this.scaleFactor *=
        1 + event.detail.spreadChange / event.detail.startSpread;

      this.scaleFactor = Math.min(
        Math.max(this.scaleFactor, this.data.minScale),
        this.data.maxScale
      );

      this.el.object3D.scale.x = this.scaleFactor * this.initialScale.x;
      this.el.object3D.scale.y = this.scaleFactor * this.initialScale.y;
      this.el.object3D.scale.z = this.scaleFactor * this.initialScale.z;

    const dbg = getGestureDebug();
    if (dbg) {
      dbg.handler.scaleCalls = (dbg.handler.scaleCalls || 0) + 1;
      dbg.handler.visible = !!this.el.object3D.visible;
      dbg.handler.scale = Number(this.el.object3D.scale.x).toFixed(3);
    }
  }
});

  console.log('✅ Gesture components registered successfully');
} else {
  console.warn('⚠️ AFRAME not available when gesture-detector.js loaded');
}

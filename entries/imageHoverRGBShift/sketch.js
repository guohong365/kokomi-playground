import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class Sketch extends kokomi.Base {
  async create() {
    const screenCamera = new kokomi.ScreenCamera(this);
    screenCamera.addExisting();

    const gallary = new kokomi.Gallery(this, {
      vertexShader,
      fragmentShader,
    });
    await gallary.addExisting();

    const customEffect = new kokomi.CustomEffect(this, {
      vertexShader: vertexShader2,
      fragmentShader: fragmentShader2,
      uniforms: {
        uMaskRadius: {
          value: 160,
        },
        uDevicePixelRatio: {
          value: window.devicePixelRatio,
        },
        uMouse: {
          value: new THREE.Vector2(0, 0),
        },
        uMouseSpeed: {
          value: 0,
        },
      },
    });
    customEffect.addExisting();

    // mouse move
    let offsetX = 0;
    let offsetY = 0;

    let targetSpeed = 0;

    this.update(() => {
      // mouse pos
      const { x, y } = this.interactionManager.mouse;
      offsetX = THREE.MathUtils.lerp(offsetX, x, 0.1);
      offsetY = THREE.MathUtils.lerp(offsetY, y, 0.1);
      customEffect.customPass.material.uniforms.uMouse.value =
        new THREE.Vector2(offsetX, offsetY);

      // mouse speed
      const hoverDelta = new THREE.Vector2(
        this.iMouse.mouseDOMDelta.x / window.innerWidth,
        this.iMouse.mouseDOMDelta.y / window.innerHeight
      );

      const mouseSpeed = Math.hypot(hoverDelta.x, hoverDelta.y);
      targetSpeed = THREE.MathUtils.lerp(targetSpeed, mouseSpeed, 0.1);
      customEffect.customPass.material.uniforms.uMouseSpeed.value = Math.min(
        targetSpeed,
        0.05
      );
      targetSpeed *= 0.999;
    });
  }
}

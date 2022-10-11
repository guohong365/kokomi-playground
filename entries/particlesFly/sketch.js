import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil";

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 0, 1);

    const controls = new kokomi.OrbitControls(this);
    controls.controls.autoRotate = true;

    const geometry = new THREE.BufferGeometry();

    const posBuffer = kokomi.makeBuffer(240, () =>
      THREE.MathUtils.randFloatSpread(2)
    );

    geometry.setAttribute("position", new THREE.BufferAttribute(posBuffer, 3));

    const cm = new kokomi.CustomPoints(this, {
      baseMaterial: new THREE.ShaderMaterial(),
      // geometry: new THREE.PlaneGeometry(1, 1, 16, 16),
      geometry,
      vertexShader,
      fragmentShader,
      materialParams: {
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
      },
      uniforms: {
        uDevicePixelRatio: {
          value: window.devicePixelRatio,
        },
        uPointSize: {
          value: 40,
        },
      },
    });
    cm.addExisting();
  }
}

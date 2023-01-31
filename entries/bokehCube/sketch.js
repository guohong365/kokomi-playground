import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";

class ParticlesFly extends kokomi.Component {
  constructor(base, config) {
    super(base);

    const { colors = ["#cb4959", "#3beced"], count = 36, size = 75 } = config;

    const geometry = new THREE.BufferGeometry();

    const posBuffer = kokomi.makeBuffer(count, () =>
      THREE.MathUtils.randFloatSpread(1)
    );
    kokomi.iterateBuffer(posBuffer, posBuffer.length, (arr, axis) => {
      arr[axis.x] = THREE.MathUtils.randFloatSpread(1.5);
      arr[axis.y] = THREE.MathUtils.randFloatSpread(1.5);
      arr[axis.z] = 0;
    });

    geometry.setAttribute("position", new THREE.BufferAttribute(posBuffer, 3));

    const pIndexs = kokomi.makeBuffer(posBuffer.length / 3, (v, k) => v);
    geometry.setAttribute("pIndex", new THREE.BufferAttribute(pIndexs, 1));

    const cm = new kokomi.CustomPoints(base, {
      baseMaterial: new THREE.ShaderMaterial(),
      // geometry: new THREE.PlaneGeometry(1, 1, 16, 16),
      geometry,
      vertexShader: vertexShader2,
      fragmentShader: fragmentShader2,
      materialParams: {
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        defines: {
          COLOR_COUNT: colors.length,
        },
      },
      uniforms: {
        uDevicePixelRatio: {
          value: window.devicePixelRatio,
        },
        uPointSize: {
          value: size,
        },
        uColors: {
          value: colors.map((color) => new THREE.Color(color)),
        },
      },
    });
    this.cm = cm;
  }
  addExisting() {
    this.cm.container = this.container;
    this.cm.addExisting();
  }
}

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(2, 1.5, 2);

    this.camera.fov = 50;
    this.camera.updateProjectionMatrix();

    const controls = new kokomi.OrbitControls(this);
    controls.controls.autoRotate = true;

    kokomi.enableRealisticRender(this.renderer);

    const cm = new kokomi.CustomMesh(this, {
      baseMaterial: new THREE.ShaderMaterial(),
      geometry: new THREE.BoxGeometry(1, 1, 1),
      vertexShader,
      fragmentShader,
      materialParams: {
        side: THREE.DoubleSide,
        transparent: true,
      },
      uniforms: {
        uTexture: {
          value: null,
        },
      },
    });
    cm.addExisting();

    const rtScene = new THREE.Scene();
    const rtCamera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    rtCamera.position.z = 1;
    const rt = new kokomi.RenderTexture(this, {
      rtScene,
      rtCamera,
    });

    const pf = new ParticlesFly(this, {
      colors: ["#cb4959", "#3beced"],
      count: 16,
      size: 100,
    });
    pf.container = rtScene;
    pf.addExisting();

    rt.texture.minFilter = THREE.LinearFilter;
    rt.texture.magFilter = THREE.LinearFilter;

    cm.material.uniforms.uTexture.value = rt.texture;

    // postprocessing
    const composer = new POSTPROCESSING.EffectComposer(this.renderer);
    this.composer = composer;

    composer.addPass(new POSTPROCESSING.RenderPass(this.scene, this.camera));

    // bloom
    const bloom = new POSTPROCESSING.BloomEffect({
      luminanceThreshold: 0.05,
      luminanceSmoothing: 0,
      mipmapBlur: true,
      intensity: 2,
      radius: 0.3,
    });
    composer.addPass(new POSTPROCESSING.EffectPass(this.camera, bloom));

    this.renderer.autoClear = true;
  }
}

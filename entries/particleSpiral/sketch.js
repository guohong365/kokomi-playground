import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";
import * as POSTPROCESSING from "postprocessing";

class ParticleSpiral extends kokomi.Component {
  constructor(base, config = {}) {
    super(base);

    const { count = 120, pointCount = 120, uniforms } = config;

    const totalPointCount = count * pointCount;

    const geometry = new THREE.BufferGeometry();

    const posBuffer = kokomi.makeBuffer(totalPointCount, (val) => val);
    geometry.setAttribute("position", new THREE.BufferAttribute(posBuffer, 3));

    kokomi.iterateBuffer(posBuffer, posBuffer.length, (arr, axis, i) => {
      arr[axis.x] = Math.random();
      arr[axis.y] = Math.random();
      arr[axis.z] = i / totalPointCount;
    });

    const uj = new kokomi.UniformInjector(this.base);
    this.uj = uj;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      defines: {
        SPIRALS: count,
      },
      uniforms: {
        ...uj.shadertoyUniforms,
        ...{
          uPointSize: {
            value: 10,
          },
          uColor: {
            value: new THREE.Color(uniforms.color),
          },
          uColor2: {
            value: new THREE.Color(uniforms.color2),
          },
        },
      },
    });

    const cm = new THREE.Points(geometry, material);
    this.cm = cm;
  }
  addExisting() {
    this.base.scene.add(this.cm);
  }
  update() {
    if (this.uj && this.cm) {
      this.uj.injectShadertoyUniforms(this.cm.material.uniforms);
    }
  }
}

class Sketch extends kokomi.Base {
  create() {
    const config = {
      bgColor: "#08092B",
      spiral: {
        count: 120,
        pointCount: 120,
        uniforms: {
          color: "#66CCFF",
          color2: "#CB17CF",
        },
      },
    };
    this.config = config;

    this.scene.background = new THREE.Color(config.bgColor);

    this.camera.position.set(0, 0, 1);
    this.camera.fov = 60;
    this.camera.updateProjectionMatrix();

    // new kokomi.OrbitControls(this);

    const ps = new ParticleSpiral(this, config.spiral);
    this.ps = ps;
    ps.addExisting();

    const g = new THREE.Group();
    this.scene.add(g);
    g.add(ps.cm);
    g.rotation.x = THREE.MathUtils.degToRad(-60);

    // postprocessing
    const createPostprocessing = () => {
      const composer = new POSTPROCESSING.EffectComposer(this.renderer, {
        frameBufferType: THREE.HalfFloatType,
        multisampling: 8,
      });
      this.composer = composer;

      composer.addPass(new POSTPROCESSING.RenderPass(this.scene, this.camera));

      const bloom = new POSTPROCESSING.BloomEffect({
        blendFunction: POSTPROCESSING.BlendFunction.ADD,
        luminanceThreshold: 0.3,
        luminanceSmoothing: 0,
        mipmapBlur: true,
        intensity: 2,
        radius: 0.4,
      });

      const effectPass = new POSTPROCESSING.EffectPass(this.camera, bloom);
      composer.addPass(effectPass);

      this.renderer.autoClear = true;
    };

    createPostprocessing();

    // this.createDebug();
  }
  createDebug() {
    const config = this.config;
    const mat = this.ps.cm.material;

    const gui = new dat.GUI();
    gui.addColor(config, "bgColor").onChange((val) => {
      this.scene.background = new THREE.Color(val);
    });
    gui.addColor(config.spiral.uniforms, "color").onChange((val) => {
      mat.uniforms.uColor.value = new THREE.Color(val);
    });
    gui.addColor(config.spiral.uniforms, "color2").onChange((val) => {
      mat.uniforms.uColor2.value = new THREE.Color(val);
    });
  }
}

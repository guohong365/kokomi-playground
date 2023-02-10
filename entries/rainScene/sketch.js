import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";
import * as POSTPROCESSING from "postprocessing";

class RainFloor extends kokomi.Component {
  constructor(base, config = {}) {
    super(base);

    const { count = 1000 } = config;

    const am = this.base.am;

    // floor
    const fNormalTex = am.items["floor-normal"];
    const fOpacityTex = am.items["floor-opacity"];
    const fRoughnessTex = am.items["floor-roughness"];
    fNormalTex.wrapS = fNormalTex.wrapT = THREE.MirroredRepeatWrapping;
    fOpacityTex.wrapS = fOpacityTex.wrapT = THREE.MirroredRepeatWrapping;
    fRoughnessTex.wrapS = fRoughnessTex.wrapT = THREE.MirroredRepeatWrapping;

    // custom reflector
    const uj = new kokomi.UniformInjector(this.base);
    this.uj = uj;
    const mirror = new kokomi.Reflector(new THREE.PlaneGeometry(25, 100));
    this.mirror = mirror;
    mirror.position.z = -25;
    mirror.rotation.x = -Math.PI / 2;

    mirror.material.uniforms = {
      ...mirror.material.uniforms,
      ...uj.shadertoyUniforms,
      ...{
        uNormalTexture: {
          value: fNormalTex,
        },
        uOpacityTexture: {
          value: fOpacityTex,
        },
        uRoughnessTexture: {
          value: fRoughnessTex,
        },
        uRainCount: {
          value: count,
        },
        uTexScale: {
          value: new THREE.Vector2(1, 4),
        },
        uDistortionAmount: {
          value: 0.1,
        },
        uBlurStrength: {
          value: 6.3,
        },
        uMipmapTextureSize: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight),
        },
      },
    };
    mirror.material.vertexShader = vertexShader;
    mirror.material.fragmentShader = fragmentShader;

    const mipmapper = new kokomi.PackedMipMapGenerator();
    this.mipmapper = mipmapper;
    const mirrorFBO = mirror.getRenderTarget();
    this.mirrorFBO = mirrorFBO;
    const mipmapFBO = new kokomi.FBO(this.base);
    this.mipmapFBO = mipmapFBO;

    mirror.material.uniforms.tDiffuse.value = mipmapFBO.rt.texture;
  }
  addExisting() {
    this.base.scene.add(this.mirror);
  }
  update() {
    this.uj.injectShadertoyUniforms(this.mirror.material.uniforms);

    this.mipmapper.update(
      this.mirrorFBO.texture,
      this.mipmapFBO.rt,
      this.base.renderer
    );
  }
}

class Rain extends kokomi.Component {
  constructor(base, config = {}) {
    super(base);

    const { count = 1000, speed = 1.5, debug = false } = config;

    const am = this.base.am;

    // rain
    const rNormalTex = am.items["rain-normal"];
    rNormalTex.flipY = false;

    const uj = new kokomi.UniformInjector(this.base);
    this.uj = uj;
    const rainMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader2,
      fragmentShader: fragmentShader2,
      uniforms: {
        ...uj.shadertoyUniforms,
        ...{
          uSpeed: {
            value: speed,
          },
          uHeightRange: {
            value: 20,
          },
          uNormalTexture: {
            value: rNormalTex,
          },
          uBgRt: {
            value: null,
          },
          uRefraction: {
            value: 0.05,
          },
          uBaseBrightness: {
            value: 0.07,
          },
        },
      },
    });
    this.rainMat = rainMat;

    const rain = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(),
      rainMat,
      count
    );
    this.rain = rain;
    rain.instanceMatrix.needsUpdate = true;

    const dummy = new THREE.Object3D();

    const progressArr = [];
    const speedArr = [];

    for (let i = 0; i < rain.count; i++) {
      dummy.position.set(
        THREE.MathUtils.randFloat(-10, 10),
        0,
        THREE.MathUtils.randFloat(-20, 10)
      );
      dummy.scale.set(0.03, THREE.MathUtils.randFloat(0.3, 0.5), 0.03);
      if (debug) {
        dummy.scale.setScalar(1);
        rainMat.uniforms.uSpeed.value = 0;
      }
      dummy.updateMatrix();
      rain.setMatrixAt(i, dummy.matrix);

      progressArr.push(Math.random());
      speedArr.push(dummy.scale.y * 10);
    }
    rain.rotation.set(-0.1, 0, 0.1);
    rain.position.set(0, 4, 4);

    rain.geometry.setAttribute(
      "aProgress",
      new THREE.InstancedBufferAttribute(new Float32Array(progressArr), 1)
    );
    rain.geometry.setAttribute(
      "aSpeed",
      new THREE.InstancedBufferAttribute(new Float32Array(speedArr), 1)
    );

    const bgFBO = new kokomi.FBO(this.base, {
      width: window.innerWidth * 0.1,
      height: window.innerHeight * 0.1,
    });
    this.bgFBO = bgFBO;
    rainMat.uniforms.uBgRt.value = bgFBO.rt.texture;

    const fboCamera = this.base.camera.clone();
    this.fboCamera = fboCamera;
  }
  addExisting() {
    this.base.scene.add(this.rain);
  }
  update() {
    this.uj.injectShadertoyUniforms(this.rainMat.uniforms);

    this.rain.visible = false;
    this.base.renderer.setRenderTarget(this.bgFBO.rt);
    this.base.renderer.render(this.base.scene, this.fboCamera);
    this.base.renderer.setRenderTarget(null);
    this.rain.visible = true;
  }
}

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 2, 9);

    const lookAt = new THREE.Vector3(0, 2, 0);
    this.camera.lookAt(lookAt);

    const controls = new kokomi.OrbitControls(this);
    controls.controls.target = lookAt;

    // kokomi.enableRealisticRender(this.renderer);

    const am = new kokomi.AssetManager(this, [
      {
        name: "shutter-Diffuse",
        type: "texture",
        path: "https://s2.loli.net/2023/01/31/4b7YcTDx1teCoAm.png",
      },
      {
        name: "shutter-Glossiness",
        type: "texture",
        path: "https://s2.loli.net/2023/01/31/6hBzKvqc2opLFeE.png",
      },
      {
        name: "shutter-Normal",
        type: "texture",
        path: "https://s2.loli.net/2023/01/31/yprJK9Ns57YuSw6.png",
      },
      {
        name: "side-cover-Diffuse",
        type: "texture",
        path: "https://s2.loli.net/2023/01/31/qcfDKyzQdJ3hmSV.png",
      },
      {
        name: "top-cover-Diffuse",
        type: "texture",
        path: "https://s2.loli.net/2023/01/31/C98NKGUorEXmdWe.png",
      },
      {
        name: "brick-normal",
        type: "texture",
        path: "https://s2.loli.net/2023/01/31/cnZ9qXoEseUWRlY.jpg",
      },
      {
        name: "floor-normal",
        type: "texture",
        path: "https://s2.loli.net/2023/01/31/JfhqtZERnGHQUuo.png",
      },
      {
        name: "floor-opacity",
        type: "texture",
        path: "https://s2.loli.net/2023/01/31/5zVHumc91IESJhA.jpg",
      },
      {
        name: "floor-roughness",
        type: "texture",
        path: "https://s2.loli.net/2023/01/31/ZIM2rXWJOp76ECV.jpg",
      },
      {
        name: "rain-normal",
        type: "texture",
        path: "https://s2.loli.net/2023/01/31/qT2vC8G71UtMXeb.png",
      },
      {
        name: "rain",
        type: "audio",
        path: "../../assets/rain.mp3",
      },
      {
        name: "rain-scene",
        type: "gltfModel",
        path: "../../assets/rain-scene.glb",
      },
    ]);
    this.am = am;
    am.on("ready", () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      // sound
      const rainSound = new Howl({
        src: "../../assets/rain.mp3",
        loop: true,
      });
      rainSound.play();

      const config = {
        color: "#4ec0e9",
        rain: {
          count: 1000,
          speed: 1.5,
          debug: false,
        },
      };

      // lights
      const pointLight1 = new THREE.PointLight(config.color, 0.4, 17, 0.8);
      pointLight1.position.set(0, 2.3, 0);
      this.scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight("#81C8F2", 2, 30);
      pointLight2.position.set(0, 30, 0);
      this.scene.add(pointLight2);

      const rectLight1 = new THREE.RectAreaLight("#89D7FF", 66, 19.1, 0.2);
      rectLight1.position.set(0, 8.06, -9.8);
      rectLight1.rotation.set(
        THREE.MathUtils.degToRad(90),
        THREE.MathUtils.degToRad(180),
        0
      );
      this.scene.add(rectLight1);

      const rectLight1Helper = new kokomi.RectAreaLightHelper(rectLight1);
      this.scene.add(rectLight1Helper);

      // main scene
      const model = am.items["rain-scene"];
      this.scene.add(model.scene);

      const modelParts = kokomi.flatModel(model.scene);
      kokomi.printModel(modelParts);

      const walls = modelParts[1];
      const floor = modelParts[2];
      const shutter = modelParts[3];
      const sideCover = modelParts[4];
      const topCover = modelParts[5];
      const cable = modelParts[6];
      const uNeon = modelParts[7];
      const power = modelParts[8];
      const stand = modelParts[9];

      uNeon.material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(config.color),
      });

      power.material = new THREE.MeshPhongMaterial({
        color: new THREE.Color("#2F2F2F"),
        shininess: 150,
      });

      cable.material = new THREE.MeshPhongMaterial({
        color: new THREE.Color("#2F2F2F"),
        shininess: 150,
      });

      stand.material = new THREE.MeshPhongMaterial({
        color: new THREE.Color("#2F2F2F"),
        shininess: 50,
      });

      const bnTex = am.items["brick-normal"];
      bnTex.rotation = THREE.MathUtils.degToRad(90);
      bnTex.wrapS = bnTex.wrapT = THREE.RepeatWrapping;
      bnTex.repeat.set(5, 8);
      walls.material = new THREE.MeshPhongMaterial({
        color: new THREE.Color("#111111"),
        normalMap: bnTex,
        normalScale: new THREE.Vector2(0.5, 0.5),
        shininess: 50,
      });

      const sdTex = am.items["shutter-Diffuse"];
      const sgTex = am.items["shutter-Glossiness"];
      const snTex = am.items["shutter-Normal"];
      sdTex.flipY = false;
      sgTex.flipY = false;
      snTex.flipY = false;
      shutter.material = new THREE.MeshPhysicalMaterial({
        map: sdTex,
        roughnessMap: sgTex,
        normalMap: snTex,
        reflectivity: 0.8,
        roughness: 0.5,
        metalness: 0.3,
        specularIntensity: 0.5,
      });

      const scTex = am.items["side-cover-Diffuse"];
      scTex.flipY = false;
      sideCover.material = new THREE.MeshPhysicalMaterial({
        map: scTex,
        reflectivity: 0.7,
        roughness: 0.5,
        metalness: 0.2,
        specularIntensity: 0.5,
      });

      const tcTex = am.items["top-cover-Diffuse"];
      tcTex.flipY = false;
      topCover.material = new THREE.MeshPhysicalMaterial({
        map: tcTex,
        reflectivity: 0.7,
        roughness: 0.5,
        metalness: 0.2,
        specularIntensity: 0.5,
      });

      floor.visible = false;

      // rain floor
      const rainFloor = new RainFloor(this, {
        count: config.rain.count,
      });
      rainFloor.addExisting();

      // rain
      const rain = new Rain(this, config.rain);
      rain.addExisting();

      rainFloor.mirror.ignoreObjects.push(rain.rain);

      // flicker
      const turnOffLight = () => {
        uNeon.material.color.copy(new THREE.Color("black"));
        pointLight1.color.copy(new THREE.Color("black"));
      };

      const turnOnLight = () => {
        uNeon.material.color.copy(new THREE.Color(config.color));
        pointLight1.color.copy(new THREE.Color(config.color));
      };

      let flickerTimer = null;

      const flicker = () => {
        flickerTimer = setInterval(async () => {
          const rate = Math.random();
          if (rate < 0.5) {
            turnOffLight();
            await kokomi.sleep(200 * Math.random());
            turnOnLight();
            await kokomi.sleep(200 * Math.random());
            turnOffLight();
            await kokomi.sleep(200 * Math.random());
            turnOnLight();
          }
        }, 3000);
      };

      flicker();

      // postprocessing
      const composer = new POSTPROCESSING.EffectComposer(this.renderer);
      this.composer = composer;

      composer.addPass(new POSTPROCESSING.RenderPass(this.scene, this.camera));

      // bloom
      const bloom = new POSTPROCESSING.BloomEffect({
        luminanceThreshold: 0.4,
        luminanceSmoothing: 0,
        mipmapBlur: true,
        intensity: 2,
        radius: 0.4,
      });
      composer.addPass(new POSTPROCESSING.EffectPass(this.camera, bloom));

      // antialiasing
      const smaa = new POSTPROCESSING.SMAAEffect();
      composer.addPass(new POSTPROCESSING.EffectPass(this.camera, smaa));
    });
  }
}

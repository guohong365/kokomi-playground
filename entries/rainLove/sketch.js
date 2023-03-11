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
        uTexOffset: {
          value: new THREE.Vector2(1, -0.5),
        },
        uDistortionAmount: {
          value: 0.25,
        },
        uBlurStrength: {
          value: 8,
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
            value: 0.1,
          },
          uBaseBrightness: {
            value: 0.1,
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

    // config
    const config = {
      text: "love",
      color: "#ef77eb",
      rain: {
        count: 1000,
        speed: 1.5,
        debug: false,
      },
    };

    // asphalt: https://3dtextures.me/2017/04/05/asphalt-001/
    // floor: https://3dtextures.me/2019/10/22/ground-wet-002/
    // rain normal: https://www.shadertoy.com/view/XsfXDr
    // audio: https://on-jin.com/sound/kan.php
    const am = new kokomi.AssetManager(this, [
      {
        name: "asphalt-normal",
        type: "texture",
        path: "https://s2.loli.net/2023/02/09/4FkJryn78ZhQBqj.jpg",
      },
      {
        name: "floor-normal",
        type: "texture",
        path: "https://s2.loli.net/2023/02/15/GcWBptwDKn8b2dU.jpg",
      },
      {
        name: "floor-opacity",
        type: "texture",
        path: "https://s2.loli.net/2023/02/15/E5dajTYIucWL1vy.jpg",
      },
      {
        name: "floor-roughness",
        type: "texture",
        path: "https://s2.loli.net/2023/02/15/aWeN6ED4mbpZGLs.jpg",
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
    ]);
    this.am = am;

    am.on("ready", async () => {
      const font = await kokomi.loadFont();

      // sound
      const rainSound = new Howl({
        src: "../../assets/rain.mp3",
        loop: true,
      });
      rainSound.play();

      document.querySelector(".loader-screen").classList.add("hollow");

      // lights
      const pointLight1 = new THREE.PointLight(config.color, 0.5, 17, 0.8);
      pointLight1.position.set(0, 2, 0);
      this.scene.add(pointLight1);

      const pointLight2 = new THREE.PointLight("#81C8F2", 2, 30);
      pointLight2.position.set(0, 25, 0);
      this.scene.add(pointLight2);

      const rectLight1 = new THREE.RectAreaLight("#89D7FF", 66, 19.1, 0.2);
      rectLight1.position.set(0, 8, -10);
      rectLight1.rotation.set(
        THREE.MathUtils.degToRad(90),
        THREE.MathUtils.degToRad(180),
        0
      );
      this.scene.add(rectLight1);

      const rectLight1Helper = new kokomi.RectAreaLightHelper(rectLight1);
      this.scene.add(rectLight1Helper);

      // wall
      const aspTex = am.items["asphalt-normal"];
      aspTex.rotation = THREE.MathUtils.degToRad(90);
      aspTex.wrapS = aspTex.wrapT = THREE.RepeatWrapping;
      aspTex.repeat.set(5, 8);

      const wallMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color("#111111"),
        normalMap: aspTex,
        normalScale: new THREE.Vector2(0.5, 0.5),
        shininess: 200,
      });

      const wall = new THREE.Mesh(new THREE.BoxGeometry(25, 20, 0.5), wallMat);
      this.scene.add(wall);
      wall.position.y = 10;
      wall.position.z = -10.3;

      const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 20, 20), wallMat);
      this.scene.add(wall2);
      wall2.position.y = 10;
      wall2.position.x = -12;

      const wall3 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 20, 20), wallMat);
      this.scene.add(wall3);
      wall3.position.y = 10;
      wall3.position.x = 12;

      // text
      const t3d = new kokomi.Text3D(this, config.text, font, {
        size: 3,
        height: 0.2,
        curveSegments: 120,
        bevelEnabled: false,
      });
      t3d.mesh.geometry.center();

      const tm = new THREE.Mesh(
        t3d.mesh.geometry,
        new THREE.MeshBasicMaterial({
          color: config.color,
        })
      );
      this.scene.add(tm);
      tm.position.y = 1.54;

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
        tm.material.color.copy(new THREE.Color("black"));
        pointLight1.color.copy(new THREE.Color("black"));
      };

      const turnOnLight = () => {
        tm.material.color.copy(new THREE.Color(config.color));
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
      const createPostprocessing = () => {
        const composer = new POSTPROCESSING.EffectComposer(this.renderer, {
          frameBufferType: THREE.HalfFloatType,
          multisampling: 8,
        });
        this.composer = composer;

        composer.addPass(
          new POSTPROCESSING.RenderPass(this.scene, this.camera)
        );

        const bloom = new POSTPROCESSING.BloomEffect({
          blendFunction: POSTPROCESSING.BlendFunction.ADD,
          luminanceThreshold: 0.4,
          luminanceSmoothing: 0,
          mipmapBlur: true,
          intensity: 2,
          radius: 0.4,
        });

        const smaa = new POSTPROCESSING.SMAAEffect();

        const effectPass = new POSTPROCESSING.EffectPass(
          this.camera,
          bloom,
          smaa
        );
        composer.addPass(effectPass);

        this.renderer.autoClear = true;
      };

      createPostprocessing();
    });
  }
}

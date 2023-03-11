import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";
import * as POSTPROCESSING from "postprocessing";

class Model extends kokomi.Component {
  constructor(base) {
    super(base);

    const group = new THREE.Group();
    this.group = group;

    const am = this.base.am;

    const model = am.items["model"];
    this.model = model;

    const modelScene = model.scene.clone();
    this.group.add(modelScene);

    const modelParts = kokomi.flatModel(modelScene);
    kokomi.printModel(modelParts);

    this.group.scale.setScalar(0.05);

    const animations = new kokomi.AnimationManager(
      this.base,
      this.model.animations,
      this.group
    );
    console.log(animations.actions);
    animations.actions["Object_0"].timeScale = 0.15;
    animations.actions["Object_0"].play();

    const Object_111 = modelParts[112];
    Object_111.visible = false;
  }
  addExisting() {
    this.container.add(this.group);
  }
}

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 0, 5);

    // new kokomi.OrbitControls(this);

    kokomi.beautifyRender(this.renderer);

    this.scene.background = new THREE.Color("#000000");

    // model: https://sketchfab.com/3d-models/butterfly-bb7a9781c2674e59a0f335fb8efb77d3
    const am = new kokomi.AssetManager(
      this,
      [
        {
          name: "hdr",
          type: "hdrTexture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/hdris/empty-wharehouse/empty_warehouse_01_1k.hdr",
        },
        {
          name: "model",
          type: "gltfModel",
          path: "../../assets/butterfly-transformed.glb",
        },
      ],
      {
        useDracoLoader: true,
      }
    );
    this.am = am;
    am.on("ready", () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      document.querySelector(".main-scene").classList.remove("hollow");

      // light
      const envMap = kokomi.getEnvmapFromHDRTexture(
        this.renderer,
        am.items["hdr"]
      );

      this.scene.environment = envMap;

      const ambiLight = new THREE.AmbientLight(0xffffff, 0.2);
      this.scene.add(ambiLight);

      const spotLight = new THREE.SpotLight(0xffffff, 2, 0, 1.3, 1);
      this.scene.add(spotLight);

      // scroller
      const sc = new kokomi.NormalScroller(this);
      sc.listenForScroll();

      this.update(() => {
        sc.syncScroll();
      });

      // sync dom scroll
      const h = document.querySelector(".scroll-container").scrollHeight;

      document.querySelector(".scroll-container-height").style.height = h;

      this.update(() => {
        const cs = sc.scroll.current;

        document.querySelector(
          ".scroll-container-translate"
        ).style.transform = `translateY(${-cs}px)`;
      });

      // sync webgl scroll
      const scg = new THREE.Group();
      this.scene.add(scg);

      const sectionCount = 6;

      this.update(() => {
        const cs = sc.scroll.current;
        const csr = (cs * (sectionCount - 1)) / window.innerHeight;

        scg.position.y = csr;
      });

      // meshes
      const g = new THREE.Group();
      scg.add(g);

      // f1
      const mo1 = new Model(this);
      mo1.container = g;
      mo1.addExisting();
      mo1.group.position.set(0, -2.5, 0);

      const mo2 = new Model(this);
      mo2.container = g;
      mo2.addExisting();
      mo2.group.position.set(-10, -3, -6);

      const mo3 = new Model(this);
      mo3.container = g;
      mo3.addExisting();
      mo3.group.position.set(10, -4, -10);

      const f1 = new kokomi.Float(this, {
        rotationIntensity: 2,
        floatIntensity: 0.2,
        floatingRange: [1, 1],
      });
      f1.container = g;
      f1.addExisting();
      f1.add(mo1.group);
      f1.add(mo2.group);
      f1.add(mo3.group);

      // f2
      const mo4 = new Model(this);
      mo4.container = g;
      mo4.addExisting();
      mo4.group.position.set(-1, -12.5, 0);

      const mo5 = new Model(this);
      mo5.container = g;
      mo5.addExisting();
      mo5.group.position.set(12, -14, -10);

      const f2 = new kokomi.Float(this, {
        rotationIntensity: 2,
        floatIntensity: 0.2,
        floatingRange: [1, 1],
      });
      f2.container = g;
      f2.addExisting();
      f2.add(mo4.group);
      f2.add(mo5.group);

      // f3
      const mo6 = new Model(this);
      mo6.container = g;
      mo6.addExisting();
      mo6.group.position.set(-3, -19.5, 2);

      const mo7 = new Model(this);
      mo7.container = g;
      mo7.addExisting();
      mo7.group.position.set(8, -23, -10);

      const mo8 = new Model(this);
      mo8.container = g;
      mo8.addExisting();
      mo8.group.position.set(4, -24, 2);

      const f3 = new kokomi.Float(this, {
        rotationIntensity: 2,
        floatIntensity: 0.2,
        floatingRange: [1, 1],
      });
      f3.container = g;
      f3.addExisting();
      f3.add(mo6.group);
      f3.add(mo7.group);
      f3.add(mo8.group);

      // sparkles
      const sp1 = new kokomi.Sparkles(this, {
        noise: 0,
        speed: 0.01,
        scale: [20, 100, 20],
        opacity: 10,
        color: new THREE.Color("#FFD2BE"),
        size: 0.6,
        count: 500,
      });
      sp1.container = scg;
      sp1.addExisting();

      const sp2 = new kokomi.Sparkles(this, {
        noise: 0,
        speed: 0.01,
        scale: [30, 100, 10],
        opacity: 2,
        color: new THREE.Color("#FFFFFF"),
        size: 10,
        count: 50,
      });
      sp2.container = scg;
      sp2.addExisting();

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

        const dof = new POSTPROCESSING.DepthOfFieldEffect(this.camera, {
          focusDistance: 0,
          focalLength: 0.02,
          bokehScale: 3,
        });

        const bloom = new POSTPROCESSING.BloomEffect({
          blendFunction: POSTPROCESSING.BlendFunction.ADD,
          luminanceThreshold: 0.1,
          luminanceSmoothing: 0.9,
          // mipmapBlur: true,
          intensity: 2,
        });

        const vig = new POSTPROCESSING.VignetteEffect({
          offset: 0.1,
          darkness: 1.5,
        });

        const effectPass = new POSTPROCESSING.EffectPass(
          this.camera,
          dof,
          bloom,
          vig
        );
        composer.addPass(effectPass);

        this.renderer.autoClear = true;
      };

      createPostprocessing();
    });
  }
}

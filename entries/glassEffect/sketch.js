import * as kokomi from "kokomi.js";
import * as THREE from "three";
import gsap from "gsap";
import * as dat from "lil-gui";
import * as POSTPROCESSING from "postprocessing";

class Sketch extends kokomi.Base {
  create() {
    this.camera.position.set(0, 0, 3);

    const controls = new kokomi.OrbitControls(this);
    // controls.controls.autoRotate = true;

    kokomi.beautifyRender(this.renderer);

    kokomi.enableShadow(this.renderer);

    this.scene.background = new THREE.Color("#ffffff");

    const am = new kokomi.AssetManager(
      this,
      [
        {
          name: "hdr",
          type: "hdrTexture",
          path: "https://market-assets.fra1.cdn.digitaloceanspaces.com/market-assets/hdris/potsdamer-platz/potsdamer_platz_1k.hdr",
        },
        {
          name: "model",
          type: "gltfModel",
          path: "../../assets/gdn8-logo-v3.glb",
        },
        {
          name: "uv-map",
          type: "texture",
          // path: "https://s2.loli.net/2023/03/07/AtZbU9CYWRxqhGE.png",
          path: "https://s2.loli.net/2023/03/07/CMXhWJDgj1crzSV.png",
        },
        {
          name: "grain",
          type: "texture",
          path: "https://s2.loli.net/2023/03/08/dUzHSACYZT8pOB5.png",
        },
      ],
      {
        useDracoLoader: true,
      }
    );

    am.on("ready", () => {
      document.querySelector(".loader-screen").classList.add("hollow");

      document.querySelector(".main-scene").classList.remove("hollow");

      const envMap = kokomi.getEnvmapFromHDRTexture(
        this.renderer,
        am.items["hdr"]
      );

      this.scene.environment = envMap;

      const stage = new kokomi.Stage(this);
      stage.addExisting();

      const model = am.items["model"];

      const modelParts = kokomi.flatModel(model.scene);
      kokomi.printModel(modelParts);

      model.scene.scale.setScalar(0.01);

      stage.add(model.scene);

      const rabbit_v3_rm_20211118 = modelParts[1];
      rabbit_v3_rm_20211118.material = new THREE.MeshBasicMaterial({
        map: am.items["uv-map"],
      });

      // rabbit_v3_rm_20211118.geometry = new THREE.TorusKnotGeometry(
      //   40,
      //   20,
      //   100,
      //   16
      // );
      // stage.adjustAll();

      rabbit_v3_rm_20211118.geometry.attributes.uv.needsUpdate = true;

      const uv = rabbit_v3_rm_20211118.geometry.attributes.uv.array;
      kokomi.iterateBuffer(
        uv,
        uv.length,
        (arr, axis) => {
          arr[axis.x] = 0;
          arr[axis.y] = 0;
          arr[axis.z] = 1;
          arr[axis.w] = 0;
        },
        4
      );

      // return;

      // scroll
      const screenCamera = new kokomi.ScreenCamera(this);
      screenCamera.addExisting();

      const sc = new kokomi.NormalScroller();
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

      const sectionCount = 2;

      this.update(() => {
        const cs = sc.scroll.current;
        const csr = (cs * (sectionCount - 1)) / window.innerHeight;

        // scg.position.y = csr * 2;
        qs.position.y = csr * 2;
      });

      // meshes
      const g = new THREE.Group();
      scg.add(g);

      g.add(stage.group);

      // rt1
      const rtScene1 = new THREE.Scene();

      const rtCamera1 = new kokomi.OrthographicCamera({
        frustum: 2,
        near: -0.1,
      });

      // rt2
      const rtScene2 = new THREE.Scene();

      rtScene2.add(scg);

      const rtCamera2 = new THREE.PerspectiveCamera(70, 1, 0.01, 100);
      rtCamera2.position.set(0, 0, 1.5);

      const rt2 = new kokomi.RenderTexture(this, {
        rtScene: rtScene2,
        rtCamera: rtCamera2,
        width: window.innerWidth * window.devicePixelRatio * 0.6,
        height: window.innerHeight * window.devicePixelRatio * 0.6,
      });

      // qs
      const qMat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTexture: {
            value: null,
          },
          uGrainTexture: {
            value: am.items["grain"],
          },
        },
      });

      qMat.uniforms.uTexture.value = rt2.texture;

      const qs = new THREE.Group();
      rtScene1.add(qs);

      const q1 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), qMat);
      qs.add(q1);

      const q2 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), qMat);
      q2.position.y = -2;
      qs.add(q2);

      const bg = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshBasicMaterial({
          // color: "#555555",
          color: "black",
        })
      );
      bg.position.z = -1;
      rtScene1.add(bg);

      const rt1 = new kokomi.RenderTexture(this, {
        rtScene: rtScene1,
        rtCamera: rtCamera1,
      });

      const quad1 = new kokomi.RenderQuad(this, rt1.texture);
      quad1.addExisting();

      // tilt with inertia
      const tiltG = new THREE.Group();
      rtScene1.add(tiltG);
      tiltG.add(qs);

      let offsetX = 0;
      let offsetY = 0;

      this.update(() => {
        const { x, y } = this.interactionManager.mouse;

        offsetX = THREE.MathUtils.lerp(offsetX, x, 0.1);
        offsetY = THREE.MathUtils.lerp(offsetY, y, 0.1);

        tiltG.position.y = 0.1 * offsetY;
        tiltG.position.x = 0.2 * offsetX;

        g.position.y = -0.2 * offsetY;
        g.position.x = -0.4 * offsetX;

        g.rotation.y = 0.4 * offsetX;
      });

      // postprocessing
      const createPostprocessing = () => {
        this.scene.background = this.scene.background.convertSRGBToLinear();

        const composer = new POSTPROCESSING.EffectComposer(this.renderer, {
          frameBufferType: THREE.HalfFloatType,
          multisampling: 8,
        });
        this.composer = composer;

        composer.addPass(
          new POSTPROCESSING.RenderPass(this.scene, this.camera)
        );

        const ca = new POSTPROCESSING.ChromaticAberrationEffect();

        const effectPass = new POSTPROCESSING.EffectPass(this.camera, ca);
        composer.addPass(effectPass);

        this.renderer.autoClear = true;
      };

      createPostprocessing();
    });
  }
}
